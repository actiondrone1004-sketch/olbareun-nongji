"""
올바른농지 홈페이지 빌드 스크립트
  python _build/build.py
- partials/ (head, header, footer, apply) + pages/*.html (front matter + 본문) → 프로젝트 루트의 *.html
- dist-artifact/ 에 Claude Artifact 배포용 복사본 생성 (index.html은 doctype/html/head/body 없는 fragment)
- 태그 균형 / 중복 id / 미해결 {{placeholder}} 검사
"""
import os, re, shutil, sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)          # 프로젝트 루트 (산출물 html이 놓이는 곳)
ART = os.path.join(HERE, "dist-artifact")   # Claude Artifact 배포용 복사본 (index.html은 fragment)
PAGE_KEYS = ["services", "about", "press"]
sys.path.insert(0, HERE)
import media

def read(p):
    with open(p, encoding="utf-8") as f: return f.read()

# 검색엔진 소유 확인 코드 (네이버 서치어드바이저 / 구글 서치 콘솔 'HTML 태그' 방식의 content 값). 비워두면 태그를 넣지 않는다
SITE_VERIFY = {"naver-site-verification": "9de716f4ccf1746f71be174c7797d62f3e912273", "google-site-verification": "WJbigHsbPqCgjsQgdU7bgGHpTk7TSP9LR3-O31KIgbA"}
VERIFY_TAGS = "\n".join('<meta name="%s" content="%s">' % (k, v) for k, v in SITE_VERIFY.items() if v)

head_t = read(os.path.join(HERE, "partials", "head.html"))
header_t = read(os.path.join(HERE, "partials", "header.html"))
footer_t = read(os.path.join(HERE, "partials", "footer.html"))
apply_t = read(os.path.join(HERE, "partials", "apply.html"))

class Checker(HTMLParser):
    VOID = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
    def __init__(self):
        super().__init__(); self.stack=[]; self.errors=[]; self.ids={}
    def handle_starttag(self, tag, attrs):
        if tag in self.VOID: return
        self.stack.append((tag, self.getpos()[0]))
        for k,v in attrs:
            if k=="id":
                if v in self.ids: self.errors.append(f"duplicate id '{v}' at line {self.getpos()[0]} (first at {self.ids[v]})")
                self.ids[v]=self.getpos()[0]
    def handle_endtag(self, tag):
        if tag in self.VOID: return
        if not self.stack: self.errors.append(f"stray </{tag}> at line {self.getpos()[0]}"); return
        if self.stack[-1][0] != tag:
            # try to find it
            names=[t for t,_ in self.stack]
            if tag in names:
                while self.stack and self.stack[-1][0]!=tag:
                    t,l=self.stack.pop(); self.errors.append(f"unclosed <{t}> from line {l} (closed by </{tag}> at {self.getpos()[0]})")
                self.stack.pop()
            else:
                self.errors.append(f"unexpected </{tag}> at line {self.getpos()[0]} (open: {self.stack[-1]})")
        else:
            self.stack.pop()

def check(html, name):
    c=Checker(); c.feed(html)
    for t,l in c.stack: c.errors.append(f"unclosed <{t}> from line {l} at EOF")
    # unresolved placeholders
    for m in re.finditer(r"\{\{[^}]+\}\}", html): c.errors.append(f"unresolved placeholder {m.group(0)}")
    if c.errors:
        print(f"[{name}] PROBLEMS:"); [print("   ", e) for e in c.errors]
    else:
        print(f"[{name}] ok, {len(html)//1024} KB")
    return not c.errors

def parse_page(src):
    m = re.match(r"---\n(.*?)\n---\n(.*)", src, re.S)
    meta = dict(re.findall(r"^(\w+):\s*(.*)$", m.group(1), re.M))
    return meta, m.group(2)

# 캐시 무효화: site.css / site.js 내용 해시를 ?v= 로 붙인다 (GitHub Pages는 10분 캐시 → 배포 직후 옛 CSS+새 HTML 조합으로 깨져 보이는 것 방지)
import hashlib
def asset_ver(name):
    with open(os.path.join(OUT, "assets", name), "rb") as f: return hashlib.md5(f.read()).hexdigest()[:8]
CSS_V, JS_V = asset_ver("site.css"), asset_ver("site.js")
def bust(html):
    return html.replace('href="assets/site.css"', 'href="assets/site.css?v=%s"' % CSS_V).replace('src="assets/site.js"', 'src="assets/site.js?v=%s"' % JS_V)

CRUMB_NAMES = {"services.html": "농지전수조사", "about.html": "회사 소개", "press.html": "보도"}   # GNB 메뉴 이름과 같게

# 블로그: _build/posts/blog-*.html → 루트 blog-*.html
#   front matter: title(검색 제목) h1(본문 제목) desc keywords date(YYYY-MM-DD) thumb(assets/img/blog/…, 선택)
#   본문은 <p>·<h2>·<table>·<ul> 만 쓰고, 출처는 <ul class="post-src">. 글 틀(경로·날짜·다른 글·상담 폼)은 여기서 씌운다
#   보도 탭 '숏폼 · 블로그'·홈·sitemap·rss에 자동으로 들어간다
POSTS = []
if os.path.isdir(os.path.join(HERE, "posts")):
    for fn in os.listdir(os.path.join(HERE, "posts")):
        if fn.endswith(".html"):
            m_, b_ = parse_page(read(os.path.join(HERE, "posts", fn)))
            m_["file"] = fn; POSTS.append((m_, b_))
POSTS.sort(key=lambda p: (p[0]["date"], p[0]["file"]), reverse=True)
MEDIA = media.render([{"type": "blog", "url": m["file"], "title": m["h1"], "date": m["date"], "thumb": m.get("thumb", "")} for m, _ in POSTS])

def post_body(meta, body):
    fn, d = meta["file"], meta["date"]
    others = "".join('<li><a href="%s">%s</a> <small>%s</small></li>' % (m["file"], m["h1"], m["date"].replace("-", ".")) for m, _ in POSTS if m["file"] != fn)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "BlogPosting", "headline": meta["h1"], "description": meta["desc"], "datePublished": d, "dateModified": meta.get("updated", d),
         "inLanguage": "ko-KR", "mainEntityOfPage": "https://www.allfarm.kr/" + fn,
         "image": "https://www.allfarm.kr/" + meta.get("thumb", "assets/img/hero.jpg"),
         "author": {"@type": "Organization", "name": "올바른농지", "url": "https://www.allfarm.kr/"},
         "publisher": {"@type": "Organization", "name": "올바른농지", "url": "https://www.allfarm.kr/"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.allfarm.kr/"},
            {"@type": "ListItem", "position": 2, "name": "보도", "item": "https://www.allfarm.kr/press.html"},
            {"@type": "ListItem", "position": 3, "name": meta["h1"], "item": "https://www.allfarm.kr/" + fn}]}]}
    import json
    return ('<main id="main">\n<article class="post">\n  <div class="container doc post-doc">\n'
            '    <nav class="crumbs" aria-label="현재 위치"><a href="index.html">홈</a><span><a href="press.html#sns">보도</a></span><span>블로그</span></nav>\n'
            '    <h1>%s</h1>\n    <p class="meta">올바른농지 · <time datetime="%s">%s</time></p>\n%s\n'
            '    <p class="post-note">이 글은 공개된 보도와 법령을 바탕으로 한 일반 안내입니다. 개별 농지의 처분 여부와 절차는 관할 행정청이 판단하며, 올바른농지는 특정 행정 결과를 보장하지 않습니다.</p>\n'
            '    <div class="post-cta"><b>내 농지는 어떤 상황인지 궁금하다면</b><p>지번과 지금 상황만 알려주시면 대표가 직접 살펴보고 연락드립니다.</p><a class="btn btn-green" href="#apply">무료 상담 신청</a> <a class="btn" data-link="kakao" href="#apply">카카오톡으로 묻기</a></div>\n'
            '%s  </div>\n</article>\n{{APPLY}}\n</main>\n<script type="application/ld+json">%s</script>\n') % (
        meta["h1"], d, d.replace("-", "."), body.strip(),
        ('    <div class="post-more"><h2>함께 읽으면 좋은 글</h2><ul>%s</ul></div>\n' % others) if others else "",
        json.dumps(ld, ensure_ascii=False))

def build_page(fname, meta=None, body=None):
    if meta is None:
        meta, body = parse_page(read(os.path.join(HERE, "pages", fname)))
    else:   # 블로그 글
        meta = dict(meta, cur="press"); body = post_body(meta, body)
    cur = meta.get("cur", "")
    head = head_t.replace("{{TITLE}}", meta["title"]).replace("{{DESC}}", meta["desc"]).replace("{{KEYWORDS}}", meta.get("keywords", "")).replace("{{FILE}}", fname).replace("{{CANON}}", "" if fname == "index.html" else fname)
    head = head.replace("{{OGIMG}}", meta.get("thumb", "assets/img/hero.jpg"))
    if "date" in meta: head = head.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
    head = head.replace("{{VERIFY}}\n", VERIFY_TAGS + "\n" if VERIFY_TAGS and fname == "index.html" else "")
    header = header_t
    for k in PAGE_KEYS:
        header = header.replace("{{CUR_%s}}" % k, 'aria-current="page"' if cur == k else "")
    header = header.replace(' >', '>')
    footer = footer_t
    body = body.replace("{{APPLY}}", apply_t)
    for k, v in MEDIA.items(): body = body.replace(k, v); footer = footer.replace(k, v)
    if 'id="apply"' not in body:   # 이 페이지에 신청폼이 없으면 농지진단 페이지의 폼으로 보낸다
        header = header.replace('href="#apply"', 'href="index.html#apply"')
        footer = footer.replace('href="#apply"', 'href="index.html#apply"')
        body = body.replace('href="#apply"', 'href="index.html#apply"')
    if fname in CRUMB_NAMES:   # 메뉴 페이지: 검색결과의 '홈 > 메뉴' 경로·하위 링크 표시에 쓰이는 BreadcrumbList
        body += ('\n<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":['
                 '{"@type":"ListItem","position":1,"name":"홈","item":"https://www.allfarm.kr/"},'
                 '{"@type":"ListItem","position":2,"name":"%s","item":"https://www.allfarm.kr/%s"}]}</script>\n') % (CRUMB_NAMES[fname], fname)
    if meta.get("noindex") == "true":
        head = head.replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">')
    if meta.get("bare") == "true":   # 헤더·푸터 없는 독립 페이지 (admin.html)
        return bust(head + body + '\n<script src="assets/site.js"></script>\n</body>\n</html>\n')
    full = head + header + "\n" + body + "\n" + footer + "</body>\n</html>\n"
    return bust(full)

ok = True
os.makedirs(ART, exist_ok=True)
pages = sorted(os.listdir(os.path.join(HERE, "pages")))
jobs = [(f, None, None) for f in pages] + [(m["file"], m, b) for m, b in POSTS]
for fname, pmeta, pbody in jobs:
    html = build_page(fname, pmeta, pbody)
    ok &= check(html, fname)
    with open(os.path.join(OUT, fname), "w", encoding="utf-8", newline="\n") as f: f.write(html)
    # artifact copy: index.html stripped to a fragment (runtime wraps it), others verbatim
    if fname == "index.html":
        frag = html.split("<title>", 1)[1]
        frag = "<title>" + frag
        frag = frag.replace("</head>\n<body>\n", "").replace("</body>\n</html>\n", "")
        with open(os.path.join(ART, fname), "w", encoding="utf-8", newline="\n") as f: f.write(frag)
    else:
        with open(os.path.join(ART, fname), "w", encoding="utf-8", newline="\n") as f: f.write(html)

# assets → artifact dir
if os.path.isdir(os.path.join(ART, "assets")): shutil.rmtree(os.path.join(ART, "assets"))
shutil.copytree(os.path.join(OUT, "assets"), os.path.join(ART, "assets"))
# sitemap.xml: 페이지 소스 수정일을 lastmod로 (네이버·구글 수집 주기에 반영)
import datetime
SITEMAP = [("index.html", "weekly", "1.0"), ("services.html", "monthly", "0.8"), ("press.html", "weekly", "0.7"),
           ("about.html", "monthly", "0.6"), ("terms.html", "yearly", "0.2"), ("privacy.html", "yearly", "0.2")]
rows = []
for fname, freq, pri in SITEMAP:
    mt = datetime.date.fromtimestamp(os.path.getmtime(os.path.join(HERE, "pages", fname))).isoformat()
    loc = "https://www.allfarm.kr/" + ("" if fname == "index.html" else fname)
    rows.append("  <url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%s</priority></url>" % (loc, mt, freq, pri))
for m, _ in POSTS:   # 블로그 글
    rows.append("  <url><loc>https://www.allfarm.kr/%s</loc><lastmod>%s</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>" % (m["file"], m.get("updated", m["date"])))
with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rows) + "\n</urlset>\n")

# rss.xml: 네이버 서치어드바이저 'RSS 제출'용. 약관·개인정보 제외, 페이지 제목·설명·수정일
from email.utils import format_datetime
from xml.sax.saxutils import escape
items = []
for m, _ in POSTS:   # 블로그 글이 먼저 (새 글 알림)
    loc = "https://www.allfarm.kr/" + m["file"]
    when = format_datetime(datetime.datetime.fromisoformat(m["date"] + "T09:00:00+09:00"))
    items.append("<item><title>%s</title><link>%s</link><guid>%s</guid><description>%s</description><pubDate>%s</pubDate></item>" % (escape(m["h1"]), loc, loc, escape(m["desc"]), when))
for fname, _, _ in SITEMAP[:4]:
    src = os.path.join(HERE, "pages", fname)
    m, _ = parse_page(read(src))
    loc = "https://www.allfarm.kr/" + ("" if fname == "index.html" else fname)
    when = format_datetime(datetime.datetime.fromtimestamp(os.path.getmtime(src)).astimezone())
    items.append("<item><title>%s</title><link>%s</link><guid>%s</guid><description>%s</description><pubDate>%s</pubDate></item>" % (escape(m["title"]), loc, loc, escape(m["desc"]), when))
with open(os.path.join(OUT, "rss.xml"), "w", encoding="utf-8", newline="\n") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>올바른농지</title><link>https://www.allfarm.kr/</link>'
            '<description>농지 전수조사 대응 · 상속 농지 관리</description><language>ko</language>\n' + "\n".join(items) + "\n</channel></rss>\n")

print("built", len(pages), "pages +", len(POSTS), "posts ->", OUT, "| artifact copy ->", ART)
sys.exit(0 if ok else 1)

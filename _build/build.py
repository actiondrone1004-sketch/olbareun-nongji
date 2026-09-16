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
PAGE_KEYS = ["services", "about"]

def read(p):
    with open(p, encoding="utf-8") as f: return f.read()

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

def build_page(fname):
    meta, body = parse_page(read(os.path.join(HERE, "pages", fname)))
    cur = meta.get("cur", "")
    head = head_t.replace("{{TITLE}}", meta["title"]).replace("{{DESC}}", meta["desc"]).replace("{{KEYWORDS}}", meta.get("keywords", "")).replace("{{FILE}}", fname)
    header = header_t
    for k in PAGE_KEYS:
        header = header.replace("{{CUR_%s}}" % k, 'aria-current="page"' if cur == k else "")
    header = header.replace(' >', '>')
    footer = footer_t
    body = body.replace("{{APPLY}}", apply_t)
    if 'id="apply"' not in body:   # 이 페이지에 신청폼이 없으면 농지진단 페이지의 폼으로 보낸다
        header = header.replace('href="#apply"', 'href="index.html#apply"')
        footer = footer.replace('href="#apply"', 'href="index.html#apply"')
        body = body.replace('href="#apply"', 'href="index.html#apply"')
    if meta.get("noindex") == "true":
        head = head.replace('<meta name="description"', '<meta name="robots" content="noindex, nofollow">\n<meta name="description"')
    if meta.get("bare") == "true":   # 헤더·푸터 없는 독립 페이지 (admin.html)
        return head + body + '\n<script src="assets/site.js"></script>\n</body>\n</html>\n'
    full = head + header + "\n" + body + "\n" + footer + "</body>\n</html>\n"
    return full

ok = True
os.makedirs(ART, exist_ok=True)
pages = sorted(os.listdir(os.path.join(HERE, "pages")))
for fname in pages:
    html = build_page(fname)
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
print("built", len(pages), "pages ->", OUT, "| artifact copy ->", ART)
sys.exit(0 if ok else 1)

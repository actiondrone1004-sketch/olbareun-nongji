"""
보도·영상·SNS 목록 렌더링 (build.py가 import)
- data/media.json 을 읽어 {{MEDIA_*}} 자리에 넣을 HTML을 만든다
- 유튜브 채널 RSS · 블로그 RSS는 빌드할 때 받아 data/feed-cache.json 에 저장 (네트워크 실패 시 캐시 사용)
"""
import html, json, os, re, urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "media.json")
CACHE = os.path.join(HERE, "data", "feed-cache.json")

def esc(s): return html.escape(s or "", quote=True)
def dot(d): return (d or "").replace("-", ".")

def _get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (olbareun build)"})
    with urllib.request.urlopen(req, timeout=12) as r: return r.read()

def fetch_youtube(cid):
    ns = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}
    root = ET.fromstring(_get("https://www.youtube.com/feeds/videos.xml?channel_id=" + cid))
    out = []
    for e in root.findall("a:entry", ns):
        vid = e.findtext("yt:videoId", "", ns)
        link = e.find("a:link", ns).get("href", "")
        out.append({"type": "youtube", "url": link or "https://www.youtube.com/watch?v=" + vid, "id": vid,
                    "title": e.findtext("a:title", "", ns), "date": e.findtext("a:published", "", ns)[:10]})
    return out

def fetch_blog(url):
    root = ET.fromstring(_get(url))
    out = []
    for it in root.iter("item"):
        d = it.findtext("pubDate", "")
        try: d = parsedate_to_datetime(d).strftime("%Y-%m-%d")
        except Exception: d = ""
        desc = it.findtext("description", "") or ""
        m = re.search(r'<img[^>]+src="([^"]+)"', desc)
        out.append({"type": "blog", "url": it.findtext("link", ""), "title": it.findtext("title", ""), "date": d, "thumb": m.group(1) if m else ""})
    return out[:30]

def load(extra=()):
    with open(DATA, encoding="utf-8") as f: data = json.load(f)
    ch = data.get("channels", {})
    cache = {}
    if os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as f: cache = json.load(f)
    for key, fn, arg in (("youtube", fetch_youtube, ch.get("youtube_channel_id")), ("blog", fetch_blog, ch.get("blog_rss"))):
        if not arg: cache.pop(key, None); continue
        try:
            cache[key] = fn(arg); print("  media: %s %d건 수집" % (key, len(cache[key])))
        except Exception as e:
            print("  media: %s 수집 실패(%s), 캐시 %d건 사용" % (key, e.__class__.__name__, len(cache.get(key, []))))
    with open(CACHE, "w", encoding="utf-8") as f: json.dump(cache, f, ensure_ascii=False, indent=1)
    feed = list(data["feed"]["items"]) + list(extra)
    seen = {i["url"] for i in feed}
    for k in ("youtube", "blog"):
        feed += [i for i in cache.get(k, []) if i["url"] not in seen]
    feed.sort(key=lambda i: i.get("date", ""), reverse=True)
    videos = sorted(data["videos"]["items"], key=lambda i: i["date"], reverse=True)
    news = sorted(data["news"]["items"], key=lambda i: i["date"], reverse=True)
    return feed, videos, news

TYPE_NAME = {"instagram": "인스타그램", "youtube": "유튜브", "blog": "블로그"}

def yt_id(url):
    m = re.search(r"(?:v=|youtu\.be/|shorts/|embed/)([\w-]{11})", url or "")
    return m.group(1) if m else ""

def feed_card(i):
    t = i.get("type", "blog")
    thumb = i.get("thumb") or ""
    if t == "youtube" and not thumb:
        vid = i.get("id") or yt_id(i["url"])
        if vid: thumb = "https://i.ytimg.com/vi/%s/hqdefault.jpg" % vid
    # 네이버 블로그 썸네일(pstatic)은 다른 사이트 리퍼러면 403 → 리퍼러 없이 요청
    ph = ('<img src="%s" alt="" loading="lazy" referrerpolicy="no-referrer">' % esc(thumb)) if thumb else '<span class="ph-empty">%s</span>' % TYPE_NAME.get(t, "")
    ext = ' target="_blank" rel="noopener"' if i["url"].startswith("http") else ""   # 사이트 안 블로그 글은 같은 창
    return ('<a class="fd-card fd-%s" data-type="%s" href="%s"%s>'
            '<span class="ph">%s<span class="badge">%s</span></span>'
            '<span class="body"><span class="src">%s · %s</span><b>%s</b></span></a>') % (
        t, t, esc(i["url"]), ext, ph, TYPE_NAME.get(t, ""), TYPE_NAME.get(t, ""), dot(i.get("date")), esc(i.get("title")))

def video_card(v):
    return ('<div class="vd-card">'
            '<button type="button" class="vd-play" data-yt="%s" aria-label="%s 재생">'
            '<img src="https://i.ytimg.com/vi/%s/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">'
            '<span class="vd-btn" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></button>'
            '<a class="body" href="https://www.youtube.com/watch?v=%s" target="_blank" rel="noopener"><span class="src">%s · %s</span><b>%s</b></a></div>') % (
        esc(v["id"]), esc(v["title"]), esc(v["id"]), esc(v["id"]), esc(v["source"]), dot(v["date"]), esc(v["title"]))

def news_card(n):
    src = n.get("img", "")
    if src and not src.startswith("http"): src = "assets/img/news/" + src
    ph = ('<img src="%s" alt="" loading="lazy" width="480" height="300">' % esc(src)) if n.get("img") else '<span class="ph-empty">%s</span>' % esc(n["source"])
    return ('<a class="nw-card" href="%s" target="_blank" rel="noopener"><span class="ph">%s</span>'
            '<span class="body"><span class="src">%s · %s</span><b>%s</b></span></a>') % (
        esc(n["url"]), ph, esc(n["source"]), dot(n["date"]), esc(n["title"]))

EMPTY_FEED = ('<div class="fd-empty"><b>첫 영상과 글을 준비하고 있습니다.</b>'
              '<p>올라오는 대로 이곳에 모입니다. 채널을 구독하시면 먼저 받아보실 수 있어요.</p>'
              '<div class="sns-row">%s</div></div>')

def sns_buttons():
    return ('<a class="sns sns-yt" data-link="youtube" href="#" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9l5.7 3.1z"/></svg>유튜브</a>'
            '<a class="sns sns-ig" data-link="instagram" href="#" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>인스타그램</a>'
            '<a class="sns sns-kk" data-link="kakao" href="#" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.6 10-8S17.5 3 12 3z"/></svg>카카오톡 채널</a>'
            '<a class="sns sns-bl" data-link="blog" data-hide-empty href="#" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v12H8l-4 4z"/></svg>블로그</a>')

def ceo_blocks():
    with open(DATA, encoding="utf-8") as f: c = json.load(f).get("ceo", {})
    by_date = lambda l: sorted(l, key=lambda i: (bool(i.get("pin")), i["date"]), reverse=True)
    links = "".join('<li><a href="%s" target="_blank" rel="noopener">%s<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg></a></li>' % (esc(l["url"]), esc(l["label"])) for l in c.get("links", []))
    return {
        "{{MEDIA_CEO_TV}}": '<div class="vd-list album" id="ceoTv">%s</div>' % "".join(video_card(v) for v in by_date(c.get("tv", []))),
        "{{MEDIA_CEO_TV_COUNT}}": str(len(c.get("tv", []))),
        "{{MEDIA_CEO_LECTURES}}": '<div class="vd-list album" id="ceoLec">%s</div>' % "".join(video_card(v) for v in by_date(c.get("lectures", []))),
        "{{MEDIA_CEO_ARTICLES}}": '<div class="nw-list list" id="ceoNews">%s</div>' % "".join(news_card(n) for n in by_date(c.get("articles", []))),
        "{{MEDIA_CEO_LINKS}}": '<ul class="link-list">%s</ul>' % links,
    }

def render(extra=()):
    """extra: 사이트 안 블로그 글(build.py가 _build/posts/에서 읽어 넘김) — feed에 합쳐 보도 탭·홈에 나온다"""
    feed, videos, news = load(extra)
    tabs = ""
    if feed:
        types = [t for t in ("instagram", "youtube", "blog") if any(i.get("type") == t for i in feed)]
        tabs = '<div class="fd-tabs" role="group" aria-label="종류">' + '<button type="button" class="on" data-filter="all">전체</button>' + "".join(
            '<button type="button" data-filter="%s">%s</button>' % (t, TYPE_NAME[t]) for t in types) + "</div>" + \
            '<div class="view-toggle" role="group" aria-label="보기 방식"><button type="button" class="on" data-view="album" data-target="#feedList">앨범</button><button type="button" data-view="list" data-target="#feedList">목록</button></div>'
        tabs = '<div class="pr-tools">' + tabs + '</div>'
    feed_html = ('<div class="fd-list album" id="feedList">%s</div>' % "".join(feed_card(i) for i in feed)) if feed else EMPTY_FEED % sns_buttons()
    return {
        **ceo_blocks(),
        "{{MEDIA_SNS}}": sns_buttons(),
        "{{MEDIA_FEED_TABS}}": tabs,
        "{{MEDIA_FEED}}": feed_html,
        "{{MEDIA_FEED_COUNT}}": str(len(feed)),
        "{{MEDIA_FEED_HOME}}": ('<section id="sns"><div class="container"><div class="sec-head"><h2>올바른농지 숏폼 · 블로그</h2></div>'
                                '<div class="fd-list album">%s</div><p class="more-link"><a href="press.html#sns">전체 보기 →</a></p></div></section>'
                                % "".join(feed_card(i) for i in feed[:4])) if feed else "",
        "{{MEDIA_VIDEOS}}": '<div class="vd-list album" id="videoList">%s</div>' % "".join(video_card(v) for v in videos),
        "{{MEDIA_VIDEOS_HOME}}": '<div class="vd-list album">%s</div>' % "".join(video_card(v) for v in videos[:4]),
        "{{MEDIA_NEWS}}": '<div class="nw-list album" id="newsList">%s</div>' % "".join(news_card(n) for n in news),
        "{{MEDIA_NEWS_COUNT}}": str(len(news)),
        "{{MEDIA_VIDEOS_COUNT}}": str(len(videos)),
    }

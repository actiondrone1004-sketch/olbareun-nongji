"""
블로그 글 썸네일(= 공유 이미지 og:image, 1200x630) 생성
  python _build/post_thumbs.py        (Pillow 필요, 맑은 고딕 사용)
- _build/posts/*.html front matter의 h1과 thumb 경로를 읽어, 없는 파일만 만든다 (다시 만들려면 파일을 지우고 실행)
- 색은 site.css '색 조합 C': 짙은 올리브 면 + 벼이삭 금색 선 + 흰 글씨
"""
import os, re
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
FONT_B = "C:/Windows/Fonts/malgunbd.ttf"
FONT_R = "C:/Windows/Fonts/malgun.ttf"
BG, GOLD, WHITE, SOFT = (46, 58, 36), (200, 162, 74), (255, 255, 255), (214, 220, 200)

def wrap(draw, text, font, width):
    lines, cur = [], ""
    for word in text.split(" "):
        t = (cur + " " + word).strip()
        if draw.textlength(t, font=font) <= width: cur = t
        else: lines.append(cur); cur = word
    return lines + [cur]

def make(h1, path):
    im = Image.new("RGB", (1200, 630), BG)
    d = ImageDraw.Draw(im)
    d.rectangle([80, 170, 200, 178], fill=GOLD)
    main, _, sub = h1.partition(" — ") if " — " in h1 else h1.partition("? ")
    if _ == "? ": main += "?"
    f1 = ImageFont.truetype(FONT_B, 64)
    y = 215
    for line in wrap(d, main, f1, 1040):
        d.text((80, y), line, font=f1, fill=WHITE); y += 86
    if sub:
        f2 = ImageFont.truetype(FONT_R, 38)
        y += 10
        for line in wrap(d, sub, f2, 1040):
            d.text((80, y), line, font=f2, fill=SOFT); y += 54
    d.text((80, 540), "올바른농지 · allfarm.kr", font=ImageFont.truetype(FONT_B, 30), fill=GOLD)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, quality=86)
    print("thumb", os.path.basename(path))

for fn in sorted(os.listdir(os.path.join(HERE, "posts"))):
    src = open(os.path.join(HERE, "posts", fn), encoding="utf-8").read()
    h1 = re.search(r"^h1:\s*(.*)$", src, re.M).group(1)
    th = re.search(r"^thumb:\s*(.*)$", src, re.M)
    if th and not os.path.exists(os.path.join(OUT, th.group(1))):
        make(h1, os.path.join(OUT, th.group(1)))

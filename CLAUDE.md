# 2026 농지 전수조사 홈페이지 (올바른농지)

덴딜(dendeal.ai.kr) 구조를 참조한 다중 페이지 정적 사이트. 프레임워크 없음.
기획서: https://claude.ai/artifact/T2K9FdeY1LHr7DqQg3a1br (와이어프레임 기획서, 2026-09-16)

## 구조
```
index.html                 홈 (hero+무료진단 폼(이름·연락처만) → 숫자 강조 4(#facts) → 관련 뉴스 3x3+더보기(#news) → CTA(#contact))
services.html              서비스소개 (확인 필요 농지 → 절차+이행강제금 예상 비용 → 관리해야 하는 이유 3 → 왜 올바른농지 → 폼)
about.html                 회사소개 (v2 2026-09-16: HERO+신뢰바 → 대표 소개(#ceo: 프로필·출강 로고 15·강의사진·저서2) → 기준과 원칙(#principles: 기준3·하는일/하지않는일·이해관계 공개·진단 3단계) → 방송·언론(#press) → 함께하는 곳(#partners) → 회사개요·오시는길(#map) → 폼). 하단에 JSON-LD Person/Organization
terms.html privacy.html    약관 · 개인정보처리방침 (템플릿, [ ] 채워야 함)
admin.html                 신청 관리 화면 (메뉴에 없음, noindex, 헤더·푸터 없는 bare 페이지). CONFIG.FORM_ENDPOINT의 Apps Script에서 목록을 읽고 상태·메모를 저장
tools/apps-script/         Code.gs(구글 시트 저장 + 목록 API + 메일 알림) · README.md(설치 순서). 신청폼 → 시트 '신청목록' = 관리자 목록
assets/site.css            공통 CSS (토큰 --g-700 등 → 공통 컴포넌트 → 메인 → 서브 → 반응형)
assets/site.js             공통 JS — 맨 위 CONFIG 블록(PHONE/HOURS/FORM_ENDPOINT/CONTACT_EMAIL/KAKAO_URL/BLOG_URL/SHEET_URL — APP_* 는 앱 배너 제거로 현재 미사용)
assets/img/                hero.jpg field.jpg · news/news-NN.jpg (기사 썸네일 480x300)
  about/                   회사소개용: prof-juwang.png(원본 그대로, 검정 배경 — 카드 배경도 #000) · lecture-1/2.webp · book-*.webp(저서 표지 2) · tv-sbsbiz-moneyshow-1/2.webp · logos/*.webp(출강 로고 15, 흰배경 평탄화·트림)
images/                    ★ 원본 자료(배포 안 함). 사용자가 넣어준 사진·로고 원본. cafe/ banner/ quick/ 는 콕집어경매(경매학원) 프로젝트 자산이라 여기선 안 씀. books/저서2(저자 다름)·저서4(내지)·career/방송3(교수 미출연)은 미사용
_build/                    ★ 소스. 루트 *.html은 여기서 생성된 산출물
  partials/  head · header(GNB) · footer · apply(서브페이지 하단 CTA+폼)
  _unused/   제거된 것들(계산기 · 서비스4카드 · 전수조사 페이지 · 서비스 상세 4페이지(service-pages/) · 메인 비용안내/이용방법/사례/중요안내 섹션) — 복구용
  pages/     페이지별 front matter(title/desc/keywords/cur/noapply/bare/noindex) + <main> 본문. {{APPLY}} 자리에 apply 파셜 삽입
  build.py   python _build/build.py → 루트 html 생성 + dist-artifact/ 생성 + 태그/중복id 검사
  dist-artifact/  Artifact 배포용 (index.html은 fragment, 나머지는 완전한 문서)
_archive/                  이전 단일 페이지 버전 (base64 이미지 인라인, 대용량 — 읽지 말 것)
```

## 편집 규칙
- **루트 html을 직접 고치지 말 것.** `_build/pages/*.html`(페이지 내용) 또는 `_build/partials/*.html`(GNB·푸터·폼)을 고치고 `python _build/build.py` 실행.
- index·services·about에는 `id="apply"` 폼(이름·연락처만)이 있어 `href="#apply"`가 공통 CTA. 폼이 없는 페이지(terms·privacy·admin)는 빌드가 `index.html#apply`로 바꿈.
- 카피 규칙: "바로 25%" "100% 해결" "안 걸리게" 금지. 절차(조사→처분의무→처분명령→미이행→이행강제금)와 유예(§12)를 함께 쓴다. 결과 보장 문구 금지.
- 후기/실적은 실제 자료가 생기기 전까지 넣지 않는다.
- 대표: 이주왕 교수 (올바른농지 대표이사 · 이주왕kok경매학원 대표 · 서울사이버대학교 부동산학과 겸임교수 — 직함은 SBS Biz 방송 자막 기준). 회사소개의 인용문·설립 동기 문단은 초안이라 대표 확인 필요. 출강 로고는 '제휴'가 아닌 '출강 이력'으로만 표기하고 연도·내용은 미확인.
- 이미지 후처리는 Pillow(설치됨)로. 헤드리스 스크린샷: Edge `--headless=new --window-size=W,H --screenshot=...` (W는 500 이상이어야 함 — 그 아래는 최소창 크기 때문에 잘려 보임)

## 배포 (Artifact)
- URL: https://claude.ai/code/artifact/6e45d7c9-dd48-48bb-b901-7fdc5db59a61 (단축: https://claude.ai/artifact/EcnSzT1JAdcyqnch3nHQK2)
- 빌드 후 Artifact 툴: `file_path: _build/dist-artifact/index.html`, `root: _build/dist-artifact`, `url:` 위 주소,
  `files`: 나머지 8개 html + assets/site.css + assets/site.js + assets/img/* (list form).
  `url` 없이 배포하면 별개 아티팩트가 생기니 반드시 붙일 것. 배포 전 `action: "read"`로 최신 버전 확인.
- 서브페이지가 아티팩트 안에서 supporting file로 열리는지는 2026-09-16 기준 미확인. 안 되면 GitHub Pages/Netlify로 배포(루트 파일 그대로 올리면 됨).
- 실서비스 도메인 배포 시: www / non-www 둘 다 HTTPS, head.html의 canonical·og:image 절대 URL·네이버 서치어드바이저 메타 채우기, sitemap.xml·robots.txt 추가.
- 참고: 같은 이름의 디자인 캔버스 아티팩트가 따로 있다(af8ec918-88e2-4176-be59-8809a09eac70). 홈페이지 코드가 아니므로 혼동 금지.

## 신청 접수 흐름
폼(site.js form.apply-form) → CONFIG.FORM_ENDPOINT로 POST. Apps Script 주소(script.google.com)면 text/plain으로 보내고(CORS 회피) 시트에 저장·메일 알림. 비어 있으면 mailto 폴백. Formspree 등 JSON 엔드포인트도 그대로 됨.

## 미기입 플레이스홀더
`[상담전화]` `[상담 가능 시간]` `[주소]` `[사업자번호]` `[가격]` `[서비스 지역]` `[이메일]`,
about.html 함께하는 곳의 `[협력 행정사 사무소 · 법무법인]` `[협력 세무사]` `[농작업 · 묘목 협력업체]` (동의 받은 곳만 실명·로고 표기), terms/privacy의 `[시행일]` `[환불 기준]` `[폼 서비스명]`,
`tel:00000000000` (CONFIG.PHONE 채우면 JS가 교체), 블로그 글 링크(CONFIG.BLOG_URL).

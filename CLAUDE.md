# 2026 농지 전수조사 홈페이지 (올바른농지)

덴딜(dendeal.ai.kr) 구조를 참조한 다중 페이지 정적 사이트. 프레임워크 없음.
기획서: https://claude.ai/artifact/T2K9FdeY1LHr7DqQg3a1br (와이어프레임 기획서, 2026-09-16)

## 구조
```
index.html                 홈 v5 (2026-09-28, 인포그래픽·모션): hx 위성 스캔 지도 hero(SVG 필지 격자·스캔선·현장 확인 표시 — mk 스크립트로 생성한 정적 SVG) → #why 숫자 카드 4(카운트업·막대·4곳 중 1곳·매년 누적) → #flow 절차 5단계 선 그리기+유예 분기 → #stories 아이콘 인용 3 → #how 세 걸음 원형 아이콘 → #promise → #ceo → #apply → 숏폼·방송 뉴스. 모션은 [data-reveal]→.in(site.js IntersectionObserver), html.js일 때만 숨김, prefers-reduced-motion이면 정지
services.html              '농지전수조사' 탭 v5 인포그래픽(2026-09-28): 뉴스 hero → #schedule 조사 일정 타임라인(개월 비례·'지금' 표시) → #facts 면적 비교(10,490,000 대 550,000)·100칸 중 27칸·12개월 → #check 아이콘 6칸 → #process 5단계 선+조문·유예/기한 상자 → #penalty 25% 막대·매년 누적 → 마무리 CTA → 폼. 생성 스크립트 없이 _build/pages/services.html 직접 편집(100칸·12칸은 반복 태그). CSS는 site.css 'sv-' 블록과 '농지전수조사 v5' 블록
about.html                 회사 소개 v5 인포그래픽(2026-09-28): ab-hero(사진+숫자 15곳·10편·2권 카운트업) → #ceo 걸어온 길 타임라인(2011 법인·2013·2018·2020~23·2024·2026 — 출처 확인된 것만) → #scope 경계선(하는/하지 않는 일 아이콘)+약속 3 → #career 로고·강의 사진·저서 → #media 대표 방송·강의 영상·기사·링크 → #map 회사 개요 아이콘 카드(네이버 지도 링크) → 폼. JSON-LD 유지
press.html                 '보도' 탭(2026-09-28): 채널 버튼 → 방송 뉴스(유튜브, 제자리 재생) → 올바른농지 숏폼·블로그 → 기사(2026-09-30 순서 변경, 섞지 않음). 각 목록 앨범/목록 전환. 내용은 전부 _build/data/media.json에서 생성(아래 '보도·SNS 데이터')
terms.html privacy.html    약관 · 개인정보처리방침 (템플릿, [ ] 채워야 함)
admin.html                 관리자 화면 (푸터 맨 아래 '관리자' 링크, noindex, bare 페이지). 비밀번호만 입력(계정은 ADMIN_EMAIL 고정) → [통계] 일·월·연별 방문자·조회수·페이지별·문의·카카오/전화/유튜브/인스타 클릭 + [문의 목록] leads 상태·메모·삭제 (SDK 없이 REST)
tools/firebase/            ★ 신청 저장소(현재 사용). firestore.rules(권한: 누구나 생성, 관리자 이메일만 읽기·수정) · firebase.json · README.md(설정·관리자 추가·규칙 배포 명령)
tools/apps-script/         (대안, 미사용) Code.gs 구글 시트 저장 + 목록 API + 메일 알림 · README.md
assets/site.css            공통 CSS — 색 조합 C(2026-09-28): 흰 배경 · 올리브 #4b5d3a(짙은 면 #2e3a24) · 벼이삭 금색 #c8a24a · 먹색 글자 #1c1c1a · 경고 주황 #c0643f 하나만. 라임 형광·원형 그라데이션 금지, 짙은 면은 페이지당 최소로. 맨 아래 '색 조합 C' 블록이 :root 토큰을 최종 결정 · 1160px. 앞부분은 812bc3e의 평면 CSS, 'v3' 블록(상황 선택·역할표·기록·상담 과정·비용·FAQ·폼 select) → 맨 아래 '가독성 보정' 블록(본문 17px·잉크 진하게·제목 700·작은 글씨 13px 이상 — 사용자 요청, 글씨체 바꿀 때 이 블록 유지). 반응형 950/700/480
olbareun-redesign/         1차 재구성안(다른 도구 산출물, gitignore). 이력: 09-17 적용→반려→되돌림, 09-18 사용자가 2차 기획(상황 중심)을 주며 미색 디자인 선택 → 현재 v3. 초록 카드형 디자인은 git 764dafd 에 남아 있음
assets/site.js             공통 JS — 맨 위 CONFIG 블록(PHONE/HOURS/FIREBASE{apiKey,projectId}/FORM_ENDPOINT/CONTACT_EMAIL/KAKAO_URL/BLOG_URL — APP_*·SHEET_URL은 현재 미사용)
assets/img/                hero.jpg field.jpg · news/news-NN.jpg (기사 썸네일 480x300)
  about/                   회사소개용: prof-juwang.png(원본 그대로, 검정 배경 — 카드 배경도 #000) · lecture-1/2.webp · book-*.webp(저서 표지 2) · tv-sbsbiz-moneyshow-1/2.webp · logos/*.webp(출강 로고 15, 흰배경 평탄화·트림)
images/                    ★ 원본 자료(배포 안 함). 사용자가 넣어준 사진·로고 원본. cafe/ banner/ quick/ 는 콕집어경매(경매학원) 프로젝트 자산이라 여기선 안 씀. books/저서2(저자 다름)·저서4(내지)·career/방송3(교수 미출연)은 미사용
_build/                    ★ 소스. 루트 *.html은 여기서 생성된 산출물
  partials/  head · header(GNB) · footer · apply(서브페이지 하단 CTA+폼)
  _unused/   제거된 것들(계산기 · 서비스4카드 · 전수조사 페이지 · 서비스 상세 4페이지(service-pages/) · 메인 비용안내/이용방법/사례/중요안내 섹션) — 복구용
  pages/     페이지별 front matter(title/desc/keywords/cur/noapply/bare/noindex) + <main> 본문. {{APPLY}} 자리에 apply 파셜 삽입
  build.py   python _build/build.py → 루트 html 생성 + dist-artifact/ 생성 + 태그/중복id 검사 + site.css/site.js 링크에 내용 해시 ?v= 부여(캐시 무효화 — GitHub Pages 10분 캐시 때문에 배포 직후 옛 CSS+새 HTML로 깨져 보이던 문제 방지)
  dist-artifact/  Artifact 배포용 (index.html은 fragment, 나머지는 완전한 문서)
_archive/                  이전 단일 페이지 버전 (base64 이미지 인라인, 대용량 — 읽지 말 것)
```

## 편집 규칙
- **루트 html을 직접 고치지 말 것.** `_build/pages/*.html`(페이지 내용) 또는 `_build/partials/*.html`(GNB·푸터·폼)을 고치고 `python _build/build.py` 실행.
- index·services·about에는 `id="apply"` 폼(이름·연락처만)이 있어 `href="#apply"`가 공통 CTA. 폼이 없는 페이지(terms·privacy·admin)는 빌드가 `index.html#apply`로 바꿈.
- 섹션 위 소제목 라벨(.sec-tag / .eyebrow — Trust·Press·서비스소개 같은 작은 글씨)은 사용자 요청으로 전부 제거함(2026-09-17). 새 섹션에도 넣지 말 것
- v4 원칙(2026-09-28 사용자 요청): 홈페이지는 짧은 카피와 이야기 흐름으로 단순하게, 자세한 문의는 카카오톡 채널(CONFIG.KAKAO_URL)에서 진행. 설명을 늘리지 말 것. 아래 v3 원칙 중 금지 사항은 그대로 유효
- v3 원칙(사용자 2차 기획, 2026-09-18): 고객이 '내 상황 찾기 → 받을 도움 이해 → 상담 결정' 순으로 읽게 한다. 상황 선택은 안내용 분류일 뿐 진단·결과 단정 금지. 제공하지 않는 결과물·응답 시간 약속 금지(결과 전달 방식·계획서 형식·가격 예시는 운영 기준 확정 후 — index의 `[가격 기준 확정 후 대표 예시 표기]`·`[서비스 지역]` 참고). 관리기록은 '예시' 표기 유지, 실제 수행 자료(담당자·현장·익명화 기록)는 확보 후 별도 사례 영역에. (숫자 카운팅 금지는 2026-09-28 사용자 요청으로 홈 인포그래픽에 한해 해제 — 스크롤 등장·카운트업·선 그리기 정도까지, 깜빡임·자동 슬라이드는 쓰지 않음.) 폼의 '상담 상황' select 값은 Firestore extra['상담 상황']로 저장되어 admin 이름 아래 표시
- 카피 규칙: "바로 25%" "100% 해결" "안 걸리게" 금지. 절차(조사→처분의무→처분명령→미이행→이행강제금)와 유예(§12)를 함께 쓴다. 결과 보장 문구 금지.
- 후기/실적은 실제 자료가 생기기 전까지 넣지 않는다.
- 대표: 이주왕 교수 (올바른농지 대표이사 · 이주왕kok경매학원 대표 · 서울사이버대학교 부동산학과 겸임교수 — 직함은 SBS Biz 방송 자막 기준). 회사소개의 설립 동기 문장("…돕기 위해 올바른농지를 설립했습니다")은 초안이라 대표 확인 필요(인용문은 v3에서 삭제). 출강 로고는 '제휴'가 아닌 '출강 이력'으로만 표기하고 연도·내용은 미확인.
- 이미지 후처리는 Pillow(설치됨)로. 헤드리스 스크린샷: Edge `--headless=new --window-size=W,H --screenshot=...` (W는 500 이상이어야 함 — 그 아래는 최소창 크기 때문에 잘려 보임)

## 배포 (GitHub Pages — 실서비스)
- 공개 주소: https://www.allfarm.kr (2026-09-28 연결 · 루트 CNAME 파일 · allfarm.kr→www 자동 이동 · HTTPS 강제 · 옛 github.io 주소는 새 주소로 301)
  DNS: www CNAME actiondrone1004-sketch.github.io / @ A 185.199.108~111.153. head.html canonical·og:url·og:image, sitemap·robots, about JSON-LD가 이 주소를 쓴다
- 저장소: https://github.com/actiondrone1004-sketch/olbareun-nongji (public, main 브랜치 루트에서 Pages 빌드)
- 배포 순서: `python _build/build.py` → `git add -A && git commit -m "..." && git push` → 1~2분 뒤 반영 (Pages 상태: `gh api repos/actiondrone1004-sketch/olbareun-nongji/pages --jq .status`)
- .gitignore로 제외: `_archive/` `_design/` `_build/dist-artifact/` `images/`(사이트 미참조 원본) `KakaoTalk_*.jpg` `*.docx` — 개인 사진·원본 자료는 공개 저장소에 올리지 말 것
- robots.txt는 admin.html을 크롤링 제외
- 검색 노출(2026-09-30): 네이버 서치어드바이저·구글 서치 콘솔 소유 확인 코드는 build.py `SITE_VERIFY`에 넣으면 index.html head에만 meta로 들어감(빈 값이면 생략). sitemap.xml·rss.xml(메뉴 4페이지, 네이버 RSS 제출용)은 빌드가 pages/ 수정일로 생성. 네이버·구글 소유 확인 코드 입력·배포 완료(2026-09-30, 구글은 URL 접두어 속성). sitemap·rss 제출 완료(사용자 확인 2026-09-30) — 글 추가·수정 시 재제출 불필요, 빌드·배포만. 홈 하단 JSON-LD(WebSite·Organization sameAs = 유튜브·인스타·카카오)
- 이 PC에서 `python`이 "Could not find platform independent libraries"로 죽으면 PowerShell에서 `$env:PYTHONHOME="C:\Users\kswmi\AppData\Local\Programs\Python\Python312"` 후 실행

## 배포 (Artifact — 미리보기용)
- URL: https://claude.ai/code/artifact/6e45d7c9-dd48-48bb-b901-7fdc5db59a61 (단축: https://claude.ai/artifact/EcnSzT1JAdcyqnch3nHQK2)
- 빌드 후 Artifact 툴: `file_path: _build/dist-artifact/index.html`, `root: _build/dist-artifact`, `url:` 위 주소,
  `files`: 나머지 8개 html + assets/site.css + assets/site.js + assets/img/* (list form).
  `url` 없이 배포하면 별개 아티팩트가 생기니 반드시 붙일 것. 배포 전 `action: "read"`로 최신 버전 확인.
- 서브페이지가 아티팩트 안에서 supporting file로 열리는지는 2026-09-16 기준 미확인. 안 되면 GitHub Pages/Netlify로 배포(루트 파일 그대로 올리면 됨).
- 실서비스 도메인 배포 시: www / non-www 둘 다 HTTPS, head.html의 canonical·og:image 절대 URL·네이버 서치어드바이저 메타 채우기, sitemap.xml·robots.txt 추가.
- 참고: 같은 이름의 디자인 캔버스 아티팩트가 따로 있다(af8ec918-88e2-4176-be59-8809a09eac70). 홈페이지 코드가 아니므로 혼동 금지.

## 보도·SNS 데이터 (2026-09-28~)
- `_build/data/media.json` → `_build/media.py`가 `{{MEDIA_*}}` 자리(press.html·index 하단·푸터 채널 버튼)에 HTML 생성. 수정 후 `python _build/build.py`
- videos: 방송사 보도 영상(유튜브 ID). 정치 논평 채널은 넣지 않는다. news: 기사(썸네일은 assets/img/news/)
- feed: 올바른농지 숏폼·블로그. 인스타그램은 공개 API가 없어 릴스 URL을 직접 추가(type instagram, thumb 선택). 유튜브 채널(UCVs19gtXW8jh4VA0HZUoigQ)은 빌드 때 RSS로 자동 수집, 블로그는 channels.blog_rss에 RSS 주소를 넣으면 자동 수집. 수집 결과는 data/feed-cache.json(네트워크 실패 시 사용). 채널에 영상이 없으면 RSS가 404 → '수집 실패, 캐시 0건'은 정상
- 채널 주소는 site.js CONFIG(KAKAO_URL·YOUTUBE_URL·INSTAGRAM_URL·BLOG_URL) — data-link="youtube|instagram|kakao|blog"
- ceo: 회사 소개 #media(대표 방송·강의 영상·기사·링크). 설명란/본문에 이주왕 이름이 확인된 자료만. 교보문고 '이주왕' 저자 페이지는 약력(충남대 행정·랜드타운 공법)이 달라 동명이인 가능 → 넣지 않음. 에듀윌은 '서울사이버대 외래강사', SBS 자막은 '겸임교수'로 표기가 다름
- 빌드 print에 '—' 같은 문자 쓰지 말 것(Windows 콘솔 cp949에서 빌드가 죽음)

## 블로그 (2026-09-30~, 사이트 안 글)
- 글 소스: `_build/posts/blog-*.html` (front matter: title=검색 제목 · h1=본문 제목 · desc · keywords · date · thumb). desc(페이지·OG 설명)는 80자 이내(공백 포함, 여유 두고 78자 이하) — 네이버 서치어드바이저 권고(2026-10-01 전 페이지 맞춤), pages/ 도 동일. 빌드가 루트 `blog-*.html`로 만들고 글 틀(경로·날짜·안내문·상담 CTA·다른 글·폼·BlogPosting JSON-LD)을 씌움. 보도 탭 '숏폼·블로그'·홈 하단·sitemap·rss에 자동 추가
- 썸네일(=og:image 1200x630): `python _build/post_thumbs.py` → assets/img/blog/ (없는 파일만 생성, 맑은 고딕)
- 글 원칙: 공개 보도·법령만 근거로, 끝에 '참고한 자료'(ul.post-src) 링크 필수. 카피 규칙 동일(절차+유예 함께, 결과 보장·'피하는 법' 금지). 정부 '추진' 사항은 확정 전이라고 명시
- 글 9편(2026-09-30): 전수조사 대상·일정 / 처분의무·처분명령·유예 / 이행강제금 25% / 상속 농지 / 심층조사 10대 위험군 / 임대차 특별정비기간 / 무단 휴경 기준 / 불법 전용 양성화 / 거래 절벽. 인포그래픽은 HTML·CSS figure.pf(pf-flow 단계·pf-bars 막대·pf-stats 숫자·pf-chips 번호칸·pf-vs 두칸 비교, site.css 블로그 인포그래픽 블록) — 이미지 아닌 글자라 검색에 읽힘. 조사 지침 원문 PDF(mafra 597611) 근거 사용. 대표 검토 전이라 저자는 '올바른농지'(조직)로 표기

## 방문 통계 (2026-09-28~)
site.js 맨 아래가 Firestore `stats/{YYYY-MM-DD}`(한국 날짜) 칸을 increment로 1씩 올린다: v(그날 첫 방문, localStorage ob_seen_day) · pv · pv_home/services/about/press/other · c_kakao/phone/youtube/instagram/blog. localhost·file·admin·webdriver는 제외.
규칙(firestore.rules stats)은 허용 칸만, 칸마다 +1까지, 읽기는 관리자만 — 칸을 추가하면 statKeys()와 admin FIELDS 둘 다 고치고 규칙 배포. 문의 수는 leads의 createdAt으로 센다.
사업자: 농업회사법인 주식회사 비전글로벌(브랜드 올바른농지) · 140-81-01121 · 경기도 안양시 동안구 관악대로 486, 3층(관양동, 덕진빌딩). 등록증 PDF는 gitignore(*.pdf)

## 신청 접수 흐름 (Firebase, 2026-09-17~)
폼(site.js form.apply-form) → Firestore REST `documents:commit`으로 `leads/{id}` 생성 (CONFIG.FIREBASE, createdAt은 서버시간). 관리자는 admin.html에서 이메일/비밀번호 로그인(Identity Toolkit REST) 후 runQuery로 목록 조회, PATCH로 상태·메모, DELETE로 삭제.
- 프로젝트 `olbareun-nongji`(actiondrone1004@gmail.com 소유) · Firestore 서울 · 관리자 이메일은 `tools/firebase/firestore.rules` isAdmin() 목록 → 바꾸면 `firebase deploy --only firestore:rules --config tools/firebase/firebase.json --project olbareun-nongji`
- 규칙 테스트를 curl로 할 때 한글 본문은 반드시 UTF-8 파일(`--data-binary @file`)로 보낼 것 — Git Bash 인라인 문자열은 CP949로 나가 규칙(status=='신규')에 걸린다
- 새 신청 이메일 알림 없음(Functions는 유료 플랜). 대안: FIREBASE.projectId를 비우고 FORM_ENDPOINT에 Formspree/Apps Script 주소 → JSON POST(Apps Script는 text/plain). 둘 다 없으면 mailto 폴백

## 네이버 블로그 원고 (2026-10-01~, `_naver/`, gitignore — 현장 사진 포함)
- blog.naver.com/allfarm_ (블로그 주소 변경: 옛 visionglobal2004와 같은 블로그, 로그인 아이디는 visionglobal2004) 발행용 원고 패키지. `python _naver/make.py [01 05 ...]` → `_naver/out/index.html`(예약표) · `out/NN.html`(복사용 페이지: 본문 복사·제목·태그·이미지 목록) · `out/img/NN/`
- 원고 `_naver/posts/NN.txt`(front matter title·date·tags + 본문 줄 문법: `#`/`##`/`###` 제목, `>` 인용, `~` 작은 글씨, `---` 구분선, `**굵게**` `==형광==` `^^주황^^` `@@올리브@@` `++크게++`, `[card:이름|캡션]` `[photo:경로|캡션]` `[yt:ID|제목|출처]` `[link:URL|제목|출처]` `[end]`=연락처 맺음 블록, `[src]` 아래 `제목 | URL`)
- 인포그래픽은 `_naver/cards.py`(cover·stats·flow·bars·check·vs·tl·grid·tiles·table·qa·pics·ceo·cta) → HTML을 Edge headless로 1080px PNG 촬영(내용 해시 캐시 build/cache.json)
- 일정: 10/2~10/6 하루 4편(10·13·17·20시) 20편. 1~10편 작성 완료, 11~20편 계획은 make.py PLAN. 글자 수 공백 제외 1,500자 이상(빌드가 출력)
- 현장 사진(video/ 원본, 2025-06-25 촬영) 인물은 이주왕 대표 — 얼굴 공개 허용(2026-10-01). 번호판만 흐림(make.py BLUR)
- 네이버 글쓰기 API는 2020-05 종료. 손으로 올릴 때: 한 번에 붙여넣으면 사진(data URI)은 안 따라옴(사용자 확인 2026-10-01) → 복사용 페이지의 '조각 복사'(글 HTML·사진 PNG 클립보드·영상/기사 주소를 순서대로, 스페이스바로 다음 조각)로 Ctrl+V 반복
- 자동 발행(2026-10-01~): `_naver/upload/`(Playwright, 김해프로그램/tools/naver-blog 기반). `node login.js`(로그인 창 — '로그인 상태 유지' 자동 체크, allfarm_ 계정이 아니면 로그아웃) → `python _naver/upload/to_json.py`(out/NN.html → posts/NN.json) → `node post.js posts/NN.json`(인자 없으면 시험 작성만, 발행 차단) → `node run.js 시작 끝 간격분`(바로 발행, published.log에 있는 편은 건너뜀, 발행 버튼 뒤 오류는 재시도 안 함). 영상·기사는 링크 문단으로 들어감. 1~10편 발행 완료(2026-10-01 20:01~22:24, 10분 간격)

## 미기입 플레이스홀더
`[상담 가능 시간]` `[가격]` `[서비스 지역]` `[이메일]` (상담전화 010-2529-2998은 2026-10-01 입력: site.js CONFIG.PHONE + 파셜·페이지 정적 표기 + JSON-LD telephone),
terms/privacy의 `[시행일]` `[환불 기준]` `[폼 서비스명]` (네이버 블로그는 2026-09-30 연결, 2026-10-01 주소 변경: blog.naver.com/allfarm_ — 옛 visionglobal2004 RSS는 비어 있음, RSS 자동 수집),
카카오톡 채널 http://pf.kakao.com/_YzQrX.

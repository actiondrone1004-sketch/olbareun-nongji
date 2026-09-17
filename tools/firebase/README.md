# 무료진단 신청 → Firebase(Firestore) 저장 + 관리자 화면

신청폼에서 받은 이름·연락처가 Firestore `leads` 컬렉션에 한 건씩 쌓이고,
홈페이지의 **`admin.html`** 에서 로그인 후 목록을 보고 상태(신규/연락중/완료/보류)·메모를 관리합니다.
서버·SDK 없이 브라우저 → Firestore REST 로 바로 저장하며, 접근 권한은 `firestore.rules` 가 통제합니다.
Firebase 무료(Spark) 요금제 범위로 충분합니다. **새 신청 이메일 알림은 없습니다** (Cloud Functions = 유료 플랜 필요).

## 현재 설정 (2026-09-17)
- Firebase 프로젝트: `olbareun-nongji` (소유 계정: actiondrone1004@gmail.com)
  콘솔: https://console.firebase.google.com/project/olbareun-nongji
- Firestore: asia-northeast3(서울), 컬렉션 `leads`
- 웹 앱: `olbareun-nongji-web` — apiKey·projectId는 `assets/site.js` CONFIG.FIREBASE 에 들어 있음
  (웹 API 키는 공개용 식별자. 데이터 보호는 규칙이 담당하므로 저장소에 올려도 됨)
- 인증: 이메일/비밀번호. 관리자 이메일은 `firestore.rules` 의 `isAdmin()` 목록

## 데이터 구조 — `leads/{id}`
| 필드 | 설명 |
|---|---|
| name, phone | 이름·연락처 (phone은 `0XX-XXXX-XXXX` 형식만 허용) |
| page | 신청한 페이지 제목 + 주소 |
| extra | (선택) 폼에 항목이 늘면 label→값 map으로 저장 |
| status | 신규 → 연락중 → 완료 / 보류 (관리자만 변경) |
| memo | 관리자 메모 (500자) |
| createdAt | 서버 시각 |

## 관리자 추가/변경
1. Firebase 콘솔 → Authentication → Users → **사용자 추가** (이메일 + 임시 비밀번호)
   또는 admin.html 로그인 화면의 "재설정 메일 보내기"로 본인이 비밀번호를 정하게 할 수 있음
2. `firestore.rules` 의 `isAdmin()` 이메일 목록에 추가
3. 규칙 배포:
   ```
   firebase deploy --only firestore:rules --config tools/firebase/firebase.json --project olbareun-nongji
   ```
   (Firebase CLI 로그인 필요: `firebase login`)

## 확인 방법
- 사이트 폼에서 신청 → admin.html 로그인 → 목록에 보이면 성공. 콘솔 Firestore 데이터 탭에서도 확인 가능
- 폼 오류 시 브라우저 개발자도구 Network에서 `documents:commit` 응답 확인. 403이면 규칙 위반(형식·필드)

## 처음부터 다시 만들 때 (다른 프로젝트로 옮길 때)
```
firebase projects:create <id> --display-name "Olbareun Nongji"   # 표시 이름은 영문만 가능
firebase apps:create WEB <id>-web --project <id>
gcloud services enable firestore.googleapis.com identitytoolkit.googleapis.com --project <id>
gcloud firestore databases create --location=asia-northeast3 --project=<id>
firebase apps:sdkconfig WEB <appId> --project <id>     # apiKey·projectId → site.js CONFIG.FIREBASE
firebase deploy --only firestore:rules --config tools/firebase/firebase.json --project <id>
```
그 뒤 콘솔 → Authentication → **시작하기**(API로는 초기화 불가) → 이메일/비밀번호 사용 설정 → 사용자 추가.

## 다른 저장 방식
- Formspree 등: `site.js` 의 `FIREBASE.projectId` 를 비우고 `FORM_ENDPOINT` 에 주소를 넣으면 JSON POST
- Google Apps Script(구글 시트): `tools/apps-script/` — 같은 방법으로 `FORM_ENDPOINT` 에 웹앱 주소
- 둘 다 비우면 mailto 폴백

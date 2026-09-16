/**
 * 올바른농지 — 무료진단 신청 접수 (Google Apps Script 웹앱)
 *
 * 역할
 *  - 홈페이지 신청폼(POST) → 구글 시트 '신청목록'에 한 줄씩 저장 (관리자 목록)
 *  - admin.html(GET ?action=list) → 목록 JSON 반환 (관리자 키 필요)
 *  - admin.html(POST action=update) → 상태·메모 수정
 *  - 새 신청이 오면 NOTIFY_EMAIL로 알림 메일 (비워두면 생략)
 *
 * 설치 방법은 같은 폴더의 README.md 참고.
 */

var SHEET_NAME   = '신청목록';
var ADMIN_KEY    = 'CHANGE-ME-관리자키';   // admin.html에서 입력하는 키. 길고 추측 어려운 문자열로 바꿀 것
var NOTIFY_EMAIL = '';                     // 예) 'me@example.com'  새 신청 알림 받을 주소. 비우면 알림 없음

var FIXED_HEADERS = ['접수일시', '상태', '메모', '이름', '연락처'];   // 시트 앞쪽 고정 열. 나머지 항목은 뒤에 자동 추가

function doPost(e) {
  var body;
  try { body = JSON.parse((e.postData && e.postData.contents) || '{}'); }
  catch (err) { return out({ ok: false, error: 'bad_json' }); }

  // 관리자 화면에서 상태·메모 수정
  if (body.action === 'update') {
    if (body.key !== ADMIN_KEY) return out({ ok: false, error: 'unauthorized' });
    var sh = sheet(), headers = headerRow(sh), row = Number(body.row);
    if (!row || row < 2 || row > sh.getLastRow()) return out({ ok: false, error: 'bad_row' });
    if (body['상태'] !== undefined) sh.getRange(row, headers.indexOf('상태') + 1).setValue(body['상태']);
    if (body['메모'] !== undefined) sh.getRange(row, headers.indexOf('메모') + 1).setValue(body['메모']);
    return out({ ok: true });
  }

  // 새 신청 저장
  if (body.company) return out({ ok: true });                 // 스팸 봇(honeypot)
  if (!body['이름'] || !body['연락처']) return out({ ok: false, error: 'missing_fields' });

  var lock = LockService.getScriptLock(); lock.tryLock(10000);
  try {
    var sh = sheet();
    var record = { '접수일시': new Date(), '상태': '신규', '메모': '' };
    Object.keys(body).forEach(function (k) { if (k !== 'action' && k !== 'key') record[k] = String(body[k]); });
    var headers = ensureHeaders(sh, Object.keys(record));
    var rowValues = headers.map(function (h) { return record[h] !== undefined ? record[h] : ''; });
    sh.appendRow(rowValues);
    sh.getRange(sh.getLastRow(), 1).setNumberFormat('yyyy-mm-dd hh:mm');
  } finally { lock.releaseLock(); }

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, '[올바른농지] 무료진단 신청 — ' + body['이름'] + ' ' + body['연락처'],
        Object.keys(body).map(function (k) { return k + ': ' + body[k]; }).join('\n') + '\n\n시트: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
    } catch (err) { /* 메일 실패는 저장에 영향 없음 */ }
  }
  return out({ ok: true });
}

function doGet(e) {
  var p = e.parameter || {};
  if (p.key !== ADMIN_KEY) return out({ ok: false, error: 'unauthorized' });
  if (p.action !== 'list') return out({ ok: true, message: 'olbareun-nongji lead endpoint' });
  var sh = sheet(), last = sh.getLastRow();
  if (last < 2) return out({ ok: true, rows: [] });
  var headers = headerRow(sh);
  var values = sh.getRange(2, 1, last - 1, headers.length).getValues();
  var tz = Session.getScriptTimeZone();
  var rows = values.map(function (v, i) {
    var o = { row: i + 2 };
    headers.forEach(function (h, j) {
      var cell = v[j];
      o[h] = (cell instanceof Date) ? Utilities.formatDate(cell, tz, 'yyyy-MM-dd HH:mm') : String(cell);
    });
    return o;
  }).reverse();   // 최신 순
  return out({ ok: true, rows: rows });
}

// ---------- helpers ----------
function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(FIXED_HEADERS); sh.setFrozenRows(1); }
  return sh;
}
function headerRow(sh) {
  var lastCol = Math.max(sh.getLastColumn(), 1);
  return sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
}
function ensureHeaders(sh, keys) {
  var headers = headerRow(sh);
  if (headers.length === 1 && !headers[0]) { headers = FIXED_HEADERS.slice(); sh.getRange(1, 1, 1, headers.length).setValues([headers]); sh.setFrozenRows(1); }
  var added = false;
  keys.forEach(function (k) { if (headers.indexOf(k) === -1) { headers.push(k); added = true; } });
  if (added) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  return headers;
}
function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

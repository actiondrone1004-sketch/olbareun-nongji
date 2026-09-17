/* =========================================================
   올바른농지 — 공통 스크립트 (모든 페이지 공유)
   ========================================================= */
(function () {
  'use strict';

  // ===== 설정 (여기만 채우면 모든 페이지에 반영됩니다) =====
  var CONFIG = {
    PHONE: "",            // 예) "1800-1234"  비워두면 [상담전화] 표시
    HOURS: "",            // 예) "평일 09:00 ~ 18:00"  비워두면 [상담 가능 시간] 표시
    FIREBASE: {           // 신청 저장소 (Firestore). tools/firebase/README.md 참고. projectId가 있으면 FORM_ENDPOINT보다 우선
      apiKey: "AIzaSyC5uoEt30sdC5dwyHSY9kPxmzg1loEsjoE",   // 웹 API 키 — 공개용 식별자이며 접근 권한은 firestore.rules가 통제
      projectId: "olbareun-nongji"
    },
    FORM_ENDPOINT: "",    // (대안) "https://formspree.io/f/xxxxxxx" (POST JSON) 또는 Apps Script 웹앱 주소. FIREBASE도 이것도 없으면 mailto로 전송
    CONTACT_EMAIL: "",    // FORM_ENDPOINT가 없을 때 mailto 수신 주소
    KAKAO_URL: "",        // 예) "https://pf.kakao.com/_xxxxx"  비워두면 카카오톡 링크 숨김
    BLOG_URL: "",         // 예) "https://blog.naver.com/xxxxx"  비워두면 블로그 링크 숨김
    APP_IOS_URL: "",      // App Store 링크. 비워두면 버튼 숨김
    APP_ANDROID_URL: "",  // Google Play 링크. 비워두면 버튼 숨김
    SHEET_URL: ""         // (Apps Script 방식일 때) 신청목록 구글 시트 주소. Firebase 방식에서는 미사용
  };

  window.OB_CONFIG = CONFIG;   // admin.html 등 다른 스크립트에서 참조
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ----- 설정값 채우기 -----
  if (CONFIG.PHONE) {
    document.body.classList.add('has-phone');   // 헤더·고정 CTA의 전화 버튼은 번호가 있을 때만 표시
    $$('[data-phone]').forEach(function (el) { el.textContent = CONFIG.PHONE; });
    $$('[data-phone-link]').forEach(function (el) { el.href = 'tel:' + CONFIG.PHONE.replace(/[^0-9]/g, ''); });
  }
  if (CONFIG.HOURS) { $$('[data-hours]').forEach(function (el) { el.textContent = CONFIG.HOURS; }); }
  [['kakao', CONFIG.KAKAO_URL], ['blog', CONFIG.BLOG_URL], ['app-ios', CONFIG.APP_IOS_URL], ['app-android', CONFIG.APP_ANDROID_URL], ['email', CONFIG.CONTACT_EMAIL ? 'mailto:' + CONFIG.CONTACT_EMAIL : '']].forEach(function (pair) {
    $$('[data-link="' + pair[0] + '"]').forEach(function (el) {
      if (pair[1]) { el.href = pair[1]; if (pair[0] !== 'email') { el.target = '_blank'; el.rel = 'noopener'; } }
      else if (el.hasAttribute('data-hide-empty')) { (el.closest('[data-hide-wrap]') || el).hidden = true; }
    });
    if (pair[0] === 'email' && CONFIG.CONTACT_EMAIL) { $$('[data-email]').forEach(function (el) { el.textContent = CONFIG.CONTACT_EMAIL; }); }
  });

  $$('.channels').forEach(function (c) { if ($$('a', c).every(function (a) { return a.hidden; })) c.hidden = true; });
  if (!CONFIG.APP_IOS_URL && !CONFIG.APP_ANDROID_URL) { $$('[data-no-app]').forEach(function (el) { el.hidden = false; }); }

  // ----- 헤더: 스크롤 그림자 -----
  var header = $('header.site');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // ----- GNB 드롭다운 (클릭 토글 + 데스크톱 hover) -----
  $$('nav.gnb .has-sub').forEach(function (item) {
    var btn = $('button', item);
    var open = function (v) { item.classList.toggle('open', v); btn.setAttribute('aria-expanded', v ? 'true' : 'false'); };
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(!item.classList.contains('open')); });
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var t; item.addEventListener('mouseenter', function () { clearTimeout(t); open(true); });
      item.addEventListener('mouseleave', function () { t = setTimeout(function () { open(false); }, 120); });
    }
    document.addEventListener('click', function (e) { if (!item.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
  });

  // ----- 모바일 메뉴 -----
  var menuBtn = $('#menuBtn'), mnav = $('#mnav');
  if (menuBtn && mnav) {
    menuBtn.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) { mnav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
  }

  // ----- 숫자 카운터 (.fact .v[data-count]) -----
  var counters = $$('[data-count]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, target = parseFloat(el.getAttribute('data-count')), dec = (String(el.getAttribute('data-count')).split('.')[1] || '').length;
        var numEl = $('.n', el) || el, start = performance.now(), dur = 1300;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3), cur = target * eased;
          numEl.textContent = cur.toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { io.observe(el); });
  }

  // ----- 이행강제금 계산기 -----
  var input = $('#landValue');
  if (input) {
    var RATE = 0.25, koEl = $('#landValueKo'), r1 = $('#r1'), r3 = $('#r3'), r5 = $('#r5');
    var fmt = function (n) { return Math.round(n).toLocaleString('ko-KR'); };
    var toKorean = function (n) {
      if (!n) return '0원';
      var units = ['', '만', '억', '조'], parts = [], i = 0;
      while (n > 0 && i < units.length) { var c = n % 10000; if (c) parts.unshift(c.toLocaleString('ko-KR') + units[i]); n = Math.floor(n / 10000); i++; }
      return parts.join(' ') + '원';
    };
    var parseNum = function (s) { return parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0; };
    var update = function () {
      var v = parseNum(input.value); if (v > 999999999999) v = 999999999999;
      input.value = v ? fmt(v) : '';
      koEl.textContent = toKorean(v);
      r1.textContent = fmt(v * RATE) + '원'; r3.textContent = fmt(v * RATE * 3) + '원'; r5.textContent = fmt(v * RATE * 5) + '원';
    };
    input.addEventListener('input', update); input.addEventListener('blur', update);
    $$('.presets button').forEach(function (b) { b.addEventListener('click', function () { input.value = b.getAttribute('data-v'); update(); }); });
    update();
  }

  // ----- 연락처 자동 하이픈 -----
  $$('input[type="tel"]').forEach(function (phone) {
    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '').slice(0, 11), out = d;
      if (d.length > 3 && d.length <= 7) out = d.slice(0, 3) + '-' + d.slice(3);
      else if (d.length > 7) out = d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
      phone.value = out;
    });
  });

  // ----- 상담 신청 폼 (모든 페이지 공통: form.apply-form) -----
  $$('form.apply-form').forEach(function (form) {
    var msg = $('.form-msg', form), submitBtn = $('button[type="submit"]', form), btnHtml = submitBtn.innerHTML;
    var setInvalid = function (el, bad) { var f = el.closest('.f'); if (f) f.classList.toggle('invalid', bad); };
    var showMsg = function (t, ok) { msg.textContent = t; msg.className = 'form-msg ' + (ok ? 'ok' : 'err'); };
    var labelOf = function (el) {
      if (el.getAttribute('data-label')) return el.getAttribute('data-label');
      var l = el.id && form.querySelector('label[for="' + el.id + '"]');
      return l ? l.textContent.replace('*', '').trim() : el.name;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.company && form.company.value) return; // honeypot
      var ok = true;
      $$('[required]', form).forEach(function (el) {
        if (el.type === 'checkbox') return;
        var bad = !el.value.trim();
        if (el.type === 'tel' && !bad) bad = !/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(el.value.trim());
        setInvalid(el, bad); ok = ok && !bad;
      });
      if (!ok) { showMsg('필수 항목을 확인해 주세요. 연락 가능한 휴대폰 번호를 입력해 주세요.', false); var fb = $('.f.invalid input, .f.invalid select', form); if (fb) fb.focus(); return; }
      if (form.consent && !form.consent.checked) { showMsg('개인정보 수집·이용에 동의해 주셔야 상담 연락이 가능합니다.', false); return; }

      var data = {};
      $$('input, select, textarea', form).forEach(function (el) {
        if (!el.name || el.name === 'company' || el.type === 'checkbox' || el.type === 'hidden') return;
        if (el.value.trim()) data[labelOf(el)] = el.value.trim();
      });
      data['신청일시'] = new Date().toLocaleString('ko-KR');
      data['페이지'] = document.title + ' (' + location.href + ')';

      var fb = CONFIG.FIREBASE || {};
      if (fb.projectId) {
        // Firestore REST로 leads/{id} 생성. SDK 없이 fetch만 사용. 접수시각은 서버시간(REQUEST_TIME)으로 채워 규칙(createdAt == request.time)을 통과한다
        submitBtn.disabled = true; submitBtn.textContent = '신청 중…';
        var extra = {};
        Object.keys(data).forEach(function (k) { if (['이름', '연락처', '신청일시', '페이지'].indexOf(k) === -1) extra[k] = { stringValue: data[k] }; });
        var fields = { name: { stringValue: data['이름'] || '' }, phone: { stringValue: data['연락처'] || '' }, page: { stringValue: data['페이지'].slice(0, 300) }, status: { stringValue: '신규' }, memo: { stringValue: '' } };
        if (Object.keys(extra).length) fields.extra = { mapValue: { fields: extra } };
        var docId = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        var docPath = 'projects/' + fb.projectId + '/databases/(default)/documents';
        fetch('https://firestore.googleapis.com/v1/' + docPath + ':commit?key=' + encodeURIComponent(fb.apiKey), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ writes: [{ update: { name: docPath + '/leads/' + docId, fields: fields }, updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }], currentDocument: { exists: false } }] })
        })
          .then(function (res) { if (!res.ok) throw new Error(res.status); showMsg('접수되었습니다. ' + (CONFIG.HOURS ? CONFIG.HOURS + ' 중에 ' : '확인 후 ') + '연락드리겠습니다.', true); form.reset(); })
          .catch(function () { showMsg('전송 중 문제가 발생했습니다. 잠시 후 다시 시도하시거나 전화로 문의해 주세요.', false); })
          .finally(function () { submitBtn.disabled = false; submitBtn.innerHTML = btnHtml; });
        return;
      }

      if (!CONFIG.FORM_ENDPOINT) {
        var body = Object.keys(data).map(function (k) { return k + ': ' + data[k]; }).join('\n');
        window.location.href = 'mailto:' + CONFIG.CONTACT_EMAIL + '?subject=' + encodeURIComponent('[농지 무료진단 신청] ' + (data['이름'] || '')) + '&body=' + encodeURIComponent(body);
        showMsg('메일 앱이 열립니다. 전송 버튼을 눌러 신청을 완료해 주세요.', true);
        return;
      }
      submitBtn.disabled = true; submitBtn.textContent = '신청 중…';
      // Google Apps Script 웹앱이면 text/plain으로 보내야 CORS 사전요청 없이 저장된다 (tools/apps-script/README.md)
      var isGas = /script\.google\.com/.test(CONFIG.FORM_ENDPOINT);
      fetch(CONFIG.FORM_ENDPOINT, { method: 'POST', headers: isGas ? { 'Content-Type': 'text/plain;charset=utf-8' } : { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return isGas ? res.json().catch(function () { return { ok: true }; }) : { ok: true }; })
        .then(function (j) { if (j && j.ok === false) throw new Error(j.error || 'rejected'); showMsg('접수되었습니다. ' + (CONFIG.HOURS ? CONFIG.HOURS + ' 중에 ' : '확인 후 ') + '연락드리겠습니다.', true); form.reset(); })
        .catch(function () { showMsg('전송 중 문제가 발생했습니다. 잠시 후 다시 시도하시거나 전화로 문의해 주세요.', false); })
        .finally(function () { submitBtn.disabled = false; submitBtn.innerHTML = btnHtml; });
    });
  });

  // ----- 서브 목차(.subnav)가 있는 페이지는 앵커 이동 시 헤더+목차 높이만큼 여유를 둔다 -----
  var subnav = $('.subnav');
  if (subnav && header) { document.documentElement.style.scrollPaddingTop = (header.offsetHeight + subnav.offsetHeight + 16) + 'px'; }

  // ----- 접힌 <details> 안의 앵커로 이동하면 자동으로 펼친다 (예: services.html#process) -----
  var reveal = function () {
    if (!location.hash) return;
    var node = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (!node) return;
    var opened = false, p = node.parentElement;
    while (p) { if (p.tagName === 'DETAILS' && !p.open) { p.open = true; opened = true; } p = p.parentElement; }
    if (opened) requestAnimationFrame(function () { node.scrollIntoView(); });
  };
  window.addEventListener('hashchange', reveal); reveal();

  // ----- 더보기 토글: [data-more="#목록"] 버튼이 목록의 .hidden-item 을 펼친다 -----
  $$('[data-more]').forEach(function (btn) {
    var list = $(btn.getAttribute('data-more')); if (!list) return;
    var hidden = $$('.more-item', list); if (!hidden.length) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      var open = list.classList.toggle('expanded');
      btn.textContent = open ? '접기' : btn.getAttribute('data-more-label') || '더보기';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // ----- 자가 체크 (survey.html) -----
  var sc = $('.selfcheck');
  if (sc) {
    var boxes = $$('input[type="checkbox"]', sc), result = $('.result', sc);
    var render = function () {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      result.classList.toggle('show', n > 0);
      if (n === 0) return;
      result.innerHTML = n >= 3
        ? '<b>' + n + '개 항목이 해당됩니다.</b> 현재 행정단계와 이용상태 확인이 먼저입니다. 무료진단으로 내 농지의 단계를 정리해 드립니다.'
        : '<b>' + n + '개 항목이 해당됩니다.</b> 하나만 해당되어도 조사 대상일 수 있습니다. 취득연도와 이용상태를 기준으로 무료진단을 받아보세요.';
    };
    boxes.forEach(function (b) { b.addEventListener('change', render); });
  }
})();

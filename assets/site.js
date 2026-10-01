/* =========================================================
   올바른농지 — 공통 스크립트 (모든 페이지 공유)
   ========================================================= */
(function () {
  'use strict';

  // ===== 설정 (여기만 채우면 모든 페이지에 반영됩니다) =====
  var CONFIG = {
    PHONE: "010-2529-2998", // 비워두면 [상담전화] 표시
    HOURS: "평일 09:00 ~ 18:00",         // 예) "평일 09:00 ~ 18:00"  비워두면 [상담 가능 시간] 표시
    FIREBASE: {           // 신청 저장소 (Firestore). tools/firebase/README.md 참고. projectId가 있으면 FORM_ENDPOINT보다 우선
      apiKey: "AIzaSyC5uoEt30sdC5dwyHSY9kPxmzg1loEsjoE",   // 웹 API 키 — 공개용 식별자이며 접근 권한은 firestore.rules가 통제
      projectId: "olbareun-nongji"
    },
    FORM_ENDPOINT: "",    // (대안) "https://formspree.io/f/xxxxxxx" (POST JSON) 또는 Apps Script 웹앱 주소. FIREBASE도 이것도 없으면 mailto로 전송
    CONTACT_EMAIL: "",    // FORM_ENDPOINT가 없을 때 mailto 수신 주소
    KAKAO_URL: "https://pf.kakao.com/_YzQrX",   // 카카오톡 채널. 비워두면 카카오톡 링크 숨김
    YOUTUBE_URL: "https://www.youtube.com/channel/UCVs19gtXW8jh4VA0HZUoigQ",
    INSTAGRAM_URL: "https://www.instagram.com/right_farming2004/",
    BLOG_URL: "https://blog.naver.com/allfarm_",         // 예) "https://blog.naver.com/xxxxx"  비워두면 블로그 링크 숨김
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
  [['kakao', CONFIG.KAKAO_URL], ['youtube', CONFIG.YOUTUBE_URL], ['instagram', CONFIG.INSTAGRAM_URL], ['blog', CONFIG.BLOG_URL], ['app-ios', CONFIG.APP_IOS_URL], ['app-android', CONFIG.APP_ANDROID_URL], ['email', CONFIG.CONTACT_EMAIL ? 'mailto:' + CONFIG.CONTACT_EMAIL : '']].forEach(function (pair) {
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
          .then(function (res) { if (!res.ok) throw new Error(res.status); showMsg('접수되었습니다. 남겨주신 번호로 전화드려 농지 상황을 확인한 뒤, 도울 수 있는 범위와 비용을 안내합니다. 동의하신 뒤에만 진행합니다.' + (CONFIG.HOURS ? ' (전화 상담 ' + CONFIG.HOURS + ')' : ''), true); form.reset(); })
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
        .then(function (j) { if (j && j.ok === false) throw new Error(j.error || 'rejected'); showMsg('접수되었습니다. 남겨주신 번호로 전화드려 농지 상황을 확인한 뒤, 도울 수 있는 범위와 비용을 안내합니다. 동의하신 뒤에만 진행합니다.' + (CONFIG.HOURS ? ' (전화 상담 ' + CONFIG.HOURS + ')' : ''), true); form.reset(); })
        .catch(function () { showMsg('전송 중 문제가 발생했습니다. 잠시 후 다시 시도하시거나 전화로 문의해 주세요.', false); })
        .finally(function () { submitBtn.disabled = false; submitBtn.innerHTML = btnHtml; });
    });
  });

  // ----- 서브 목차(.subnav)가 있는 페이지는 앵커 이동 시 헤더+목차 높이만큼 여유를 둔다 -----
  var subnav = $('.subnav');
  if (subnav && header) { document.documentElement.style.scrollPaddingTop = (header.offsetHeight + subnav.offsetHeight + 16) + 'px'; }

  // ----- 상황 선택(#situations): 버튼 → 해당 패널만 표시. '이 상황으로 상담 신청'은 폼의 상담 상황 select에 이어진다 -----
  var sitList = $('#sitList');
  if (sitList) {
    var sitBtns = $$('.sit-btn', sitList), sitPanels = $$('.sit-panel', sitList);
    var pick = function (btn) {
      sitBtns.forEach(function (b) { var on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
      sitPanels.forEach(function (p) { p.hidden = p.id !== btn.getAttribute('aria-controls'); });
    };
    sitBtns.forEach(function (b) { b.addEventListener('click', function () {
      pick(b);
      // 모바일(한 열)에서는 패널이 버튼 바로 아래 펼쳐지므로 그 위치로 살짝 이동
      if (window.matchMedia('(max-width: 700px)').matches) requestAnimationFrame(function () { b.scrollIntoView({ block: 'start' }); });
    }); });
    pick(sitBtns[0]);
    if (location.hash === '#situations') { /* 앵커 진입 시 첫 패널 유지 */ }
  }
  var setSituation = function (v) { $$('select[name="situation"]').forEach(function (sel) { sel.value = v; if (sel.value !== v) sel.value = ''; }); };
  $$('[data-situation].sit-apply').forEach(function (a) { a.addEventListener('click', function () { setSituation(a.getAttribute('data-situation')); }); });

  // ----- 접힌 <details> 안의 앵커로 이동하면 자동으로 펼친다 (예: services.html#process) -----
  var reveal = function () {
    if (!location.hash) return;
    var node = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (!node) return;
    var opened = false, p = node.parentElement;
    while (p) { if (p.tagName === 'DETAILS' && !p.open) { p.open = true; opened = true; } p = p.parentElement; }
    if (opened) requestAnimationFrame(function () { node.scrollIntoView(); });
  };
  window.addEventListener('hashchange', reveal); reveal();

  // ----- 보도: 앨범/목록 전환 · 종류 필터 · 유튜브 제자리 재생 -----
  // 모바일(700px 이하)에서는 처음에 목록형으로 보여 준다 (전환 버튼이 없는 홈 목록 포함)
  if (window.matchMedia && window.matchMedia('(max-width: 700px)').matches) {
    $$('.view-toggle').forEach(function (g) { $$('button', g).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-view') === 'list'); }); });
    $$('.vd-list.album, .nw-list.album, .fd-list.album').forEach(function (l) { l.classList.remove('album'); l.classList.add('list'); });
  }
  $$('.view-toggle button').forEach(function (btn) {
    var list = $(btn.getAttribute('data-target')); if (!list) return;
    var apply = function () {
      $$('button', btn.parentNode).forEach(function (b) { b.classList.toggle('on', b === btn); b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      list.classList.remove('album', 'list'); list.classList.add(btn.getAttribute('data-view'));
    };
    if (btn.classList.contains('on')) apply();
    btn.addEventListener('click', apply);
  });
  $$('.fd-tabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      $$('button', btn.parentNode).forEach(function (b) { b.classList.toggle('on', b === btn); });
      $$('#feedList .fd-card').forEach(function (c) { c.hidden = f !== 'all' && c.getAttribute('data-type') !== f; });
    });
  });
  $$('.vd-play').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + btn.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = btn.getAttribute('aria-label') || 'YouTube'; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
      f.className = 'vd-frame'; btn.replaceWith(f);
    });
  });

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

  // ----- 방문 통계: Firestore stats/{YYYY-MM-DD}(한국 날짜) 칸을 1씩 올린다. 관리자 화면(admin.html)에서 일·월·연별로 본다 -----
  // v=그날 첫 방문(브라우저 기준 순방문), pv=조회수, pv_<페이지>, c_<채널>=클릭. 로컬 미리보기·관리자 페이지·자동화 브라우저는 세지 않는다
  (function () {
    var fb = CONFIG.FIREBASE || {};
    if (!fb.projectId || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:' || navigator.webdriver) return;
    var file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
    if (file === 'admin') return;
    var day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    var docPath = 'projects/' + fb.projectId + '/databases/(default)/documents';
    var bump = function (keys) {
      try {
        fetch('https://firestore.googleapis.com/v1/' + docPath + ':commit?key=' + encodeURIComponent(fb.apiKey), {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
          body: JSON.stringify({ writes: [{ update: { name: docPath + '/stats/' + day, fields: {} }, updateMask: { fieldPaths: [] },
            updateTransforms: keys.map(function (k) { return { fieldPath: k, increment: { integerValue: '1' } }; }) }] })
        }).catch(function () {});
      } catch (e) {}
    };
    var page = { index: 'home', '': 'home', services: 'services', about: 'about', press: 'press' }[file] || 'other';
    var keys = ['pv', 'pv_' + page], seen = '';
    try { seen = localStorage.getItem('ob_seen_day'); localStorage.setItem('ob_seen_day', day); } catch (e) {}
    if (seen !== day) keys.push('v');
    bump(keys);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      var h = a.getAttribute('href') || '', k = '';
      if (/^tel:/.test(h)) k = 'c_phone';
      else if (/pf\.kakao\.com/.test(a.href)) k = 'c_kakao';
      else if (a.getAttribute('data-link') === 'youtube') k = 'c_youtube';
      else if (/instagram\.com/.test(a.href)) k = 'c_instagram';
      else if (a.getAttribute('data-link') === 'blog') k = 'c_blog';
      if (k) bump([k]);
    }, true);
  })();

  // ----- 홈 v5: 스크롤하면 나타남([data-reveal] → .in) · 숫자 올라가기([data-count]) -----
  (function () {
    var els = $$('[data-reveal]');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var countUp = function (root) {
      $$('[data-count]', root).forEach(function (el) {
        var end = +el.getAttribute('data-count'); if (reduce || !end) return;
        var t0 = null, dur = 1400;
        var step = function (t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur); k = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(end * k).toLocaleString('ko-KR'); if (k < 1) requestAnimationFrame(step); };
        el.textContent = '0'; requestAnimationFrame(step);
      });
    };
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); countUp(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();
})();

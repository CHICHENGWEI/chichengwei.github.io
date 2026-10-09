// BaxterEnglish：手機選單＋圖片放大＋30 秒填表
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    });
  }

  var links = document.querySelectorAll('a.zoom');
  if (!links.length || typeof HTMLDialogElement !== 'function') return;
  var dlg = document.createElement('dialog');
  dlg.className = 'lb';
  dlg.innerHTML = '<button type="button" aria-label="關閉">×</button><img alt=""><p></p>';
  document.body.appendChild(dlg);
  var img = dlg.querySelector('img'), cap = dlg.querySelector('p');
  dlg.querySelector('button').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var inner = a.querySelector('img');
      img.src = a.getAttribute('href');
      img.alt = inner ? inner.alt : '';
      cap.textContent = inner ? inner.alt : '';
      dlg.showModal();
    });
  });
})();

// 捲動進場：卡片、步驟、素材圖依序浮上來
(function () {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = document.querySelectorAll('.door, .card, .steps li, .shot, .stat, .price, .shortbar a, .row, .faq > div');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var t = e.target; t.classList.add('in'); io.unobserve(t);
      setTimeout(function () { t.classList.remove('rv', 'in'); t.style.transitionDelay = ''; }, 1200); // 進場完就拿掉，滑過效果才不會延遲
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) return; // 第一屏內的不動，避免閃一下
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms';
    el.classList.add('rv');
    io.observe(el);
  });
})();

// 30 秒填表（規格：改版研究/各頁內容/09_詢問表單.md）
// 手機：用 LINE 送出（https://line.me/R/oaMessage/{ID}/?{text}，電腦版 LINE 不支援）
// 電腦：送到 Google 表單（baxterenglish.ai 名下），回應讀不到，送出後直接顯示成功
(function () {
  var LINE_ID = '@baxter_english';
  var GFORM = 'https://docs.google.com/forms/d/e/1FAIpQLSetUfvZU6vPNhNftes2ffCBdlb_N-O1ip2ShTxzbmeAnsztQQ/formResponse';
  var F_TEXT = 'entry.1126643972', F_CONTACT = 'entry.1447770098', F_FROM = 'entry.2090958783';
  var mobile = window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  document.querySelectorAll('form.ask').forEach(function (f) {
    var val = function (n) { var e = f.querySelector('[name="' + n + '"]'); return e ? e.value.trim() : ''; };
    var vals = function (n) {
      return [].slice.call(f.querySelectorAll('[name="' + n + '"]:checked')).map(function (i) {
        if (i.value !== '其他') return i.value;
        var t = val(n + '_other'); return t ? '其他：' + t : '其他';
      });
    };
    var schoolBox = f.querySelector('[data-show="school"]'), distBox = f.querySelector('[data-show="district"]');
    var err = f.querySelector('.ask-err'), done = f.querySelector('.ask-done');
    var lineBtn = f.querySelector('.ask-line'), sendBtn = f.querySelector('.ask-send');
    (mobile ? lineBtn : sendBtn).classList.add('primary');
    if (mobile) { sendBtn.parentNode.insertBefore(lineBtn, sendBtn); }

    function sync() {
      var st = (f.querySelector('[name="stage"]:checked') || {}).value || '';
      schoolBox.hidden = !st || st === '幼兒園大班' || st === '大學' || st === '成人';
      var m = vals('mode');
      distBox.hidden = !(m.indexOf('到府') > -1 || m.indexOf('咖啡廳') > -1);
      f.querySelectorAll('[data-other-for]').forEach(function (box) {
        var on = f.querySelector('input[data-other="' + box.getAttribute('data-other-for') + '"]').checked;
        box.hidden = !on;
      });
    }
    f.addEventListener('change', sync);

    // 從哪一頁點進來：from 寫進訊息第一行；goal 先勾好（例：高中小班登記）
    var qs = new URLSearchParams(location.search);
    var pre = qs.get('goal'), from = qs.get('from');
    if (pre) {
      f.querySelectorAll('input[name="goal"]').forEach(function (i) { if (i.value === pre) i.checked = true; });
    }
    sync();

    function message() {
      var L = ['老師您好，我想詢問家教課程（網站表單' + (from ? '・' + from + '頁' : '') + '）'];
      var st = vals('stage')[0], stype = vals('stype')[0], school = val('school');
      var extra = [stype, school].filter(Boolean).join('，');
      L.push('・學生：' + st + (extra && !schoolBox.hidden ? '（' + extra + '）' : ''));
      L.push('・想加強：' + vals('goal').join('、'));
      var d = val('district');
      L.push('・上課方式：' + vals('mode').join('、') + (d && !distBox.hidden ? '（' + d + '）' : ''));
      L.push('・方便時段：' + vals('slot').join('、'));
      if (vals('size')[0]) L.push('・' + vals('size')[0]);
      L.push('・稱呼：' + val('who'));
      if (val('contact')) L.push('・聯絡方式：' + val('contact'));
      if (val('note')) L.push('・備註：' + val('note'));
      return L.join('\n');
    }
    function check(how) {
      var miss = [];
      if (!vals('stage').length) miss.push('學生階段');
      if (!vals('goal').length) miss.push('想加強什麼');
      if (!vals('mode').length) miss.push('上課方式');
      if (!vals('slot').length) miss.push('方便的時段');
      if (!val('who')) miss.push('怎麼稱呼');
      if (how === 'send' && !val('contact')) miss.push('聯絡方式（LINE ID、電話或 Email）');
      return miss;
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var how = (e.submitter && e.submitter.value) || (mobile ? 'line' : 'send');
      var miss = check(how);
      done.hidden = true;
      if (miss.length) { err.textContent = '還沒填：' + miss.join('、'); err.hidden = false; return; }
      err.hidden = true;
      var text = message();
      if (how === 'line') {
        location.href = 'https://line.me/R/oaMessage/' + encodeURIComponent(LINE_ID) + '/?' + encodeURIComponent(text);
        return;
      }
      var body = new URLSearchParams();
      body.append(F_TEXT, text);
      body.append(F_CONTACT, val('contact'));
      body.append(F_FROM, location.pathname + (from ? '（' + from + '）' : ''));
      sendBtn.disabled = true; sendBtn.textContent = '送出中…';
      fetch(GFORM, { method: 'POST', mode: 'no-cors', body: body }).then(function () {
        done.textContent = '已收到！一天內會用您留的聯絡方式回覆；比較急的話，也可以直接加 LINE @baxter_english。';
        done.hidden = false; sendBtn.textContent = '已送出';
      }, function () {
        err.textContent = '送出失敗，請改用「用 LINE 送出」，或直接加 LINE @baxter_english。';
        err.hidden = false; sendBtn.disabled = false; sendBtn.textContent = '送出';
      });
    });
  });
})();

// 頁尾訂閱：直接送到 Kit，不跳頁（10/9）
(function () {
  document.querySelectorAll('form.sub-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = f.querySelector('.sub-msg'), btn = f.querySelector('button');
      btn.disabled = true; msg.textContent = '送出中…';
      fetch(f.action, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(f) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.status !== 'failed') {
            f.classList.add('done'); msg.textContent = '訂閱成功！下個月 1 號寄到您的信箱。';
          } else {
            msg.textContent = 'Email 好像不太對，請再確認一次。'; btn.disabled = false;
          }
        })
        .catch(function () { f.submit(); });
    });
  });
})();

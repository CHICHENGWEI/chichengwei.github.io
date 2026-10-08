// BaxterEnglish：手機選單＋圖片放大
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

// 30 秒填表：組成 LINE 訊息（https://line.me/R/oaMessage/{ID}/?{text}）
(function () {
  var LINE_ID = '@baxter_english', MAIL = 'baxterenglish.ai@gmail.com';
  var mobile = window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  document.querySelectorAll('form.ask').forEach(function (f) {
    var vals = function (n) { return [].slice.call(f.querySelectorAll('[name="' + n + '"]:checked')).map(function (i) { return i.value; }); };
    var val = function (n) { var e = f.querySelector('[name="' + n + '"]'); return e ? e.value.trim() : ''; };
    var schoolBox = f.querySelector('[data-show="school"]'), distBox = f.querySelector('[data-show="district"]');
    var err = f.querySelector('.ask-err'), done = f.querySelector('.ask-done');
    var lineBtn = f.querySelector('.ask-line'), copyBtn = f.querySelector('.ask-copy');
    (mobile ? lineBtn : copyBtn).classList.add('primary');
    if (!mobile) { lineBtn.parentNode.insertBefore(copyBtn, lineBtn); }

    function sync() {
      var st = vals('stage')[0] || '';
      schoolBox.hidden = !st || st === '幼兒園大班' || st === '大學' || st === '成人';
      var m = vals('mode');
      distBox.hidden = !(m.indexOf('到府') > -1 || m.indexOf('咖啡廳') > -1);
    }
    f.addEventListener('change', sync);

    // 從哪一頁點進來，就先勾好那個階段或項目
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
      return miss;
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var how = (e.submitter && e.submitter.value) || (mobile ? 'line' : 'copy');
      var miss = check(how);
      done.hidden = true;
      if (miss.length) { err.textContent = '還沒填：' + miss.join('、'); err.hidden = false; return; }
      err.hidden = true;
      var text = message();
      if (how === 'line') {
        location.href = 'https://line.me/R/oaMessage/' + encodeURIComponent(LINE_ID) + '/?' + encodeURIComponent(text);
      } else if (how === 'mail') {
        location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('家教課程詢問（網站表單）') + '&body=' + encodeURIComponent(text);
      } else {
        var ok = function () { done.textContent = '已複製。請貼到 LINE（@baxter_english）或 Email 傳給我，一天內回覆。'; done.hidden = false; };
        if (navigator.clipboard) { navigator.clipboard.writeText(text).then(ok, function () { window.prompt('請複製這段訊息：', text); }); }
        else { window.prompt('請複製這段訊息：', text); }
      }
    });
  });
})();

(function () {
  'use strict';

  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, ESC: 27,
              RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406, INFO: 457 };
  var COLS = 4;
  var hasTizen = typeof tizen !== 'undefined' && tizen && tizen.application;

  var grid = document.getElementById('grid');
  var overlay = document.getElementById('overlay');
  var ovTitle = document.getElementById('ovTitle');
  var ovBody = document.getElementById('ovBody');
  var ovButtons = document.getElementById('ovButtons');
  var toastEl = document.getElementById('toast');
  var hdmiHint = document.getElementById('hdmiHint');

  var focus = 0;
  var tiles = [];
  var installed = null;          // id -> ApplicationInformation
  var mode = 'home';             // 'home' | 'overlay' | 'tv'
  var ovFocus = 0;
  var ovScroll = null;

  try { focus = Math.min(parseInt(localStorage.getItem('focus') || '0', 10) || 0, TILES.length - 1); } catch (e) {}

  /* ---------- remote keys ---------- */
  function registerKeys() {
    if (!(typeof tizen !== 'undefined' && tizen.tvinputdevice)) return;
    var wanted = ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue', 'Info',
                  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    try { tizen.tvinputdevice.registerKeyBatch(wanted); }
    catch (e) {
      wanted.forEach(function (k) { try { tizen.tvinputdevice.registerKey(k); } catch (e2) {} });
    }
  }

  /* ---------- build UI ---------- */
  function build() {
    grid.innerHTML = '';
    TILES.forEach(function (t, i) {
      var el = document.createElement('div');
      el.className = 'tile tile-' + t.key;
      el.setAttribute('role', 'menuitem');
      el.setAttribute('aria-label', t.name);
      el.setAttribute('data-key', t.key);
      el.style.setProperty('--glow', t.glow);
      el.innerHTML =
        '<div class="card" style="background:' + t.bg + '">' +
          '<div class="sheen"></div>' +
          '<div class="logo">' + t.logo + '</div>' +
          '<div class="num">' + (i + 1) + '</div>' +
          '<div class="badge">Not installed?</div>' +
        '</div>';
      el.addEventListener('click', function () { setFocus(i); activate(i); });
      el.addEventListener('mouseenter', function () { setFocus(i); });
      grid.appendChild(el);
      tiles.push(el);
    });
    setFocus(focus);
  }

  function setFocus(i) {
    if (i < 0 || i >= tiles.length) return;
    tiles[focus] && tiles[focus].classList.remove('focused');
    focus = i;
    tiles[focus].classList.add('focused');
    var t = TILES[focus];
    document.getElementById('capName').textContent = t.name;
    document.getElementById('capSub').textContent = t.type === 'hdmi' ? 'Switch to your HDMI device' : (t.sub || 'Open app');
    try { localStorage.setItem('focus', String(focus)); } catch (e) {}
  }

  /* ---------- clock ---------- */
  function tick() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var h12 = ((h + 11) % 12) + 1;
    document.getElementById('time').textContent = h12 + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM' : ' PM');
    document.getElementById('greeting').textContent =
      h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Good night';
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    document.getElementById('date').textContent = days[d.getDay()] + ', ' + d.getDate() + ' ' + mons[d.getMonth()];
  }

  /* ---------- toast / overlay ---------- */
  var toastTimer = null;
  function toast(msg, ms, kind) {
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.add('hidden'); }, ms || 3500);
  }

  function showOverlay(title, bodyHtml, buttons, scrollable) {
    clearTimeout(toastTimer); toastEl.classList.add('hidden');
    ovTitle.textContent = title;
    ovBody.innerHTML = bodyHtml;
    ovBody.className = scrollable ? 'scroll' : '';
    ovScroll = scrollable ? ovBody : null;
    ovButtons.innerHTML = '';
    (buttons && buttons.length ? buttons : [{ label: 'OK', action: closeOverlay }]).forEach(function (b, i) {
      var el = document.createElement('div');
      el.className = 'btn';
      el.textContent = b.label;
      el._action = b.action;
      el.addEventListener('click', function () { ovFocus = i; runOvButton(); });
      ovButtons.appendChild(el);
    });
    ovFocus = 0;
    paintOvFocus();
    overlay.classList.remove('hidden');
    mode = 'overlay';
  }
  function closeOverlay() { overlay.classList.add('hidden'); mode = 'home'; }
  function paintOvFocus() {
    var bs = ovButtons.children;
    for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('focused', i === ovFocus);
  }
  function runOvButton() {
    var b = ovButtons.children[ovFocus];
    if (b && b._action) b._action(); else closeOverlay();
  }

  /* ---------- installed-app discovery ---------- */
  function loadInstalled(cb) {
    if (!hasTizen || !tizen.application.getAppsInfo) { cb && cb(); return; }
    try {
      tizen.application.getAppsInfo(function (list) {
        installed = {};
        list.forEach(function (a) { installed[a.id] = a; });
        resolveTiles(list);
        cb && cb();
      }, function () { cb && cb(); });
    } catch (e) { cb && cb(); }
  }

  function resolveTiles(list) {
    TILES.forEach(function (t, i) {
      if (t.type === 'hdmi') return;
      var found = null;
      (t.ids || []).some(function (id) { if (installed[id]) { found = id; return true; } return false; });
      if (!found && t.match) {
        var hits = list.filter(function (a) {
          return a.name && t.match.test(a.name) && !/dummy|widget|service|daemon/i.test(a.id);
        });
        if (hits.length) found = hits[0].id;
      }
      t.resolved = found;
      if (tiles[i]) tiles[i].classList.toggle('missing', !found);
    });
  }

  function candidates(t) {
    var out = [];
    if (t.resolved) out.push(t.resolved);
    (t.ids || []).forEach(function (id) { if (out.indexOf(id) < 0) out.push(id); });
    return out;
  }

  /* ---------- launching apps ---------- */
  var busyUntil = 0;
  function launchApp(t) {
    var now = Date.now();
    if (now < busyUntil) return;           // ignore key repeat / double press
    busyUntil = now + 1200;
    if (!hasTizen) { toast('Preview mode: on the TV this opens ' + t.name); return; }
    var ids = candidates(t);
    if (!ids.length) { launchFailed(t, 'not found on this TV'); return; }
    var i = 0, lastErr = '';
    toast('Opening ' + t.name + '\u2026', 2500);
    var tileEl = tiles[TILES.indexOf(t)];
    tileEl && tileEl.classList.add('launching');
    setTimeout(function () { tileEl && tileEl.classList.remove('launching'); }, 1200);
    (function next() {
      if (i >= ids.length) { launchFailed(t, lastErr); return; }
      var id = ids[i++];
      try {
        tizen.application.launch(id, function () {}, function (e) { lastErr = e && (e.name + ': ' + e.message); next(); });
      } catch (e) { lastErr = e && (e.name + ': ' + e.message); next(); }
    })();
  }

  function launchFailed(t, why) {
    busyUntil = 0;
    if (typeof console !== 'undefined' && why) console.warn('[launcher] ' + t.name + ' failed: ' + why);
    toast("Couldn't open " + t.name + ". Is it installed? Press BLUE to check app IDs.", 6000, 'error');
  }

  /* ---------- HDMI ---------- */
  function openHdmi() {
    var now = Date.now();
    if (now < busyUntil) return;
    busyUntil = now + 1200;
    var order = HDMI_CONFIG.order.slice(), lastNote = '';
    (function next(note) {
      if (note) lastNote = note;
      var m = order.shift();
      if (!m) { busyUntil = 0; hdmiManual(lastNote); return; }
      if (m === 'tvwindow') hdmiViaTvWindow(next);
      else if (m === 'native') hdmiViaNative(next);
      else next(note);
    })();
  }

  function hdmiViaTvWindow(fail) {
    if (!(typeof tizen !== 'undefined' && tizen.tvwindow && tizen.systeminfo)) { fail(); return; }
    try {
      tizen.systeminfo.getPropertyValue('VIDEOSOURCE', function (vs) {
        var all = (vs.connected || []).filter(function (s) { return s.type === 'HDMI'; });
        if (!all.length) { fail('No HDMI device was reported as connected. Is it switched on?'); return; }
        if (all.length === 1) { showSource(all[0], fail); return; }
        showOverlay('Choose input', '<p>More than one HDMI device is connected.</p>',
          all.map(function (s) { return { label: 'HDMI ' + s.number, action: function () { closeOverlay(); showSource(s, fail); } }; })
            .concat([{ label: 'Cancel', action: closeOverlay }]));
      }, function () { fail(); });
    } catch (e) { fail(); }
  }

  function showSource(src, fail) {
    try {
      tizen.tvwindow.setSource(src, function () {
        tizen.tvwindow.show(function () {
          busyUntil = 0;
          enterTvMode('HDMI ' + src.number);
        }, function () { fail(); }, ['0px', '0px', '1920px', '1080px'], 'MAIN');
      }, function () { fail(); }, 'MAIN');
    } catch (e) { fail(); }
  }

  var hintTimer = null;
  function enterTvMode(label) {
    mode = 'tv';
    document.body.classList.add('tvmode');
    hdmiHint.innerHTML = label + ' &middot; Press <b>BACK</b> to return to Home';
    hdmiHint.classList.remove('hidden');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hdmiHint.classList.add('hidden'); }, 4000);
  }
  function exitTvMode() {
    try { tizen.tvwindow.hide(function () {}, function () {}, 'MAIN'); } catch (e) {}
    document.body.classList.remove('tvmode');
    hdmiHint.classList.add('hidden');
    mode = 'home';
  }

  function hdmiViaNative(fail) {
    if (!hasTizen) { fail(); return; }
    var ids = (HDMI_CONFIG.nativeApps || []).slice();
    (function next() {
      var id = ids.shift();
      if (!id) { fail(); return; }
      try { tizen.application.launch(id, function () {}, function () { next(); }); }
      catch (e) { next(); }
    })();
  }

  function hdmiManual(note) {
    if (!hasTizen) { toast('Preview mode: on the TV this switches to HDMI'); return; }
    showOverlay('Switch to HDMI',
      (note ? '<p>' + escapeHtml(note) + '</p>' : '') +
      '<p>This TV did not let the launcher switch inputs automatically.</p>' +
      '<p>Press the <b>SOURCE</b> button on your remote (or Home &rarr; Connected Devices) and pick your HDMI device.</p>',
      [{ label: 'OK', action: closeOverlay }]);
  }

  /* ---------- installed-app list (diagnostics) ---------- */
  function showAppList() {
    if (!hasTizen) {
      showOverlay('Installed apps', '<p>Only available on the TV.</p>');
      return;
    }
    loadInstalled(function () {
      if (!installed) { showOverlay('Installed apps', '<p>Could not read the app list.</p>'); return; }
      var rows = Object.keys(installed).map(function (k) { return installed[k]; })
        .filter(function (a) { return a.show !== false; })
        .sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); })
        .map(function (a) { return '<tr><td>' + escapeHtml(a.name || '') + '</td><td><code>' + escapeHtml(a.id) + '</code></td></tr>'; })
        .join('');
      var status = TILES.filter(function (t) { return t.type !== 'hdmi'; }).map(function (t) {
        return '<li>' + t.name + ': ' + (t.resolved ? '<code>' + t.resolved + '</code>' : '<span class="err">not found</span>') + '</li>';
      }).join('');
      showOverlay('Installed apps', '<ul class="status">' + status + '</ul><table>' + rows + '</table>',
        [{ label: 'Close', action: closeOverlay }], true);
    });
  }

  /* ---------- actions & keys ---------- */
  function activate(i) {
    var t = TILES[i];
    if (!t) return;
    if (t.type === 'hdmi') openHdmi(); else launchApp(t);
  }

  function onKey(e) {
    var k = e.keyCode;
    if (mode === 'tv') {
      if (k === KEY.BACK || k === KEY.ESC) { exitTvMode(); e.preventDefault(); }
      return;
    }
    if (mode === 'overlay') {
      var n = ovButtons.children.length;
      if (k === KEY.LEFT) { ovFocus = (ovFocus + n - 1) % n; paintOvFocus(); }
      else if (k === KEY.RIGHT) { ovFocus = (ovFocus + 1) % n; paintOvFocus(); }
      else if (k === KEY.UP && ovScroll) { ovScroll.scrollTop -= 120; }
      else if (k === KEY.DOWN && ovScroll) { ovScroll.scrollTop += 120; }
      else if (k === KEY.ENTER) { runOvButton(); }
      else if (k === KEY.BACK || k === KEY.ESC) { closeOverlay(); }
      e.preventDefault();
      return;
    }
    var r = Math.floor(focus / COLS), c = focus % COLS, rows = Math.ceil(TILES.length / COLS);
    switch (k) {
      case KEY.LEFT:  setFocus((focus + TILES.length - 1) % TILES.length); break;
      case KEY.RIGHT: setFocus((focus + 1) % TILES.length); break;
      case KEY.UP:    vmove(((r + rows - 1) % rows) * COLS + c); break;
      case KEY.DOWN:  vmove(((r + 1) % rows) * COLS + c); break;
      case KEY.ENTER: activate(focus); break;
      case KEY.YELLOW: hdmiViaNative(function () { hdmiManual(); }); break;
      case KEY.BLUE: case KEY.INFO: showAppList(); break;
      case KEY.BACK: /* this is the home screen: stay here */ break;
      default:
        if (k >= 49 && k <= 57) { var idx = k - 49; if (idx < TILES.length) { setFocus(idx); activate(idx); } }
        else return;
    }
    e.preventDefault();
  }

  function vmove(target) { setFocus(Math.min(target, TILES.length - 1)); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ---------- start ---------- */
  document.addEventListener('keydown', onKey);
  /* ---------- multitasking: hide / resume ----------
   * Samsung pauses JavaScript while the app is hidden (another app, input
   * change, or TV off with Instant On) and fires 'visibilitychange' on both
   * hide and resume. With reload="disable" + eden_resume in config.xml the
   * page is kept, so we must tidy up ourselves.                           */
  function resetUi() {
    if (mode === 'tv') exitTvMode();
    if (mode === 'overlay') closeOverlay();
    clearTimeout(toastTimer); toastEl.classList.add('hidden');
    clearTimeout(hintTimer); hdmiHint.classList.add('hidden');
    tiles.forEach(function (el) { el.classList.remove('launching'); });
    busyUntil = 0;
    mode = 'home';
  }
  function onHidden() { resetUi(); }
  function onResumed() {
    resetUi();
    var target = (typeof RESUME_FOCUS !== 'undefined' && RESUME_FOCUS === 'first') ? 0 : focus;
    for (var i = 0; i < tiles.length; i++) tiles[i].classList.remove('focused');
    setFocus(Math.max(0, Math.min(target, tiles.length - 1)));
    tick();
    loadInstalled();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) onHidden(); else onResumed();
  });
  registerKeys();
  build();
  tick();
  setInterval(tick, 15000);
  loadInstalled();
})();

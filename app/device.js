/* Public Tizen application APIs. No Mac server, network address or credentials. */
(function () {
  'use strict';
  var IDS = {
    youtube: '9Ur5IzDKqV.TizenYouTube',
    netflix: 'org.tizen.netflix-app',
    zee5: 'wKDM33Rods.ZEE5',
    primevideo: 'org.tizen.primevideo',
    hotstar: 'fiZNCxMH9Y.Hotstar',
    sonyliv: 'EUKHUxrGQA.SonyLIV',
    browser: 'com.samsung.tv.knox-browser'
  };
  var STREAMING = [];
  var CONSUMER_SYSTEM = ['org.tizen.browser', 'com.samsung.tv.knox-browser'];
  var EXTRA_BRANDS = {};
  var INTERNAL = ['adplatform.ADPlayer', 'WykOS4t4F0.cmsWebApp', '25emanual3.emanual',
    'ZODRT12q2l.WebAccountExtension', 'ByJlgt0XeD.CastSettingsApp', 'tv6pbVMQFF.PrivacyChoices'];
  var SELF = 'KsHome0001.CleanHome';
  /* HDMI: prefer live-source switch, then native source apps that exist on this TV. */
  var HDMI_NATIVE = ['org.tizen.SMSourceAPP', 'org.tizen.tv-viewer'];
  /* Samsung Smart Hub: csfs is the real Home destination on this TV (was home_appid).
     coba.newhome launches silently without UI — do not prefer it. */
  var SAMSUNG_HOME = ['com.samsung.tv.csfs', 'org.tizen.menu', 'com.samsung.tv.coba.edenview'];
  function api() { return window.tizen && window.tizen.application; }
  function unavailable(done) {
    done({ message: 'Open Clean Home on the TV to use this control.', detail: 'The web preview cannot control the TV.' });
  }
  function failure(err) {
    return { message: 'The TV could not open this screen.', detail: err && (err.message || err.name) || 'Try again, or press the remote’s Home button to return to Clean Home.' };
  }
  /* Fire-and-forget launch: call done as soon as launch is issued so the dock stays snappy.
     Tizen’s success callback often waits until the target app is fully up (slow). */
  function launchApp(id, done) {
    if (!api()) { unavailable(done); return; }
    if (!id) { done({ message: 'This app has no launch target.' }); return; }
    try {
      api().launch(id, function () {}, function (err) {
        /* Late failure — surface only if we can without blocking the happy path. */
        if (window.FrameDevice && FrameDevice._onLateLaunchFail) FrameDevice._onLateLaunchFail(id, err);
      });
      done(null);
    } catch (err) { done(failure(err)); }
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({ message: 'This app has no launch target.' }); return; }
    launchApp(IDS[brand], done);
  }
  function art(done) {
    if (!api()) { unavailable(done); return; }
    try {
      var data = [new tizen.ApplicationControlData('mode', ['fullscreen']), new tizen.ApplicationControlData('requester', ['mobile'])];
      var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/default', null, null, null, data);
      api().launchAppControl(control, 'org.tizen.art-app', function () {}, function () {});
      done(null);
    } catch (err) { done(failure(err)); }
  }
  function home(done) {
    if (!api()) { unavailable(done); return; }
    /* 1) Direct launch of Smart Hub (csfs) — verified on UA43DU7660KLXL. */
    var ids = SAMSUNG_HOME.slice();
    function tryIds() {
      if (!ids.length) { tryAppControl(); return; }
      var id = ids.shift();
      try {
        api().launch(id, function () { done(null); }, function () { tryIds(); });
      } catch (e) { tryIds(); }
    }
    function tryAppControl() {
      try {
        var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/main', null, null, null, null);
        api().launchAppControl(control, 'com.samsung.tv.csfs', function () { done(null); }, function (err) {
          done(err ? failure(err) : { message: 'Could not open Samsung Home.', detail: 'Press the remote’s Home button if Smart Hub does not appear.' });
        });
      } catch (e) {
        done({ message: 'Could not open Samsung Home.', detail: String(e && e.message || e) });
      }
    }
    tryIds();
  }
  function settings(done) { launchApp('com.samsung.tv.coba.setting', done); }

  /* HDMI: setSource(HDMI1) then show — avoids the black screen from show() alone.
     Falls back to SMSourceAPP / tv-viewer which open the live source UI. */
  var hdmiMode = false;
  function exitHdmi(done) {
    try {
      if (window.tizen && tizen.tvwindow) tizen.tvwindow.hide(function () {}, function () {}, 'MAIN');
    } catch (e) {}
    hdmiMode = false;
    if (document.body) document.body.className = document.body.className.replace(/\s*is-hdmi\b/g, '');
    if (done) done(null);
  }
  function enterHdmiUi() {
    hdmiMode = true;
    if (document.body && document.body.className.indexOf('is-hdmi') < 0) document.body.className += ' is-hdmi';
  }
  function hdmiSetSourceThenShow(done) {
    if (!(window.tizen && tizen.tvwindow && tizen.systeminfo)) { done(false); return; }
    try {
      tizen.systeminfo.getPropertyValue('VIDEOSOURCE', function (vs) {
        var all = ((vs && vs.connected) || []).filter(function (s) { return s.type === 'HDMI'; });
        var src = null, i;
        if (!all.length && vs && vs.available) {
          all = (vs.available || []).filter(function (s) { return s.type === 'HDMI'; });
        }
        for (i = 0; i < all.length; i++) if (String(all[i].number) === '1') { src = all[i]; break; }
        if (!src && all.length) src = all[0];
        if (!src) { done(false); return; }
        try {
          tizen.tvwindow.setSource(src, function () {
            tizen.tvwindow.show(function () {
              enterHdmiUi();
              done(true);
            }, function () { done(false); }, ['0px', '0px', '1920px', '1080px'], 'MAIN');
          }, function () { done(false); }, 'MAIN');
        } catch (e) { done(false); }
      }, function () { done(false); });
    } catch (e) { done(false); }
  }
  function hdmi(done) {
    if (!api()) { unavailable(done); return; }
    hdmiSetSourceThenShow(function (ok) {
      if (ok) { done(null); return; }
      var ids = HDMI_NATIVE.slice();
      function next() {
        if (!ids.length) {
          done({ message: 'Could not switch to HDMI.', detail: 'Press SOURCE on your remote and pick HDMI 1. No HDMI device may be connected.' });
          return;
        }
        var id = ids.shift();
        try {
          api().launch(id, function () { done(null); }, function () { next(); });
        } catch (e) { next(); }
      }
      next();
    });
  }
  function apps(done) {
    if (!api()) { unavailable(done); return; }
    try {
      api().getAppsInfo(function (list) {
        var known = {}, seen = {}, result = [];
        Object.keys(IDS).forEach(function (brand) { known[IDS[brand]] = brand; });
        known['com.samsung.tv.cobalt-yt'] = 'youtube';
        list.forEach(function (a) {
          var primary = !!known[a.id], stream = STREAMING.indexOf(a.id) >= 0;
          var consumer = /^[A-Za-z0-9]{10}\.[A-Za-z0-9_-]+$/.test(a.id) || CONSUMER_SYSTEM.indexOf(a.id) >= 0;
          if (a.id === SELF || INTERNAL.indexOf(a.id) >= 0 || seen[a.id] || !a.name || (!primary && !stream && (!a.show || !consumer))) return;
          if (!primary && /(?:service|worker|preview|promotion|plugin|launcher|test|sdk|^ep[ -]|factory|daemon)/i.test(a.name + ' ' + a.id)) return;
          if (/-dummy$/.test(a.id)) return;
          seen[a.id] = true;
          result.push({ appId: a.id, name: a.name, brand: known[a.id] || EXTRA_BRANDS[a.id] || '', icon: a.iconPath || '', rank: primary ? Object.keys(IDS).indexOf(known[a.id]) : (stream ? 20 : 30) });
        });
        result.sort(function (a, b) { return a.rank - b.rank || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
        done(null, result);
      }, function (err) { done(failure(err)); });
    } catch (err) { done(failure(err)); }
  }
  window.FrameDevice = {
    launch: launch, launchApp: launchApp, art: art, home: home, settings: settings, apps: apps, hdmi: hdmi,
    exitHdmi: exitHdmi, isHdmi: function () { return hdmiMode; }
  };
}());

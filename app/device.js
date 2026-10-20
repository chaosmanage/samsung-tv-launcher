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
  /* HDMI on UA43DU7660: tvwindow.setSource+show produced a black overlay and blocked fallbacks.
     Launch the native source apps that sdb confirmed on this TV. */
  var HDMI_NATIVE = ['org.tizen.SMSourceAPP', 'org.tizen.tv-viewer', 'org.tizen.tv-viewer-sub1'];
  var SAMSUNG_HOME = ['com.samsung.tv.csfs', 'org.tizen.menu', 'com.samsung.tv.coba.edenview'];
  /* Crystal UHD is not The Frame; try Art/Ambient apps that exist on this set. */
  var ART_APPS = ['org.tizen.art-app', 'com.samsung.tv.coba.art', 'com.samsung.tv.home.art'];
  function api() { return window.tizen && window.tizen.application; }
  function unavailable(done) {
    done({ message: 'Open Clean Home on the TV to use this control.', detail: 'The web preview cannot control the TV.' });
  }
  function failure(err) {
    return { message: 'The TV could not open this screen.', detail: err && (err.message || err.name) || 'Try again, or press the remote’s Home button to return to Clean Home.' };
  }
  function launchApp(id, done) {
    if (!api()) { unavailable(done); return; }
    if (!id) { done({ message: 'This app has no launch target.' }); return; }
    try {
      api().launch(id, function () {}, function () {});
      done(null);
    } catch (err) { done(failure(err)); }
  }
  function launchChain(ids, done, failMsg) {
    if (!api()) { unavailable(done); return; }
    var list = ids.slice();
    function next() {
      if (!list.length) {
        done({ message: failMsg || 'Could not open that screen.', detail: 'Try again from Samsung Home if needed.' });
        return;
      }
      var id = list.shift();
      try {
        api().launch(id, function () { done(null); }, function () { next(); });
      } catch (e) { next(); }
    }
    next();
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({ message: 'This app has no launch target.' }); return; }
    launchApp(IDS[brand], done);
  }
  function art(done) {
    launchChain(ART_APPS, done, 'Art / Ambient Mode is not available on this TV.');
  }
  function home(done) {
    if (!api()) { unavailable(done); return; }
    var ids = SAMSUNG_HOME.slice();
    function tryIds() {
      if (!ids.length) {
        try {
          var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/main', null, null, null, null);
          api().launchAppControl(control, 'com.samsung.tv.csfs', function () { done(null); }, function (err) {
            done(err ? failure(err) : { message: 'Could not open Samsung Home.' });
          });
        } catch (e) { done({ message: 'Could not open Samsung Home.', detail: String(e && e.message || e) }); }
        return;
      }
      var id = ids.shift();
      try {
        api().launch(id, function () { done(null); }, function () { tryIds(); });
      } catch (e) { tryIds(); }
    }
    tryIds();
  }
  function settings(done) { launchApp('com.samsung.tv.coba.setting', done); }
  function hdmi(done) {
    /* Do not use tvwindow embedding on this model — it paints black and never falls back. */
    launchChain(HDMI_NATIVE, done, 'Could not open HDMI / Source. Press SOURCE on the remote.');
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
    exitHdmi: function (done) { if (done) done(null); },
    isHdmi: function () { return false; }
  };
}());

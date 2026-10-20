/* Public Tizen application APIs. */
(function () {
  'use strict';
  var IDS = {
    youtube: '9Ur5IzDKqV.TizenYouTube',
    netflix: 'org.tizen.netflix-app',
    zee5: 'wKDM33Rods.ZEE5',
    primevideo: 'org.tizen.primevideo',
    hotstar: 'fiZNCxMH9Y.Hotstar',
    sonyliv: 'EUKHUxrGQA.SonyLIV',
    browser: 'org.tizen.browser'
  };
  var STREAMING = [];
  var CONSUMER_SYSTEM = ['org.tizen.browser', 'com.samsung.tv.knox-browser', 'com.samsung.tv.store', '25emanual3.emanual', 'com.samsung.tv.SmartThingsApp', 'com.samsung.tv.gaminghub', 'com.samsung.tv.music-flex', 'com.samsung.tv.health-mde-workout-tracker', 'com.samsung.tv.MultiControlApp', 'org.tizen.ScreenMirroring-app-tv', 'com.samsung.tv.mycontents'];
  var EXTRA_BRANDS = {};
  var INTERNAL = ['adplatform.ADPlayer', 'WykOS4t4F0.cmsWebApp', 'org.volt.apps',
    'ZODRT12q2l.WebAccountExtension', 'ByJlgt0XeD.CastSettingsApp', 'tv6pbVMQFF.PrivacyChoices'];
  var SELF = 'KsHome0001.CleanHome';
  /* Verified on UA43DU7660 with aul STATUS_FOCUS: org.tizen.tv-viewer (and sub1).
     SMSourceAPP only reached STATUS_LAUNCHING. */
  var HDMI_NATIVE = ['org.tizen.tv-viewer', 'org.tizen.tv-viewer-sub1', 'org.tizen.SMSourceAPP'];
  var SAMSUNG_HOME = ['com.samsung.tv.csfs', 'org.tizen.menu', 'com.samsung.tv.coba.edenview'];
  function api() { return window.tizen && window.tizen.application; }
  function unavailable(done) {
    done({ message: 'Open Clean Home on the TV to use this control.', detail: 'The web preview cannot control the TV.' });
  }
  function failure(err) {
    return { message: 'The TV could not open this screen.', detail: err && (err.message || err.name) || 'Try again.' };
  }
  function launchApp(id, done) {
    if (!api()) { unavailable(done); return; }
    if (!id) { done({ message: 'This app has no launch target.' }); return; }
    try { api().launch(id, function () {}, function () {}); done(null); }
    catch (err) { done(failure(err)); }
  }
  function launchChain(ids, done, failMsg) {
    if (!api()) { unavailable(done); return; }
    var list = ids.slice();
    function next() {
      if (!list.length) { done({ message: failMsg || 'Could not open that screen.' }); return; }
      var id = list.shift();
      try { api().launch(id, function () { done(null); }, function () { next(); }); }
      catch (e) { next(); }
    }
    next();
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({ message: 'This app has no launch target.' }); return; }
    launchApp(IDS[brand], done);
  }
  function art(done) {
    done({ message: 'Art Mode is not available on this TV.', detail: 'UA43DU7660 Crystal UHD has no Art Mode UI. The Art control was removed.' });
  }
  function home(done) {
    if (!api()) { unavailable(done); return; }
    var ids = SAMSUNG_HOME.slice();
    function tryIds() {
      if (!ids.length) {
        try {
          var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/main', null, null, null, null);
          api().launchAppControl(control, 'com.samsung.tv.csfs', function () { done(null); }, function (err) { done(err ? failure(err) : { message: 'Could not open Samsung Home.' }); });
        } catch (e) { done({ message: 'Could not open Samsung Home.' }); }
        return;
      }
      var id = ids.shift();
      try { api().launch(id, function () { done(null); }, function () { tryIds(); }); }
      catch (e) { tryIds(); }
    }
    tryIds();
  }
  /* Candidates verified/tried on UA43DU7660; launchChain stops at the first that opens. */
  /* Verified on UA43DU7660 (20 Oct 2026, aul STATUS_FOCUS): org.tizen.menu (Settings overlay), quickpanel.
     com.samsung.tv.coba.setting launches but never runs; homesetting fails. */
  var TV_SETTINGS = ['org.tizen.menu', 'com.samsung.tv.quickpanel'];
  function settings(done) {
    launchChain(TV_SETTINGS, done, 'Could not open TV settings. Use the remote Settings/Home key.');
  }
  function hdmi(done) {
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
          if (!primary && CONSUMER_SYSTEM.indexOf(a.id) < 0 && /(?:service|worker|preview|promotion|plugin|launcher|test|sdk|^ep[ -]|factory|daemon)/i.test(a.name + ' ' + a.id)) return;
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

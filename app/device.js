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
  var HDMI_NATIVE = ['com.samsung.tv.coba.source', 'org.tizen.tv-viewer', 'org.tizen.SMSourceAPP'];
  var SAMSUNG_HOME = ['com.samsung.tv.coba.newhome', 'com.samsung.tv.csfs'];
  function api() { return window.tizen && window.tizen.application; }
  function unavailable(done) {
    done({ message: 'Open Clean Home on the TV to use this control.', detail: 'The web preview cannot control the TV.' });
  }
  function failure(err) {
    return { message: 'The TV could not open this screen.', detail: err && (err.message || err.name) || 'Try again, or press the remote’s Home button to return to Clean Home.' };
  }
  function bounded(done) {
    var finished = false, timer = setTimeout(function () { finish({ message: 'The TV did not respond. Please try again.' }); }, 8000);
    function finish(err, value) { if (finished) return; finished = true; clearTimeout(timer); done(err, value); }
    return finish;
  }
  function launchApp(id, done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try { api().launch(id, function () { finish(null); }, function (err) { finish(failure(err)); }); }
    catch (err) { finish(failure(err)); }
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({message: 'This app has no launch target.'}); return; }
    launchApp(IDS[brand], done);
  }
  function art(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      var data = [new tizen.ApplicationControlData('mode', ['fullscreen']), new tizen.ApplicationControlData('requester', ['mobile'])];
      var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/default', null, null, null, data);
      api().launchAppControl(control, 'org.tizen.art-app', function () { finish(null); }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function home(done) {
    var ids = SAMSUNG_HOME.slice();
    function tryNext(err) {
      if (!ids.length) { done(err || { message: 'Could not open Samsung Home.' }); return; }
      launchApp(ids.shift(), function (e) { if (e) tryNext(e); else done(null); });
    }
    tryNext(null);
  }
  function settings(done) { launchApp('com.samsung.tv.coba.setting', done); }
  function hdmi(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    function tryNative() {
      var ids = HDMI_NATIVE.slice();
      function next(err) {
        if (!ids.length) {
          finish({ message: 'Could not open an HDMI source.', detail: 'Press the SOURCE button on your remote and pick your HDMI device.' });
          return;
        }
        launchApp(ids.shift(), function (e) { if (e) next(e); else finish(null); });
      }
      next(null);
    }
    try {
      if (window.tizen && tizen.tvwindow && tizen.systeminfo) {
        tizen.systeminfo.getPropertyValue('VIDEOSOURCE', function (vs) {
          var all = ((vs && vs.connected) || []).filter(function (s) { return s.type === 'HDMI'; });
          if (!all.length) { tryNative(); return; }
          var src = all[0];
          try {
            tizen.tvwindow.show(function () { finish(null); }, function () { tryNative(); },
              ['0px', '0px', '1920px', '1080px'], src.type + src.number, 'MAIN');
          } catch (e) { tryNative(); }
        }, function () { tryNative(); });
        return;
      }
    } catch (e) {}
    tryNative();
  }
  function apps(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      api().getAppsInfo(function (list) {
        var known = {}, seen = {}, result = [];
        Object.keys(IDS).forEach(function (brand) { known[IDS[brand]] = brand; });
        // Also accept cobalt YouTube fallback as youtube brand
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
        finish(null, result);
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  window.FrameDevice = { launch: launch, launchApp: launchApp, art: art, home: home, settings: settings, apps: apps, hdmi: hdmi };
}());

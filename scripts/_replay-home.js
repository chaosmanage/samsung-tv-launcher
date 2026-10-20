// Replays the real launch requests logged on the UA43DU7660 (20 Oct 2026) through the shipped handoff code.
const src = require('fs').readFileSync(__dirname + '/../app/main.js', 'utf8');
const grab = (name) => { const i = src.indexOf('  function ' + name + '('); let depth = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') depth++; else if (src[k] === '}' && --depth === 0) return src.slice(i, k + 1); } };
let current = null, pref = { useAsHome: false }, handoffs = [];
const tizen = { application: { getCurrentApplication: () => ({ getRequestedAppControl: () => current }) } };
const FrameDevice = { home: (cb) => { handoffs.push(step); cb && cb(null); } };
const chDebug = () => {}; global.document = { documentElement: { className: '' }, hidden: false, hasFocus: () => true };
const document = global.document; const window = global; const useAsHome = () => pref.useAsHome !== false;
let step = '';
eval('var lastLaunchKey = null; var HANDOFF = { at: 0 };' + ['isHomeTriggeredLaunch', 'launchKey', 'maybeHandOffHome', 'launchInfo', 'onEntry', 'handoffHide', 'handoffShow'].map(grab).join('\n') + '; global.onEntry = onEntry; global.HANDOFF = HANDOFF; global.setLast = function (k) { lastLaunchKey = k; };');
const req = (caller, data) => ({ callerAppId: caller, appControl: { operation: 'http://tizen.org/appcontrol/operation/default', uri: '', data: Object.entries(data).map(([key, value]) => ({ key, value })) } });
const SDB = req('', { USE_DISKCACHE: 'Yes', __K_SPLASH_SCREEN: 'LA_UI_DEFAULT', __K_RELOCATE_BELOW: 'KsHome0001.CleanHome', Title: 'Clean Home' });
const APPROW = req('org.tizen.litewebappservice', { callerid: 'com.samsung.tv.home.media', CallerId: 'com.samsung.tv.home.media', SkipReload: 'Yes', LaunchFromHome: '1', __K_RELOCATE_BELOW: 'com.samsung.tv.csfs', Entry: 'launcher' });
const HOMEKEY = (t) => req('tvctx-manager', { USE_DISKCACHE: 'Yes', __K_SPLASH_SCREEN: 'LA_UI_DEFAULT', SkipReload: 'Yes', __K_APP_LAUNCH_START_TIME: String(t), __K_RELOCATE_BELOW: 'KsHome0001.CleanHome', entry_point: 'smarthub_key', __TVCONTEXT_PREV_APP__: 'KsHome0001.CleanHome', Title: 'Clean Home' });
const RECOVERY = req('', { Title: 'Clean Home', __K_EX_RECOVERY_LAUNCH: 'true' });
const steps = [
  ['Off: cold sdb launch (start)', SDB, ['start'], false],
  ['Off: focus, same request', SDB, ['focus'], false],
  ['Off: opened from Samsung Home app row 20:36:56', APPROW, ['visible', 'webkitvisible', 'focus'], false],
  ['Off: REAL Home key 20:37:44 (focus only, CH in front)', HOMEKEY(1564176), ['focus'], true],
  ['Off: back from Samsung Home, stale Home-key request', HOMEKEY(1564176), ['visible', 'webkitvisible', 'focus', 'pageshow'], false],
  ['Off: app row again (must show Clean Home)', APPROW, ['appcontrol', 'visible', 'focus'], false],
  ['Off: second Home press (new start time) via visible', HOMEKEY(1600000), ['visible', 'webkitvisible', 'focus'], true],
  ['Off: recovery relaunch', RECOVERY, ['start'], false],
  ['On: Home press', HOMEKEY(1700000), ['focus'], false, true],
];
let ok = true;
// --- head-script replay: cold Home-key launch, toggle Off ---
{
  const html = require('fs').readFileSync(__dirname + '/../app/index.html', 'utf8');
  const code = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
  const launches = []; const store = { 'cleanhome.homepref': JSON.stringify({ useAsHome: false }) };
  const run = (reqObj, prefOff) => { const doc = { documentElement: { className: '' } }; const win = { localStorage: { getItem: k => prefOff ? store[k] || null : null } };
    launches.length = 0; new Function('window', 'document', 'tizen', 'performance', code)(win, doc, { application: { getCurrentApplication: () => ({ getRequestedAppControl: () => reqObj }), launch: (id, ok) => { launches.push(id); ok && ok(); } } }, { timing: { navigationStart: Date.now() - 40 } });
    return { win, doc, launches: launches.slice() }; };
  const cases = [['head: cold Home key, Off', HOMEKEY(1800000), true, 1], ['head: cold app row, Off', APPROW, true, 0], ['head: cold sdb, Off', SDB, true, 0], ['head: recovery, Off', RECOVERY, true, 0], ['head: Home key, On', HOMEKEY(1800001), false, 0]];
  for (const [name, r, off, expect] of cases) {
    const o = run(r, off); let pass = o.launches.length === expect && (expect ? /ch-handoff/.test(o.doc.documentElement.className) : !/ch-handoff/.test(o.doc.documentElement.className));
    if (expect) { // main.js must not launch a second time for the same request
      global.setLast(o.win.__CH_EARLY.key); pref.useAsHome = false; current = r; const b = handoffs.length; onEntry('start'); onEntry('focus'); pass = pass && handoffs.length === b;
    }
    ok = ok && pass; console.log((pass ? 'PASS' : 'FAIL') + '  launches=' + o.launches.join(',') + '  ' + name + (expect ? ' (main.js de-duped)' : ''));
  }
  global.setLast(null);
}
for (const [name, r, hooks, expect, on] of steps) {
  pref.useAsHome = !!on; current = r; step = name; const before = handoffs.length;
  hooks.forEach(h => onEntry(h));
  let n = handoffs.length - before, pass = expect ? n === 1 : n === 0;
  const black = /ch-handoff/.test(document.documentElement.className);
  const wantBlack = expect || (/stale/.test(name));   // stale echo within 1.5 s stays black; app row / others show
  pass = pass && (black === wantBlack);
  ok = ok && pass;
  console.log((pass ? 'PASS' : 'FAIL') + '  black=' + black + '  handoffs=' + n + '  ' + name + '  [' + hooks.join(',') + ']');
}
process.exit(ok ? 0 : 1);

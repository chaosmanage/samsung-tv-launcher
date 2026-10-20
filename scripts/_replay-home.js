// Replays the real launch requests logged on the UA43DU7660 (20 Oct 2026) through the shipped handoff code.
const src = require('fs').readFileSync(__dirname + '/../app/main.js', 'utf8');
const grab = (name) => { const i = src.indexOf('  function ' + name + '('); let depth = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') depth++; else if (src[k] === '}' && --depth === 0) return src.slice(i, k + 1); } };
let current = null, pref = { useAsHome: false }, handoffs = [];
const tizen = { application: { getCurrentApplication: () => ({ getRequestedAppControl: () => current }) } };
const FrameDevice = { home: (cb) => { handoffs.push(step); cb && cb(null); } };
const chDebug = () => {}; const useAsHome = () => pref.useAsHome !== false;
let step = '';
eval('var lastLaunchKey = null;' + ['isHomeTriggeredLaunch', 'launchKey', 'maybeHandOffHome', 'launchInfo', 'onEntry'].map(grab).join('\n') + '; global.onEntry = onEntry;');
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
for (const [name, r, hooks, expect, on] of steps) {
  pref.useAsHome = !!on; current = r; step = name; const before = handoffs.length;
  hooks.forEach(h => onEntry(h));
  const n = handoffs.length - before, pass = expect ? n === 1 : n === 0;
  ok = ok && pass;
  console.log((pass ? 'PASS' : 'FAIL') + '  handoffs=' + n + '  ' + name + '  [' + hooks.join(',') + ']');
}
process.exit(ok ? 0 : 1);

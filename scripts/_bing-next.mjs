// Functional test for Settings -> Background -> "Next Bing photo" / "Back to today's photo".
// Mocks Bing (per-market archives, one broken image, then total outage) and drives the UI with arrow/Enter keys only.
import { openPreview } from './browser.mjs';
import fs from 'node:fs';
const jpg = fs.readFileSync(fs.existsSync('/tmp/fakebing.jpg') ? '/tmp/fakebing.jpg' : 'app/assets/wallpapers/alpine-thumb.jpg');
const apps = fs.existsSync('/tmp/mockapps.json') ? JSON.parse(fs.readFileSync('/tmp/mockapps.json', 'utf8')) : [];
let outage = false; const archiveCalls = [];
const p = await openPreview();
const page = await p.browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.log('PAGEERR', e.message));
await page.route('https://www.bing.com/HPImageArchive*', r => {
  const u = new URL(r.request().url()); const mkt = u.searchParams.get('mkt'), idx = +u.searchParams.get('idx'), n = +u.searchParams.get('n');
  archiveCalls.push(mkt + ':' + idx + ':' + n);
  if (outage) return r.fulfill({ status: 503, body: '' });
  const imgs = []; for (let i = 0; i < n; i++) { const day = idx + i; const name = mkt === 'en-IN' || day % 2 ? 'Day' + day : mkt.replace('-', '') + 'Day' + day; imgs.push({ url: `/th?id=OHR.${name}_${mkt}123_1920x1080.jpg&rf=x`, title: 'Photo ' + name }); }
  return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ images: imgs }) });
});
await page.route('https://www.bing.com/th*', r => (outage || /Day1_/.test(r.request().url())) ? r.fulfill({ status: 404, body: '' }) : r.fulfill({ contentType: 'image/jpeg', body: jpg }));
await page.addInitScript(list => {
  window.tizen = { application: { getAppsInfo: ok => setTimeout(() => ok(list), 50), getCurrentApplication: () => ({ appInfo: { iconPath: '/x.png', version: '1.2.5' }, getRequestedAppControl: () => ({ callerAppId: '', appControl: { operation: 'http://tizen.org/appcontrol/operation/default', uri: '', data: [] } }), exit() {} }), launch: (id, ok) => ok && ok(), launchAppControl() {} }, ApplicationControl: function () {}, tvinputdevice: { registerKey() {}, registerKeyBatch() {}, getSupportedKeys: () => [] } };
  if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('cleanhome.home.v1', JSON.stringify({ version: 2, ui: 3, look: { apps: 'icons', bg: 'photo' }, home: ['hdmi', 'youtube', 'netflix', 'zee5', 'primevideo', 'hotstar', 'sonyliv', 'browser'], dailyBing: true, useAsHome: true })); }
}, apps);
await page.goto(p.baseURL + '/', { waitUntil: 'load' }); await page.waitForTimeout(2000);
const shown = () => page.evaluate(() => (document.querySelector('[data-live]') || {}).getAttribute && document.querySelector('img[data-live^="http"]') ? document.querySelector('img[data-live^="http"]').getAttribute('data-live') : '');
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('cleanhome.bing') || 'null'));
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(120); } };
let ok = true; const check = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) ok = false; };
check('today shown at start', /OHR\.Day0_/.test(await shown()), await shown());
await page.evaluate(() => ShoreQA.scene('settings')); await page.waitForTimeout(300);
await key('Enter'); await page.waitForTimeout(400);                      // Background group (first row)
const focusText = () => page.evaluate(() => (document.querySelector('.appearance-rows .setting-choice.is-focus') || {}).innerText || '');
for (let i = 0; i < 12 && !/Next Bing photo/.test(await focusText()); i++) await key('ArrowDown');
check('Next Bing photo reachable with arrows', /Next Bing photo/.test(await focusText()));
await key('Enter'); await page.waitForTimeout(1200);
let s1 = await shown(); check('Next skips today and broken Day1 -> Day2', /OHR\.Day2_/.test(s1), s1);
await page.screenshot({ path: '/tmp/bing-next-1.png' });
await key('Enter'); await page.waitForTimeout(1200);
let s2 = await shown(); check('Next again -> different photo', s2 !== s1 && /OHR\./.test(s2), s2);
const st = await stored(); check('pick persisted', st && st.pick === s2 && st.url === s2, JSON.stringify(st));
// exhaust en-IN pool so it grows into other markets
for (let i = 0; i < 16; i++) { await key('Enter'); await page.waitForTimeout(700); }
check('pool grew into other markets', archiveCalls.some(c => !c.startsWith('en-IN')), archiveCalls.join(' '));
// reload: pick survives same day
const before = await shown(); await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2000);
check('manual pick survives app restart (same day)', (await shown()) === before, await shown());
// outage: Next keeps current
outage = true; await page.evaluate(() => ShoreQA.scene('settings')); await page.waitForTimeout(300); await key('Enter'); await page.waitForTimeout(300);
for (let i = 0; i < 12 && !/Next Bing photo/.test(await focusText()); i++) await key('ArrowDown');
const keep = await shown(); await page.evaluate(() => { /* force pool exhaustion path */ }); 
for (let i = 0; i < 3; i++) { await key('Enter'); await page.waitForTimeout(1500); }
check('outage keeps current photo', (await shown()) === keep, await shown());
const msg = await page.evaluate(() => document.querySelector('.appearance-rows').innerText);
check('outage message shown', /Current photo kept|Finding/.test(msg), msg.replace(/\s+/g, ' ').slice(0, 200));
outage = false;
await key('ArrowDown'); check('Back to today reachable', /Back to today/.test(await focusText()));
await key('Enter'); await page.waitForTimeout(1500);
check('Back to today restores Day0', /OHR\.Day0_/.test(await shown()), await shown());
check('pick cleared', !(await stored()).pick);
// next day: pick replaced by today's
await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('cleanhome.bing')); c.pick = c.url = 'https://www.bing.com/th?id=OHR.Day5_en-IN123_1920x1080.jpg'; c.date = '2000-1-1'; localStorage.setItem('cleanhome.bing', JSON.stringify(c)); });
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2000);
check('new day replaces manual pick with today', /OHR\.Day0_/.test(await shown()) && !(await stored()).pick, await shown());
console.log(ok ? 'PASS all' : 'FAIL some'); await p.close(); process.exit(ok ? 0 : 1);

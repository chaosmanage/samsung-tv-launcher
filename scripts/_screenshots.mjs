// Renders README screenshots at 1920x1080 in headless Chromium (no TV involved).
// Uses today's live Bing photo (falls back to the bundled wallpaper if Bing is unreachable).
// Usage: node scripts/_screenshots.mjs [outDir]   (default docs/screenshots)
import { openPreview } from './browser.mjs';
import fs from 'node:fs';
const out = process.argv[2] || 'docs/screenshots'; fs.mkdirSync(out, { recursive: true });
const apps = fs.existsSync('/tmp/mockapps.json') ? JSON.parse(fs.readFileSync('/tmp/mockapps.json', 'utf8')) : [];
const p = await openPreview();
const page = await p.browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.log('PAGEERR', e.message));
// Headless Chromium on the box has no direct egress, so Bing requests are proxied through Node's fetch.
await page.route('https://www.bing.com/**', async r => {
  try { const res = await fetch(r.request().url()); r.fulfill({ status: res.status, contentType: res.headers.get('content-type') || '', body: Buffer.from(await res.arrayBuffer()) }); }
  catch (e) { r.abort(); }
});
await page.route('https://api.open-meteo.com/**', async r => {
  try { const res = await fetch(r.request().url()); r.fulfill({ status: res.status, contentType: 'application/json', body: Buffer.from(await res.arrayBuffer()) }); } catch (e) { r.abort(); }
});
await page.addInitScript(list => {
  window.tizen = { application: { getAppsInfo: ok => setTimeout(() => ok(list), 50), getCurrentApplication: () => ({ appInfo: { iconPath: '/x.png', version: '1.2.5' }, getRequestedAppControl: () => ({ callerAppId: '', appControl: { operation: 'http://tizen.org/appcontrol/operation/default', uri: '', data: [] } }), exit() {} }), launch: (id, ok) => ok && ok(), launchAppControl() {} }, ApplicationControl: function () {}, tvinputdevice: { registerKey() {}, registerKeyBatch() {}, getSupportedKeys: () => [] } };
  localStorage.setItem('cleanhome.home.v1', JSON.stringify({ version: 2, ui: 3, look: { apps: 'icons', bg: 'photo' }, home: ['hdmi', 'youtube', 'netflix', 'zee5', 'primevideo', 'hotstar', 'sonyliv', 'browser', '3201606009684.Spotify'], dailyBing: true, useAsHome: true }));
}, apps);
page.on('requestfailed', r => console.log('FAILED', r.url().slice(0, 90), r.failure() && r.failure().errorText));
await page.goto(p.baseURL + '/', { waitUntil: 'load' });
await page.waitForFunction(() => !!document.querySelector('img[data-live^="http"]'), null, { timeout: 15000 }).catch(() => console.log('Bing unreachable: bundled wallpaper used'));
await page.waitForTimeout(3000);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(150); } };
const shot = async name => { await page.waitForTimeout(700); await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 88 }); console.log('saved', `${out}/${name}.jpg`); };
const focusText = () => page.evaluate(() => (document.querySelector('.is-focus') || {}).innerText || '');
await page.evaluate(() => ShoreQA.scene('home')); await key('ArrowDown'); await key('ArrowRight', 2);
await shot('01-home');
await page.evaluate(() => ShoreQA.scene('settings')); await shot('02-settings');
await key('Enter'); await page.waitForTimeout(400);
for (let i = 0; i < 12 && !/Next Bing photo/.test(await focusText()); i++) await key('ArrowDown');
await shot('03-settings-background');
await key('Enter'); await page.waitForFunction(() => !/Finding/.test(document.querySelector('.appearance-rows').innerText), null, { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(1500);
await shot('04-next-bing-photo');
await page.evaluate(() => ShoreQA.scene('home')); await shot('05-home-after-next');
await page.evaluate(() => ShoreQA.scene('settings')); await page.waitForTimeout(300);
for (let i = 0; i < 8; i++) { if (/Samsung/.test(await focusText())) break; await key('ArrowDown'); }
await key('Enter'); await shot('06-settings-samsung');
await page.evaluate(() => ShoreQA.scene('editor')); await shot('07-apps-on-home');
await page.evaluate(() => ShoreQA.scene('apps')); await shot('08-all-apps');
await p.close();

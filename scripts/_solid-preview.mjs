import { openPreview } from './browser.mjs';
import fs from 'node:fs';
const apps = JSON.parse(fs.readFileSync('/tmp/mockapps.json', 'utf8'));
const p = await openPreview();
const page = await p.browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.log('PAGEERR', e.message));
await page.route('https://www.bing.com/HPImageArchive*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ images: [{ url: '/th?id=OHR.FakeTest_1920x1080.jpg' }] }) }));
await page.route('https://www.bing.com/th*', r => r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync('/tmp/fakebing.jpg') }));
await page.addInitScript(([list, mode]) => {
  window.tizen = { application: { getAppsInfo: ok => setTimeout(() => ok(list), 50),
    getCurrentApplication: () => ({ appInfo: { iconPath: '/x.png', version: '1.2.4' }, getRequestedAppControl: () => ({ callerAppId: '', appControl: { operation: 'http://tizen.org/appcontrol/operation/default', data: [] } }), exit() {} }),
    launch: (id, ok) => ok && ok(), launchAppControl() {} }, ApplicationControl: function () {}, tvinputdevice: { registerKey() {}, registerKeyBatch() {}, getSupportedKeys: () => [] } };
  localStorage.setItem('cleanhome.glass', mode);
  localStorage.setItem('cleanhome.home.v1', JSON.stringify({ version: 2, ui: 3, look: { apps: 'icons' }, home: ['hdmi','youtube','netflix','zee5','primevideo','hotstar','sonyliv','browser','3201606009684.Spotify'], dailyBing: true }));
}, [apps, process.argv[2] || 'solid']);
await page.goto(p.baseURL + '/', { waitUntil: 'load' }); await page.waitForTimeout(2500);
const m = process.argv[2] || 'solid';
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
await page.screenshot({ path: `/tmp/g-${m}-home.png` });
console.log('stage', await page.evaluate(() => document.querySelector('.stage').className.match(/glass-\w+/)[0]));
await page.evaluate(() => ShoreQA.scene('settings')); await page.waitForTimeout(600);
await page.screenshot({ path: `/tmp/g-${m}-settings.png` });
await p.close();

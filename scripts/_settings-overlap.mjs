import { openPreview } from './browser.mjs';
import fs from 'node:fs';

function boxes(page, sel) {
  return page.$$eval(sel, els => els.filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  }).map(el => {
    const r = el.getBoundingClientRect();
    return { t: (el.innerText || el.textContent || '').slice(0, 90).replace(/\s+/g, ' '), x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right };
  }));
}
function overlap(a, b, pad = 2) {
  return !(a.r <= b.x + pad || b.r <= a.x + pad || a.b <= b.y + pad || b.b <= a.y + pad);
}
function report(name, rows, footer, preview, clip) {
  const issues = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      const nested = (a.x <= b.x && a.r >= b.r && a.y <= b.y && a.b >= b.b) || (b.x <= a.x && b.r >= a.r && b.y <= a.y && b.b >= a.b);
      if (!nested && overlap(a, b)) {
        // ignore overlaps entirely outside the visible clip
        if (clip) {
          const midY = (Math.min(a.b, b.b) + Math.max(a.y, b.y)) / 2;
          if (midY > clip.b || midY < clip.y) continue;
        }
        issues.push(`row-overlap: [${i}]"${a.t.slice(0,36)}" <-> [${j}]"${b.t.slice(0,36)}"`);
      }
    }
    const row = rows[i];
    const vis = clip ? { x: Math.max(row.x, clip.x), y: Math.max(row.y, clip.y), r: Math.min(row.r, clip.r), b: Math.min(row.b, clip.b) } : row;
    vis.w = vis.r - vis.x; vis.h = vis.b - vis.y;
    if (footer && footer.h > 0 && vis.w > 2 && vis.h > 2 && overlap(vis, footer)) issues.push(`footer-overlap: [${i}]"${row.t.slice(0,50)}"`);
    if (preview && row.x < preview.x && row.r > preview.x + 8 && overlap(row, preview))
      issues.push(`preview-clip: [${i}]"${row.t.slice(0,40)}" right=${Math.round(row.r)} previewX=${Math.round(preview.x)}`);
  }
  if (clip && footer && clip.b > footer.y + 2) issues.push(`rows-clip-into-footer: clipBottom=${Math.round(clip.b)} footerY=${Math.round(footer.y)}`);
  return { name, issues, rowCount: rows.length, footerY: footer && Math.round(footer.y), lastRowBottom: rows.length ? Math.round(Math.max(...rows.map(r => r.b))) : 0, clipBottom: clip && Math.round(clip.b), previewX: preview && Math.round(preview.x) };
}

const apps = JSON.parse(fs.readFileSync('/tmp/mockapps.json', 'utf8'));
const p = await openPreview();
const page = await p.browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.log('PAGEERR', e.message));
await page.route('https://www.bing.com/HPImageArchive*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ images: [{ url: '/th?id=OHR.FakeTest_1920x1080.jpg' }] }) }));
await page.route('https://www.bing.com/th*', r => r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync('/tmp/fakebing.jpg') }));
await page.addInitScript(list => {
  window.tizen = {
    application: {
      getAppsInfo: (ok) => setTimeout(() => ok(list), 50),
      getCurrentApplication: () => ({
        appInfo: { iconPath: '/x.png', version: '1.2.4' },
        getRequestedAppControl: () => ({ callerAppId: '', appControl: { operation: 'http://tizen.org/appcontrol/operation/default', uri: '', data: [] } }),
        exit: () => {}
      }),
      launch: (id, ok) => ok && ok(),
      launchAppControl: () => {}
    },
    ApplicationControl: function () {},
    tvinputdevice: { registerKey() {}, registerKeyBatch() {}, getSupportedKeys: () => [] }
  };
  localStorage.setItem('cleanhome.home.v1', JSON.stringify({
    version: 2, ui: 3, look: { apps: 'icons', bg: 'photo' },
    home: ['hdmi', 'youtube', 'netflix', 'zee5', 'primevideo', 'hotstar', 'sonyliv', 'browser'],
    dailyBing: true, useAsHome: true
  }));
}, apps);

await page.goto(p.baseURL + '/', { waitUntil: 'load' });
await page.waitForTimeout(2500);
const results = [];

async function measure(label) {
  await page.waitForTimeout(400);
  const rows = await boxes(page, '.appearance-rows .setting-section, .appearance-rows .setting-reason, .settings-overview .settings-group');
  // also peer choices that are not nested check — use sections+reasons for vertical stack
  const footer = (await boxes(page, '.appearance-desc, .settings-overview-hint')).filter(f => f.h > 0)[0] || null;
  const preview = await page.evaluate(() => {
    const el = document.querySelector('.stage.at-appearance .scene, .stage.at-wallpaper .scene');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right };
  });
  const clip = await page.evaluate(() => {
    const el = document.querySelector('.appearance-rows, .settings-overview');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right };
  });
  const r = report(label, rows, footer, preview, clip);
  // also check choice text vs preview
  const choices = await boxes(page, '.appearance-rows .setting-choice, .appearance-rows .setting-reason');
  if (preview) {
    for (const c of choices) {
      if (c.x < preview.x && c.r > preview.x + 8 && overlap(c, preview))
        r.issues.push(`choice-preview-clip: "${c.t.slice(0,40)}" right=${Math.round(c.r)}`);
    }
    if (footer && overlap(footer, preview) === false) { /* ok */ }
  }
  if (footer && clip) {
    for (const c of choices) {
      const vis = { x: Math.max(c.x, clip.x), y: Math.max(c.y, clip.y), r: Math.min(c.r, clip.r), b: Math.min(c.b, clip.b), w: 0, h: 0 };
      vis.w = vis.r - vis.x; vis.h = vis.b - vis.y;
      if (vis.w > 2 && vis.h > 2 && overlap(vis, footer)) r.issues.push(`choice-footer-overlap: "${c.t.slice(0,40)}"`);
    }
  }
  results.push(r);
  await page.screenshot({ path: `/tmp/set-${label.replace(/\W+/g, '_')}.png` });
  return r;
}

await page.evaluate(() => ShoreQA.scene('settings'));
await measure('settings-overview');

async function openGroup(g) {
  await page.evaluate((group) => {
    ShoreQA.scene('settings');
  }, g);
  await page.waitForTimeout(300);
  await page.evaluate((group) => {
    for (let i = 0; i < 12; i++) {
      const acts = ShoreQA.actions();
      const want = group === 'editor' ? 'settings.editor' : 'settings.group.' + group;
      if (acts.indexOf(want) >= 0) { ShoreQA.activate(want); return want; }
      ShoreQA.nav('down');
    }
    return ShoreQA.actions();
  }, g);
  await page.waitForTimeout(500);
}

for (const group of ['background', 'layout', 'typography', 'focus', 'samsung']) {
  await openGroup(group);
  console.log('OPEN', group, await page.evaluate(() => ShoreQA.where()));
  await measure(group);
  if (group === 'background') {
    for (let i = 0; i < 8; i++) await page.evaluate(() => ShoreQA.nav('down'));
    await measure('background-deep');
  }
  if (group === 'samsung') {
    console.log('SAMSUNG', await page.evaluate(() => Array.from(document.querySelectorAll('.setting-choice')).map(e => e.innerText.replace(/\s+/g, ' ').slice(0, 100))));
  }
}

fs.writeFileSync('/tmp/settings-overlap.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
const bad = results.filter(r => r.issues.length);
console.log(bad.length ? ('FAIL ' + bad.map(b => b.name + ':' + b.issues.length).join(', ')) : 'PASS all pages');
await p.close();

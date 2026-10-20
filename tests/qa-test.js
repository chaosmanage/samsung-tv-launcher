const puppeteer = require('puppeteer-core');
const path = require('path');
const OUT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(OUT, 'index.html');

const STUB = (opts) => `
(function(){
  var log = window.__log = { launches: [], keys: [], exit: 0, tv: [], hide: 0 };
  var opts = ${JSON.stringify(opts)};
  var apps = [
    { id: 'com.samsung.tv.cobalt-yt', name: 'YouTube', show: true },
    { id: 'org.tizen.netflix-app', name: 'Netflix', show: true },
    { id: 'Zx9ZEE5aaa.ZEE5', name: 'ZEE5', show: true },
    { id: 'org.tizen.primevideo', name: 'Prime Video', show: true },
    { id: 'org.tizen.primevideo-dummy', name: 'Prime Video', show: false },
    { id: 'HsJio00001.JioHotstar', name: 'JioHotstar', show: true },
    { id: 'com.samsung.tv.knox-browser', name: 'Internet', show: true }
  ];
  function err(n,m){ return { name: n, message: m }; }
  window.tizen = {
    application: {
      launch: function(id, ok, fail){ log.launches.push(id);
        setTimeout(function(){ (opts.failIds||[]).indexOf(id) >= 0 || !apps.some(function(a){return a.id===id;}) ? fail(err('NotFoundError','No such app: '+id)) : ok(); }, 5); },
      getAppsInfo: function(ok){ setTimeout(function(){ ok(apps); }, 1); },
      getCurrentApplication: function(){ return { exit: function(){ log.exit++; }, hide: function(){ log.exit++; } }; }
    },
    tvinputdevice: { registerKeyBatch: function(k){ log.keys = k.slice(); }, registerKey: function(k){ log.keys.push(k); } },
    systeminfo: { getPropertyValue: function(p, ok){ setTimeout(function(){ ok({ connected: opts.hdmi || [] }); }, 1); } },
    tvwindow: {
      setSource: function(src, ok){ log.tv.push('set:' + src.number); setTimeout(function(){ ok(src, 'MAIN'); }, 1); },
      show: function(ok, fail, rect){ log.tv.push('show:' + rect.join(',')); setTimeout(function(){ ok(rect, 'MAIN'); }, 1); },
      hide: function(ok){ log.hide++; ok && ok(); }
    }
  };
})();`;

let pass = 0, fail = 0; const results = [];
function check(name, cond, extra) { (cond ? pass++ : fail++); results.push((cond ? 'PASS ' : 'FAIL ') + name + (cond || !extra ? '' : '  -> ' + extra)); }

async function open(browser, opts, withTizen = true) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  if (withTizen) await page.evaluateOnNewDocument(STUB(opts || {}));
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(URL, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 120));
  return { page, errors };
}
const key = (page, code) => page.evaluate(c => {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(e, 'keyCode', { get: () => c }); document.dispatchEvent(e);
}, code);
const focused = page => page.evaluate(() => [...document.querySelectorAll('.tile')].findIndex(t => t.classList.contains('focused')));
const wait = ms => new Promise(r => setTimeout(r, ms));
const L = 37, U = 38, R = 39, D = 40, OK = 13, BACK = 10009, BLUE = 406;

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--force-device-scale-factor=1'] });

  /* ---- 1. layout & default state ---- */
  let { page, errors } = await open(browser, { hdmi: [{ type: 'HDMI', number: 1 }] });
  check('8 tiles rendered', await page.$$eval('.tile', t => t.length) === 8);
  check('tile order', JSON.stringify(await page.$$eval('.tile', t => t.map(x => x.getAttribute('aria-label')))) ===
    JSON.stringify(['HDMI','YouTube','Netflix','ZEE5','Prime Video','JioHotstar','Sony LIV','Internet']));
  check('initial focus on tile 1 (HDMI)', await focused(page) === 0);
  check('remote keys registered', (await page.evaluate(() => __log.keys)).includes('ColorF3Blue'));
  const fits = await page.evaluate(() => { const b = document.querySelector('footer').getBoundingClientRect();
    const g = document.querySelector('.grid').getBoundingClientRect(); return b.bottom <= 1080 && g.right <= 1920 && g.left >= 0 && document.documentElement.scrollHeight <= 1080; });
  check('layout fits 1920x1080 without scrolling', fits);
  check('only Sony LIV flagged missing', JSON.stringify(await page.$$eval('.tile.missing', t => t.map(x => x.getAttribute('aria-label')))) === '["Sony LIV"]');

  /* ---- 2. D-pad navigation ---- */
  const seq = [];
  for (let i = 0; i < 8; i++) { await key(page, R); seq.push(await focused(page)); }
  check('RIGHT walks 1..8 and wraps to 1', JSON.stringify(seq) === '[1,2,3,4,5,6,7,0]', JSON.stringify(seq));
  await key(page, L); check('LEFT from first wraps to last', await focused(page) === 7);
  await key(page, R); await key(page, D); check('DOWN from row1 col1 -> row2 col1', await focused(page) === 4);
  await key(page, D); check('DOWN from bottom row wraps to top', await focused(page) === 0);
  await key(page, U); check('UP from top row wraps to bottom', await focused(page) === 4);
  for (let c = 0; c < 4; c++) { await page.evaluate(() => 0); }
  await key(page, U); await key(page, R); await key(page, R); await key(page, R);
  check('RIGHT x3 on top row reaches col 4', await focused(page) === 3);
  await key(page, D); check('DOWN from col 4 -> tile 8', await focused(page) === 7);
  await key(page, U); check('UP from tile 8 -> tile 4', await focused(page) === 3);
  await key(page, R); check('RIGHT from end of row 1 continues to row 2', await focused(page) === 4);
  await key(page, L); check('LEFT from start of row 2 goes back to row 1 end', await focused(page) === 3);
  const capOk = await page.$eval('#capName', e => e.textContent) === 'ZEE5';
  check('caption follows focus', capOk);

  /* ---- 3. Enter to launch ---- */
  await key(page, L); // ZEE5 -> Netflix (index 2)
  await wait(250);
  await page.screenshot({ path: OUT + '/preview-focused.png' });
  await key(page, OK); await wait(50);
  check('ENTER on Netflix launches org.tizen.netflix-app', (await page.evaluate(() => __log.launches))[0] === 'org.tizen.netflix-app', JSON.stringify(await page.evaluate(() => __log.launches)));
  await key(page, OK); await wait(50);
  check('double ENTER is debounced (one launch)', (await page.evaluate(() => __log.launches)).length === 1);
  await wait(1300);
  await page.evaluate(() => __log.launches = []);
  await key(page, 50); await wait(50); // '2' -> YouTube
  check('number key 2 launches YouTube (cobalt id preferred)', (await page.evaluate(() => __log.launches))[0] === 'com.samsung.tv.cobalt-yt');
  await wait(1300); await page.evaluate(() => __log.launches = []);
  await key(page, 54); await wait(50); // '6' -> JioHotstar via name match
  check('JioHotstar resolved by name match', (await page.evaluate(() => __log.launches))[0] === 'HsJio00001.JioHotstar');
  await wait(1300); await page.evaluate(() => __log.launches = []);
  await key(page, 52); await wait(50);
  check('ZEE5 resolved by name when store ID absent', (await page.evaluate(() => __log.launches))[0] === 'Zx9ZEE5aaa.ZEE5');
  await wait(1300); await page.evaluate(() => __log.launches = []);
  await key(page, 53); await wait(50);
  check('Prime Video uses real app, not the -dummy stub', (await page.evaluate(() => __log.launches))[0] === 'org.tizen.primevideo');
  await wait(1300);

  /* ---- 4. failed launch -> error toast ---- */
  await key(page, 55); await wait(100); // Sony LIV not installed
  const t = await page.$eval('#toast', e => ({ hidden: e.classList.contains('hidden'), err: e.classList.contains('error'), txt: e.textContent }));
  check('failed launch shows error toast', !t.hidden && t.err && /Sony LIV/.test(t.txt), JSON.stringify(t));
  await page.screenshot({ path: OUT + '/preview-error.png' });

  /* ---- 5. Back handling ---- */
  await wait(1300);
  for (let i = 0; i < 3; i++) await key(page, BACK);
  const st = await page.evaluate(() => ({ exit: __log.exit, vis: getComputedStyle(document.getElementById('home')).visibility }));
  check('BACK on home does not exit/hide the app', st.exit === 0 && st.vis === 'visible');

  /* ---- 6. App list overlay ---- */
  await key(page, BLUE); await wait(50);
  check('BLUE opens installed-app list', !(await page.$eval('#overlay', e => e.classList.contains('hidden'))));
  check('opening a pop-up hides any toast', await page.$eval('#toast', e => e.classList.contains('hidden')));
  check('app list hides hidden system stubs', !(await page.$eval('#ovBody', e => e.textContent.includes('primevideo-dummy'))));
  await page.screenshot({ path: OUT + '/preview-applist.png' });
  await key(page, BACK); await wait(20);
  check('BACK closes overlay', await page.$eval('#overlay', e => e.classList.contains('hidden')));
  await key(page, R); check('navigation works after overlay closes', (await focused(page)) >= 0);

  /* ---- 7. HDMI single input ---- */
  await key(page, 49); await wait(60);
  const tv = await page.evaluate(() => ({ log: __log.tv, mode: document.body.classList.contains('tvmode') }));
  check('HDMI tile sets source + shows full-screen TV window', tv.mode && tv.log[0] === 'set:1' && tv.log[1] === 'show:0px,0px,1920px,1080px', JSON.stringify(tv));
  const before = (await page.evaluate(() => __log.launches)).length; const fBefore = await focused(page);
  await key(page, R); await key(page, OK); await key(page, 51); await wait(30);
  check('keys ignored while HDMI showing (except BACK)', (await page.evaluate(() => __log.launches)).length === before && await focused(page) === fBefore);
  await key(page, BACK); await wait(20);
  const back = await page.evaluate(() => ({ hide: __log.hide, mode: document.body.classList.contains('tvmode'), exit: __log.exit }));
  check('BACK from HDMI hides TV window and returns home', back.hide === 1 && !back.mode && back.exit === 0);
  check('zero console errors (main run)', errors.length === 0, JSON.stringify(errors));
  await page.close();

  /* ---- 8. HDMI multiple inputs -> picker ---- */
  ({ page, errors } = await open(browser, { hdmi: [{ type: 'HDMI', number: 1 }, { type: 'TV', number: 1 }, { type: 'HDMI', number: 3 }] }));
  await key(page, OK); await wait(60);
  const btns = await page.$$eval('#ovButtons .btn', b => b.map(x => x.textContent));
  check('multiple HDMI shows picker', JSON.stringify(btns) === '["HDMI 1","HDMI 3","Cancel"]', JSON.stringify(btns));
  await key(page, R); await key(page, OK); await wait(60);
  check('picking HDMI 3 sets that source', (await page.evaluate(() => __log.tv))[0] === 'set:3');
  await key(page, BACK);
  check('zero console errors (multi-HDMI run)', errors.length === 0, JSON.stringify(errors));
  await page.close();

  /* ---- 9. No HDMI connected -> falls back to native, then manual help ---- */
  ({ page, errors } = await open(browser, { hdmi: [] }));
  await key(page, OK); await wait(150);
  const nat = await page.evaluate(() => __log.launches);
  check('no HDMI -> tries native Source apps', nat[0] === 'com.samsung.tv.coba.source', JSON.stringify(nat));
  const msg = await page.$eval('#ovBody', e => e.textContent);
  check('then shows SOURCE-button help with reason', /SOURCE/.test(msg) && /No HDMI device/.test(msg), msg);
  await key(page, BACK);
  check('zero console errors (no-HDMI run)', errors.length === 0, JSON.stringify(errors));
  await page.close();

  /* ---- 10. all candidate IDs fail -> toast ---- */
  ({ page, errors } = await open(browser, { failIds: ['org.tizen.netflix-app'] }));
  await key(page, 51); await wait(150);
  const nl = await page.evaluate(() => __log.launches);
  check('Netflix falls back through all candidate IDs', nl.length === 4 && nl[0] === 'org.tizen.netflix-app', JSON.stringify(nl));
  check('then shows error toast', await page.$eval('#toast', e => e.classList.contains('error') && !e.classList.contains('hidden')));
  check('zero console errors (fail run; warnings allowed)', errors.length === 0, JSON.stringify(errors));
  await page.close();

  /* ---- 11. desktop preview without tizen ---- */
  ({ page, errors } = await open(browser, null, false));
  await wait(300); await page.screenshot({ path: OUT + '/preview.png' });
  await key(page, R); await key(page, OK); await wait(30);
  check('runs without tizen object (preview mode), no errors', errors.length === 0 && await focused(page) === 1, JSON.stringify(errors));
  await page.close();

  await browser.close();
  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

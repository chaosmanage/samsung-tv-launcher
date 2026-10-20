# Clean Home – ad-free launcher for Samsung Tizen TVs

A lightweight Tizen web app (HTML/CSS/JS, no frameworks, no network calls)
that acts as a clean home screen. Target: Samsung UA43DU7660KLXL (2024, Tizen).
Non-developer install guide: **INSTALL.md**.

## Files
| Path | What |
|---|---|
| `config.xml` | Tizen widget manifest (id `KsHome0001.CleanHome`, profile `tv-samsung`) |
| `index.html`, `css/style.css`, `js/main.js` | App |
| `js/apps.js` | **Tile list + app IDs + HDMI settings: edit here** |
| `icon.png` | 512×512 app icon |
| `.project`, `.tproject` | Lets Tizen Studio import the folder as a TV web project |
| `preview*.png` | Headless 1920×1080 screenshots |
| `tests/qa-test.js` | Headless QA suite (Puppeteer + stubbed `tizen` APIs) |
| `dist/CleanHome-TEST-SIGNED-do-not-install.wgt` | Packaged with a throwaway Tizen test cert to validate the package. **Won't install on a retail Samsung TV**; re-sign with a Samsung certificate (INSTALL.md Step 5–6). |

## How app launching works
1. On start (and whenever the app comes back to the foreground) it calls
   `tizen.application.getAppsInfo()` and, for each tile, picks the first ID in
   `ids` that is installed, else the first installed app whose **name** matches
   `match` (system stubs like `*-dummy`/services are skipped).
2. `tizen.application.launch(id)`; on error it tries the next candidate ID;
   when all fail, a red toast appears: "Couldn't open X…".
3. Blue button shows the TV's installed apps with their real IDs.

## HDMI
1. `tizen.systeminfo.getPropertyValue('VIDEOSOURCE')` → connected HDMI
   sources (picker if more than one) → `tizen.tvwindow.setSource()` +
   `tizen.tvwindow.show()` full screen (1920×1080). BACK hides it.
2. If that's unavailable/refused: launch the TV's own source/viewer app
   (`com.samsung.tv.coba.source`, `org.tizen.tv-viewer`, `org.tizen.SMSourceAPP`).
3. Else: a pop-up telling the user to press SOURCE.

## Privileges (all public level, so a Samsung "Public" distributor cert works)
`application.launch`, `application.info`, `tv.inputdevice`, `tv.window`,
`system`, `fullscreen`.

## QA
```
cd tests && npm i puppeteer-core && node qa-test.js   # uses /usr/bin/google-chrome
```

## Multitasking / "Autorun Last App" (v1.1.0)
- `config.xml`: `background-support="enable"`, `<tizen:app-control>` with
  `<tizen:src name="index.html" reload="disable"/>` and the
  `http://samsung.com/appcontrol/operation/eden_resume` operation, plus
  metadata `http://samsung.com/tv/metadata/multitasking.support=true`.
- `main.js`: on `visibilitychange` hidden → leave HDMI view, close pop-ups/toasts;
  on resume → same cleanup, re-focus (`RESUME_FOCUS` in `js/apps.js`: `'last'`/`'first'`),
  refresh clock, re-read installed apps.
- Rebuild the PDF guide: `python3 docs/build-pdf.py` (needs `markdown` + Chrome).

# Changelog

All notable changes to Clean Home (`KsHome0001.CleanHome`). Install/upgrade steps: [docs/UPDATE.md](docs/UPDATE.md).

## 1.2.9 (2026-10-20) — debug build installed for testing, cold-boot fix NOT yet confirmed

### Fixed (pending a plug-pull test)
- **Cold-boot black screen with the toggle On.** The 1.2.8 theory (a toggle-Off blackout) did not explain it:
  Kunal still saw a black screen on a plug-pull boot with *Use Clean Home as Home screen* On. Debug logs show
  `startup_appid` launches Clean Home in the **background** on a cold boot (`__K_BG_LAUNCH=enable`,
  `entry_point=cold_booting`, no caller). Sometimes the system raises it a few seconds later, and sometimes
  nothing does, so the page stays behind a black screen until a remote power cycle relaunches it. The black
  screen is not the page itself. Clean Home was never brought to the front.
  - Toggle **On**: on a cold-boot launch, Clean Home now raises itself (`tizen.application.launch` on its own
    app id) if it isn't visible and focused after 1.5 s, and tries once more at 4 s. It makes at most 2 attempts.
  - Toggle **Off**: on a cold-boot launch, Clean Home hands off to Samsung Home, so the TV boots into Samsung
    Home. If that launch fails, Clean Home raises itself instead of staying black.
  - Home-key presses (`entry_point=smarthub_key`) and app-list launches don't carry `cold_booting` and are
    unchanged. This only runs once, at page start. No boot or startup vconfs were changed.
- This build has debug beacons on (logging to the PC). It hasn't been plug-pull tested yet. The 1.2.6 and 1.2.8
  cold-boot fixes were each reported as fixed before they were tested on a real cold boot, and neither fixed it.

## 1.2.8 (2026-10-20)

### Removed
- **TV Plus → YouTube redirect removed completely.** 1.2.7's in-app redirect force-launched YouTube over and
  over (it saw TV Plus still running in the background) and missed presses from Netflix (Clean Home is suspended
  there). It shipped without proper testing. The 1.2.6 shell watcher, the PC re-arm task and `tvplus-watcher/`
  are removed too. TV Plus vconfs and appsvc state were checked against the original baseline.
  See [docs/TVPLUS-REMAP-POSTMORTEM.md](docs/TVPLUS-REMAP-POSTMORTEM.md).

### Fixed
- **Cold-boot black screen (further fix).** With *Use Clean Home as Home screen* Off, hiding the page adds the
  black handoff class with no handoff timestamp, so the 1.2.6 safety timer never cleared it. A plug-pull boot hides
  and re-shows Clean Home while tv-viewer and the web runtime settle, so it stayed black until a remote power cycle.
  Every blackout now has a timestamp. The page is shown again 1.5 s after it becomes visible if nothing handed off.
  In the first 30 s after load, it is shown even if the page still reports hidden. A real Home press with the toggle
  Off still hands off to Samsung Home with no flash.

## 1.2.7 (2026-10-20) — withdrawn, see 1.2.8

### Added
- **TV Plus button opens YouTube** (Settings → Samsung, default On). While Clean Home is in the
  background (`background-support` already enabled), it watches running apps via
  `getAppsContext` (~150 ms while hidden) and on blur/hide. When
  `HEPsqFNie0.tvplusstandalone` newly appears, it launches YouTube and tries to kill HEP.
  Works with the PC off (Clean Home is `startup_appid`). Toggle-Off Home handoff unchanged.
- `FrameDevice.getRunningMap` / `killApp` helpers.

### Changed
- PC Task Scheduler re-arm is **not required**; shell `tvplus-watcher/` remains optional/manual only.
- Widget version 1.2.7.

## 1.2.6 (2026-10-20)

### Fixed
- **Cold-boot black screen** (plug-pull → all black until remote power cycle). With *Use Clean Home
  as Home screen* Off, the 1.2.4 head handoff treated bare `operation/main` as a Home press.
  Cold boot / `startup_appid` also uses `operation/main`, so Clean Home stayed black and the
  old safety un-black required `document.hasFocus()` (often false at boot). Handoff now only
  runs for `entry_point=smarthub_key` (real Home key). Safety clears `ch-handoff` after ~1.5 s
  without requiring focus; an extra 1 s clear runs when `__CH_EARLY` was set. Toggle-Off
  no-flash for real Home presses is unchanged.
- Docs: cold-boot notes in README.

### Added
- **`tvplus-watcher/`** — non-root resident loop that redirects the Samsung TV Plus button to
  YouTube (polls `memory/appfw/current_fullscreen_appid`, launches YouTube, kills HEP).
  Samsung UEP + web-app limits mean it does not survive reboot; use
  `scripts/windows/tvplus_watch_rearm.ps1` on the PC to re-arm when the TV is online.
  Does not touch Home originals or appsvc aliases.

## 1.2.5 (2026-10-20)

### Added
- **Next Bing photo** (Settings → Background, shown when Bing daily is on). Shows a different recent Bing
  photo with OK on the remote. Order: Bing India (`en-IN`, `idx=0` and `idx=7`, about 15 days), then other Bing
  markets (en-US, en-GB, ja-JP, de-DE, fr-FR, en-CA, en-AU, es-ES, it-IT, pt-BR), de-duplicated by image name
  (35+ photos). One small JSON request at a time, only when you ask for more. Bing only, no other sources.
- **Back to today's photo** in the same section.
- The new photo is preloaded and only swapped in once it has loaded. If Bing or the image fails, the current
  wallpaper stays and the row says "Current photo kept". Up to 4 broken images are skipped per press.
- A manual pick persists across restarts **until the date changes**, then today's Bing photo replaces it.
- Daily refresh now also preloads today's image before showing it (no blank frame), and yesterday's photo
  stays on screen until today's has loaded.
- Debug beacon commands `bingnext` / `bingtoday` and `bing-pool` / `bing-next` log events.
- Tests: `scripts/_bing-next.mjs` (mocked Bing, keys only: skip broken image, pool growth across markets,
  persistence, outage keeps current, back to today, new day resets). Screenshot renderer `scripts/_screenshots.mjs`.

### Changed
- Docs rewritten: README (features, screenshots, remote keys, Bing behaviour, restore, FAQ),
  `docs/INSTALL.md` (full first install), new `docs/UPDATE.md`, this root `CHANGELOG.md`.
  Root `INSTALL.md` now points to `docs/`.
- `scripts/native-home/run.py` normalises CRLF → LF before pushing the `.sh` probe (Windows checkouts broke bash
  on the TV); `.gitattributes` keeps `*.sh` as LF.

### Verified on the real TV
- **Toggle-Off Home flash fix (1.2.4 hotfix 3, commit 5dc6c45) confirmed by Kunal on the UA43DU7660KLXL**
  (20 Oct 2026, ~21:10 IST): with *Use Clean Home as Home screen* Off, Home goes to Samsung Home with no
  Clean Home flash. Debug-log timings on that build (20:56:33–20:56:51 IST, handoff on the `visible` hook while
  the screen stays black): Samsung Home in front 642 / 357 / 576 ms (launch call 233 / 114 / 203 ms).
  Kunal's test presses 21:13:57–21:14:12 IST: 345 / 101 / 167 / 392 / 329 ms (launch call 176 / 107 / 143 / 214 / 101 ms).
- **1.2.5 installed on the TV** (21:16 IST debug build to verify, 21:17 IST release build, pid 3421):
  prefs kept on upgrade (dock 9 apps incl. Spotify, *Use Clean Home as Home screen* Off as Kunal left it,
  Bing daily on). On the TV, `bingnext` loaded the en-IN pool (8) and switched to the next photo
  (MahaNavami2026) in under a second; `bingtoday` switched back to today's (BrownSloth).

### Unchanged on purpose
- Visuals elsewhere: clock and header text stay white, dock, glass and fonts as in 1.2.4 hotfix 3.
- Storage: still one small `cleanhome.bing` value (now `{url, today, pick, date}`); images are never written to disk.

## 1.2.4 (2026-10-20), hotfix 1–3
- Hotfix 3: Home-key handoff decided in an early `<head>` script with a black screen, so toggle Off goes to
  Samsung Home without a Clean Home flash (**verified on the real TV by Kunal, 20 Oct 2026**). Clock and header text back to white. Header lens keeps the 1.2.3 glass.
- Hotfix 2: handoff evaluated on every entry hook (start, appcontrol, focus, visible, pageshow, resume),
  de-duplicated by `__K_APP_LAUNCH_START_TIME`; `scripts/_replay-home.js` replays real TV launch requests.
- Hotfix 1: Home key detected by `entry_point=smarthub_key`; app-row launches never redirect; prefs never reset on recovery launch.
- Solid (no-blur) glass by default for speed; optional preblur A/B mode.
- Settings → Samsung → **Use Clean Home as Home screen** toggle. Back on the main screen does nothing.
- Details: [docs/CHANGELOG-1.2.4.md](docs/CHANGELOG-1.2.4.md).

## 1.2.3
- App picker (Settings → Apps on Home), dynamic TV icons, one wallpaper source everywhere, Home returns to the
  main screen from Settings, Samsung Home moved to the header. Hi-res JioHotstar / Sony LIV, Samsung Internet
  logo, Spotify, focused-app label. Details: [docs/CHANGELOG-1.2.3.md](docs/CHANGELOG-1.2.3.md).

## 1.2.2
- Bundled dock icons, glass dock follows the Bing wallpaper, HDMI via source app, bolder clock/weather, new app icon.

## 1.2.1
- Samsung Home and HDMI fixes, consistent icon framing, bigger clock with AM/PM, weather icon, Bing daily
  wallpaper (no device bloat), faster launches.

## 1.2.0
- Rebuilt on CleanFrame (MIT, Nathan Clark): real app icons, Wakad weather, native Home-button takeover + restore.

## 1.1.0 and 1.0
- First custom launcher (8 tiles, D-pad navigation, HDMI) and Autorun Last App support.

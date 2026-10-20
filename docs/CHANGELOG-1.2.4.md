# Clean Home 1.2.4

## Home toggle (P0)
- Settings → Samsung → **Use Clean Home as Home screen** On/Off.
- Soft preference in `localStorage` (`cleanhome.home.v1.useAsHome`, default On).
- **App-list launches always show Clean Home** (operation/default). Never redirects away.
- When Off and the launch looks like a Home-key / `operation/main` (or eden_resume) takeover,
  Clean Home hands off to `com.samsung.tv.csfs` and exits.
- Native Home vconf (`db/appfw/home_appid`, etc.) is still applied/restored from the PC via
  `scripts/native-home` / `tvwork/run_mode.py` (same mechanism as 1.2.3). The in-app toggle
  cannot write vconf from the web app.

## Back on main
- Back on the main dock no longer opens “Leave Home?”. It stays on Clean Home.
- Back inside Settings / All apps / pickers still goes up one level.
- Samsung Home is only via the top-right header control.

## Settings layout
- Appearance rows scroll above the footer hint; focused rows scroll into view.
- Shorter Daily-photo reason; wrapping names/descriptions; preview pane clip adjusted.

## TV settings
- `FrameDevice.settings` tries: `com.samsung.tv.coba.setting`, `quicksetting`, `org.tizen.menu`,
  `homesetting`, `quickpanel`, `floating-menu`, `broadcastingmenu`. Live verification required.

## Performance
- **Default glass = solid** (`cleanhome.glass` = `solid`): no blurred images at all, plain translucent fills for dock, list fields and Settings. `preblur` mode is still available (debug `glass-preblur`) for A/B timing.
- Debug `perfrun:dock|settings|bg` logs sync ms and next-frame ms (double rAF) per focus move.
- Glass surfaces use **one in-memory pre-blurred 480×270 JPEG** (canvas) per wallpaper change
  instead of CSS `filter: blur()` on full-res Bing/bundled images.
- Arrow key-repeat coalesced (~40ms); `perf` beacon logs ms per key when debug is on.
- Dropped CSS blur filters and some moving-element box-shadows.

## TV Plus remapping
- Investigation: package `com.samsung.tv.tvplus` exists. No matching writable vconf key found
  via SDK uid 901 (unlike Home). Documented as not available without a discovered key/root.

## Icons
- Carries 1.2.3 unified marks (Spotify, Hotstar, Sony LIV, Samsung Internet, SmartThings).

## 1.2.4 hotfix (20 Oct 2026, 20:35 IST): Home toggle and prefs persistence
- **Home key detection** now uses the data the TV actually sends. Remote Home = `entry_point=smarthub_key` (caller tvctx-manager).
  `LaunchFromHome=1` / `Entry=launcher` (opening Clean Home from Samsung Home's app row), sdb/app-list launches,
  `__K_EX_RECOVERY_LAUNCH` and return-to-app launches never hand off. `operation/main` still hands off.
- **Handoff no longer exits Clean Home.** Exiting the registered Home app made the TV start a recovery relaunch.
  The handoff now only brings up Samsung Home (com.samsung.tv.csfs).
- **Prefs no longer reset.** Boot never writes defaults over storage when the read comes back empty; it retries the read
  instead. Every save is mirrored to `cleanhome.home.v1.bak` / `cleanhome.homepref.bak` and read back, and saves are synchronous localStorage writes.
- Debug-only commands: `adddock:<appId>`, `exit`. Removed `simhome`.

## 1.2.4 hotfix 2 (20 Oct 2026, 20:45 IST): Home key while Clean Home is already running
- Kunal's real test (20:37:44): with Clean Home in front, a Home press arrives ONLY as a window `focus` event whose
  requested app control is the new `entry_point=smarthub_key` request. The handoff rule now runs on every entry hook
  (start, appcontrol, focus, visible, webkitvisible, pageshow, resume) with a fresh `getRequestedAppControl()`.
- One press = one handoff: requests are de-duplicated by `__K_APP_LAUNCH_START_TIME` (or the full request), so coming
  back from Samsung Home with the same stale request never bounces, and app-row/app-list launches always show Clean Home.
- Samsung Home launches before logging/rendering. On a cold Home-key launch it runs before the first paint.
  Fallback chain: com.samsung.tv.csfs → com.samsung.tv.coba.newhome → coba.edenview. org.tizen.menu (TV settings) was removed from this chain.
- `scripts/_replay-home.js` replays the logged real requests through the shipped code (9/9 PASS).
- TV Plus key: the system handles it before apps see it. Pressing it showed Samsung's "You have disabled Samsung TV Plus"
  popup, and Clean Home got only a `blur` (no key event). Samsung support says app buttons can't be reprogrammed.

## 1.2.4 hotfix 3 (20 Oct 2026, 20:56 IST): Home flash, white clock/header, header glass
- **Home-key flash minimised (toggle Off).** An inline `<script>` at the top of `<head>` reads `cleanhome.homepref` and the launch
  request synchronously. On `entry_point=smarthub_key` / `operation/main` (never `LaunchFromHome=1`, `Entry=launcher` or recovery) it blacks out the page
  and launches com.samsung.tv.csfs (fallback coba.newhome) before CSS, fonts, images or main.js load. main.js de-dupes the same request via `__CH_EARLY`.
  When Clean Home is already running, the handoff blacks out the UI before launching. With the toggle Off, the page also turns black when it goes to the background,
  so a resume never shows a stale frame. Any legitimate show (app list, app row, back from Samsung Home) restores it at the first entry hook. A 3 s safety timer restores it if Samsung Home never takes focus.
  New beacon events: `home-handoff-front` (ms from handoff to Samsung Home taking focus), `home-handoff-show`.
- **Clock and header buttons are white** (`#fff`, shadow `0 2px 6px rgba(0,0,0,.45)` like the weather line) on photo backgrounds, including icons, PM and the focus label.
  Cause: the bundled wallpaper's adaptive palette ("peaks": #274359 / #3f5b73) was applied while the Bing photo was shown.
- **Header focus lens keeps its 1.2.3 glass** (sharp photo + the 1.2.3 CSS blur on that small static element only). Dock, Settings and sheets stay blur-free (solid).

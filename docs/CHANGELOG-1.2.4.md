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
- Glass surfaces use **one in-memory pre-blurred 480×270 JPEG** (canvas) per wallpaper change
  instead of CSS `filter: blur()` on full-res Bing/bundled images.
- Arrow key-repeat coalesced (~40ms); `perf` beacon logs ms per key when debug is on.
- Dropped CSS blur filters and some moving-element box-shadows.

## TV Plus remapping
- Investigation: package `com.samsung.tv.tvplus` exists. No matching writable vconf key found
  via SDK uid 901 (unlike Home). Documented as not available without a discovered key/root.

## Icons
- Carries 1.2.3 unified marks (Spotify, Hotstar, Sony LIV, Samsung Internet, SmartThings).

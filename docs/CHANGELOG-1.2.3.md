# Clean Home 1.2.3 — update notes

## Safety (P0)
- Removed the auto-redirect to Smart Hub that could lock you out. Clean Home always opens from the Apps list.
  The legacy `useAsHome` key is cleared on startup. The "soft Home" toggle was dropped.
- **Home inside sub-screens:** pressing Home while Settings, All apps, Apps on Home or any overlay is open now resets
  to the main home (`appcontrol` + `visibilitychange` handlers → `resetToMain`).

## Dock and icons — CleanFrame unified look
- Dock marks are CleanFrame-style **single-ink marks** (white, CSS `mask-image`, optical sizing from `metrics.js`), all from
  high-res or vector sources. See `docs/ICON-SOURCES.md`. JioHotstar (official 2025 star), Sony LIV (vector SONY + liv),
  Internet (official Samsung Internet 2025 planet), SmartThings (official glyph), Spotify (Simple Icons).
- Why not the TV's `iconPath` for these: on this TV, YouTube (`9Ur5IzDKqV.TizenYouTube`) and JioHotstar (`fiZNCxMH9Y.Hotstar`)
  ship the generic 117×117 Tizen pinwheel as their icon. Sony LIV ships a 1920×1080 banner, `org.tizen.browser` and
  Prime Video icon files are missing, and `knox-browser` is "Workspace Browser" (Windows logo). These were logged from inside the app.
- Spotify / SmartThings and other known apps get the matching mark automatically. Other apps you add use the TV's own `iconPath` **in the same slot** (no backplate). Placeholder icons (dark and blue Tizen
  pinwheels) are detected with a 16×16 RGBA fingerprint and shown as an ink monogram instead.
- Equal slots: every dock item has the same width, height and pitch, whatever the app count.
- Labels follow CleanFrame "icons" mode: the focused app's name sits under the dock. All apps grid: 96px icon, label 18px below, never overlapping.
- Dock glass restored to CleanFrame's light treatment (live blur 16px, CleanFrame veil) instead of a heavy frosted slab.

## Header
- **Samsung Home** moved from the dock to the header: `Samsung Home · All apps · Settings`. It opens `com.samsung.tv.csfs`
  (fallbacks `org.tizen.menu`, `edenview`). Stored docks containing the old Samsung Home tile are migrated automatically.
- Art Mode stays removed (no Art Mode on Crystal UHD). HDMI opens `org.tizen.tv-viewer`.

## App picker
- Settings → Apps on Home lists **every launchable installed app** (`getAppsInfo`, consumer allowlist + filters) with real icons.
  Add / remove / reorder (max 9), saved in one small localStorage key. HDMI is a special tile.
- Internet now opens the real Samsung Internet (`org.tizen.browser`), not Workspace Browser.

## Weather
- Fixed `29Â°` mojibake: `main.js` is ASCII-only (`\u00B0`), and the Windows build script now writes UTF-8 without a BOM.
- The location line shows the full **"Wakad, Pune"** (no truncation).

## Wallpaper — one source of truth
- `activeWallpaperSrc()` = today's Bing URL (Daily photo on) or the chosen bundled wallpaper. `applyWallpaperEverywhere()`
  sets that **same src** on all 7 consumers: home photo, dock mat, Settings / All apps backdrop (`sheet-bg`) and the 4 glass fields.
  Glass = CSS blur of that src. No more stock coastal panels behind Bing.
- Pre-blurred stock material JPEGs (`assets/materials/`, `*-panel.jpg`, 4.7 MB+) were deleted from the package.
- Picking a wallpaper turns Daily Bing off. No image files are written to the TV; Bing stays a live URL plus one small localStorage record.

## Launcher icon
- App-list icon is the 256×256 house mark (`icon.png`), not "F".

## Tooling
- `scripts/windows/build_install.ps1` (package + push + install; `-Debug` enables the LAN beacon) and
  `scripts/windows/chdebug_server.py` (beacon + `/cmd` test commands). Note: the command file is `chdebug-cmd.txt`
  (a `.cmd` file name was being blocked on Windows).

## Home key and Settings
- Extra return-to-home hooks: `webkitvisibilitychange`, `pageshow`, and window `focus` after more than 1s away (only when a sub-screen is open).
  The debug beacon logs every launch/resume hook with the requested app control (caller, operation, data) so that a
  real Home-key press can be told apart from an app-list launch.
- Known limitation (from TV tests): when Clean Home is already in the foreground, a relaunch (`0 execute`) delivers **no**
  event to the page, so Home pressed inside Settings may still do nothing on this firmware. See the test table.

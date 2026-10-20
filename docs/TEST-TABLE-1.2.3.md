# Clean Home v1.2.3 — live TV test table (UA43DU7660KLXL)

Timezone: Asia/Calcutta (IST). Tested 2026-10-20 ~18:25–18:30 IST.

Screenshot note: `sdb capture` / `0 screenshot` / `0 smartcapture` are unavailable on this TV (shell returns closed / empty). Evidence is aul_test is_run / get_pid / get_status via reverse-TCP probe, plus unpacked .wgt and installed filesystem checks.

| Feature | How tested on TV | Evidence / result |
|---|---|---|
| P0 Lockout fix (always open from app list) | Uninstall+reinstall v1.2.3; `0 execute KsHome0001.CleanHome`; wait ~5s; aul probe | **PASS** — `is_run` yes; `get_pid=2969`; `status: 2(STATUS_FOCUS)`. No redirect to Smart Hub. Soft toggle / `enforceHomePreference` removed; legacy `useAsHome:false` cleared on startup. |
| P0 Home key → Clean Home | Re-applied Control.cs after reinstall reset home to csfs; `run_mode.py apply` then `query` | **PASS** — `Home` / `home_appid` / `startup_appid` = `KsHome0001.CleanHome`. Soft Home Off-forward **DROPPED** (could not safely distinguish Home-key vs app-list launch). |
| P1 App list icon (not “F”) | Unpacked signed wgt `icon.png`; device `shared/res/KsHome0001.CleanHome.png`; md5 match | **PASS (device evidence)** — installed launcher icon is 2112-byte house PNG (md5 `70b2e92b…` = wgt `icon.png`). config.xml `<icon src="icon.png"/>`. Full uninstall clears cache. **Cannot** visually confirm Samsung Apps UI without screen capture — user should check app list. Overlay toast shows `iconPath` for ~8s on launch. |
| P2 Official dock logos + labels | Built PNG squircles; Playwright TV-scale previews; Read PNGs | **PASS (preview)** — preview paths below; labels below icons, no overlap. Art Mode absent. Live dock look needs user eyes (no TV screenshot). |
| P3 HDMI | `0 execute org.tizen.tv-viewer` then aul | **PASS** — tv-viewer `STATUS_FOCUS`; Clean Home went `STATUS_BG`. App launches tv-viewer first (then sub1, SMSourceAPP). |
| P3 Art Mode | Prior aul probes of art-app / coba.art / home.art / ambientfte | **REMOVED** — no Art Mode UI on Crystal UHD; button removed from `utils()`. |
| Version / package | config.xml + package.json + signed wgt | **PASS** — v1.2.3 signed with MyTV; installed via `vd_appinstall`. |

## Paths
- Preview (full): `docs/images/cleanhome-preview-v123.png`
- Dock strip (scaled): `docs/images/cleanhome-dock-preview-v123.png`
- Dock true-scale: `docs/images/cleanhome-dock-true-scale-v123.png`
- Installed launcher icon (pulled): `docs/images/installed-launcher-icon-v123.png`
- Signed wgt on PC: `C:\Users\Kunal\CleanHome\dist\Clean Home.wgt`
- Repo zip: `/workspace/launcher-repo.zip`

## Final run: Tue 20 Oct 2026, 19:31–19:35 IST, UA43DU7660KLXL (192.168.1.136)

| # | Test | Result | Evidence |
|---|---|---|---|
| F1 | Debug build installs and launches | PASS | `app_id[KsHome0001.CleanHome] install completed`; `0 execute` -> pid 2559 (19:31:37) |
| F2 | Dock marks load on TV (all single-ink) | PASS | beacon `marks`: hdmi.png, youtube.svg, netflix.svg, zee5.png, primevideo.svg, **hotstar.png, sonyliv.svg, browser.png, spotify.svg** |
| F3 | Spotify (user-added `rJeHak5zRg.Spotify`) gets the unified mark | PASS | beacon `home` includes `rJeHak5zRg.Spotify`; mark `spotify:spotify.svg` |
| F4 | Equal spacing with 9 items incl. added app | PASS | beacon `pitch` = 112,296,…,1584 (constant 184px step) |
| F5 | Focus label under the focused tile only, follows focus | PASS | `focusName` "YouTube @x384 y932 (markBottom 864)" then "JioHotstar @x1120 y932"; label top 68px under the mark bottom, centred on the tile |
| F6 | Header has Samsung Home + All apps + Settings | PASS | beacon `header` = util.samsunghome, util.apps, util.settings |
| F7 | Wallpaper single source (Bing) on all surfaces | PASS | beacon `walls`: photo/mat/bg/field/fieldAlt/utility/utilityAlt all = Bing BrownSloth URL |
| F8 | Weather shows full "Wakad, Pune" | PASS | caption `…Clear nightWakad, Pune` |
| F9 | Home from Settings (simulated `0 execute` while in Settings) | **FAIL / platform limit** | after `0 execute` at 19:33:01 the page received **no** appcontrol/visibility/pageshow/focus event (only real remote keys). `getSupportedKeys` exposes Menu/Info/Exit/Source only, no Home. Injection tools `input_keyevent` are permission-denied. |
| F10 | Release build installed and running | PASS | install completed 19:34; `aul_test is_run` = running; `get_status` = 2 (STATUS_FOCUS); pid 1661; config `version="1.2.3"` |
| F11 | Visual crispness of new marks on panel | PREVIEW ONLY | No screen capture on this TV; `docs/previews/dock-1.2.3-final.png` (Chromium render of the same files). Needs a photo from Kunal. |

Note: Kunal was using the remote during this run (ArrowUp/Enter key events in the log), so the view values after the `right` commands reflect his navigation, not only the test.

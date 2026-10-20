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

# Clean Home 1.2.4 test table

Times in Asia/Calcutta (IST). TV: UA43DU7660KLXL.

## Code / preview (box, 20 Oct 2026 ~19:50–19:57 IST)

| # | Test | Result | Evidence |
|---|---|---|---|
| C1 | Version 1.2.4 in package.json + config.xml | PASS | both say 1.2.4; `scripts/check.py` OK |
| C2 | Home toggle UI in Settings → Samsung | PASS | Playwright: rows include “Use Clean Home as Home screen On — …” |
| C3 | Soft handoff never redirects operation/default | PASS (code) | `isHomeTriggeredLaunch` returns false for `/operation/default` |
| C4 | Back on main does not open Leave prompt | PASS (code) | `openMessage('leave')` removed from `V.home` / list home |
| C5 | Settings layout no overlaps at 1080p | PASS | `scripts/_settings-overlap.mjs` → **PASS all pages** (clipBottom ≤ footerY) |
| C6 | Pre-blur glass path present | PASS (code) | `paintGlass` + `is-preblur`; CSS live-glass filters removed |
| C7 | Git push | PASS | `b22eea713d1f8b38833c782ec88db17873a9d9eb` on `main` |

## Live TV (blocked — sdb cannot connect as of 19:57 IST)

| # | Test | Result | Evidence / what Kunal should do |
|---|---|---|---|
| T1 | Install 1.2.4 signed build; `aul is_run` + FOCUS | **BLOCKED** | Re-enable Developer Mode / IP; agent will reinstall |
| T2 | Toggle Off → Home → Samsung Home; app-list still opens Clean Home | **BLOCKED** | After install: Settings→Samsung→toggle Off, press Home; then open Clean Home from apps |
| T3 | Toggle On → Home → Clean Home | **BLOCKED** | Toggle On, press Home |
| T4 | TV settings opens system settings (FOCUS) | **BLOCKED** | Settings→Samsung→TV settings; confirm system UI |
| T5 | Back on main stays on Clean Home (no prompt) | **BLOCKED** | Press Back on dock |
| T6 | Perf: ms/key before vs after via debug `perf` events | **BLOCKED** | Debug build + beacon; move focus in Settings |
| T7 | TV Plus → YouTube via vconf | **FAIL (no key found)** | `com.samsung.tv.tvplus` exists; no writable vconf key under SDK uid 901. Needs Kunal OK to dig further or abandon |

## Mechanism notes
- **Home toggle:** soft `localStorage` flag. Native Home was already `KsHome0001.CleanHome` on last query (`db/appfw/home_appid`). Off = hand off Home-triggered launches to `com.samsung.tv.csfs`. On = stay. PC `run_mode.py apply/restore` still owns vconf.
- **TV Plus:** not remappable with the Home-style vconf method found so far.

## Hotfix live results (20 Oct 2026, IST, UA43DU7660 192.168.1.136)
| Test | Result | Evidence |
|---|---|---|
| Detection rule vs real launch data (Home key / app row / sdb / recovery / return) | PASS | only smarthub_key and operation/main hand off (node check on logged data) |
| Spotify restored to dock | PASS | 20:31:37 dock = hdmi,youtube,netflix,zee5,primevideo,hotstar,sonyliv,browser,rJeHak5zRg.Spotify |
| Toggle Off persists (write and readback) | PASS | 20:31:40 home-pref useAsHome:false readback:false |
| Forced exit #1 → recovery relaunch keeps prefs | PASS | 20:34:06 prefs-load found:true hasSpotify:true; state useAsHome:false; new pid 3650 |
| Forced exit #2 → recovery relaunch keeps prefs | PASS | 20:34:38 same; new pid 1677 |
| Recovery launch does not hand off | PASS | home-handoff-skip reason not-home-launch |
| `0 kill` as a restart method | N/A | TV returns "General error [-1]"; used the in-app exit (real process exit) instead |
| Real remote Home with toggle Off → Samsung Home | PENDING | needs Kunal's press |

## Hotfix 2 (20 Oct 2026, 20:45 IST)
| Test | Result | Evidence |
|---|---|---|
| Kunal real Home press, toggle Off, previous build | FAIL | 20:37:44 focus-only smarthub_key event; handoff not evaluated on focus |
| Replay of the logged requests through the new code (9 cases) | PASS | `node scripts/_replay-home.js`: Home key on focus and visible hand off once; stale/app-row/sdb/recovery/On don't |
| New build installed and running | PASS | 20:44 pid 2104 STATUS_FOCUS; prefs found, dock 9 incl. Spotify, useAsHome false |
| Real Home press with toggle Off (new build) | PENDING | Kunal |
| TV Plus key reaches Clean Home | FAIL (platform) | 20:37:16 only `blur`, Samsung popup "You have disabled Samsung TV Plus"; no keydown |

## Hotfix 3 (20 Oct 2026, 20:56 IST)
| Test | Result | Evidence |
|---|---|---|
| Kunal real Home presses, toggle Off (hotfix 2 build) | PASS (with flash) | 20:46:45 / 20:47:08 / 20:47:25 handoff on `visible`; Samsung Home took focus 605 / 814 / 875 ms after Clean Home became visible; UI painted meanwhile |
| Replay (head script + main.js, 14 cases incl. blackout state) | PASS | `node scripts/_replay-home.js` |
| Clock/header ink with "peaks" palette + Bing photo | PASS | preview: before #274359 / #3f5b73 / focus #0c2131, after rgb(255,255,255) for clock, PM, header text, icons and focus label |
| Header focus lens vs 1.2.3 | PASS | pixel diff on the lens ≤ 14/255 (text cream → white) |
| Settings overlap test | PASS | `_settings-overlap.mjs` all pages |
| Installed on TV | PASS | 20:55:58 pid 2084 STATUS_FOCUS, prefs found (dock 9 incl. Spotify, toggle Off), utility lens = Bing photo, dock/sheet glass not loaded (solid) |
| Home key → Samsung Home time after fix | PENDING | logged automatically as `home-handoff-front` on Kunal's next press |

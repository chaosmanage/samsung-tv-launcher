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

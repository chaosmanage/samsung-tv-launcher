# TV Plus → YouTube watcher

See [`../tvplus-watcher/README.md`](../tvplus-watcher/README.md).

## Status (2026-10-20, UA43DU7660KLXL)

- Config remaps (`alias_info`, `equivalent_appid_mapping`) **fail** — button launches HEP directly.
- Live watcher mode: `vconf100` (vconf poll 100 ms). `buxton2ctl get system` cannot read memory keys.
- Persistence: PC re-arm script (Clean Home web app cannot spawn the shell; UEP blocks unsigned files).
- Timings: prefer real TV Plus presses; watcher logs `DETECT` / `DONE act_ms=` under
  `/home/owner/share/tmp/sdk_tools/tvplus-remap/watch.log`.

## 1.2.7 in-app redirect (preferred)

Clean Home itself redirects TV Plus → YouTube with the PC off. Shell watcher + PC re-arm
are optional only. See CHANGELOG 1.2.7.

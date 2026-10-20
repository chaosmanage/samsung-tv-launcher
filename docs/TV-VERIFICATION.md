# Live TV verification notes (UA43DU7660KLXL)

## HDMI
`aul_test get_status` after `0 execute`:
- `org.tizen.tv-viewer` → STATUS_FOCUS (2) — used first
- `org.tizen.tv-viewer-sub1` → STATUS_FOCUS (2)
- `org.tizen.SMSourceAPP` → STATUS_LAUNCHING (0) only

## Art Mode
- `org.tizen.art-app` / `com.samsung.tv.coba.art` → not running after execute
- `com.samsung.tv.home.art` → STATUS_SERVICE (background)
- `com.samsung.tv.ambientfte` → STATUS_FOCUS but is Ambient FTE, not Art Mode
**Art Mode control removed from the UI** on this Crystal UHD.

## Lockout
v1.2.3 removes auto-redirect. Verified with `aul_test is_run KsHome0001.CleanHome`
and stable pid after launch.

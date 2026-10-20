# TV Plus Watcher (button → YouTube)

Non-root resident loop for Samsung Tizen TVs. When the TV Plus button brings
`HEPsqFNie0.tvplusstandalone` to the fullscreen foreground, it launches YouTube
(`9Ur5IzDKqV.TizenYouTube`, fallback `com.samsung.tv.cobalt-yt`) and kills HEP.

## Why not a signed service / Clean Home spawn

- Samsung UEP blocks executing unsigned *files* (`[uep][bash] the file is NOT signed!!`).
- MyTV user cert cannot install a privileged `on-boot` / `auto-restart` service like Samsung's own hotkey-service.
- Clean Home is a **web** app: no `exec` / shell spawn API. It cannot start this watcher itself.
- Closest persistence: **PC-side re-arm** (`scripts/windows/tvplus_watch_rearm.ps1`) while the PC is on the LAN. After a TV reboot, re-run start via the uid-901 injection channel (or the scheduled re-arm).

## Detection / speed

| Approach | Result |
|---|---|
| `buxton2ctl get system memory/...` | **Fails** ("Required key not available") — memory keys are not on the system layer |
| `vconftool get memory/appfw/current_fullscreen_appid` | Works (~200–250 ms/call) — used at **100 ms** poll |
| `pgrep` HEP | Slow (~400 ms) — not used |
| Launch | `app_launcher -s` + `app_launcher -k` **in parallel** (no pre-kill sleep) |

Timestamps land in `/home/owner/share/tmp/sdk_tools/tvplus-remap/watch.log` (`DETECT` / `DONE act_ms=`). Prefer timing from real TV Plus presses.

## Install / start

From the PC (CleanHome `tvwork`):

```bat
python tvwork\run_probe.py tvplus-watcher\watch_start.sh watch_start 20 30
```

(Or paste `watch_start.sh` body into a probe.) Verify: `watch.pid` alive, `watch.log` has `mode=vconf100`.

## Stop / uninstall

```sh
kill "$(cat /home/owner/share/tmp/sdk_tools/tvplus-remap/watch.pid)"
rm -f .../watch.pid .../watch.off
# optional: keep watch.log for timings
```

Off switch without kill: `touch .../watch.off` (resume: `rm` it).

Does **not** modify Home / appsvc / mapping keys.

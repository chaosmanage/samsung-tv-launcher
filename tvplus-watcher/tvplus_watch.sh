#!/bin/sh
# Canonical source of the TV Plus -> YouTube watcher loop.
# DO NOT execute this file on the TV (UEP blocks unsigned files).
# watch_start embeds the same loop as an inline `sh -c` via the uid-901 injection channel.
#
# Detection: vconftool get memory/appfw/current_fullscreen_appid (buxton "system" layer
# cannot read memory/* keys — "Required key not available").
# Poll ~100ms. Launch YouTube + kill HEP in parallel. Debounce per HEP appearance.
# Off switch: touch /home/owner/share/tmp/sdk_tools/tvplus-remap/watch.off

T=9Ur5IzDKqV.TizenYouTube
F=com.samsung.tv.cobalt-yt
H=HEPsqFNie0.tvplusstandalone
K=memory/appfw/current_fullscreen_appid
D=/home/owner/share/tmp/sdk_tools/tvplus-remap
echo $$ > "$D/watch.pid"
echo "$(date "+%F %T.%N") start pid $$ mode=vconf100" >> "$D/watch.log"
a=0
while :; do
  [ -f "$D/watch.off" ] && { sleep 1; continue; }
  c=$(vconftool get "$K" 2>/dev/null)
  case "$c" in
    *"$H"*)
      if [ "$a" = "0" ]; then
        td=$(date +%s%N)
        echo "$(date "+%F %T.%N") DETECT hep_vconf" >> "$D/watch.log"
        app_launcher -s "$T" >/dev/null 2>&1 &
        app_launcher -k "$H" >/dev/null 2>&1 &
        wait
        echo "$(date "+%F %T.%N") DONE act_ms=$(( ($(date +%s%N)-td)/1000000 ))" >> "$D/watch.log"
        a=1
      fi
      ;;
    *) a=0 ;;
  esac
  sleep 0.1
done

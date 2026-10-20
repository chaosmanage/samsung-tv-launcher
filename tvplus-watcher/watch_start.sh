#!/bin/sh
# UEP-safe starter: inline sh -c (do not exec a file). Idempotent.
# Run via CleanHome tvwork/run_probe.py (uid-901 injection), not as a signed TPK.
D=/home/owner/share/tmp/sdk_tools/tvplus-remap
mkdir -p "$D"
if [ -f "$D/watch.pid" ] && kill -0 "$(cat "$D/watch.pid")" 2>/dev/null; then
  echo "already running pid $(cat "$D/watch.pid")"; exit 0
fi
echo "--- restart $(date '+%F %T') mode=vconf100 ---" >> "$D/watch.log"
(
  exec </dev/null >/dev/null 2>/dev/null
  setsid sh -c '
T=9Ur5IzDKqV.TizenYouTube
F=com.samsung.tv.cobalt-yt
H=HEPsqFNie0.tvplusstandalone
K=memory/appfw/current_fullscreen_appid
D=/home/owner/share/tmp/sdk_tools/tvplus-remap
echo $$ > $D/watch.pid
echo "$(date "+%F %T.%N") start pid $$ mode=vconf100" >> $D/watch.log
a=0
while :; do
  [ -f $D/watch.off ] && { sleep 1; continue; }
  c=$(vconftool get $K 2>/dev/null)
  case "$c" in
    *"$H"*)
      if [ "$a" = "0" ]; then
        td=$(date +%s%N)
        echo "$(date "+%F %T.%N") DETECT hep_vconf" >> $D/watch.log
        app_launcher -s $T >/dev/null 2>&1 &
        app_launcher -k $H >/dev/null 2>&1 &
        wait
        echo "$(date "+%F %T.%N") DONE act_ms=$(( ($(date +%s%N)-td)/1000000 ))" >> $D/watch.log
        a=1
      fi
      ;;
    *) a=0 ;;
  esac
  sleep 0.1
done
' &
)
sleep 0.5
echo "started pid $(cat "$D/watch.pid" 2>/dev/null)"

# Re-arm the TV Plus watcher if the TV is online and the watcher is dead.
# Schedule every 5 minutes while the PC is on the same LAN (Task Scheduler).
# Does NOT launch TV Plus / YouTube — only starts the resident watcher if missing.
param(
  [string]$TvHost = "192.168.1.136",
  [string]$CleanHome = "C:\Users\Kunal\CleanHome"
)
$ErrorActionPreference = "Stop"
$sdb = "C:\tizen-studio\tools\sdb.exe"
$py = "C:\Users\Kunal\AppData\Local\Programs\Python\Python313\python.exe"
$serial = "${TvHost}:26101"
$probe = Join-Path $CleanHome "tvwork\probes\p_rearm_watch.sh"
$run = Join-Path $CleanHome "tvwork\run_probe.py"
$log = Join-Path $CleanHome "tvwork\probes\out\rearm.log"

function Log($m) { $line = "$(Get-Date -Format s) $m"; Add-Content -Path $log -Value $line }

& $sdb connect $serial 2>$null | Out-Null
$devs = & $sdb devices 2>$null | Out-String
if ($devs -notmatch [regex]::Escape($serial)) { Log "TV offline"; exit 0 }

$script = @'
set -u
printf 'PROBE_BEGIN\n'
D=/home/owner/share/tmp/sdk_tools/tvplus-remap
mkdir -p "$D"
if [ -f "$D/watch.pid" ] && kill -0 "$(cat "$D/watch.pid")" 2>/dev/null; then
  echo "ok pid=$(cat $D/watch.pid)"
  printf 'PROBE_END\n'
  exit 0
fi
echo "--- rearm $(date '+%F %T') ---" >> "$D/watch.log"
( exec </dev/null >/dev/null 2>/dev/null
  setsid sh -c '
T=9Ur5IzDKqV.TizenYouTube
F=com.samsung.tv.cobalt-yt
H=HEPsqFNie0.tvplusstandalone
K=memory/appfw/current_fullscreen_appid
D=/home/owner/share/tmp/sdk_tools/tvplus-remap
echo $$ > $D/watch.pid
echo "$(date "+%F %T.%N") start pid $$ mode=vconf100 rearm" >> $D/watch.log
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
sleep 0.6
echo "rearmed pid=$(cat $D/watch.pid 2>/dev/null)"
printf 'PROBE_END\n'
'@
Set-Content -Path $probe -Value $script -Encoding ASCII
& $py $run $probe p_rearm_watch 15 25 | Tee-Object -FilePath (Join-Path $CleanHome "tvwork\probes\out\p_rearm_watch.txt")
Log "rearm probe done"

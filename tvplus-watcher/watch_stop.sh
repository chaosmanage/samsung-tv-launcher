#!/bin/sh
D=/home/owner/share/tmp/sdk_tools/tvplus-remap
[ -f "$D/watch.pid" ] && kill "$(cat "$D/watch.pid")" 2>/dev/null
pkill -f 'mode=vconf100' 2>/dev/null
pkill -f 'DETECT hep_vconf' 2>/dev/null
rm -f "$D/watch.pid"
echo stopped

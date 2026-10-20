# Package app\ with the MyTV profile, push and upgrade-install on the TV.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\windows\build_install.ps1 [-Debug] [-Tv 192.168.1.136:26101] [-DebugUrl http://<pc-ip>:8765]
param([switch]$Debug, [string]$Tv = '192.168.1.136:26101', [string]$Profile = 'MyTV', [string]$DebugUrl = 'http://192.168.1.185:8765')
$ErrorActionPreference = 'Continue'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Src = Join-Path $Root 'app'; $Build = Join-Path $Root '.local\build-app'; $Dist = Join-Path $Root 'dist'
if (Test-Path $Build) { Remove-Item -Recurse -Force $Build }
New-Item -ItemType Directory -Force -Path $Build, $Dist | Out-Null
Copy-Item -Recurse -Force (Join-Path $Src '*') $Build
if ($Debug) {
  # UTF-8 without BOM. Never use Get-Content/Set-Content here: it re-encoded the degree sign as "Â°".
  $mj = Join-Path $Build 'main.js'; $enc = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($mj, [IO.File]::ReadAllText($mj, $enc).Replace("var CH_DEBUG_URL = '';", "var CH_DEBUG_URL = '$DebugUrl';"), $enc)
}
Remove-Item (Join-Path $Dist '*.wgt') -Force -ErrorAction SilentlyContinue
& C:\tizen-studio\tools\ide\bin\tizen.bat package -t wgt -s $Profile -o $Dist -- $Build
$wgt = Get-ChildItem $Dist -Filter *.wgt | Select-Object -First 1
$SDB = 'C:\tizen-studio\tools\sdb.exe'
& $SDB connect $Tv | Out-Null
& $SDB -s $Tv push $wgt.FullName /home/owner/share/tmp/sdk_tools/CleanHome.wgt
& $SDB -s $Tv shell 0 vd_appinstall KsHome0001.CleanHome /home/owner/share/tmp/sdk_tools/CleanHome.wgt

# Install Clean Home (first time, Windows)

This is the complete first-time setup for **Clean Home** (`KsHome0001.CleanHome`, package `KsHome0001`)
on a 2024 Samsung Tizen TV from a Windows 10/11 PC. Every command below is the one actually used on the
reference setup:

| Thing | Reference value (replace with yours) |
|---|---|
| TV | Samsung UA43DU7660KLXL, Tizen 9.0, ARMv7 |
| TV IP / SDB port | `192.168.1.136` / `26101` |
| PC IP | `192.168.1.185` |
| Project folder | `C:\Users\Kunal\CleanHome` |
| Tizen Studio | `C:\tizen-studio` |
| Certificate profile | `MyTV` |

> **Safety.** Installing Clean Home is like installing any app: it always opens from the TV's Apps list and
> can be uninstalled at any time. The Home-button takeover (step 8) is optional, uses no root and no firmware
> change, and is reversible (step 9). Never commit certificates, passwords, DUIDs or anything in `.local/`.

Time needed: about 45 minutes the first time (mostly downloads). Updates later take 2 minutes ([UPDATE.md](UPDATE.md)).

---

## 1. Get the project

Either:

```bat
cd C:\Users\Kunal
git clone https://github.com/chaosmanage/samsung-tv-launcher.git CleanHome
```

or on GitHub: green **Code → Download ZIP**, then extract to `C:\Users\Kunal\CleanHome`.

Check these exist: `app\config.xml`, `app\index.html`, `app\main.js`, `scripts\windows\build_install.ps1`.

Use a short path without spaces or OneDrive sync. Tizen's packager dislikes long paths.

## 2. Install Tizen Studio and the TV tools

1. Download **Tizen Studio** (with IDE) from <https://developer.tizen.org/development/tizen-studio/download>
   and install it to `C:\tizen-studio`. It needs a Java runtime; the installer tells you if one is missing.
2. Open **Package Manager** (`C:\tizen-studio\package-manager\package-manager.exe`):
   - **Main SDK** tab: install **Tizen SDK tools**.
   - **Extension SDK** tab: install **TV Extensions-9.0** (or the newest TV extension) and
     **Samsung Certificate Extension**.
3. Check the two tools used below exist:
   - `C:\tizen-studio\tools\sdb.exe` (Smart Development Bridge: talks to the TV)
   - `C:\tizen-studio\tools\ide\bin\tizen.bat` (Tizen CLI: packages and signs the app)
4. Optional, for the Home-button takeover in step 8: **Python 3** (python.org; tick *Add to PATH*) and the
   **.NET 6 SDK** (or newer) from <https://dotnet.microsoft.com/download>.

## 3. Find your PC's IP address

```bat
ipconfig
```

Use the **IPv4 Address** of the adapter on the same network as the TV (e.g. `192.168.1.185`). If it changes
often, reserve it in your router (DHCP reservation); Developer Mode only accepts one PC IP.

## 4. Turn on Developer Mode on the TV

1. Press **Home**, open **Apps**.
2. Type **1 2 3 4 5**. Remotes without number keys (like the UA43DU7660's one-remote): use the **SmartThings**
   phone app's virtual remote (it has a number pad) or a USB/Bluetooth keyboard plugged into the TV.
3. The **Developer mode** dialog opens. Set it **On**, enter your **PC's IP**, press **OK**.
4. **Restart the TV**: hold the **Power** button on the remote until the TV turns off and on again
   (a quick press only puts it in standby, which doesn't apply the change).
5. After restart, the Apps screen shows **Developer mode** at the top.

## 5. Connect to the TV with sdb

In **Command Prompt**:

```bat
set SDB=C:\tizen-studio\tools\sdb.exe
set TV=192.168.1.136:26101
%SDB% connect %TV%
%SDB% devices
```

Expected:

```
connecting to 192.168.1.136:26101 ...
connected to 192.168.1.136:26101
List of devices attached
192.168.1.136:26101     device          UA43DU7660KLXL
```

If the list is empty or says `offline`: the PC IP in Developer Mode must match `ipconfig`; PC and TV must be on
the same network (not a guest Wi-Fi); restart the TV again; allow `sdb.exe` through Windows Firewall.

## 6. Create a Samsung certificate profile (one time)

Samsung TVs only install apps signed with a **Samsung** certificate that lists the TV's DUID.

1. Open Tizen Studio → **Tools → Certificate Manager** → **+**.
2. Choose **Samsung** → device type **TV** → profile name **`MyTV`**.
3. **Author certificate:** *Create a new author certificate*, any name, and a password. Write the password down
   somewhere safe; you need it for every future update. Optional backup of the `.p12` file.
4. Sign in with your **Samsung account** when asked.
5. **Distributor certificate:** keep **Public** privilege. Keep *Add the DUID of the connected device* ticked:
   the TV must still be connected via `sdb` (step 5) so it can read the DUID.
6. Finish. Make sure `MyTV` is the **active** profile (tick mark) in Certificate Manager.
7. Tizen Studio → **Tools → Device Manager** → right-click the TV → **Permit to install applications**.
   This pushes your distributor certificate to the TV. Repeat this whenever you create a new certificate.

The certificates live under `C:\Users\<you>\SamsungCertificate\` and in Tizen Studio's workspace. They are
**never** part of this repository (`.gitignore` blocks `*.p12`, `profiles.xml`, `author.xml`, `.local/`, `*.wgt`).

## 7. Build, sign and install Clean Home

### Option A: one command (recommended)

From the project folder in **PowerShell**:

```powershell
cd C:\Users\Kunal\CleanHome
powershell -ExecutionPolicy Bypass -File scripts\windows\build_install.ps1 -Tv 192.168.1.136:26101 -Profile MyTV
```

What it does (see the script; it's short):

1. Copies `app\` to `.local\build-app\` (your source is never modified).
2. Runs `tizen.bat package -t wgt -s MyTV -o dist -- .local\build-app` to build and sign `dist\Clean Home.wgt`.
3. `sdb connect`, pushes the `.wgt` to `/home/owner/share/tmp/sdk_tools/CleanHome.wgt` on the TV.
4. Installs it with `sdb shell 0 vd_appinstall KsHome0001.CleanHome ...`.

Expected ending: `app_id[KsHome0001.CleanHome] install completed`.

`-Debug` additionally points the app's debug beacon at `http://192.168.1.185:8765` (pass `-DebugUrl` for
another PC) so `scripts\windows\chdebug_server.py` can log what the TV does. Leave it off for everyday builds.

### Option B: the same steps by hand (Command Prompt)

```bat
cd C:\Users\Kunal\CleanHome
mkdir dist 2>nul
C:\tizen-studio\tools\ide\bin\tizen.bat package -t wgt -s MyTV -o C:\Users\Kunal\CleanHome\dist -- C:\Users\Kunal\CleanHome\app
%SDB% -s %TV% push "C:\Users\Kunal\CleanHome\dist\Clean Home.wgt" /home/owner/share/tmp/sdk_tools/CleanHome.wgt
%SDB% -s %TV% shell 0 vd_appinstall KsHome0001.CleanHome /home/owner/share/tmp/sdk_tools/CleanHome.wgt
%SDB% -s %TV% shell 0 execute KsHome0001.CleanHome
```

Expected: `Package File Location: ...\dist\Clean Home.wgt`, then `install completed`, then
`successfully launched pid = ...`.

### Check it on the TV

Open **Apps** → **Clean Home**. You should see the photo, the white clock with *Wakad, Pune* weather,
**Samsung Home · All apps · Settings** at the top right and the glass dock. Move with ← → and watch the app
name appear under the dock. Pin **Clean Home** to Samsung's app row if you like (it's always launchable from there).

Signing errors? See [Troubleshooting](#troubleshooting).

## 8. Optional: make the Home button open Clean Home

Samsung has no supported way to change the Home app. On this TV the Home and power-on apps are two system
settings (`db/appfw/home_appid`, `db/appfw/startup_appid`) that the SDK user can change through the developer
connection. `scripts\native-home\` (from CleanFrame) does exactly that and can put the originals back.
Read [HOME-TAKEOVER.md](HOME-TAKEOVER.md) first: it's undocumented and a firmware update can undo it.

### 8.1 Build the helper (one time)

```bat
cd C:\Users\Kunal\CleanHome
dotnet build scripts\native-home\Control.csproj -c Release -o .local\native-home\out
```

You should get `.local\native-home\out\CleanFrameHomeControl.dll`, `.runtimeconfig.json` and `.deps.json`.
It's framework-dependent .NET 6 and runs on the TV's own `/usr/bin/dotnet`.

### 8.2 Describe your TV (one time)

Create `.local\device.json` (git-ignored):

```json
{
  "host": "192.168.1.136",
  "model": "UA43DU7660KLXL",
  "sdb": "C:\\tizen-studio\\tools\\sdb.exe"
}
```

`run.py` refuses to run if the TV reports a different model on its `:8001` API (if that API answers).

### 8.3 Look first, then save the originals

```bat
python scripts\native-home\run.py inspect
python scripts\native-home\run.py query
```

`inspect` prints the user id, firmware, current Home settings and libraries (read-only).
`query` prints a line like `CLEANFRAME_HOME_JSON={"Home":"...","Autostart":0,"Strings":{...}}` and also saves it in
`.local\native-home\query-output.txt`.

**Before you ever apply**, copy the JSON after `CLEANFRAME_HOME_JSON=` into **`.local\native-home\original.json`**.
This is your way back. Keep a backup copy outside the project. Never overwrite it with an "applied" query.

### 8.4 Prove restore works, then apply

```bat
python scripts\native-home\run.py restore
python scripts\native-home\run.py query
python scripts\native-home\run.py apply
python scripts\native-home\run.py query
```

- `restore` should print `CLEANFRAME_HOME_RESTORED=...` equal to your original.
- `apply` prints `CLEANFRAME_HOME_APPLIED=...` with `KsHome0001.CleanHome` as Home/startup.
- The helper refuses to apply if anything changed since `original.json` was taken, and puts the originals back
  automatically if an apply fails halfway.

Press **Home** on the remote: Clean Home appears. From now on, **Settings → Samsung → Use Clean Home as Home
screen** decides what Home does (On: Clean Home; Off: Samsung Home, no flash). No PC needed for that.

## 9. Restore Samsung Home (undo step 8)

```bat
python scripts\native-home\run.py restore
python scripts\native-home\run.py query     REM must match .local\native-home\original.json
```

Other ways back: Settings → Samsung toggle Off (soft), uninstalling Clean Home (`%SDB% -s %TV% shell 0 vd_appuninstall KsHome0001.CleanHome`), or a factory reset as a last resort.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `sdb devices` empty / `offline` | PC IP changed (re-enter it in Developer Mode), different network, TV not fully restarted, firewall blocking `sdb.exe`. |
| `tizen.bat package` fails with a certificate/profile error | Profile name must be exactly `MyTV` (or pass `-Profile`), and it must be the active profile. Wrong author password → recreate the profile. |
| `install failed` with a signature / certificate message | The TV doesn't trust the distributor cert: *Permit to install applications* again; DUID must be in the profile. |
| Upgrade refused | The old build was signed with a different author certificate. Uninstall first (you lose the dock settings), then install. |
| `Package File Location` path has `Â°` problems / weather shows `Â°` | Don't edit `main.js` with PowerShell `Get-Content/Set-Content`; use `build_install.ps1` which writes UTF-8 without BOM. |
| `run.py`: `Missing compiled helper` | Do step 8.1. |
| `run.py`: `Missing original.json baseline` | Do step 8.3. |
| `run.py`: `Configuration changed since snapshot` | Home is already applied (fine), or something else changed it. Run `query` and compare with `original.json` before doing anything else. |
| `run.py`: `$'\r': command not found` | Old checkout with Windows line endings; update to 1.2.5+ (run.py normalises them; `.gitattributes` keeps `.sh` as LF). |
| Home goes to Samsung Home | Toggle is Off in Settings → Samsung, or Clean Home was uninstalled (then re-run `apply`). |

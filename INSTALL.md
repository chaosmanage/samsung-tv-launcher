# Install Clean Home on your Samsung TV (Windows)

App version covered here: **1.2.1**.

This guide installs **Clean Home** (`KsHome0001.CleanHome`) — a CleanFrame-based launcher — on a 2024 Samsung Tizen TV from a Windows PC. Follow every step in order. Do not skip.

## What you need

- Windows PC on the same Wi-Fi / LAN as the TV
- Tizen Studio 6.1+ with **TV Extensions** and **Samsung Certificate Extension**
- A Samsung certificate profile already created for **this** TV (profile name `MyTV` in this setup)
- The Clean Home project folder (this repository)

TV used here: `UA43DU7660KLXL`, Developer Mode IP `192.168.1.136`, SDB port `26101`.

## A. Download / open the project

1. Open https://github.com/chaosmanage/samsung-tv-launcher in your browser (signed in as `chaosmanage`).
2. Click the green **Code** button → **Download ZIP**.
3. Extract the ZIP to a short path, for example `C:\Users\Kunal\CleanHome`.
4. Confirm you can see `app\config.xml`, `app\index.html`, `app\main.js`, `INSTALL.md`.

## B. Confirm Tizen Studio tools

1. Package Manager: `C:\tizen-studio\package-manager\package-manager.exe`
2. Main SDK tab: **Tizen SDK tools** installed (this provides `C:\tizen-studio\ide\TizenStudio.exe`)
3. Extension SDK tab: **TV Extensions-9.0** and **Samsung Certificate Extension** (2.0.73+)
4. Confirm these exist:
   - `C:\tizen-studio\tools\sdb.exe`
   - `C:\tizen-studio\tools\ide\bin\tizen.bat`

## C. Put the TV in Developer Mode

1. On the TV remote open **Apps**.
2. On the remote type **12345** (if your remote has no number pad, use the on-screen number keypad / SmartThings / a USB keyboard).
3. Turn **Developer mode** On.
4. Enter your **PC's IPv4 address** (same LAN as the TV).
5. Restart the TV when asked.
6. On the PC open a Command Prompt:

```bat
C:\tizen-studio\tools\sdb.exe connect 192.168.1.136:26101
C:\tizen-studio\tools\sdb.exe devices
```

You should see `192.168.1.136:26101    device    UA43DU7660KLXL`.

7. In Device Manager / Tizen Studio, right-click the TV → **Permit to install applications**.

## D. Build a signed `.wgt` with profile `MyTV`

From Command Prompt:

```bat
cd C:\Users\Kunal\CleanHome
mkdir dist 2>nul

REM Package the app folder as a widget, signed with your existing MyTV profile
C:\tizen-studio\tools\ide\bin\tizen.bat package -t wgt -s MyTV -o C:\Users\Kunal\CleanHome\dist -- C:\Users\Kunal\CleanHome\app
```

When prompted for certificate passwords, enter the passwords you chose when creating the Samsung certificate (author, then distributor).

Confirm `C:\Users\Kunal\CleanHome\dist\CleanHome.wgt` (or similarly named `.wgt`) exists.

If `tizen package` asks for a project: the `app` folder must contain `config.xml` at its root (it does).

## E. Install on the TV

```bat
set SDB=C:\tizen-studio\tools\sdb.exe
set TV=192.168.1.136:26101
set WGT=C:\Users\Kunal\CleanHome\dist\CleanHome.wgt

%SDB% -s %TV% push %WGT% /home/owner/share/tmp/sdk_tools/CleanHome.wgt
%SDB% -s %TV% shell 0 vd_appinstall KsHome0001.CleanHome /home/owner/share/tmp/sdk_tools/CleanHome.wgt
%SDB% -s %TV% shell 0 applist
%SDB% -s %TV% shell 0 execute KsHome0001.CleanHome
```

Look at the TV: you should see the CleanFrame-style dock with HDMI, YouTube, Netflix, ZEE5, Prime Video, JioHotstar, Sony LIV, Internet, and Samsung Home.

## F. Autorun Last App (official, limited)

This does **not** intercept the Home key. It only re-opens the last-used app after power-on if that feature is supported:

**Settings → All Settings → General & Privacy → Start Screen Options**

- Turn **off** "Start with Smart Hub Home"
- Turn **on** "Autorun Last App"

Then open Clean Home once before powering off.

## G. Home button takeover (optional)

Pointing the physical Home key at Clean Home is undocumented and risky. Read [docs/HOME-TAKEOVER.md](docs/HOME-TAKEOVER.md) fully first. Do not run apply until originals are saved and restore has been proven.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `sdb devices` empty | Re-check Developer Mode IP, same LAN, TV restarted, Windows firewall |
| Install fails certificate | Re-permit install; confirm DUID matches the certificate; profile `MyTV` |
| App launches then exits | Check `config.xml` privileges; reinstall signed build |
| Icons missing | Icons load from each installed app on the TV; open once on device |
| Weather blank | TV needs internet; Open-Meteo must be reachable |

## Uninstall

```bat
C:\tizen-studio\tools\sdb.exe -s 192.168.1.136:26101 shell 0 vd_appuninstall KsHome0001.CleanHome
```

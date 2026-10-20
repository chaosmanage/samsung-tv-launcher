## 1.2.4 notes

- Use **Settings → Samsung → Use Clean Home as Home screen** to choose whether the remote Home button stays on Clean Home or hands off to Samsung Home. Opening Clean Home from the app list always works.
- Back on the main dock no longer asks to leave; use the header **Samsung Home** control.
- See `docs/CHANGELOG-1.2.4.md`.

# Install Clean Home 1.2.3 on a Samsung TV (Windows)

This installs **Clean Home** (`KsHome0001.CleanHome`) on a 2024 Samsung Tizen TV from a Windows PC.
Setup used here: TV `UA43DU7660KLXL` at `192.168.1.136`, SDB port `26101`; PC on the same LAN; certificate profile `MyTV`.
Replace those values with yours.

> Safety: Clean Home always opens from the Apps list, and never redirects or locks you out.
> The Home-button takeover (section G) is optional and reversible (section H).

## A. Get the project

1. Clone or download `https://github.com/chaosmanage/samsung-tv-launcher` (green **Code** → **Download ZIP**).
2. Extract it to a short path, e.g. `C:\Users\Kunal\CleanHome`.
3. Check that `app\config.xml`, `app\index.html`, `app\main.js` and `INSTALL.md` exist.

## B. Install Tizen Studio

1. Install **Tizen Studio 6.x** (with IDE) from developer.tizen.org.
2. Open `C:\tizen-studio\package-manager\package-manager.exe`:
   - Main SDK: **Tizen SDK tools**
   - Extension SDK: **TV Extensions** (9.0) and **Samsung Certificate Extension**
3. Check that these exist:
   - `C:\tizen-studio\tools\sdb.exe`
   - `C:\tizen-studio\tools\ide\bin\tizen.bat`

## C. Turn on Developer Mode on the TV

1. On the TV open **Apps**, then type **1 2 3 4 5** on the remote (or use the on-screen keypad).
2. Set **Developer mode** to **On**. Enter your **PC's IPv4 address** (from `ipconfig`).
3. Restart the TV (hold Power until it reboots).
4. On the PC:

```bat
set SDB=C:\tizen-studio\tools\sdb.exe
set TV=192.168.1.136:26101
%SDB% connect %TV%
%SDB% devices
```

You should see `192.168.1.136:26101   device   UA43DU7660KLXL`.
If the list is empty, check: same LAN, correct PC IP in Developer Mode, TV restarted, and that Windows Firewall allows `sdb.exe`.

## D. Create the `MyTV` certificate profile (one time)

1. Tizen Studio → **Tools → Certificate Manager → +**.
2. Choose **Samsung** → **TV** → profile name `MyTV`.
3. Author certificate: create a new one and pick a password (keep it safe).
4. Distributor certificate: **Partner/Public**. When asked for device DUIDs, keep the connected TV (it reads the DUID through sdb).
5. Sign in with your Samsung account when prompted. Finish.
6. Device Manager → right-click the TV → **Permit to install applications** (pushes the certificate to the TV).

Never commit certificates, `.p12` files or passwords. They live under `C:\Users\<you>\SamsungCertificate\` and in Tizen Studio's profiles. The repo's `.gitignore` excludes `.local/` and `dist/`.

## E. Build a signed `.wgt`

```bat
cd C:\Users\Kunal\CleanHome
mkdir dist 2>nul
C:\tizen-studio\tools\ide\bin\tizen.bat package -t wgt -s MyTV -o C:\Users\Kunal\CleanHome\dist -- C:\Users\Kunal\CleanHome\app
```

Expected: `Package File Location: C:\Users\Kunal\CleanHome\dist\Clean Home.wgt`.
If it fails with a certificate error, re-check the profile name (`MyTV`) and that the profile is set active in Certificate Manager.

Tip: `scripts\windows\build_install.ps1` packages, pushes and installs in one go (section F).
It edits files only with UTF-8 (no BOM) .NET calls. Older versions used `Get-Content/Set-Content`, which corrupted `°` into `Â°`.

## F. Install or upgrade on the TV

```bat
set WGT="C:\Users\Kunal\CleanHome\dist\Clean Home.wgt"
%SDB% -s %TV% push %WGT% /home/owner/share/tmp/sdk_tools/CleanHome.wgt
%SDB% -s %TV% shell 0 vd_appinstall KsHome0001.CleanHome /home/owner/share/tmp/sdk_tools/CleanHome.wgt
%SDB% -s %TV% shell 0 execute KsHome0001.CleanHome
```

Expected output: `app_id[KsHome0001.CleanHome] install completed` and `successfully launched pid = ...`.

- **Upgrade in place** (same command): keeps your dock, settings and the Home-button takeover.
- **Uninstall** (`0 vd_appuninstall KsHome0001.CleanHome`) resets the Home button to Samsung Home. If you used section G, re-run `apply` after reinstalling.

You should now see the CleanFrame-style glass dock (HDMI, YouTube, Netflix, ZEE5, Prime Video, JioHotstar, Sony LIV, Internet) and Samsung Home / All apps / Settings at the top right.

## G. Optional: make the Home button open Clean Home

This uses an undocumented developer-channel workaround (no root, no firmware change). A Samsung update can undo it. Read `docs/HOME-TAKEOVER.md` first.

```bat
python scripts\native-home\run.py inspect
python scripts\native-home\run.py query      REM save the output as .local\native-home\original.json
python scripts\native-home\run.py restore    REM prove restore works first
python scripts\native-home\run.py apply      REM point Home/startup at KsHome0001.CleanHome
python scripts\native-home\run.py query      REM expect home / startup = KsHome0001.CleanHome
```

Without takeover you can still use **Settings → General & Privacy → Start Screen Options → Autorun Last App**.

## H. Restore Samsung Home

- From the PC: `python scripts\native-home\run.py restore`, then `query` must match `original.json`.
- From the TV: the **Samsung Home** control in Clean Home's header opens Smart Hub at any time.
- Last resort: uninstall Clean Home (this resets Home to Samsung), or factory reset.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `sdb devices` empty | Developer Mode IP = PC IP, same LAN, TV restarted, firewall allows sdb |
| Install: certificate error | Permit install again; DUID must be in the MyTV distributor cert |
| Weather shows `Â°` | Built with an old script that re-encoded `main.js`; rebuild with `build_install.ps1` or plain `tizen package` |
| An app shows a monogram | The TV only ships the Tizen placeholder icon for it; Clean Home deliberately shows a monogram instead |
| Bing photo missing | TV offline or Bing unreachable; the bundled wallpaper is used automatically |
| Home key goes to Samsung Home after reinstall | Uninstall resets it; re-run section G `apply` |

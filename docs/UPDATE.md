# Update Clean Home to a new version

Updating installs the new build **over** the old one. Your dock (including apps you added, e.g. Spotify),
Settings, wallpaper choice, the *Use Clean Home as Home screen* toggle and the Home-button takeover all stay.

You need the same PC, Tizen Studio and **the same certificate profile** (`MyTV`) used for the first install
([INSTALL.md](INSTALL.md)). A build signed with a different author certificate can't upgrade in place.

## 1. Get the new version

With git (recommended):

```bat
cd C:\Users\Kunal\CleanHome
git pull
```

Without git: download the ZIP again from GitHub and extract it **over** `C:\Users\Kunal\CleanHome`, keeping
your `.local\` folder (it holds `device.json`, `original.json` and the Home helper build; it isn't in the ZIP).

See what changed in [CHANGELOG.md](../CHANGELOG.md). The version is in `app\config.xml` (`version="1.2.5"`).

## 2. Make sure the TV is reachable

```bat
C:\tizen-studio\tools\sdb.exe connect 192.168.1.136:26101
C:\tizen-studio\tools\sdb.exe devices
```

If it isn't listed, check Developer Mode is still On with your PC's current IP ([INSTALL.md § 4–5](INSTALL.md#4-turn-on-developer-mode-on-the-tv)).

## 3. Rebuild, re-sign and reinstall

PowerShell, from the project folder:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\build_install.ps1 -Tv 192.168.1.136:26101 -Profile MyTV
```

This repackages `app\`, signs it with `MyTV`, pushes it and runs `vd_appinstall` (upgrade in place).
Expected: `app_id[KsHome0001.CleanHome] install completed`. The manual equivalent is in
[INSTALL.md § 7 Option B](INSTALL.md#option-b-the-same-steps-by-hand-command-prompt).

Then open Clean Home (Apps list or the Home button). If it's already open, the TV restarts it with the new version.

## 4. Do I need to re-apply the Home takeover?

**No**, not after an update. An in-place upgrade keeps the app ID `KsHome0001.CleanHome`, so the TV's Home
setting still points at it. Check any time with:

```bat
python scripts\native-home\run.py query
```

Re-run `python scripts\native-home\run.py apply` only if:

- you **uninstalled** Clean Home (uninstalling makes the TV fall back to Samsung Home), or
- a **Samsung firmware update** reset the Home app, or
- `query` no longer shows `KsHome0001.CleanHome`.

`apply` checks the current state against `.local\native-home\original.json` first and refuses if something
unexpected changed.

## 5. What's kept and what isn't

| Kept on upgrade | Reset |
|---|---|
| Dock apps and order (`cleanhome.home.v1`) | Nothing, on a normal upgrade |
| Background, layout, font, focus style, Bing daily on/off | |
| *Use Clean Home as Home screen* (`cleanhome.homepref`) | |
| Today's Bing photo / your *Next Bing photo* pick (`cleanhome.bing`) | |
| Home takeover (system setting, outside the app) | |

**Uninstalling** (`0 vd_appuninstall KsHome0001.CleanHome`) deletes all of the app's settings and the Home
takeover. Avoid it unless an upgrade is refused (certificate change).

## 6. After updating, quick check

1. Clock and header text are white; weather says *Wakad, Pune*.
2. The dock has your apps; ← → shows each name under the dock.
3. Settings → Samsung shows the toggle in the state you left it.
4. Press Home once from another app: you get Clean Home (toggle On) or Samsung Home (Off).

## Rolling back

Check out the previous version and install it the same way:

```bat
git log --oneline -10
git checkout <older-commit>
powershell -ExecutionPolicy Bypass -File scripts\windows\build_install.ps1 -Tv 192.168.1.136:26101 -Profile MyTV
git checkout main
```

Use the same certificate profile. If the TV refuses to install an older version over a newer one,
uninstall first (settings and the Home takeover are lost; re-apply with `run.py apply`).

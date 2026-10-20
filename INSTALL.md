# Installing "Clean Home" on your Samsung TV

Clean Home is a simple home screen for your TV: one screen with big tiles for
**HDMI, YouTube, Netflix, ZEE5, Prime Video, JioHotstar, Sony LIV and Internet**,
and no ads. It does not delete or block anything on the TV. Samsung's normal
home screen is still there underneath; you just open Clean Home instead.

Built for: **Samsung UA43DU7660KLXL** (43" Crystal UHD DU7600, 2024, Tizen).

You only have to do this once. It takes about 45–60 minutes the first time,
mostly waiting for downloads. You need:

- A Windows, Mac or Linux computer on the **same Wi-Fi** as the TV
- A free **Samsung account** (used to make the "certificate" Samsung requires)
- This folder (`tizen-launcher`) on that computer

> Why a certificate? Samsung only installs apps signed with a certificate that
> is tied to your specific TV (its "DUID"). The `.wgt` file in `dist/` is only
> a test build and **will not install** on your TV. You make your own signed
> copy in Step 5.

---

## Step 1. Find your computer's IP address

- **Windows:** press Start, type `cmd`, open it, type `ipconfig`, and note the
  "IPv4 Address" (looks like `192.168.1.23`).
- **Mac:** System Settings → Wi-Fi → Details → IP address.

Also note the **TV's IP address**: on the TV go to Settings → All Settings →
Connection → Network → Network Status → IP Settings.

## Step 2. Turn on Developer Mode on the TV

1. Press **Home** on the remote and open **Apps**.
2. On the Apps screen, type **1 2 3 4 5** with the remote's number keys (or
   the on-screen number pad). A "Developer mode" box appears.
3. Switch **Developer mode** to **On**.
4. Enter your **computer's IP address** from Step 1, select **OK**.
5. **Turn the TV fully off and on** (hold the power button on the remote until
   the Samsung logo appears, or unplug it for 30 seconds).
6. Open Apps again: you should see **"Develop Mode"** at the top.

Source: [Samsung Developer – TV Device](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html)

## Step 3. Install Tizen Studio on your computer

1. Download **Tizen Studio** (the "IDE installer") from
   <https://developer.tizen.org/development/tizen-studio/download> and install it.
   (It may ask you to install Java first; accept.)
2. When it finishes, the **Package Manager** opens (or open it from the Tizen
   Studio folder: `package-manager`).
3. In Package Manager open the **Extension SDK** tab and install:
   - **TV Extensions** (latest version)
   - **Samsung Certificate Extension**
4. Close Package Manager when done.

Source: [Samsung Developer – Installing TV SDK](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html)

## Step 4. Connect Tizen Studio to the TV

1. Open **Tizen Studio**, then **Tools → Device Manager**.
2. Click **Remote Device Manager**, then **+**.
3. Name: `My TV`, IP: your **TV's IP** from Step 1, port `26101`. Click **Add**.
4. Switch **Connection** to **On**. The TV appears in the Device Manager list.

If it won't connect: check the TV shows "Develop Mode", that the IP you typed
on the TV is your computer's current IP, and that both are on the same Wi-Fi.

## Step 5. Create your Samsung certificate

1. In Tizen Studio open **Tools → Certificate Manager** (click Cancel on any
   "Migration" pop-up).
2. Click **+** → choose **Samsung** → choose **TV** → **Next**.
3. Profile name: `MyTV` → **Next**.
4. **Create a new author certificate** → enter a name and a password you will
   remember → **Next** → **sign in with your Samsung account** → keep the
   suggested backup folder → **Next**.
5. **Create a new distributor certificate** → privilege level **Public** →
   your TV should be listed as connected; click **+** next to it so its
   **DUID** is added (or type it: on the TV, Settings → Support → About This TV
   / Contact Samsung → "Unique Device ID") → **Next** → **Finish**.
6. Make sure **MyTV** is ticked as the active profile.

Source: [Samsung Developer – Creating Certificates](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html)

## Step 6. Build and install Clean Home

**Easy way (Tizen Studio window):**
1. **File → Import → General → Existing Projects into Workspace**, choose
   **Select root directory**, pick the `tizen-launcher` folder, tick
   **CleanHome**, click **Finish**.
2. In Project Explorer, right-click the project → **Run As → Tizen Web Application**.
   Tizen Studio signs it with your MyTV certificate and installs it on the TV.
   Clean Home opens on the TV.

**Command-line way (if you prefer):** open a terminal in the folder that
contains `tizen-launcher` (Tizen Studio's `tools` and `tools/ide/bin` must be
on your PATH):

```
sdb connect <TV-IP>
tizen package -t wgt -s MyTV -- tizen-launcher
tizen install -n "Clean Home.wgt" -- tizen-launcher
```

(Before packaging this way, move `dist/`, `tests/`, `*.md` and `preview*.png`
out of the folder so they aren't bundled. They're harmless, just unnecessary.)

## Step 7. Make it easy to open

1. On the TV press **Home** → **Apps**. Clean Home is in your installed apps.
2. Highlight **Clean Home**, press and hold **OK** (or press **Down**) and
   choose **Add to Home** if it isn't already in the bottom app row.
3. In the app row, highlight Clean Home → press **Down** → **Move**, and move
   it to the **first spot** (far left, right after the Samsung tabs).

From then on: press **Home**, then **OK** on the first tile, and you're in.

## Using Clean Home

| Remote button | What it does |
|---|---|
| Arrows | Move between tiles (wraps around at the edges) |
| OK | Open the highlighted app |
| 1–8 | Open tile 1–8 directly (1 = HDMI ... 8 = Internet) |
| BACK | Leaves the HDMI picture / closes a pop-up. On the home grid it does nothing (so you can't exit by accident). Use **Home** to go to Samsung's menu. |
| Yellow | Open the TV's own Source menu |
| Blue | Show the app IDs found on your TV (for fixing a tile) |

### If a tile says "Couldn't open ..."
That app is not installed, or your TV uses a different app ID. Install it from
Samsung's Apps store, then try again. If it still fails, press **Blue**, note
the ID shown next to the app's name, and put it first in that tile's `ids`
list in `js/apps.js`, then repeat Step 6.

### HDMI tile
It shows your HDMI device full screen inside Clean Home. Press **BACK** to
return. If more than one HDMI device is on, it asks which one. If the TV
refuses, it tells you to press the **SOURCE** button instead. Note: while the
HDMI picture is shown inside Clean Home, the Samsung remote's buttons go to
Clean Home, not to your set-top box. Use the set-top box's own remote, or
press Yellow / SOURCE to switch through the TV's normal input instead.

### Good to know
- **Developer Mode** can stay on. If the TV's software updates and Clean Home
  disappears or won't open, just repeat Step 6.
- The certificate only works for **this TV**. For another TV, add its DUID to
  the certificate (Step 5) and reinstall.
- Optional extra privacy: Settings → All Settings → General & Privacy →
  Terms & Privacy, and switch off **Internet Based Advertisement** and
  **Viewing Information Services**.

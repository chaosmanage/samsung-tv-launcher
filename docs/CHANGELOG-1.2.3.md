# Clean Home 1.2.3

- **P0 lockout fix:** Removed auto-redirect when “Use as Home screen” was Off. Legacy `useAsHome: false` is cleared on startup. Soft Home toggle dropped (could not safely distinguish Home-key vs app-list launch).
- **P1 launcher icon:** Bundled `icon.png` is 256×256 house mark (CleanFrame-style). Full uninstall+reinstall clears Samsung launcher cache.
- **P2 dock logos:** Official-style PNG squircle tiles (YouTube, Netflix, ZEE5, Prime Video, JioHotstar, Sony LIV, Samsung Internet-style browser, HDMI, Samsung Home). Labels sit below icons with no overlap.
- **P3 HDMI:** Launch chain prefers `org.tizen.tv-viewer` / `tv-viewer-sub1` (aul STATUS_FOCUS). Dropped false-success `tvwindow.setSource` path.
- **P3 Art Mode:** Removed from UI — not present on UA43DU7660 Crystal UHD (`art-app` / `coba.art` do not stay running).

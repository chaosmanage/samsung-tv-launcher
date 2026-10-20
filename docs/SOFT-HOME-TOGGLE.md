# Soft Home toggle — removed (v1.2.3)

The v1.2.2 “Use as Home screen: Off” auto-redirect locked users out of Clean Home
(they could not open it from the app list to turn the setting back on).

**Removed in 1.2.3.** Legacy `useAsHome: false` in localStorage is cleared on startup.
Clean Home always opens when launched explicitly.

To undo the PC-side Home takeover permanently, use `run_mode.py restore` from the PC
(see HOME-TAKEOVER.md).

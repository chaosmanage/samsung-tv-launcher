# Soft “Use as Home screen” toggle

In Clean Home → Settings → Samsung:

**Use as Home screen: On** (default) — you stay in Clean Home when the TV resumes it.

**Use as Home screen: Off** — as soon as Clean Home launches or becomes visible, it opens Samsung Smart Hub (`com.samsung.tv.csfs`). Home presses that still land on Clean Home (because of the PC-side takeover) are redirected to Samsung without needing the PC.

This does **not** rewrite vconf. To permanently undo the native Home takeover, run from the PC:

```bat
python tvwork\run_mode.py restore
```

See HOME-TAKEOVER.md.

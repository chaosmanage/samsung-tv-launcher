# No device bloat

Clean Home must not accumulate files or growing storage on the TV.

## Rules

| Feature | What is stored | What is never stored |
| --- | --- | --- |
| Weather (Open-Meteo) | One tiny `localStorage` key `cleanhome.wx` overwritten on each refresh (temp/code/timestamp) | No image files, no logs, no append-only history |
| Daily Bing photo | One tiny `localStorage` key `cleanhome.bing` overwritten daily (`{url, date}`) | The photo itself is loaded as a **live URL** on an `<img>` — never downloaded to TV disk |
| Preferences | Existing CleanFrame `localStorage` prefs (home apps, look) — fixed-size object, overwritten | No new files under `/opt/usr/apps/...` beyond the signed `.wgt` install |
| Home takeover helper | Temporary files under `/home/owner/share/tmp/sdk_tools/` only while a PC-side script runs; wiped by Samsung’s SDK cleanup | Helper is not part of the widget and is not left running |

## Checks

- Weather and Bing use `fetch` → JSON/URL in memory.
- No `FileSystem`, `download`, or blob-to-disk APIs.
- Catalog (`getAppsInfo`) runs once at start / when opening All apps — not on every keypress.

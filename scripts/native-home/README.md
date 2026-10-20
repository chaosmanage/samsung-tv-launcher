# Native Home control (adapted)

Based on CleanFrame's native-home helper by Nathan Clark (MIT).

Scoped to Kunal's UA43DU7660KLXL / firmware 2130.0 family. Runs as SDK UID (not root)
via the published package-name command workaround over SDB. Target app: `KsHome0001.CleanHome`.

```sh
python3 scripts/native-home/run.py query
python3 scripts/native-home/run.py restore
```

Requires compiled `CleanFrameHomeControl.dll` for linux-arm (.NET 6) in `.local/native-home/out/`,
plus a saved `original.json` baseline. Never overwrite the baseline with the applied state.

See docs/HOME-TAKEOVER.md for risks and the restore procedure.

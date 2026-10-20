# Home button takeover

## What this does

On supported 2024 Samsung Tizen TVs, a one-shot helper can re-point the Home / startup app assignment from Samsung Home to Clean Home (`KsHome0001.CleanHome`), and restore the originals later.

It uses the existing SDB developer connection and a published package-name command workaround to run as the **SDK user (not root)**. It does not change security policy or flash firmware.

## Risks

- Undocumented: a Samsung software update can undo or break it.
- Mistakes can leave Home misbehaving until restore.
- Small but real brick risk. You accepted warranty/brick risk before apply.
- Consumer TVs do not officially allow sideloaded apps as the power-on Home.

## Prerequisites

- TV in Developer Mode, reachable from the PC via `sdb` (`192.168.1.136:26101`).
- Clean Home installed and launchable (`KsHome0001.CleanHome`).
- Compiled helper in `.local/native-home/out/` (`CleanFrameHomeControl.dll` + deps, `linux-arm` / .NET 6).
- Baseline snapshot at `.local/native-home/original.json` (created by a successful `query` **before** any apply).
- `.local/device.json` pointing at this TV.

## Commands (from the PC that can reach the TV)

```sh
python scripts/native-home/run.py inspect   # firmware, uid, libs, current vconf
python scripts/native-home/run.py query     # native snapshot JSON
# Save the query JSON as .local/native-home/original.json BEFORE apply
python scripts/native-home/run.py restore   # put originals back
python scripts/native-home/run.py apply     # point Home at Clean Home (only after restore proof)
```

## Restore

If Home misbehaves:

1. Re-enable Developer Mode if needed.
2. From the PC: `python scripts/native-home/run.py restore`
3. Confirm query/readback matches `original.json`.
4. If the helper cannot run, open Apps and launch **Samsung Home** / stock UI manually, or factory-reset as last resort.

## Safety gate used on this TV

1. Benign inspect/query — save originals.
2. Harmless round-trip (apply current value or apply+immediate restore) proving write+restore.
3. Only then: final apply (requires explicit go-ahead).

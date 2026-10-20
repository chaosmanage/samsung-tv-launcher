# Clean Home

A quieter home screen for Kunal's Samsung Crystal UHD TV (`UA43DU7660KLXL`), based on **[CleanFrame](https://github.com/nthnclrk/CleanFrame) by Nathan Clark** (MIT License).

Keeps CleanFrame's screens, layout, styling and remote navigation. Adapted for this TV's apps and identity.

## Attribution

- Original project: CleanFrame © 2026 Nathan Clark, MIT License — see `LICENSE` and `THIRD_PARTY_NOTICES.md`.
- Adaptation: Clean Home for Kunal S / chaosmanage — app identity `KsHome0001.CleanHome`.

## Apps on the dock (default order)

1. HDMI (source / TVWindow with Source-app fallback)
2. YouTube
3. Netflix
4. ZEE5
5. Prime Video
6. JioHotstar
7. Sony LIV
8. Samsung Browser (Internet)
9. Samsung Home (escape hatch back to the stock launcher)

Streaming tiles use each installed app's real `iconPath` from the TV at runtime — no bundled trademark logos. HDMI and Samsung Home use simple outline icons.

Weather for **Wakad, Pune** is shown next to the clock via Open-Meteo (no API key).

Remote: **arrows, OK/Enter, Back only** — no colour or number key dependence.

## Try the interface (browser)

```sh
npm ci
npm run dev:public
```

Open the preview URL printed by the script. App launches need the TV.

## Install on the TV

See [INSTALL.md](INSTALL.md) for the full Windows + Tizen Studio walkthrough.

App identity (must stay stable for in-place updates):

- Application ID: `KsHome0001.CleanHome`
- Package: `KsHome0001`

## Home button takeover (optional, risky)

Making the physical Home key open Clean Home uses an undocumented developer-channel workaround. It is **not** supported by Samsung, can break after firmware updates, and carries a small brick risk.

See [docs/HOME-TAKEOVER.md](docs/HOME-TAKEOVER.md) for diagnostics, apply, and **restore**. Always save originals and prove restore before applying.

## Develop and check

```sh
npm run check
```

## License

MIT — same as CleanFrame. Keep Nathan Clark's copyright notice.

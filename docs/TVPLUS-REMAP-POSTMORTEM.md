# Postmortem: TV Plus button → YouTube remap (failed, removed)

**TV:** Samsung UA43DU7660KLXL, Tizen 9.0. **Date:** 20 Oct 2026.
**Outcome:** Every attempt failed or broke the TV. All of it has been removed and the TV restored.
Today, the TV Plus button opens Samsung TV Plus again, exactly as it did before.

## What was tried

| # | Attempt | Result |
|---|---|---|
| 1 | appsvc `alias_info` rows pointing `com.samsung.tv.tvplus`, `com.samsung.tv.tvPlusDeeplinker` and `HEPsqFNie0.tvplusstandalone` at YouTube (user and system DBs) | **No effect.** The button launches `HEPsqFNie0.tvplusstandalone` directly and never goes through `alias_info`. |
| 2 | `db/menu/autorun_tv_plus_state` and `db/TCF/TVPlus/TCFEnabled` vconfs | **No effect.** The "enable TV Plus" popup kept appearing. The state also reset on reboot. |
| 3 | `db/tvplus/equivalent_appid_mapping` set to YouTube | **No effect.** That mapping is not the launch target. |
| 4 | Shell watcher on the TV (uid 901, polling the foreground app, launching YouTube when TV Plus came up), re-armed by a PC scheduled task | **Worked, but needed the PC.** The watcher dies on every reboot and only the PC could restart it. That broke the requirement that the TV works on its own. |
| 5 | In-app redirect in Clean Home **1.2.7** (`getAppsContext` polling while hidden and on blur, launch YouTube when TV Plus appears) | **Failed badly.** See below. |

## Why 1.2.7 failed

- It checked whether TV Plus was **running**, not whether it was in **front**. Clean Home's certificate is not
  allowed to kill apps, so TV Plus stayed running in the background. Every time Clean Home was hidden or lost
  focus, the watcher saw TV Plus again and **launched YouTube again, over and over**. Kunal could not even open
  Samsung Home while this was happening.
- It **missed real presses from inside Netflix.** Clean Home is suspended while another app is in front, so
  its JavaScript was not running and never saw the press.
- **It shipped without proper testing.** It was never checked with another app in front, or with TV Plus left
  running, before it was installed on Kunal's TV.

## Removed and restored

- Clean Home 1.2.8 contains no TV Plus code: no polling, no `getAppsContext` watcher, no pref and no Settings
  toggle. `background-support` was already in `config.xml` before this work, so it stays.
- The shell watcher was killed and its files deleted from the TV. The vconf/appsvc snapshots are kept for
  restore.
- The PC scheduled task `CleanHome-TVPlusWatchRearm` was deleted. `tvplus-watcher/` and the re-arm script were
  removed from this repo.
- TV values were checked against the original baseline: `autorun_tv_plus_state=disable`,
  `autorun_tv_plus=False`, `TCFEnabled=False`, original `equivalent_appid_mapping`, no TV Plus `alias_info`
  rows. Home rows (`home_appid`, `startup_appid`, appsvc `operation/main`) were not changed.

## Earlier mistakes in this project

- The "Use Clean Home as Home screen" toggle was not added when Kunal first asked for it.
- The clock and header colours were changed without anyone asking.
- The cold-boot black screen (after pulling the plug) was not fully fixed in 1.2.6. 1.2.8 has a further fix
  that still needs Kunal's plug-pull test.

## Lesson

Don't ship background behaviour that launches apps until it has been tested in every state it can meet
(another app in front, the target app running in the background, reboot). And don't install an untested
build on someone's TV.

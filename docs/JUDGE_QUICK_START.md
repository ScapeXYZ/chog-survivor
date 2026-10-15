# Judge quick-start

**The Chog NFT is not a key that unlocks Chog Survivor. The Chog NFT is the survivor itself.**

Public demo URL: **pending deployment approval**. Repository and video URLs: **pending publication approval**. This guide does not claim that any of them are live.

## Play in one minute — no wallet needed

1. Open the eventual public URL at `/`, or follow the [README walletless setup](../README.md#run-the-walletless-demo). Choose **Enter the Wild**.
2. Leave the NFT unselected. The three choice cards each offer a short themed interaction: **Survivor's Trial**, **Timing**, or **Story**. The exact encounter changes with device UTC day and the demo seed.
3. Try an interaction or use the always-visible **Skip**. Survivor's Trial offers Easy, Medium and Hard. Timing has a static alternative for reduced motion. Either Story response completes the same original choice.
4. Inspect the **simulation-only** rulebook preview, then try another choice. Mini-game difficulty/performance does not alter the contract choice, rewards or daily rules.
5. Use **Character** to learn how survivor identity and history work; **Settings** controls the existing audio preferences. Audio is optional. Navigation uses in-app buttons; refreshing returns to Home.

Mouse/touch and ordinary button keyboard controls work throughout. Use Tab, Enter/Space, the displayed map controls/arrow navigation where supported, and Escape to cancel a dialog. Reduced-motion preferences are respected. No extension installation, gas or NFT purchase is required for this simulation.

## What you are seeing

| Item | Public simulation | Real local contract evidence |
|---|---|---|
| XP, Trust, Scars, streak and title | Fixed labeled demo HUD, not your NFT's state | Actual contract state for CHOG #2006 |
| Choice effects | Documented base deltas before modifiers/clamping | Decoded confirmed receipt outcome |
| Reactions | Not presented as a confirmed reaction | Short Ancient Gate reaction tied to a verified result |
| Achievements | Labeled demo marks; playing does not earn them | First Light backed by an `AchievementEarned` event |
| Survivor journal | No simulated entries are inserted into Character | Verified `AdventureResolved` history with UTC and transaction evidence |
| Wallet confirmation | None; no signature or transaction | Existing recorded local Anvil transaction, not a live public deployment |
| Transfer continuity | Explained, not simulated as a blockchain transfer | Same #2006 state and history before/after B → A |

No progress is saved by the public simulation. No successful crossing means a blockchain action succeeded. Character deliberately shows unavailable real progression/history instead of fabricated records. “LOCAL DEMO” is the existing simulation label even when a static build is hosted publicly.

## Why the NFT is essential

The token ID is the permanent survivor identity. The wallet is only its current controller. The contract checks `ownerOf(tokenId)` before allowing one action per NFT per UTC day. XP, Trust, Scars, streak, achievements, title and history stay under that token ID when ownership changes. Selling the Chog does not erase its past or remove its existing same-day lock.

In the [recorded CHOG #2006 lifecycle](evidence/task4h-2006/README.md), Wallet B performed the Ancient Gate action, then transferred the fixture to Wallet A. Both before/after states have **18 XP, 4 Trust, 0 Scars, streak 1 and First Light**. The journal still attributes the action to B; the current owner is A. A inherited the same-day lock, and B lost write authority. These are real isolated-chain results, not simulated public-demo rewards.

## Optional wallet reads

Connecting an injected wallet on Monad **143** can read genuine Chog Genesis ownership/discovery when RPC is available. It does not enable production game actions. A selected NFT with unverified or different ownership disables previews; judges need not use this optional path. If you select a token and cannot preview, refresh the page to return to the unselected walletless demo.

Only local mode on an existing Anvil **31338** supports the actual contract loop. `127.0.0.1` refers to the visitor's machine, not a remotely hosted game server. Never import public Anvil test credentials into a funded wallet or send funds for this demo.

## Evidence and limitations

- [Receipts, token state and transfer explanation](evidence/task4h-2006/README.md)
- [Three-minute video outline](DEMO_VIDEO_OUTLINE.md) — final video not yet produced/published by this task.
- [Deployment guide](DEMO_DEPLOYMENT_GUIDE.md) — no approved public contract deployment exists.

Local receipts are not Monad explorer transactions. Current artwork release approval is unresolved. Optional external fonts, RPC and metadata have availability limits. Verify the final public links and organizer requirements before submission.

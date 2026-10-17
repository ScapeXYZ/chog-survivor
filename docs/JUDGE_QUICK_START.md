# Judge quick-start

## Verified Monad mainnet deployment and source

Game CA: **[0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code)**. [Deployment transaction](https://monadscan.com/tx/0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956), block **113947533**, chain **143**; deployer `0x320eDAe253259053d53feD8eEe6D9C0274A91E85`. Two independent RPC providers confirmed finalized creation, exact frozen-artifact runtime and the immutable Chog Genesis binding. **Source verified publicly on MonadScan (Exact Match); deployment remains unaudited.** Collection governance/custody attestations and official wallet-provider clearance remain incomplete.

[Published verified source](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code) · Solidity **0.8.28+commit.7893614a**, optimizer **200**, **Cancun**. Independently confirmed on the public Code page in [Task 7D](TASK_7D_SOURCE_VERIFICATION_RESULT.md); source verification does not imply an audit or frontend release approval.

The checked-in manifest now records the real deployment. **The existing public demo remains a walletless simulation; public mainnet gameplay has not been activated or republished.** A mainnet-enabled build is prepared locally and requires explicit `VITE_CHOG_ENV=mainnet`; checked-in Vercel configuration still forces `production` simulation. Contract existence does not authorize new transactions or frontend publication. See [Task 7A verification](TASK_7A_POST_DEPLOYMENT_VERIFICATION.md) for evidence and the separate publication gate.

**The Chog NFT is not a key that unlocks Chog Survivor. The Chog NFT is the survivor itself.**

Public demo: **https://chog-survivor.vercel.app/**. Public repository: **https://github.com/ScapeXYZ/chog-survivor**. Checked again in Task 7H; watch the owner-supplied **[2:51 demo video](https://youtu.be/qV-c7AP0VAg)**. See the [final submission package](FINAL_CHOGATHON_SUBMISSION.md). The public frontend is a simulation; live game transactions are disabled.

Video walkthrough: **https://youtu.be/qV-c7AP0VAg**. It shows simulation footage and clearly labelled historical local-Anvil evidence, not live mainnet gameplay.

## Play in one minute — no wallet needed

1. Open https://chog-survivor.vercel.app/, or follow the [README walletless setup](../README.md#run-the-walletless-demo). Choose **Enter the Wild**.
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

The existing hosted release does not enable the actual contract loop. The new local mainnet build is separately gated; existing local Anvil **31338** evidence remains valid historical fixture evidence. `127.0.0.1` refers to the visitor's machine, not a remotely hosted game server. Never import public Anvil test credentials into a funded wallet or send funds for this demo.

## Evidence and limitations

- [Receipts, token state and transfer explanation](evidence/task4h-2006/README.md)
- [Final submission/video status](FINAL_CHOGATHON_SUBMISSION.md) — [owner-supplied 2:51 video](https://youtu.be/qV-c7AP0VAg).
- [Deployment guide](DEMO_DEPLOYMENT_GUIDE.md) — real mainnet deployment is verified above; frontend publication remains gated.

Local receipts are not Monad explorer transactions. Artwork release permission and the reported MetaMask/Blockaid warning remain unresolved; do not bypass wallet warnings. Wallet connection is optional. Optional external fonts, RPC and metadata have availability limits. Verify the final public links and organizer requirements before submission.

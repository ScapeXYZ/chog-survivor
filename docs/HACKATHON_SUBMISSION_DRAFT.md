# Chogathon 2026 submission draft

Prepared for the owner-supplied deadline: **October 23, 2026, 15:00 UTC**. Confirm organizer rules and acceptance of a simulated public demo plus real local-chain evidence. Bracketed fields remain pending; this is not proof that any URL, video, repository or submission is public.

## Submission fields

**Project:** Chog Survivor
**Tagline:** Every choice leaves a mark—and the Chog carries every one.
**Demo:** `[PUBLIC HTTPS WALLETLESS DEMO URL — PENDING DEPLOYMENT APPROVAL]`
**Repository:** `[PUBLIC/JUDGE-ACCESSIBLE GITHUB URL — PENDING PUBLICATION APPROVAL]`
**Video:** `[PUBLIC VIDEO URL, MAXIMUM THREE MINUTES — PENDING CREATION/PUBLICATION]`
**Team/contact:** `[NAMES, EMAIL, DISCORD AND X HANDLES]`

**Core pitch:** “The Chog NFT is not a key that unlocks Chog Survivor. The Chog NFT is the survivor itself.”

## Product overview

Chog Survivor is a daily survival adventure whose permanent protagonist is the NFT token ID. The current owner makes a meaningful choice, explores a short encounter-themed interaction, reviews the contract preview and confirms one action per NFT per UTC day. Confirmed progression, expressive reactions, achievements and a verified journal stay attached to the Chog when it changes wallets.

There are six encounters and 18 fixed choices. Cautious choices use Survivor's Trial, reckless choices Timing and compassionate choices Story; mapping is by category rather than card position. Interactions are optional and frontend-only: completion, difficulty and Skip never independently change contract rewards, choice IDs, progression or daily eligibility.

## Judge access and honest scope

The proposed public static demo requires **no wallet, funds, NFT or account**. Enter the Wild, try any of the three choice cards, complete or Skip, then inspect the simulated rulebook preview. Demo HUD/achievement marks are fixtures; no progress, reaction or journal entry is minted or saved by simulated play. The Character screen does not substitute demo state for unavailable verified records.

The separate [CHOG #2006 evidence package](evidence/task4h-2006/README.md) records **genuine local-Anvil** confirmation and transfer continuity: B acted, received 18 XP / 4 Trust / 0 Scars / First Light, then transferred to A. A inherited the same survivor and same-day lock. The journal retained B as the historical actor. This is a fixture on chain 31338, **not authentic Chog Genesis, not Monad mainnet and not a public testnet deployment**.

The game is not deployed on Monad. Optional production NFT ownership reads are genuine read-only chain-143 queries, distinct from simulated Adventure. There is no approved remote game deployment and no production write path. Judges cannot reach this workstation's localhost Anvil through a hosted frontend.

[Judge quick-start](JUDGE_QUICK_START.md) · [README/setup](../README.md) · [deployment/environment guide](DEMO_DEPLOYMENT_GUIDE.md)

## Why the NFT is essential

`ownerOf(tokenId)` authorizes the current controller; token-keyed storage and events retain XP, Trust, Scars, streak, achievements, title, daily lock and historical decisions. A transfer removes the old owner's authority without resetting progression or allowing a second same-day action. Current owner and historical acting owner are displayed separately. Remove the NFT and the application loses its survivor identity, ownership authorization and transferable accumulated story.

The frozen contract is non-upgradeable and has no NFT custody, staking, wagering, marketplace, inventory or token economy. The demo adds no unrelated feature systems.

## Stack and verification

Solidity 0.8.28 / Foundry, React 18 / TypeScript / Vite, Wagmi / Viem / TanStack Query, Playwright Chromium; no backend service. Existing validation and new preparation results are recorded in [Task 4K](TASK_4K_PREPARATION.md).

- Task 4J: 373 frontend tests passed in each environment; production build and TypeScript passed; 43 production-artifact Chromium checks passed.
- Task 4J isolated Foundry: 39 passed, zero failed; six optional Monad-fork tests skipped without RPC.
- Real Task 4H: two authorized local transactions, 22 completed checks; no additional Adventure transaction. The initial stale-lock issue was subsequently fixed and regression-tested in Task 4I; see evidence provenance.
- Task 4I: 515 browser fixture checks passed, including immediate execution-day rollover lock. Mocked browser confirmations are not new local-chain transactions.
- Frozen contract SHA-256: `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

## Video and release checklist

Follow the [three-minute outline](DEMO_VIDEO_OUTLINE.md). Start with the pitch and walletless interactions; explicitly switch to recorded real local receipt/reaction/journal/transfer evidence; close with why the token remains the survivor. Use existing real footage if available, otherwise label screenshots/receipts as recorded evidence. Do not fabricate live confirmations or repeat transactions for recording without new authorization.

- [ ] Confirm organizer eligibility, deadline and demo/evidence acceptance.
- [ ] Resolve public-release approval for provisional runtime illustrations/screenshots and any branding; preserve exact typography and license notices.
- [ ] Review complete source set, secrets, dependencies and [safe staging plan](TASK_4K_STAGING_PLAN.md); required recent files remain untracked until reviewed.
- [ ] Obtain exact frontend deployment and repository/video/evidence publication approval; no approval is implied here.
- [ ] Verify public links from a private window on a separate network with no account wall.
- [ ] Retain simulation and local-fixture disclosures in screenshots/video.
- [ ] Check mobile/desktop, keyboard/touch, reduced motion, audio preferences, Skip and rejected/RPC-failure behavior.
- [ ] Replace every bracketed field and submit before the confirmed deadline.

Do not reset/restart Anvil, advance time, mint, act or transfer again as part of preparation. No new contract or mainnet deployment is included. Collection governance/source/security, artwork rights and explicit deployment authorization remain separate gates for any future production game.

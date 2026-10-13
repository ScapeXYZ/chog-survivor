# Chogathon 2026 submission draft

Placeholders in square brackets must be replaced before submission. This is a draft; it is not evidence that a video, repository, hosted demo, or submission has been published.

## Submission fields

**Project title:** Chog Survivor

**Tagline:** Every choice leaves a mark—and the Chog carries every one.

**Demo video:** `[PUBLIC YOUTUBE OR GOOGLE DRIVE URL — MAXIMUM 3 MINUTES]`

**Working demo / testing link:** `[HOSTED DEMO URL OR ORGANIZER-APPROVED LOCAL TESTING INSTRUCTIONS]`

**Repository:** `[PUBLIC OR JUDGE-ACCESSIBLE REPOSITORY URL]`

**Tech stack:** Solidity 0.8.28, Foundry, React 18, TypeScript, Wagmi, Viem, Vite, Playwright, isolated Anvil.

**Contact and team:** `[EMAIL, NAMES, DISCORD, AND X HANDLES]`

## Overview

Chog Survivor turns each Chog NFT into a persistent daily survivor. The current owner chooses how it responds to one deterministic encounter per UTC day, while the token ID carries XP, Trust, Scars, streaks, achievements, title, daily lock, and verifiable event history across wallet transfers. Six encounters and three choices per encounter create 18 fixed survival outcomes. The hackathon demonstration uses an explicitly labeled local Anvil fixture because the owner does not hold a canonical Chog Genesis NFT; it exercises the unchanged game contract and real owner-based authorization without presenting the fixture as a real Chog or sending a Monad transaction.

## Problem and solution

Many NFT applications treat the NFT as a login ticket while storing the meaningful character elsewhere. Chog Survivor makes the token ID the character's durable key. The frozen contract asks the canonical collection for `ownerOf(tokenId)` whenever an action is submitted. That owner is the current controller, but every progression field and event is keyed by the NFT. A transfer immediately removes the old owner's authority, grants the new owner control, preserves prior progression and journal entries, and preserves the same-day lock.

Remove the NFT and the game loses authorization, persistent survivor identity, and transfer of accumulated history. This directly addresses Chogathon's NFT-essentiality gate.

## Gameplay and technical features

- One authoritative encounter per token per UTC day.
- Six encounters and 18 contract-defined choices.
- Contract previews for prospective XP, Trust, Scars, streak, achievement, and title changes.
- Eight permanent achievements and progression-derived titles.
- `AdventureResolved` and `AchievementEarned` events form a token-filtered survival journal.
- Public deterministic scheduling permits strategic waiting, at the cost of breaking streak continuation.
- No wagering, escrow, NFT custody, marketplace, or pay-to-win currency.

The NFT is a transferable stateful protagonist rather than a gate. Browser evidence completes an action with wallet A, transfers the fixture token to wallet B, shows unchanged progression/history and the same daily lock, advances only the isolated EVM to the next UTC day, and completes a second action with wallet B.

## Testing evidence

- 38 local Foundry tests passed; six optional Monad-fork tests were skipped without an RPC.
- 124 frontend tests passed.
- Typecheck, production build, and local-mode build passed.
- Browser E2E signed two real Anvil game transactions and one fixture transfer.
- 45 browser assertions and 32 responsive screenshots passed, with no console errors or horizontal overflow.
- Frozen Solidity SHA-256: `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

## Limitations and production plan

- The game is not deployed on Monad and production writes are disabled.
- The demo NFT is a local fixture on chain 31338, not an authentic Chog Genesis NFT.
- The owner does not currently hold a canonical Chog Genesis NFT.
- Authentic Chog artwork is withheld because written reuse permission is unresolved.
- Canonical collection governance, source, privileged controls, and immutable dependency risk remain production blockers.
- The immutable contract has no pause, owner, migration, or upgrade path. A correction requires a new deployment and frontend migration.
- History depends on RPC logs from a trusted deployment start block.

The future plan is to close the canonical-governance and security gates, authorize an exact artifact and deployment ceremony, verify source/runtime/binding/start block, establish redundant RPC/log monitoring and incident procedures, and separately review a production frontend write path. This draft grants no production authorization.

## Three-minute narration

**0:00–0:20 — Concept:** “Chog Survivor makes the NFT the survivor. A wallet can control it today, but its choices and history belong to the token.”

**0:20–0:45 — Disclosure and identity:** “This demonstration runs on isolated Anvil chain 31338. Token 1001 is a local fixture—not a real Chog Genesis NFT and not Monad mainnet. It lets us exercise real `ownerOf` authorization.” Connect wallet A, discover token 1001, and select it.

**0:45–1:15 — Encounter and preview:** “The local chain determines today's encounter from the token and UTC day. Each of the six encounters has three contract-defined choices.” Show the three actual previews.

**1:15–1:45 — Confirmed action:** “I explicitly confirm one local transaction. Success appears only after Anvil confirms it and the survivor state refreshes.” Show the real hash, progression, and daily lock.

**1:45–2:10 — Character and history:** “The parchment reads actual token state. Its journal comes from decoded contract events, not a browser-generated timeline.” Show title, achievements, journal, and artwork disclosure.

**2:10–2:40 — Transfer continuity:** “Wallet A now transfers token 1001 to wallet B using local development tooling. A loses control, B gains it, and progression, history, and the lock remain.”

**2:40–3:00 — Essentiality:** “After advancing only this isolated chain to the next UTC day, wallet B makes the next decision. Remove the NFT and authorization, identity, transferable progression, and history disappear. The NFT is the survivor.”

## Recording checklist

- Confirm organizer registration and deadline before recording.
- Reset Anvil; record the generated game address and deployment block.
- Keep `LOCAL CONTRACT TEST — NOT MONAD MAINNET` visible.
- Show owner verification, actual preview, confirmation, receipt, progression, journal, and lock.
- Transfer locally; show old-owner rejection and wallet B ownership.
- Advance time only through development tooling and show B's next-day action.
- Keep the final cut at or below three minutes.
- Upload only real footage; never simulate a confirmation or transaction hash.
- Never call the fixture authentic, describe Anvil as Monad, or imply artwork permission.
- Replace every placeholder and test public/judge links in a private window.

## Artwork-compliant option

Submit using the existing code-native seal and parchment placeholder, approved environment assets, visible token ID, and factual ownership status. Before including collection portraits, metadata images, logos, badges, likenesses, or marks, obtain written permission identifying the exact assets and rights to modify/display them in the app, repository, screenshots, demo, hackathon portal, judging, presentations, and promotion; geographic scope and duration; platform sublicensing; attribution; and revocation/takedown procedure. NFT ownership and metadata availability are not licenses.

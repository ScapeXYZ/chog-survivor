# Milestone 12 — Browser E2E and demo readiness

## Verified baseline and safety

Baseline was `316245bf0ad2aa0a9c99cc6a7190e289d0ebd88a`. `src/ChogSurvivor.sol` remained byte-for-byte unchanged at SHA-256 `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`. The pre-existing untracked `design/chog-parchment-reference.png` was preserved.

Production has no approved game address: `approvedGameAddress` is now always undefined outside validated local mode, even if `VITE_CHOG_SURVIVOR_ADDRESS` is supplied. The write ABI is imported only by `LocalContractAdventure`, which is rendered only in exact local mode. Local writes require localhost RPC, chain 31338, the canonical fixture binding, current ownership, and explicit confirmation. No Monad transaction was sent.

## Browser and local environment

Playwright 1.63.0 launches its headless Chrome for Testing 153 build directly; CDP port 9222 and a desktop session are unnecessary. Install with `cd frontend && npm install`, then run `npx playwright install chromium` if the cache is absent.

Start and provision a clean chain:

```bash
anvil --host 127.0.0.1 --port 8545 --chain-id 31338
./script/local-anvil.sh install
./script/local-anvil.sh deploy
./script/local-anvil.sh verify
```

The evidence run used fixture `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`, game `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`, deployment block 4, token 1001/1002 for wallet A, and 2001 for wallet B. Addresses are deterministic only after a clean default-Anvil reset.

Run the browser journey:

```bash
cd frontend
VITE_CHOG_ENV=local \
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545 \
VITE_LOCAL_CHOG_SURVIVOR_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 \
VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK=4 \
npm run test:e2e
```

The harness injects a test-only EIP-1193 provider, derives Anvil's public development wallets from the standard mnemonic, and signs real local transactions. It refuses transaction targets other than the configured local game and fixture. Never fund or reuse these accounts. The run proves discovery, owner verification, contract preview, explicit confirmation, receipt success, progression refresh, same-day lock, A-to-B transfer, retained state/history, an isolated 86,400-second EVM advance, and B's next-day action. The application itself never advances time.

Machine-readable evidence is in `reports/task12/evidence.json`. Screenshots are generated locally under `reports/task12/screenshots/` and intentionally ignored because there are 32 large reproducible PNGs. They cover Home, Adventure, Character, and Settings at 360, 390, 430, 768, 1024, 1280, 1440, and 1920 pixels. Each view passed a horizontal-overflow assertion and the run recorded no console errors. The approved page structure and artwork were not redesigned.

## Defects fixed

- Local NFT discovery now uses a hash-verified latest Anvil block because Anvil reports genesis for `finalized`; Monad still uses finalized reads.
- The local fixture discovery call stays below Anvil's default 30M block gas limit; the production budget is unchanged.
- Confirmed actions now verify chain, game-to-NFT binding, and owner immediately before signing; reject duplicate submission; inspect receipt status; show the real local hash; and distinguish receipt success from refresh failure.
- History refresh now actually re-runs after a confirmed action.
- Local labels accurately describe contract-backed Anvil play rather than saying all gameplay is disabled.
- The confirmation dialog restores focus and blocks dismissal while pending.

## Validation

- Foundry: 38 passed, 0 failed, 6 Monad-fork tests skipped because `MONAD_RPC_URL` was deliberately unset.
- Frontend: 124 passed across 11 files.
- Typecheck: passed.
- Production and local builds: passed (Rollup emitted dependency annotation warnings only).
- Browser E2E: passed with two real game transactions, one fixture transfer, token-bound journal continuity, daily lock, 32 responsive screenshots, zero horizontal-overflow failures, and zero browser console errors.
- `git diff --check`: passed.

Accessibility checks covered keyboard-operable native controls, initial modal focus, focus restoration, live status regions, semantic headings, explicit button labels, and mobile overflow. The test did not perform a full WCAG contrast audit or automated screen-reader session. Performance review found no console errors, broken assets, or repeated discovery polling; ownership/contract reads still intentionally refresh for freshness.

## Three-minute demo storyboard and narration

- **0:00–0:20:** “Chog Survivor makes the NFT the persistent survivor; a wallet is only its current controller.” Show Home.
- **0:20–0:45:** Connect wallet A and disclose: “This is isolated Anvil. Token 1001 is a local fixture, not an authentic Chog Genesis NFT and not Monad mainnet.”
- **0:45–1:15:** Discover token 1001, open Adventure, and show the contract-selected encounter and three contract previews.
- **1:15–1:45:** Confirm one local transaction, show its real hash, then show refreshed XP, Trust, Scars, streak and daily lock.
- **1:45–2:10:** Open Character and show the parchment, title, achievements, and decoded `AdventureResolved` journal entry.
- **2:10–2:40:** Transfer 1001 with the documented local command, switch to wallet B, and show identical progression/history plus the same-day lock.
- **2:40–3:00:** Explain that the token carries progression across controllers, while production stays holder-only and write-disabled until an approved deployment.

Recording checklist: reset Anvil; capture addresses/block; hide unrelated browser UI; keep the local warning visible; show the confirmation dialog and receipt; show before/after state; show owner A then B; never call the fixture genuine Chog art or a mainnet NFT; avoid implying artwork permission; record in one honest sequence.

## Draft submission package

**Summary:** Chog Survivor is an NFT-native daily survival game where six deterministic encounters and 18 choices permanently shape each token's XP, Trust, Scars, achievements, title, and event journal.

**Problem and solution:** Most NFT games use ownership as an access key while keeping identity elsewhere. Chog Survivor keys authorization, progression, daily limits, and history by token ID, so transferring the NFT transfers the same survivor.

**Architecture:** frozen Solidity on an EVM chain; ERC-721 `ownerOf` authorization; React/Wagmi/Viem client; authoritative contract previews and events; bounded event history; isolated Anvil fixture for reproducible testing. The repository setup and commands above provide a no-funds local demo.

**Known limitations and production blockers:** there is no approved Monad game deployment or deployment start block; production writes/history remain disabled; the owner does not hold a canonical NFT; authentic artwork reuse permission remains unresolved, so the placeholder remains; chronological history depends on RPC logs; and the video has not been recorded or submitted. Searches did not locate a current official Chogathon submission rules page, so video duration, deadline, repository visibility, required fields, judging tracks, and artwork terms require confirmation from the organizer's current official channel before submission.

Stop here: this completes Milestone 12 only. It does not deploy to Monad or begin Milestone 13.

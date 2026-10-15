# Chog Survivor

**“The Chog NFT is not a key that unlocks Chog Survivor. The Chog NFT is the survivor itself.”**

Each token ID carries its XP, Trust, Scars, streak, achievements, title, daily lock and verified adventure journal. The wallet is only its current controller. Transfer the NFT and the next owner inherits the same survivor, including its history and daily eligibility.

## Start here, judges

The publicly hostable build is a **walletless simulation**, not a live blockchain game. No public demo, repository or video URL has been verified or published by this preparation task. See the [judge quick-start](docs/JUDGE_QUICK_START.md) and [submission draft](docs/HACKATHON_SUBMISSION_DRAFT.md).

1. Open the eventual demo URL at `/`, or run the demo locally below.
2. Choose **Enter the Wild**. No wallet, NFT, funds or account is required.
3. Try any of the three cards: Survivor's Trial, Timing or Story. Complete the interaction or use **Skip** to see the same original choice preview.
4. Previews show simulated rulebook base effects. **No XP, achievements or journal entries are earned or saved. No wallet confirmation is requested.**
5. Inspect the [real local-Anvil evidence](docs/evidence/task4h-2006/README.md) for actual confirmed progression, reaction, First Light and transfer continuity. It is separate from the simulation and is not Monad-mainnet evidence.

The intended contract loop is **encounter → meaningful choice → optional interaction → wallet confirmation → verified reaction → permanent NFT journal**. The hosted simulation demonstrates the encounter, interaction and preview; recorded local evidence demonstrates the confirmed part. Completing a mini-game never changes contract rewards, choice IDs or daily eligibility.

## Run the walletless demo

Use Node.js 22 (the verified version), npm and the existing lockfile. From a clean checkout containing the full reviewed source set:

```sh
cd frontend
npm ci
VITE_CHOG_ENV=production \
VITE_MONAD_RPC_URL= \
VITE_LOCAL_RPC_URL= \
VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= \
VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= \
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite. The explicit overrides prevent an existing `.env.local` from selecting Anvil. Do not assume `--mode production` alone overrides that file. For a production artifact, use the same settings with `npm run build`; output is `frontend/dist`. Hosting instructions and the approval boundary are in the [environment/deployment guide](docs/DEMO_DEPLOYMENT_GUIDE.md).

Use the in-app Home, Adventure, Character and Settings buttons. These are not separate URL routes. A refresh returns to Home. Character intentionally does not substitute simulation values for unavailable real progression/history. If you optionally select an NFT, ownership checks apply; an unowned or unverified token cannot be used for Adventure previews. A fresh walletless session is the simplest judge path.

## What is real, and what is simulated?

| Experience | Data and limitations |
|---|---|
| Walletless Adventure | Device-UTC deterministic encounter, fixed demo stats/achievement marks, optional mini-games, repeatable base-delta previews. No saved progression, transaction, confirmed reaction or generated history. |
| Optional NFT identity reads | Genuine Chog Genesis ownership on Monad chain 143 when an injected wallet and working RPC are available. This does not activate production gameplay. |
| Existing local contract mode | Real isolated Anvil chain 31338, fixture NFT, frozen contract execution, receipt-derived progression/reactions/achievements and verified event journal. Requires localhost access and a local wallet. Judges cannot access this workstation's Anvil through a hosted site. |
| Prepared evidence package | Captured CHOG #2006 local receipts, before/after state and screenshots. Historical evidence, not a live public network or a newly executed transaction. |

Only the current `ownerOf(tokenId)` may act, once per NFT per contract UTC day. A transfer does not reset progression or permit another same-day action. The journal retains the historical acting wallet separately from the current owner. See the [CHOG #2006 transfer explanation](docs/evidence/task4h-2006/README.md).

## Existing local Anvil deployment — inspect safely

The existing workspace uses `http://127.0.0.1:8545`, chain **31338**, game **`0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`**, deployment block **4**. These are this local deployment's public identifiers, not portable public-network settings. The fixture occupies the canonical numeric address **`0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`** only on the isolated local chain; it is not authentic Chog Genesis.

Do not restart/reset an existing node, rerun fixture installation, advance time or run transaction scripts to view evidence. The [recorded verification](docs/evidence/task4h-2006/verification.json) and screenshots require no running node. For an already verified existing node, the [deployment guide](docs/DEMO_DEPLOYMENT_GUIDE.md) explains local frontend settings. Foundry and an injected local wallet are needed for live local inspection; no action is necessary to read the existing survivor and journal.

`script/local-anvil.sh install/deploy` creates or changes local state. `npm run test:e2e` and `scripts/task4h-real-anvil-e2e.mjs` can submit real local transactions; the older journey also advances isolated time. **They are not safe preparation/verification commands for the current node and were not run for Task 4K.** A new fixture setup or transaction requires its own authorization. Standard public Anvil credentials must never be funded or reused on public chains.

## Architecture and verification

- `src/ChogSurvivor.sol`: frozen non-upgradeable game, six encounters, 18 fixed choices, eight achievements and token-bound state.
- `frontend/`: React 18, TypeScript, Vite, Wagmi, Viem and TanStack Query; static build with no backend.
- `frontend/src/LocalContractAdventure.tsx`: ownership/network gates, block-pinned eligibility, guarded confirmation and verified receipt reactions.
- `frontend/src/survivalHistory.ts` and `SurvivorJournal.tsx`: verified local event history, UTC evidence and historical controller attribution.
- `test/`: isolated Foundry unit, fuzz, invariant, reference-model and opt-in fork tests.

Task 4J verified **373 frontend tests in each environment**, **39 Foundry tests passed / six optional fork tests skipped**, production build/typecheck and 43 production-artifact Chromium checks. [Task 4K preparation](docs/TASK_4K_PREPARATION.md) records the new verification results and exact commands. Tests use a deterministic configuration baseline plus explicitly local fixtures; a green test does not mean a public contract is deployed.

The frozen contract SHA-256 remains:

```text
5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7
```

## Release status

No game deployment is approved on Monad, and production gameplay writes/history remain disabled. Canonical collection source/governance/security gates are separate from static-demo hosting. The game has no NFT custody, staking, inventory, currency, wagering or marketplace.

Current runtime illustrations are marked provisional in the [asset inventory](frontend/ASSET_INVENTORY.md). Public demo/repository/video release requires explicit review of those exact assets and intended uses. No artwork was replaced or generated. Existing fonts and typography are preserved; the bundled Lilita One license is also included with unchanged license terms at `frontend/public/licenses/LilitaOne-OFL.txt` for distribution. Genuine collection metadata or ownership does not grant artwork permission.

Before publication, review the [safe staging plan and release blockers](docs/TASK_4K_STAGING_PLAN.md). Required recent components are still untracked; a checkout of the current committed revision alone does not contain the complete current demo. No files have been staged or committed by this task.

## Submission materials

- [Judge quick-start and demo limitations](docs/JUDGE_QUICK_START.md)
- [Environment and deployment approval guide](docs/DEMO_DEPLOYMENT_GUIDE.md)
- [Real local transfer evidence](docs/evidence/task4h-2006/README.md)
- [Three-minute video outline](docs/DEMO_VIDEO_OUTLINE.md)
- [Submission draft](docs/HACKATHON_SUBMISSION_DRAFT.md)
- [Judge-access audit](docs/TASK_4J_JUDGE_ACCESS_AUDIT.md)
- [Game rules](docs/GAME_RULES.md), [backend freeze](docs/BACKEND_FREEZE.md), [security review](docs/SECURITY_REVIEW.md)

Submission deadline supplied by the owner: **October 23, 2026, 15:00 UTC**. Confirm organizer requirements and acceptance of a simulated public demo plus genuine local evidence. Hosting, repository publication, video upload and submission each remain unperformed and require approval.

# Task 4K — Judge demo and submission preparation

Prepared October 15, 2026. Deadline supplied by the owner: October 23, 2026, 15:00 UTC; organizer eligibility and acceptance of the proposed demo/evidence combination still require confirmation.

**Result:** judge instructions, accurate environment documentation, video outline, sanitized existing local evidence and an explicit staging plan are prepared locally. The public build remains a walletless simulation. No claim is made that a public demo, repository, video or live public-chain game exists.

## Walletless demo audit and preparation decisions

The existing Home disclosure, Adventure demo-stat label, simulated trail, base-effect preview and disabled on-chain action already distinguish simulation. No UI, font, styling, game rule or contract change was needed. A walletless visitor with no selected token can try all three interaction categories on the current encounter; completion or Skip reaches the original simulated preview. A selected token invokes the existing owner/network checks.

The judge guide explicitly separates the playable simulation from verified local contract features. Fixed demo stats/achievement marks are not earned progression. Character intentionally shows unavailable verified data; it is not populated with a fake diary. The real captured local evidence explains receipt-derived XP/Trust/Scars, the Ancient Gate reaction, emitted First Light, journal UTC/transaction evidence, historical owner B and new owner A. Transfer preserved the token's complete survivor state and daily lock, not a wallet account's score.

A fresh, no-wallet session is the shortest judging path. Refreshing returns to Home; in-app screens are not deep-link URL routes. Optional genuine Monad ownership reads are unnecessary for the simulation and do not enable game writes. The local evidence is clearly a fixture on isolated Anvil 31338, not a mainnet or remote test-network transaction.

## Files changed in Task 4K

| Files | Purpose |
|---|---|
| `README.md`, `frontend/README.md` | Current judge entrypoint, walletless setup, honest modes/limitations, transfer explanation, safe verification and local-state mutation warnings. Replaces obsolete production-address instructions while preserving historical frontend milestone notes as history. |
| `frontend/.env.example` | Explicit public demo mode, correct current variable guide, public-client credential warning; no address, authorization or live `.env.local` change. |
| `docs/HACKATHON_SUBMISSION_DRAFT.md` | Current pitch, simulation/evidence distinction, pending submission fields, preparation checklist; removes reset/time-advance/new-transaction recording instructions. |
| `docs/JUDGE_QUICK_START.md` | Concise no-wallet walkthrough, interactions, stats/reaction/achievement/journal comparison, ownership-transfer continuity and limitations. |
| `docs/DEMO_DEPLOYMENT_GUIDE.md` | Exact build settings, local versus public environment matrix, safe verification commands and deployment/publication approval boundary. |
| `docs/DEMO_VIDEO_OUTLINE.md` | Three-minute narration/capture plan using existing recorded evidence, never fabricated live confirmations. |
| `docs/TASK_4K_STAGING_PLAN.md` | Explicit required untracked source/tests, pre-existing modified files, optional tooling, excluded generated/private files and release-gated artwork/screenshots. No staging performed. |
| `docs/evidence/task4h-2006/README.md` | Captured lifecycle, before/after state, evidence provenance and screenshot caveats. |
| `docs/evidence/task4h-2006/verification.json`, `SHA256SUMS.json` | Allowlisted existing real local receipts/logs/state and payload-integrity manifest. No browser state, keys or execution scripts. |
| `docs/evidence/task4h-2006/confirmed-reaction.png`, `inherited-journal.png`, `wallet-a-daily-lock.png` | Three unchanged existing captures, about 3.2 MB for the entire evidence package. Approval-gated public redistribution; no generated/replacement artwork. |
| `frontend/public/licenses/LilitaOne-OFL.txt` | Exact copy of the already bundled OFL notice, emitted with the public build; no font file/style modification. |
| `docs/TASK_4K_PREPARATION.md` | This report. |

There are 16 Task 4K files, including this report and the three copied screenshots. The Task 4J audit is unchanged. Earlier uncommitted frontend work is preserved; its full source set still needs review before a release revision can be reproduced from Git.

## Evidence and security review

- Curated only the completed real Task 4H record: two successful receipts, 22 recorded checks, identical after-action/after-transfer character state and zero additional Adventure transactions. Original hashes and state are retained. The four evidence payload hashes match the copied bytes.
- Reviewed all three screenshots: they show the game and public development addresses, not wallet secrets. The original reaction screenshot contains the stale-day background discovered in Task 4H; its caption documents that fact. Task 4I's regression evidence, rather than this historical image, verifies the fix.
- A bounded source scan and 15-commit reachable-history pattern scan found no non-fixture PEM/private-key/provider credential candidates. The known public Anvil mnemonic remains in the pre-existing local Task 12 harness and is explicitly classified as a development fixture. No secret value is reproduced in the preparation docs.
- This is a heuristic/manual review, not a dedicated secret-scanner certification. Dependencies, binary content, build/cache/report folders, unreachable Git objects and unknown credential formats are not exhaustively covered. Dedicated final release/history scanning remains a pre-publication gate; no scanner or package was installed.
- Existing ignore rules cover local env, dependencies and common generated outputs; they do not remove previously tracked material. `VITE_*` settings are always client-visible. No new generated build folders, private env files or temporary execution scripts are proposed for staging.
- Before/after hashes confirm no modification to `frontend/src`, `frontend/scripts`, `src` or `script`, including all existing fonts, images, contracts, mini-games and transaction code. Frozen contract SHA-256 is unchanged: `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.
- Git index remains empty. No commit, push, remote creation, publication, contract/frontend deployment, live RPC write, chain time change or Anvil restart/reset occurred.

## Verification results

| Check | Result |
|---|---|
| Explicit public/demo production build | Passed: `tsc -b && vite build`. Existing PURE annotation and >500 kB JS chunk warnings remain non-blocking; main JS approximately 560 kB / 173 kB gzip. |
| Current local `.env.local` frontend run | 373 passed, 0 failed, 0 skipped, 22 files. Deterministic test baseline with explicit local suites is preserved. |
| Explicit production/demo frontend run | 373 passed, 0 failed, 0 skipped, 22 files. |
| TypeScript | Passed: `npm run typecheck`. |
| Full existing mock Chromium regression | 515 passed, 0 failed; all 18 configurations, keyboard/touch, reduced motion, existing fonts, mobile layouts, mocked rejection/confirmation, journal and immediate rollover lock. |
| Built-artifact walletless Chromium check | 44 passed, 0 failed at 320/375/768/1440px; four screens, images/no overflow, walletless three-card Skip-to-simulation flow, no confirmation prompt, local display font and exact license notice; no uncaught errors or missing runtime assets. External requests blocked. |
| Font/license preservation | Existing source hashes unchanged; emitted `/licenses/LilitaOne-OFL.txt` is byte-identical to the original OFL. |
| Evidence consistency | Both recorded receipts successful; before/after state equal; all four payload hashes match. No new transactions. |
| Documentation/index/diff checks | Local links and documentation whitespace passed; `git diff --check` passed; no staged files. The copied OFL retains two original trailing spaces intentionally so the notice stays byte-identical. |

Exact frontend commands and environment overrides are in the [deployment guide](DEMO_DEPLOYMENT_GUIDE.md#verification-without-live-chain-mutation). Build used explicit `VITE_CHOG_ENV=production` with Monad override and all local fields cleared, rather than trusting a developer `.env.local`. The mock browser script intercepts RPC and wallet requests; its “confirmed” outcomes are test fixtures, not additional real Anvil transactions.

Temporary verification logs are `/tmp/chog-4k-build.log`, `/tmp/chog-4k-tests-local.log`, `/tmp/chog-4k-tests-production.log`, `/tmp/chog-4k-typecheck.log`, `/tmp/chog-4k-browser.log`, `/tmp/chog-4k-static-browser.json` and `/tmp/chog-4k-security.json`. Only curated evidence is proposed for a durable release; do not stage temporary logs wholesale. No Foundry rerun was needed for this documentation/license-only change; Task 4J's separate result was 39 passed and six optional fork tests skipped.

## Remaining blockers

1. **Artwork release/rights approval:** existing environment, fog and refined survivor WebP/PNG assets, plus screenshots containing them, remain marked provisional/not release-approved. The superseded creature draft and unrelated design reference also need redistribution review if included in a public repo. Exact paths are in the staging plan; no asset has been replaced or generated.
2. **Complete reviewed source revision:** required recent components/helpers/tests/styles remain untracked and earlier changes remain uncommitted. Review the explicit staging list before creating a commit. This task does not stage or commit them.
3. **Final security/release review:** dedicated secret/history scan and approval of the artifact/revision, artwork, notices, destination and environments.
4. **Public URLs:** no public demo, verified GitHub repository or final video URL is supplied. Provider account/destination and publication permission are pending; remove any authentication wall before judging.
5. **Video and organizer confirmation:** the video outline is ready, not a finished recording. Use existing real footage or clearly labeled recorded receipts/screenshots; no new chain action is authorized. Confirm the supplied deadline, eligibility and acceptance of local evidence paired with simulation.
6. **External/mobile-wallet limits:** no approved public test-network game exists. Optional RPC/metadata, existing remote fonts and injected mobile wallet support need separate-device verification after deployment; they are not required for walletless simulated play. A public frontend cannot reach this workstation's localhost Anvil.

## Exact next deployment steps — approval required

1. Resolve the release blockers, review every explicit source/evidence path and approve a complete revision. No broad `git add .`, auto-push or repository import is proposed. Commit/push/publication require their own authorization.
2. Build the approved source using the exact public environment matrix and existing lockfile. Review the actual `dist` artifact and license notice. Do not include `.env.local`, node data or workspace contents as website files.
3. Choose one destination. Proposed Vercel settings: root `frontend`, Vite, Node 22, install `npm ci`, build `npm run build`, output `dist`; all environments explicitly select `VITE_CHOG_ENV=production` and omit local fields. Netlify equivalent: base/package `frontend`, build `npm run build`, publish `dist`, or upload only the approved static artifact. No new dependency, backend, testnet or contract is needed.
4. Obtain explicit approval of the **exact artifact/revision, hosting account, project and public visibility before deploying even a preview**. Repository/evidence/video publication is separately approval-gated. No deployment command was run.
5. Once separately authorized and deployed, test the exact HTTPS URL from another network/private window: four button-based screens, all three interactions, Skip, simulation notices, assets/fonts/license, no localhost dependence, no game write prompt, responsive/keyboard/reduced-motion/audio behavior and no login wall.
6. Create/approve the final three-minute video and sanitized public materials, replace every submission placeholder and independently verify demo/repository/video links before the confirmed deadline.

## Chogathon focus and stopping point

Novelty (30%) is demonstrated by genuine token-bound transfer continuity; Fun (20%) by immediately accessible existing interactions; Retention (20%) by the persistent daily survivor and journal explained through evidence; Clarity (15%) by separating simulation from confirmed state; Execution (15%) by complete source, tested static output and explicit release gates. No Hall of Fame, new gameplay or new deployment is added.

Preparation stops here. The next decision is release/artwork review and approval of a concrete staging/revision/deployment proposal, not additional game implementation.

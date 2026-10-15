# Task 4J — Judge Access and Deployment Audit

Audit date: October 15, 2026. Submission deadline supplied by the project owner: **October 23, 2026, 15:00 UTC**. The deadline and organizer submission rules were not independently verified in this audit.

**Recommendation:** release a clearly labeled, walletless, static demo after release approval, paired with a three-minute explanation and sanitized evidence of the existing real local-Anvil survivor lifecycle. Public demo interactions are simulated; the existing local receipts demonstrate actual contract behavior. No approved public game deployment was found. Hosting the current local-mode build would not make Anvil accessible to judges.

This task changes only this report. No frontend or contract deployment, repository publication, blockchain transaction, Anvil reset, dependency installation, font change, or gameplay change was performed.

## 1. Current architecture

| Area | Actual implementation |
|---|---|
| Frontend | React 18, TypeScript, Vite 6; Wagmi 2, Viem 2, TanStack Query 5. Installed dependencies and lockfile already exist. |
| Entry/build | `frontend/index.html` → `src/main.tsx` → `App.tsx`. `npm run build` runs `tsc -b && vite build`; output is `frontend/dist`. Node 22.23.2/npm 10.9.8 were used successfully. No backend, database or server runtime is required for the demo. |
| Navigation | Home, Adventure, Character and Settings are React state transitions in `App.tsx`, not pathname routes. `/` is the entry URL; `/adventure` and `/character` are not implemented deep links. Refresh returns to Home and clears the selected token. Do not advertise separate page URLs. |
| Game loop | Three existing choice cards → configured Survivor's Trial/Timing/Story interaction → completion or Skip → preview. `LocalContractAdventure.tsx` additionally performs guarded wallet confirmation, receipt verification, authoritative refresh and confirmed reaction. |
| Persistence | Contract state and events are token-bound. Demo stats do not progress or persist. Audio preferences are browser-local; App screen/token selection is in memory. |
| Contract | Frozen `src/ChogSurvivor.sol`, Solidity 0.8.28, Foundry; unchanged SHA-256 `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`. Depends on the fixed NFT collection's `ownerOf`. |
| History | `survivalHistory.ts` reads approved local `AdventureResolved`/`AchievementEarned` logs from the configured deployment block, verifies event data and reports incomplete/error states. `SurvivorJournal.tsx` distinguishes current owner from historical acting owner. No simulated history is substituted in Character. |
| Authorization | Current NFT owner only; one confirmed action per token per contract UTC day. Transfer preserves state and lock. Task 4I now derives Adventure eligibility from a block-pinned contract preview and refreshes immediately after confirmation. |

### Environment matrix

`frontend/src/contracts.ts` is the effective authority, rather than the comments in `.env.example`.

| Mode | Configuration | What judges would receive |
|---|---|---|
| Production/default demo | `VITE_CHOG_ENV=production` or no local opt-in. `approvedGameAddress` is always undefined outside valid local mode. Optional `VITE_MONAD_RPC_URL`; default `https://rpc.monad.xyz`, chain **143**. | Walletless simulated Adventure, static demo HUD/achievement fixture and repeatable base-delta previews. Optional genuine canonical NFT ownership/discovery/metadata reads when a wallet is connected correctly. No production game writes, real game stats, verified reaction or journal. |
| Local contract | `VITE_CHOG_ENV=local`, exact `VITE_LOCAL_RPC_URL=http://127.0.0.1:8545`, valid local game address; history additionally needs deployment start block. Chain **31338**. | Real isolated contract execution with fixture NFTs, verified state, achievements, reactions and history. Requires the user's own localhost node and a funded local wallet. |
| Invalid local configuration | Local requested, but required values fail validation. | Configuration blocked; do not treat fallback production configuration as successful local play. |
| Unit tests | `vite.config.ts` explicitly fixes a production baseline; local suites opt in with environment stubs/mocks. | Deterministic tests independent of developer `.env.local`. This is intentional test isolation, not evidence of public-chain availability. |

The current ignored `frontend/.env.local` selects local mode, game **`0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`**, deployment block **4**. Vite loads `.env.local` during a production build too: **`npm run build` or `--mode production` alone is insufficient to override `VITE_CHOG_ENV=local`.** Explicit build-time environment settings are essential when building from this workspace.

`frontend/.env.example` still mentions a possible `VITE_CHOG_SURVIVOR_ADDRESS`; current code does not allow it to activate a production game. Correct this documentation in a separately approved readiness task rather than trying to enable production writes.

### Addresses, wallets and external services

- Canonical Chog Genesis address: **`0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`**. The local fixture is installed at the same numeric address on a different chain; it is not an authentic Chog Genesis NFT.
- Read-only Anvil checks during this audit returned chain **31338**, deployed game bytecode, matching `CHOG_GENESIS()` binding, and CHOG #2006 owner Wallet A **`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`**.
- Wallet B is **`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`**. These are public Anvil development accounts, not production identities.
- Wallet connection uses Wagmi's **injected** connector. There is no configured WalletConnect/deep-link onboarding. Desktop extension wallets are the established path; ordinary mobile browsers without an injected provider can still use the walletless demo. Real mobile wallet access requires separate verification.
- Genuine optional NFT reads require accessible HTTPS Monad RPC with browser CORS support. Discovery uses `tokensOfOwner` candidates, `balanceOf` and verified `ownerOf`, with bounded results and explicit partial/error states; it is not a global NFT indexer.
- Optional metadata uses `tokenURI`, HTTPS or an IPFS gateway (`https://ipfs.io/ipfs/`). Metadata never proves authorization and is not a license to display collection artwork.
- No approved public testnet game/NFT deployment, public game start block, or supported public testnet configuration was found. Chain 143 is mainnet, not a fallback test network. No Monad-mainnet RPC calls were needed for this audit.

## 2. Deployment blockers and readiness findings

### Submission blockers

1. **No verified judge-access URLs.** Submission draft demo, repository and video fields are placeholders; Git has no configured remote. Public availability cannot be claimed. Existing external URLs may exist outside this workspace, but none were supplied or verified.
2. **Release content is not committed.** Baseline Git status had **15 modified tracked files and 28 untracked entries**. Required imports such as `MiniGamePanel.tsx`, `SurvivorTrial.tsx`, `ConfirmedSurvivorReaction.tsx` and `useAdventureAvailability.ts` are untracked. A deployment of the current committed revision would omit recent work. Review and include the complete intended source set before approving an artifact or repository publication.
3. **Artwork release status remains unresolved in project records.** `frontend/ASSET_INVENTORY.md` explicitly marks runtime environment, creature and fog images as provisional/local-development and not release-approved. Obtain explicit release/rights sign-off for the exact assets and intended public uses; do not infer approval from their presence in the app. Authentic Chog artwork permission is separately unresolved. This audit grants neither permission nor a redesign mandate.
4. **Public demo does not demonstrate persistent progression by itself.** It can demonstrate interaction quality and documented choice trade-offs, but not confirmed reactions, earned achievements, journal growth or a transfer. Pair it with truthful local evidence/video and judge instructions explaining the split.
5. **Submission documentation needs updating.** README and submission draft still quote 124 frontend tests and older browser results. The draft's recording checklist proposes resetting Anvil and advancing time: it must not be followed under current restrictions. Preserve existing evidence; do not reset, change time or repeat transactions to manufacture a demonstration.
6. **Judge instructions and final three-minute video are not verified complete.** No finalized public video or judge-access guide was found. Keep the deadline supplied above visible in the release checklist.

### Technical findings

- Production build succeeds. No missing built runtime asset was found; all four navigation screens work in the built artifact. There is no `vercel.json`, `netlify.toml` or CI workflow; static hosting can be configured through the provider dashboard without new dependencies.
- Runtime assets are emitted under `/assets/`; deploy at the origin root with default Vite base `/`. Subdirectory hosting such as a project GitHub Pages URL needs a separately reviewed base configuration. Existing button navigation does not need SPA rewrite rules; future real pathname routes would.
- Existing fonts must remain untouched: local **Chog Adventure Display / Lilita One Regular, weight 400**, Adventure system-ui body/buttons, and existing **Cinzel**, **IM Fell English**, **Uncial Antiqua** and serif fallbacks where used. Sources are `adventure.css`, `styles.css`, `landing.css`, `character.css`, `audio-settings.css` and inherited mini-game styles.
- `styles.css` already imports Google Fonts. Existing typography has an external availability dependency; a strict CSP must allow the current font/style sources if exact rendering is required. Do not introduce replacement fonts. Local Lilita loads from the artifact; source includes `fonts/OFL.txt`, but Vite does not automatically emit that text file. Review license-notice inclusion in the public distribution without changing typography.
- Non-blocking build warnings: Rollup removes misplaced dependency PURE annotations; the main minified JS chunk is approximately **560 kB / 173 kB gzip**, exceeding Vite's 500 kB warning. No performance score or slow-network budget was measured. Optimization is optional after access and disclosure blockers.
- Some older evidence is tracked (`frontend/reports/task12/evidence.json`), but current Task 4H evidence resides in `/tmp`, not in a durable submission folder. Temporary artifacts must not be the only evidence retained.

## 3. Judge-access options

| Option | Credibility and feasibility | Recommendation |
|---|---|---|
| **A. Public static simulated demo** | Existing architecture supports walletless play immediately after build/release approval. Shows the current day's three choices and all three interaction categories, difficulties, keyboard/touch, Skip and simulated base effects. Never saves progression or requests a gameplay signature. Optional real NFT reads remain a separate read-only feature. | **Primary interactive URL.** Retain visible simulation disclosure. Explain that “LOCAL DEMO” names the simulation, even when served from a public HTTPS URL. |
| **B. Existing approved public test network** | None was found. Code explicitly restricts contract play to exact localhost Anvil. No configuration-only change can create an approved remote contract mode. | **Unavailable under current constraints.** Do not deploy new contracts, use mainnet, change addresses or claim remote writes work. |
| **C. Static demo plus existing local evidence/video and optional local setup** | Combines A with actual receipts, state continuity, verified journal screenshots and a concise video. Judges can play without owning an NFT or installing Foundry, then inspect the genuine token-bound lifecycle. README supports optional independent local reproduction in the judge's own isolated environment. | **Recommended A + C package.** No backend, RPC tunnel or new deployment is necessary for evidence. Local reproduction is optional, not a prerequisite to judging. |

Do not expose Anvil through a public tunnel. `script/local-anvil.sh` intentionally rejects remote endpoints; `LocalCanonicalTestNFT.mint` is deliberately unrestricted, and standard Anvil accounts/admin RPC are not safe shared public infrastructure. A public HTTPS frontend calling `127.0.0.1` targets the judge's computer, not this workstation, and can additionally encounter browser local-network or mixed-content restrictions.

### Honest judge walkthrough

1. Open the public demo URL at `/` in a private browser window; no wallet, funds or NFT required.
2. Choose **Enter the Wild**. Leave the NFT unselected for walletless exploration. Each of the three cards opens its existing themed interaction; choose difficulty where applicable, complete or Skip, then inspect the **simulation-only** preview.
3. Explain that displayed demo XP/Trust/Scars and achievement marks are fixture values; trying a choice earns nothing and creates no history. Character intentionally shows unavailable progression/history rather than substituting demo records.
4. Show the accompanying existing-Anvil evidence/video for genuine confirmation, reaction, First Light, journal attribution and transfer continuity. Clearly identify chain 31338 and the fixture NFT.
5. Optional genuine Monad ownership reads require an injected wallet on chain 143; selecting a token the wallet does not own disables Adventure choices. Judges do not need this path. Return to the fresh walletless session for the public simulation.

## 4. Exact deployment steps requiring approval

These are proposed steps, **not executed**. Build verification already ran locally; no provider account/project was created.

1. Resolve artwork/release sign-off, review the exact source set and sanitized evidence, and choose the approved revision and hosting account. Complete security review before authorizing repository publication.
2. Prepare an immutable release candidate containing all required tracked/untracked source files and the judge documentation. Retain the lockfile. Commit/push or publish only after explicit authorization; connecting a Git repository to a host can trigger immediate deployment.
3. For a clean checkout, use the existing dependency lockfile with `npm ci` in `frontend`. No new package is needed. Build from `frontend` with explicit demo settings:

   ```sh
   VITE_CHOG_ENV=production \
   VITE_MONAD_RPC_URL= \
   VITE_LOCAL_RPC_URL= \
   VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= \
   VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= \
   npm run build
   ```

   Empty Monad override selects the existing public HTTPS default for optional NFT reads. Never supply a private RPC credential through `VITE_*`; all such values are client-visible. Never upload `.env.local`, keys, `.git`, local node data or the whole working directory as the website.
4. **Preferred provider configuration after deployment approval:** Vercel project root `frontend`, framework Vite, install command `npm ci`, build command `npm run build`, output `dist`, Node 22 as tested, environment settings as above for every deployed environment. Keep the final judge URL publicly accessible without account/team authentication. Vercel supports Vite/static build configuration: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [build settings](https://vercel.com/docs/builds/configure-a-build).
5. **Equivalent alternative:** Netlify base/package directory `frontend`, build `npm run build`, publish `dist` relative to that directory; or upload only the approved `frontend/dist` artifact as a manual static deployment. No Netlify plugin is needed for this plain static artifact. See [Vite setup](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/) and [manual/new project options](https://docs.netlify.com/manage/projects/add-new-project/). Use one host, not both.
6. Approve the concrete artifact/revision, environment and destination **before** the first preview or public deployment. Separately approve publication of the repository/evidence/video; none is implied by approving a frontend audit.
7. After authorized deployment, verify HTTPS URL, JS/CSS/image/font responses, four navigation buttons, walletless mini-games/Skip, simulation disclosures, no local RPC dependence, no gameplay write path, no login wall, mobile/desktop behavior and external font loading from a separate device/network. Add the exact public demo/repository/video URLs to the submission. No such remote verification was possible before a URL exists.

No contract deployment, testnet onboarding, mainnet use or production authorization change belongs in this deployment procedure.

## 5. Security and disclosure concerns

- `.env.local` is ignored; only example env files are tracked. Current local env contains public RPC/address/block settings, not a signing key. No Git remote is configured. All build-time `VITE_*` data must be considered public regardless of Git ignore rules.
- A redacted pattern scan covered **129 project text files**, excluding dependencies, Git internals, build/cache/report directories and binary assets. It found hash-shaped literals but no PEM keys or recognized provider/GitHub/AWS credential tokens. Manual review identified the **standard publicly known Anvil test mnemonic in `frontend/scripts/task12-e2e.mjs:15`**. Its derived development accounts must never be funded or reused on public chains; it is not a production secret. No mnemonic or private key is reproduced in this report.
- A regex scan of **15 reachable Git commits** found no credential-shaped tokens, PEM private keys or literal private-key assignments. This is a limited heuristic check, not a security certification: arbitrary passwords, unknown secret formats, binary/LFS content, excluded generated files and unreachable Git objects were not exhaustively audited. Neither Gitleaks nor TruffleHog is installed; no scanner/dependency was installed. Run a dedicated secret scan of the final release/history before publication.
- Production output contains no current local game address and no source maps. Local RPC strings can remain in bundled library/local-mode code; their presence alone does not activate local mode. Behavior was checked through the actual built artifact.
- Do not publish `/tmp` wholesale or expose browser profiles, wallet state, RPC credentials, node data or developer scripts as hosted assets. Sanitize evidence deliberately.
- Generic RPC failures, wrong networks, rejected transactions and unknown ownership remain explicit unavailable states. Simulated play must never be described as a successful blockchain action. A local receipt hash has no Monad explorer proof.

## 6. Real local transfer evidence available

Existing `/tmp/chog-task4h/completed-evidence.json` reports a completed real local lifecycle with **22 checks**, two approved transactions and zero additional Adventure transactions. This audit read those records and verified the current owner/binding through read-only RPC; it did not rerun the lifecycle.

| Evidence | Actual recorded result |
|---|---|
| Survivor | CHOG #2006, local fixture, Anvil 31338 |
| Action | Wallet B `act(2006, 1)`; transaction `0xfcd6afa0d8d95283c407631dcd30685725be229e40826ff62f9346c6c44c1a9f` |
| Resolution | Ancient Gate, choice 1 / Solve the runes, outcome 10, UTC day 20741; 18 XP, 4 Trust, 0 Scars, streak 1, unmarked streak 1, achievement mask 1 / First Light |
| Transfer | Wallet B → Wallet A; transaction `0x8b3a59458ec349146bcf86c45141c14043561b8ee33779d91daacdf537516933` |
| Continuity | Recorded after-action and after-transfer character fields match, including daily-action day and achievement mask; historical actor remains Wallet B while current owner is Wallet A. |
| Screenshots | Existing `confirmed-reaction.png`, `journal-before-transfer.png`, `inherited-journal.png`, `wallet-a-daily-lock.png` under `/tmp/chog-task4h/` |

The initial Task 4H run found the stale daily-lock UI; its completed evidence followed recovery, and Task 4I subsequently fixed and regression-tested the defect. Preserve this provenance rather than presenting the earlier run as flawless. Current regression evidence includes immediate rollover lock verification, but it uses mocked browser RPC; it is distinct from the real Task 4H transactions.

Local evidence can support the pitch but is not a public network deployment or independently available explorer history. Copy reviewed evidence into a durable release evidence folder only in the next authorized preparation task.

## 7. Verification performed in Task 4J

| Check | Result and scope |
|---|---|
| Explicit production/demo build | **Passed**, `tsc -b && vite build`; 8 output files, no source maps, local game address absent. Existing dependency annotation and chunk-size warnings described above. |
| Frontend, current `.env.local` configuration | **373 passed, 0 failed, 0 skipped**, 22 files. Test config intentionally provides deterministic production baseline plus explicit local-mode suites. |
| Frontend, explicit production/demo environment override | **373 passed, 0 failed, 0 skipped**, 22 files. Same suite, separate run. |
| TypeScript | **Passed**, `npm run typecheck`. |
| Foundry | **39 passed, 0 failed, 6 skipped**, 45 total across 7 suites, `forge test --offline`. Six optional Monad-fork tests skipped without `MONAD_RPC_URL`; isolated test EVM only, no live-chain writes. |
| Built-artifact Chromium | **43 checks passed, 0 failed**, widths **320, 375, 768, 1440**. Four navigation screens, image loads, no page overflow, walletless choices, each Skip → simulation preview, no local-confirm button, local display font loaded, no missing runtime assets or uncaught browser errors. Reduced motion enabled; every external request blocked. |
| Static asset references | 6 distinct local asset references resolved; **0 missing**. Inline SVG filter fragments are not filesystem assets. Runtime consists of three WebP scenes, local TTF, CSS and JS chunks plus HTML. |
| Deployment configuration | Static app/root-directory/output requirements validated; no provider config or public URL available to verify. |
| Local RPC | Chain 31338, code present at configured game, matching canonical binding, #2006 owner A; reads only. |
| Secrets | Limited redacted source/history scans and manual test-mnemonic classification, as above. |
| Contract freeze / whitespace | Frozen source SHA-256 matches; `git diff --check` passed. |

Logs: `/tmp/chog-4j-build.log`, `/tmp/chog-4j-tests-local.log`, `/tmp/chog-4j-tests-production.log`, `/tmp/chog-4j-typecheck.log`, `/tmp/chog-4j-forge.log`, `/tmp/chog-4j-static-browser.json`, `/tmp/chog-4j-secret-scan.json`. These temporary paths are local audit artifacts, not judge links.

Task 4I's existing **515 Chromium checks** additionally cover all 18 demo configurations, keyboard/touch, reduced motion, font inheritance, local mocked rejection/confirmation, journal and immediate execution-day rollover. They were not rerun in Task 4J and must not be mislabeled as new or real-Anvil transactions. This audit's 43-check smoke uses the actual production build and does not test genuine external Google Font/Monad RPC availability or mobile wallet injection.

## 8. Prioritized Chogathon checklist

### P0 — Required before submission/public release

- [ ] Confirm deadline/registration and organizer acceptance of a simulated public demo paired with genuine local-contract evidence; do not assume this satisfies an unverified public-chain requirement.
- [ ] Resolve release/rights sign-off for the existing runtime artwork and retained font license notices.
- [ ] Review and commit the complete intended source set, including currently untracked required components; perform final dedicated secret scan and reproducible build.
- [ ] Obtain explicit approval for the selected host, artifact/revision and public deployment; publish a walletless HTTPS demo URL and test it off localhost, without a login wall.
- [ ] Obtain approval for repository publication; supply a public GitHub URL and verify clean-checkout instructions. A private checkout with no remote is not submission-ready.
- [ ] Add a short judge guide: no wallet/NFT/funds needed; enter from `/`; select a card, complete or Skip; previews are simulated and repeatable; real evidence is separate.
- [ ] Update README/env guidance/submission draft to current test counts and features; remove reset/time-advance requirements from the current demonstration plan.
- [ ] Preserve and sanitize Task 4H receipts/state/screenshots in a durable evidence folder, with chain/game/token/owner attribution and local-only caveats.
- [ ] Produce and verify an accessible **≤3-minute video**. Prefer existing real footage if available; otherwise truthfully show current UI and recorded receipts/screenshots with their dates. Do not fabricate live confirmations or execute new transactions without separate authorization.
- [ ] Replace every submission placeholder: demo, repository, video, team/contact and evidence. Test all links in a private window on a second network before October 23, 15:00 UTC.

### P1 — Final execution checks

- [ ] Repeat the full test/build/typecheck gates on the approved revision; retain exact results.
- [ ] Verify deployed desktop/mobile navigation, all three interaction types, Skip, Escape/focus, keyboard and touch, reduced motion and audio preferences.
- [ ] Verify existing rejection/RPC-failure/wrong-network/non-owner safeguards remain intact; keep public demo independent of optional NFT reads.
- [ ] Confirm no `localhost` dependency in the judge's required flow and no game write request in production/demo mode.
- [ ] Verify existing remote fonts, local font license delivery and runtime assets on the selected host; preserve exact typography.
- [ ] Ensure video/evidence clearly show the NFT retaining progression, achievements, history and daily lock after transfer, with old/new controllers distinguished.

### P2 — Optional after blockers

- [ ] Consider bundle splitting or image-delivery tuning if measured loading is poor; no redesign or font replacement.
- [ ] Add concise root-page social metadata or CI checks if time permits.
- [ ] Consider a separately labeled evidence link from judge documentation. Do not add fake journal entries, new game systems, public Anvil hosting or a new contract deployment for judging convenience.

## 9. Judging alignment and recommended next task

- **Novelty 30%:** lead with the transferable token ID as the survivor; use real transfer evidence to demonstrate why the NFT is essential.
- **Fun 20%:** let judges immediately try the existing Survival Trial, Timing and Story interactions without wallet setup.
- **Retention 20%:** explain token-bound daily decisions, streaks, achievements and accumulated diary; do not claim the public simulation earns them.
- **Clarity 15%:** keep simulation, real local receipts and optional genuine NFT ownership reads visibly distinct; one primary demo URL and a short video.
- **Execution 15%:** prioritize a complete release artifact, honest access instructions, preserved evidence, tested responsive behavior and predictable failure handling over new features.

**Recommended next implementation task: “Task 4K — Judge-access release preparation, without deployment.”** Scope: update README/env/submission instructions, write the short judge walkthrough, curate sanitized existing Task 4H evidence, include required license notices and resolve recorded artwork release status with the owner. Review the full intended source set and rerun release gates. Produce a concrete artifact/revision/environment/host proposal for approval as the final step. No new gameplay, contract work, mainnet activity, time changes, frontend deployment or repository publication is included until explicitly authorized.

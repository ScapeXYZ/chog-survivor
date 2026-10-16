# Task 5A — Final demo release review

Date: **2026-10-16 Africa/Lagos**; network captures began 2026-10-15 UTC. Deadline supplied by owner: **2026-10-23 15:00 UTC** (16:00 Lagos). Organizer eligibility/deadline acceptance was not independently confirmed. Work is a local review candidate: **no commit, push, transaction, contract deployment, new Vercel release or publication was performed**.

## Decision

**GO for private demo recording/preparation**, using the clearly labeled walletless simulation and already captured historical local-chain evidence. Navigation, interactions, layout, artwork, typography and audio pass the checks below. A three-minute plan and guarded Playwright capture workflow are ready.

**NO-GO for mainnet deployment.** Genuine-holder compatibility has improved evidence, but collection source/governance/restrictions, Monad deployment toolchain readiness, production frontend integration, official security-provider review and explicit deployment approval remain open. No simulated result can stand in for a real transaction.

**Public submission/video release remains conditional**, even though the repository and static site are already publicly reachable: final artwork/branding permission, official warning follow-up, organizer acceptance, team/contact details and final video review/publication approval remain necessary. A public site existing does not itself close those review gates. Never bypass wallet warnings for judges or footage.

## Current branch and deployed artifact

Fetched `origin/main`; local `main` and remote both identify **`ac0029fb294fa3754a959ee48cc25e842ed98d6f`** before this work. The only initial uncommitted file was `frontend/src/App.tsx`, containing optional-wallet disclosures from the earlier task. It was inspected and preserved, with clearer simulation/disabled-transaction wording added.

Unauthenticated GitHub API access returned `private: false`, `visibility: public`, default branch `main`. Public URL: **https://github.com/ScapeXYZ/chog-survivor**. HTTPS homepage **https://chog-survivor.vercel.app/** returned 200 without a redirect/authentication wall, and independent Chromium access succeeded.

Live entry assets are `/assets/index-D82iYTir.js` and `/assets/index-C9o6GoDU.css`. Retrieved JS SHA-256 is **`92ce2d2d45e6b5cc2aaf3edcb1b3cd5b95878da7c6370df2e5c415e084c3bf77`**, matching Task 4W's capture. The public asset name also matches the Task 4X build of the unchanged application source. **An exact hosting deployment Git SHA is not independently exposed by these checks**; matching assets are not proof of Vercel project settings or revision metadata. The local candidate's changed disclosures/title have not been deployed.

Hosted Vercel root directory, Node version, environment variables, team overrides and deployment metadata remain unverified. The checkout was previously found unlinked; no project linking or hosting operation was attempted. Remedy: owner supplies a redacted Production-settings/revision export or explicit read-only access; verify root `frontend`, Node 22, pinned public build command and inherited variables. No secret values are needed.

## Prioritized release fixes

| Priority | Finding | Remedy / status |
| --- | --- | --- |
| P0, mainnet | No approved production game deployment or enabled write/history path | Keep disabled. Complete collection/security/toolchain gates, separately approve exact deployer/artifact/fees/address, then separately review production frontend integration. No environment-only shortcut. |
| P0, wallet trust | Reported MetaMask/Blockaid warning lacks exact detection evidence and official disposition | Capture warning/provider/version/time and request official review. Do not call it a confirmed false positive or disable warnings. No real-wallet connection is required for recording. |
| P1, fixed locally | README, judge guide, deployment guide and submission draft said demo/repository were unpublished | Replaced with independently accessible public links and explicit limits. Historical reports remain historical. Final video/team fields remain pending. |
| P1, fixed locally | Homepage optional-wallet explanation was only in an uncommitted candidate and did not explicitly name all requested limitations | Candidate now states simulation, optional ownership verification and disabled production game transactions; wallet tooltips retained. Regression test asserts visible copy and no automatic connection. |
| P1, fixed locally | Browser title said Local MVP, with no simulation caveat in search metadata | Updated title/description to Public Simulation and disabled-transaction scope. No game design, fonts or artwork changed. |
| P1, recording | Existing video outline used older timing and needed a precise evidence sequence | Added the requested 180-second storyboard, narration, receipts, capture/editing instructions and honest local-evidence captions. Original outline links to the new plan. |
| P1, release | Provisional asset/Chog branding clearance remains conditional in Task 4S | Owner obtains written clearance for exact runtime images/screenshots/video use and reference/account rights. No art replacement or permission inference from NFT ownership. |
| P1, submission | Organizer acceptance, team/contact and actual final video are pending | Confirm eligibility and deadline; record/edit/review locally, then request publication/submission approval. |
| P2 | Public HTML has HSTS but no observed CSP, Referrer-Policy or X-Content-Type-Options | Plan/test compatible headers in a separate hosting change. Existing Google Fonts, Monad RPC and allowed metadata must keep working. Missing headers are not an established warning cause. |
| P2 | Existing JS chunk >500 kB and vendor annotation warnings | Build succeeds; no dependency/code-splitting churn introduced before filming. Consider measured optimization after this release review. |

## Wallet and gameplay boundaries

Production uses Monad **143**, canonical Chog Genesis **`0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`**, public RPC, injected wallets and a hard-disabled production game address. Header and hero connection buttons only connect on explicit click. There is no automatic chain switch, message/typed-data signature, NFT approval, token transfer or production game-write request. Passive account/chain queries and explicitly requested wallet permissions remain distinct. Browser tests exercised both connection buttons, rejected permissions and wrong network using intercepted providers, never a genuine signing wallet.

**Enter the Wild works without connecting.** Demo HUD, chronicle and previews remain clearly simulated and unsaved. Interactions do not change rewards, choice IDs or daily rules. Character does not replace unavailable genuine progression/history with fixture values. Optional collection reads still verify ownership; connected non-owner/unverified selection restrictions remain intact.

NFT-keyed state, journal, achievements, UTC daily lock, transfer inheritance and frozen authorization remain unchanged. The existing local contract mode remains available on chain 31338; tests use mocks or ephemeral Foundry execution, not the existing Anvil node. Historical #2006 receipt/state/screenshot hashes all match the retained manifest. Its action and transfer are not repeated for filming.

See [mainnet/NFT eligibility](TASK_5A_MAINNET_ELIGIBILITY.md) for fresh read-only chain/code/owner evidence, six successful genuine-collection fork tests and the 1,510,761-gas read-only deployment estimate. Technical eligibility does not imply mainnet launch approval.

## Security findings and provider escalation

Fresh MetaMask public config check found no exact or parent-domain blacklist match for `chog-survivor.vercel.app`. This is a bounded public-list check, not full fuzzy detection, a Blockaid proprietary verdict, or clearance from every provider. No genuine MetaMask warning screenshot/reason, extension version or provider case was supplied. Mocked browser success cannot reproduce its reputation decision.

The reviewed application flows contain no observed malicious request/redirect or unsafe external script. Existing Google Fonts are CSS/fonts, not injected executable third-party scripts. NFT metadata is parsed as data over restricted URL schemes and is not an ownership oracle. External service availability/privacy and inaccessible hosted variables remain limitations. Credential-pattern scans are heuristics, not a full historical secret audit.

[MetaMask's official website-warning guidance](https://support.metamask.io/stay-safe/safety-in-web3/deceptive-site-ahead-when-trying-to-connect-to-a-site/) describes URL/provider analysis and directs owners to [eth-phishing-detect issues](https://github.com/MetaMask/eth-phishing-detect/issues). If Blockaid is named, use [its report portal](https://report.blockaid.io/). A transaction-specific false-classification portal is not a substitute for identifying a website warning. The [Task 4W audit](TASK_4W_WALLET_AND_SECURITY_AUDIT.md) contains the full appeal checklist.

Exact remedy: obtain the warning image/text, domain/path, UTC time, wallet version/platform, triggering action and provider reason/case ID; submit a truthful domain-owner review with repository URL, deployed JS hash and read-only request inventory. Request the actual trigger and official disposition. Do not assert a confirmed false positive, ask users to bypass it, change domains to evade it, or submit an appeal automatically. No appeal or message to a third party was sent.

## Verification results

| Check | Current result and boundary |
| --- | --- |
| Frontend tests, existing local environment | **22 files / 375 passed** |
| Frontend tests, explicit production overrides | **22 files / 375 passed** |
| Production build | Pass: TypeScript and Vite; final simulation metadata/disclosure included |
| Local-config build | Pass to `/tmp/chog-5a-local-dist`; production `dist` kept separate |
| `forge test --offline --gas-report` | **39 passed, 0 failed, 6 opt-in fork tests skipped**; isolated EVM, no Anvil |
| Opt-in `MonadForkIntegrationTest` | **6 passed, 0 failed, 0 skipped**; read-only remote RPC, in-memory writes/transfers only |
| Existing interaction Chromium suite | **515 checks pass**: all 18 choice interactions, Trial difficulties, Timing/Story, keyboard/touch, reduced motion, mobile, fixture rejection/confirmation, journal and rollover lock |
| Production preflight with existing remote fonts | **49 pass** at 320/375/768/1440 px; four screens, three simulated previews, image/font/license/artifact checks |
| Final production desktop/mobile browser | **38 pass** at 1440×1000 and 375×812; actual fonts, moving/untimed Timing, Trial/Story completion, fog motion, navigation/images; no wallet/RPC request |
| Separate live desktop/mobile browser | **38 pass**, same scope against current Vercel artifact, not local candidate |
| Optional wallet smoke, local production and live | **26 pass each**, permissions only after explicit intent; no signing/approval/switch/transfer/game-write methods |
| Existing audio Chromium suite | Pass: synthesized samples after gesture, one audio context across navigation, mute/unmute/channel behavior and persistence; eight Settings widths from 360 to 1920 px |
| Dependency security checker | **73 checks pass** |
| `npm audit --json` | **0 vulnerabilities**, all severities |
| Tracked-text secret heuristics | **154 tracked text files plus all 17 changed/new files checked, zero matches** for tested private-key/credential patterns; excludes vendored `lib` and >2 MB/binary files |
| Final production artifact extended checks | **10 pass**: no loopback/private-network URLs, local game address, tested credentials/mnemonic, env/maps; explicit simulation and disabled-transaction copy and title present |
| Protected-source review | No diff against origin for frozen contract, Foundry configuration, artwork, CSS/fonts, package/lockfile; frozen SHA-256 unchanged |
| Historical #2006 evidence | All four files match their SHA-256 manifest; no alteration |
| Whitespace review | `git diff --check` passes |

Vitest intentionally pins a read-only baseline regardless of `.env.local`; local-specific suites explicitly opt in with mocks. Running the suite under both environment selections does not mean it connects to Anvil. Local-config build is a compile check, not an Anvil session. Browser confirmations in the 515-check suite are mocked and must never be used as real transaction footage. Genuine-collection fork results remain simulations over remote state, distinct from historical #2006 receipts.

A new browser font assertion initially requested an unconfigured 400-weight Cinzel face; it was corrected to load/check the existing 600-weight face, with no font change. The final browser suites pass. Build retains existing vendor `PURE` annotation and large-chunk warnings. Chromium and network checks required approved sandbox escalation; no security warning was disabled.

## Reproduction

From project root:

```sh
git diff --check
forge test --offline --gas-report
MONAD_RPC_URL=https://rpc.monad.xyz forge test --offline --match-contract MonadForkIntegrationTest -vv
```

The fork command makes read-only network requests and executes simulations locally. Never add `--broadcast` or substitute the real-Anvil scripts.

From `frontend`:

```sh
npm test
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm test
npm run build -- --outDir /tmp/chog-5a-local-dist
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
node scripts/dependency-security-check.mjs
npm audit --json
node scripts/mini-game-integration-smoke.mjs
node scripts/public-demo-preflight.mjs --allow-fonts
node scripts/final-demo-browser.mjs
node scripts/final-demo-browser.mjs --live
node scripts/wallet-access-smoke.mjs
node scripts/wallet-access-smoke.mjs --live
```

The existing audio script was run from a temporary copy with output redirected to `/tmp/chog-5a-audio`, preserving any repository reports. Its source was not changed. Local evidence/logs use `/tmp/chog-5a-*`; durable read-only network evidence is under [docs/evidence/task5a](evidence/task5a/). These files contain public addresses/bytecode, not signing keys. Existing full gas/interaction logs are local artifacts, not publication links.

## Deliverables and remaining approval boundary

- Corrected README, judge guide, deployment guide and submission draft; historical video outline links to the new plan.
- Safe homepage disclosure/tooltips and browser-title/description changes, with unit regression coverage.
- [Mainnet and genuine-holder report](TASK_5A_MAINNET_ELIGIBILITY.md), read-only bytecode/response/estimate evidence.
- [Three-minute storyboard, narration and Playwright/Remotion instructions](TASK_5A_VIDEO_STORYBOARD.md), plus guarded desktop/mobile browser/capture script. Playwright and FFmpeg are installed; Remotion is not installed. The recording workflow was executed successfully: two private raw WebM simulation clips (21.8 s desktop, 18.08 s mobile) are under `/tmp/chog-5a-recording`; FFprobe confirmed playable container metadata. No final edited video or upload is claimed.

Review this local diff before choosing files for a later commit. Nothing is staged, committed or pushed by Task 5A. A new public frontend release, contract deployment, signing/transaction, video upload and submission each remain subject to explicit approval.

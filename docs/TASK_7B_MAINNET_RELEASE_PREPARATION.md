# Task 7B — mainnet integration and release preparation

2026-10-16. **GO for the prepared local release candidate. NO-GO for GitHub push, source submission, Vercel publication or public mainnet activation until separate owner decisions.** No mainnet transaction, signature, source upload, commit, push, Anvil reset or website publication occurred. This is a self-review and test record, not independent auditing or official wallet-provider clearance.

## Work already completed in Task 7A — reused

Read [Task 7A](TASK_7A_POST_DEPLOYMENT_VERIFICATION.md) and inspected the current repository, manifest, ABI, environment guards, wallet/write/history flows, source-verification input, documentation and Git history. All **41** Task 7A packet hashes matched **before** Task 7B edits; the Task 7B starting tree is recorded in [start-tree.json](evidence/task7b/start-tree.json).

Task 7A already established finalized deployment through two providers, exact full creation/runtime parity, immutable NFT binding, transaction/candidate parity, and actual deployment fee/reserve. It populated the manifest/receipt, updated README/judge/submission/deployment links, prepared and locally reproduced the exact explorer Standard JSON, and tested both frontend modes. **Those deployment checks, source compilation and documentation sections were not recreated or repeated.** Task 7B's live browser smoke is new frontend integration coverage, not another deployment-verification run.

| Canonical integration | Value retained unchanged |
| --- | --- |
| Game | [`0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code) |
| NFT | `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Chain / deployment block | **143 / 113947533** |
| Deployment transaction | [`0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956`](https://monadscan.com/tx/0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956) |
| Runtime Keccak-256 | `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` |
| Frozen source SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |

README, judge guide, Chogathon draft and deployment guide already accurately distinguish the deployed game from the simulation-only public website. Their Task 7A sections were retained without another rewrite. No Phantom-specific or universal-wallet compatibility claim is present in those release documents. Hosted revision/provider settings were not changed or newly re-attested.

## Remaining gaps closed in Task 7B

1. Added one shared, visible **unaudited/immutable-contract risk notice** in Settings and before real-mode actions. It states that actions cannot be paused/reversed, governance/custody is incompletely attested, no official wallet-provider clearance is claimed, and warnings must not be bypassed. This supplements existing documentation without altering mechanics, layout design, fonts or artwork.
2. Extended the existing mainnet browser harness to test the **exact built release artifact**, avoiding another browser-only rebuild. Fixed a desktop assertion that accidentally checked MetaMask twice rather than checking both discovered wallet choices. Added actual `chainChanged` event coverage: wrong network blocks actions without automatic switching or writing; returning to 143 restores eligible reads. Synthetic MetaMask is selected on desktop and Rabby on mobile; the unselected provider must not be called.
3. Added a **fresh-directory, explicit-environment local candidate builder**. It builds production simulation and mainnet candidates separately and records per-file SHA-256 plus inventory hashes. This avoids Task 7A's inherited-environment/stale-output pitfalls. It has no deployment/hosting/RPC command.
4. Added an **actual frontend live-read browser smoke** with a public-address observer and an enforced read-only RPC/selector/address allowlist. It checks current full runtime, real NFT ownership, actual deployed profile/binding reads and a bounded history page. There is no signer; the observer cannot sign, switch chains, approve or send. Fonts/metadata outside the local origin and fixed Monad RPC are blocked. This is not genuine MetaMask acceptance or proof of custody/account control.
5. Added an **offline integration audit** that compares source constants and manifest/receipt to Task 7A, ABI selectors/input types and read tuple layouts to the frozen artifact, public hosting's simulation guard, and the existing source-verification input. The encoding-only `act` ABI intentionally omits its unused return; final progression comes from validated receipts/events rather than a simulated return. No ABI or Solidity change was needed.

## Exact Task 7B modified files

Existing files modified relative to the captured Task 7B starting tree:

- `frontend/src/GameContractInfo.tsx` — displays shared risk notice.
- `frontend/src/LocalContractAdventure.tsx` — displays the notice before mainnet actions; transaction logic unchanged.
- `frontend/src/MainnetContractAdventure.test.tsx` — checks the disclosure in the existing guarded-action test.
- `frontend/scripts/mainnet-enabled-browser.mjs` — existing-artifact input, both-wallet assertion, network-change and risk-disclosure checks.

New implementation files:

- `frontend/src/MainnetRiskNotice.tsx`
- `frontend/scripts/task7b-build-candidates.mjs`
- `frontend/scripts/task7b-mainnet-readonly-browser.mjs`
- `frontend/scripts/task7b-audit-integration.mjs`

New documentation/evidence: this report and `docs/evidence/task7b/`. [Change inventory](evidence/task7b/change-inventory.json) lists every file and hash; [Task 7B patch](evidence/task7b/task7b-existing-files.patch) isolates edits to the four existing files from earlier dirty-tree work. Evidence manifests/checksum files identify their own scope to avoid self-hashing cycles. No earlier file was deleted or reset.

**Unchanged:** verified deployment manifest/receipt, frozen Solidity/artifact, actual addresses/chain, game data/rules, artwork/fonts/licenses, dependency/lockfiles, environment variables and `frontend/vercel.json`. Prior Task 7A evidence remains historical; its two included, deliberately edited tool/UI file hashes now describe the earlier version. All other Task 7A packet entries remain unchanged.

## Integration and gameplay/security validation

[Offline integration audit](evidence/task7b/integration-audit.json): correct source manifest is loaded; chain **143**, genuine collection and deployed game are exact; environment addresses cannot override the manifest. An explicit `VITE_CHOG_ENV=mainnet` is additionally required. The mainnet candidate still starts in simulation, and real mode requires an explicit switch. The checked-in Vercel command still forces **production simulation** and clears local/RPC overrides. No hosting config was changed to activate public gameplay.

The full frontend suite covers NFT identity verification, wrong/unknown chain, stale ownership, transfers, stats and progression mappings, daily/rollover locks, XP/Trust/Scars/streaks, achievements and titles, current-owner write authority, token-attached history, rejected/reverted/pending/timed-out transactions and receipt/event canonicality/finality. Existing Character cases explicitly map all CharacterView fields/title and retain token identity after a transfer; Adventure cases verify that only matching confirmed events establish rewards. These are test fixtures; no transfer or action was sent on mainnet. Frozen Solidity/unchanged Forge suites were not rerun; their prior evidence remains applicable.

The actual write boundary remains `act(tokenId,choiceId)` only, to the verified game and origin account on chain 143, after fresh runtime/NFT binding/owner/day/preview checks, simulation, gas estimation and separate explicit confirmation. It requests no NFT approvals, staking, deposit, additional value or wallet secrets. Receipt timeouts retain the hash; operators must inspect it before retrying. Account/token/network changes invalidate contexts. A standard wallet confirmation signs and broadcasts; this task never requested one from a genuine wallet.

## Release test results

| Check | Result / evidence |
| --- | --- |
| Full relevant frontend suite | **24 files / 391 passed**, [log](evidence/task7b/frontend-tests.log) |
| TypeScript + production simulation build | **PASS**, [log](evidence/task7b/production-build.log) |
| TypeScript + mainnet build | **PASS**, [log](evidence/task7b/mainnet-build.log) |
| Mainnet exact-artifact browser | **33 checks passed**, [log](evidence/task7b/mainnet-browser.log), desktop 1440/mobile 375; synthetic MetaMask/Rabby, wrong network, runtime mismatch, ownership transfer, explicit rejection, walletless navigation/history |
| Mainnet live read-only browser | **10 checks passed**, [result + public RPC transcript](evidence/task7b/mainnet-readonly-browser.json); actual frontend reads and first bounded live history page; no signing/write methods permitted |
| Simulation exact-artifact browser | **49 checks passed**, [result](evidence/task7b/simulation-browser.json), widths 320/375/768/1440; walletless navigation, assets, no overflow or page errors, loopback/credential artifact guards |
| Offline manifest/ABI/source-package audit | **PASS**, [result](evidence/task7b/integration-audit.json) |
| Syntax / whitespace / preservation | Node scripts parse; `git diff --check` passes; [inventory](evidence/task7b/change-inventory.json) records preservation and exact changes |

Existing Vite vendor PURE-annotation and >500 kB chunk warnings remain; no build/test errors remain. No dependencies were installed or changed. The live harness initially assumed no passive wallet probes; corrected to distinguish `eth_accounts` from explicit permission requests. It then needed explicit observer selection in the multi-wallet chooser. Retained failed-harness logs show both issues; final live result passed. These were harness issues, not a production transaction failure or on-chain mismatch. No application regression was observed in final testing.

Live smoke scope: public observer identity only, no genuine extension, no protected-wallet reputation verdict, no proof the observer controls the sampled account, no gameplay action and no full history sweep. History pagination/receipt states are additionally covered by the full suite and intercepted browser fixtures. Hosted CORS/provider quotas/availability and genuine extension/mobile/hardware-wallet UX still require release acceptance on the eventual hosted revision.

## Exact local release candidates

[Build manifest](evidence/task7b/build-candidates.json), [build run](evidence/task7b/build-run.json):

| Mode | Local artifact directory | File-inventory SHA-256 |
| --- | --- | --- |
| Production simulation | `/tmp/chog-task7b-candidates-Y76dq9/production` | `334f02bde015d08d95c66ed52b57bdf9f02a7afaf20d04e82ecb14c93aeb79bd` |
| Mainnet-capable, defaults to simulation | `/tmp/chog-task7b-candidates-Y76dq9/mainnet` | `184f1a17225a00f9dd7cfc598d65e6cf9de57e0649684e26c80b03b2a03bf416` |

These inventories hash ordered JSON records of each output path, size and SHA-256, as implemented by the candidate builder. They are not a transaction hash or a signed approval. `/tmp` can disappear; a later rebuild must receive its own artifact inventory and relevant checks before publication. The browser checks used these exact artifacts; no public website was activated.

## Source verification — should precede public mainnet activation

The complete existing instructions are [SOURCE_VERIFICATION_PREPARATION.md](evidence/task7a/SOURCE_VERIFICATION_PREPARATION.md); do not recreate the package or recompile an already proved unchanged input. **Recommend completing exact-match explorer source verification before public mainnet frontend activation.** It improves inspectability, but does not constitute an audit or resolve custody/provider risks. Simulation-only release is a separate decision and need not imply verified explorer source.

After separate owner source-publication approval only:

1. Open [MonadScan Verify & Publish for the deployed game](https://monadscan.com/verifyContract?a=0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390).
2. Select **Solidity Standard JSON Input**, compiler **v0.8.28+commit.7893614a**, contract **src/ChogSurvivor.sol:ChogSurvivor**. Review/upload the exact existing `docs/evidence/task7a/source-verification-input.json`.
3. Confirm optimizer enabled **200**, EVM **Cancun**, viaIR **false/default**, metadata hash **ipfs**, original remapping/source path, no libraries, **empty constructor arguments** and MIT source license. Do not flatten or change settings.
4. Submit only under that approval; inspect the resulting exact source/compiler/settings/address match. Retain the result before changing the UI's pending-source disclosure. Do not use a wallet ownership-signature flow as a substitute.

**Current status: package locally reproduced in Task 7A, unchanged, prepared/not submitted in this task; no explorer verified-source claim.** No Sourcify request, provider appeal, wallet signature or source-upload API was used.

## Remaining wallet-policy and rights risks

- **Unaudited immutable/non-pausable deployment.** No independent review occurred; the owner selected an unaudited contract deployment path. This task neither claims one nor silently reinstates it as a completed approval. Public frontend activation needs its own explicit risk decision.
- **Governance/custody/delegated permissions:** incomplete accountable collection attestations remain unknown. Correct collection bytecode/address does not prove key custody, complete roles, quorum or absence of off-chain permissions.
- **Wallet warnings:** owner previously reported that warnings disappeared; this remains an observation, not official MetaMask/Blockaid clearance. No protected genuine-wallet retest/clearance is established here. Keep protections on and stop on a genuine warning. Compatibility fixtures are not provider certification.
- **Rights:** written approval for provisional runtime illustrations, Chog name/likeness/branding/affiliation and public image/video use remains an owner/rights-holder gate. NFT ownership alone grants no artwork rights. Font files and notices are preserved. No artwork/font/design replacement was made.
- **Operations:** actual public RPC/CORS/history limits, genuine wallet/mobile UX, final hosted revision/settings and ongoing availability need acceptance; deployment gas caps are not a gameplay fee budget. No automatic retry budget is authorized.

## GitHub and Vercel decisions

Git HEAD remains **ac0029fb294fa3754a959ee48cc25e842ed98d6f**. [Initial status and commits](evidence/task7b/git-start.txt) show extensive uncommitted Tasks 5A–7A work, including untracked deployment manifest/components/scripts/evidence. Task 7B edits depend on that existing tree. **No local commit was appropriate:** committing whole modified/untracked integration files would include earlier work, while committing only new Task 7B helpers would produce an incomplete historical release. The existing-files patch, start-tree and exact change inventory make this task reviewable without silently staging prior changes. No Git index or history mutation was attempted.

- **GitHub push readiness:** technical local candidate passes; **NO-GO to push now**. The owner must choose/review the cohesive earlier-work-plus-7B release scope, exact staged diff, evidence/publication contents and local commit(s), then separately authorize push. Do not `git add .` or publish ignored environment/profile/credential material. Git push is not authorized by candidate preparation.
- **Vercel publication readiness:** simulation candidate passes artifact checks; mainnet candidate passes the tests above, with genuine-wallet/hosted-operation limitations disclosed. **NO-GO to publish/activate now**. Separate approval must identify exact artifact/revision/destination/settings and risk/rights disposition. Mainnet activation additionally requires deliberate future hosting-mode approval; current Vercel mode stays simulation. Explorer exact-source verification should precede mainnet activation under the proposed release policy.

**Final decision: GO for completed release preparation; NO-GO for source submission, push, publication or public mainnet activation.** The next step is the separate owner decision already specified, not another deployment or additional mainnet transaction.

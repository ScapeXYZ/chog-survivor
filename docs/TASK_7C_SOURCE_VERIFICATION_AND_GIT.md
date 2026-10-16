# Task 7C — source verification and local Git release preparation

2026-10-16. **Local preparation complete. MonadScan source verification remains pending. NO-GO for source submission, GitHub push, Vercel publication or public mainnet activation without the separate owner decision.** No transaction, redeployment, wallet signature, source upload, push, website change or Anvil operation occurred.

## Explorer status and exact package

Read Tasks [7A](TASK_7A_POST_DEPLOYMENT_VERIFICATION.md) and [7B](TASK_7B_MAINNET_RELEASE_PREPARATION.md). Reused their successful two-provider deployment proof and compiler reproduction rather than repeating deployment checks or compilation.

**Observed status: source-unverified in the current MonadScan UI.** A read-only fetch of the [game's code page](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code) shows the creator “Verify and Publish” prompt, without a Contract Source Code Verified result. The generic “Cross-chain Similar Match” verification button is not a verified-source result. This is a timestamped UI observation, not an API certification or assurance that the page cannot change. [Status and page hash](evidence/task7c/source-and-host-status.json); raw page retained locally, excluded from Git.

| Verification field | Exact value |
| --- | --- |
| Network / game | Monad mainnet **143** / **0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390** |
| Compiler type | Solidity **Standard JSON Input** |
| Compiler | **v0.8.28+commit.7893614a** |
| Contract | **src/ChogSurvivor.sol:ChogSurvivor** |
| Optimizer / EVM | Enabled **200** / **Cancun** |
| viaIR / metadata hash | **false/default** / **ipfs** |
| Libraries | None; original `forge-std/=lib/forge-std/src/` remapping retained |
| Constructor arguments | **Empty**; NFT address is hardcoded, not an appended argument |
| NFT binding | **0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763** |
| License | MIT |
| Input file | [source-verification-input.json](evidence/task7a/source-verification-input.json) |
| Input SHA-256 | `f84ee244cc2d86d5c72af5187e7fcdac5cb0204ffd32b3b7b3a47f3fbc186849` |
| Frozen source SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| Creation bytecode | 6,772 bytes; Keccak-256 `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Bound runtime | 6,688 bytes; Keccak-256 `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` |

Confirmed that the retained Standard JSON embeds the unchanged frozen source and that its existing compiler output matches **all creation and runtime-template bytes**, including metadata, in the approved artifact. Task 7A already verified constructor-linked runtime against mainnet. The unpatched immutable runtime template is not the final deployed runtime. No package/settings change or compiler rerun was necessary.

### Owner-operated verification instructions — do not submit yet

1. After separate source-publication approval, open [MonadScan Verify & Publish for this game](https://monadscan.com/verifyContract?a=0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390). Confirm mainnet **143** and the complete game address.
2. Select **Solidity Standard JSON Input**, **v0.8.28+commit.7893614a**, and the named **MIT** license option. Use the exact input file/hash above; do not flatten source or change paths/remapping/settings.
3. Choose **src/ChogSurvivor.sol:ChogSurvivor** when requested. Confirm optimizer 200, Cancun, viaIR false/default, IPFS metadata and no libraries. Leave constructor argument hex **empty**; do not paste the NFT address there.
4. Review the exact prepared data before the separately authorized submission. [Machine-readable submission fields](evidence/task7c/manual-submission-fields.json) and [existing preparation guide](evidence/task7a/SOURCE_VERIFICATION_PREPARATION.md) contain the same values. This is source publication; it requires no new deployment or wallet signature. Do not enter a wallet-secret or contract-address-ownership signing flow.
5. After an authorized submission succeeds, inspect the explorer's exact-match source, address/compiler/settings and retain its result. Only then prepare a reviewed update to the pending-source disclosure. Source verification is not an independent audit or wallet-provider clearance.

**Recommendation:** complete explorer exact-source verification before public mainnet frontend activation. No verification form/API was submitted and no Sourcify request was made.

## Full working-tree review and preservation

Reviewed tracked diffs and nonignored untracked files, including prior-task frontend/manifest/ABI/history changes, safety tests, local deployment/review tools, runbooks/reports, public RPC/source fixtures and the separate private film workspace. The initial inventory covers **580** files. Pattern triage identified **no credential literal matches** in the inspected nonignored text; this is a scoped review, not proof that secrets cannot exist elsewhere. Ignored environment contents, home credentials, keystores and browser-wallet profiles were not opened.

Only README and `.gitignore` changed among inventoried earlier files during Task 7C. README now explicitly identifies the **genuine mainnet Chog Genesis collection and its explorer link**, separately from the game and local fixture address. Game CA, Monad 143 and deployment transaction links were already correct and retained. All other prior contents remain unchanged. New Task 7C work is a read-only hosted-browser script, status/submission/exclusion/commit/test records and this report. [Preservation review](evidence/task7c/preservation-and-final-review.json).

No ambiguous private-media files were staged. The Task 5B film describes itself as private and has unresolved publication/asset rights; it is deferred intact for an owner decision. The current task makes no claim that the private film or public artwork rights have been cleared.

### Files excluded from commits — retained on disk

[Exact newly excluded file inventory](evidence/task7c/excluded-files.json) records **138** existing files, hashes and reasons. Exclusions include:

- Entire `demo-video/` private workspace: source/editing work, renders, voice/media, caches, thumbnails and copied images/fonts. This preserves completed Task 5B work without silently approving its publication.
- Local environment/secrets and existing ignored outputs: `frontend/.env.local`, `.env*` except the two public `.env.example` templates, keys/keystores, dependencies, `out/`, `cache/`, `broadcast/`, `deployments/`, `dist/`, reports/tool environments and existing restricted design references. Only the two example env files are tracked; no private-key/seed material was staged.
- Raw scraped HTML/explorer/support pages and third-party bundles; incomplete network captures; failed/sandbox/error/diagnostic captures; CLI help snapshots; temporary start-tree/patch review records. Their working copies remain available; no deletion/reset was used.

Curated **successful test logs, public RPC transcripts, golden compilation fixtures and the exact source-verification Standard JSON are intentional reproducibility evidence** and were committed. They are distinct from transient build directories or render caches. Historical reports/checksum lists retain their original scopes; auxiliary excluded captures resolve only in this preserved workspace. Do not misrepresent older packet checksums as a complete current Git-tree manifest. The exclusion inventory documents that boundary.

Eight historical raw logs contain trailing empty lines. They were kept byte-for-byte; the evidence commit's whitespace check disabled only `blank-at-eof`. No source formatting or evidence hashes were rewritten to silence that warning.

## Logical local commits

Starting HEAD: `ac0029fb294fa3754a959ee48cc25e842ed98d6f`. The index was empty before staging. Exact paths and initial hashes were pinned in [local-commit-plan.json](evidence/task7c/local-commit-plan.json); each staged group was checked against its plan.

| Local commit | Scope |
| --- | --- |
| `480bef24beb0376cea0663249ada3bd670a62a41` | Ignore private media and local-only review captures — 1 file |
| `4b5b6e92bc9197f97f804915926c58a5d665aa1d` | Verified frontend, simulation release guard, tests and read-only/browser helpers — 38 files |
| `63b834539d6dd5172dbf13c1e622f9e8d73838b1` | Mainnet review tools and reproducible dry-run tooling — 14 files |
| `aee091d8ead49216984895d85ce14bd6400db208` | Readiness/runbook documentation and curated deployment/source evidence — 176 files |

[Commit record](evidence/task7c/local-commits.json). A final **`docs: record source verification status and local release handoff`** commit contains this report and Task 7C records; obtain its own hash with `git log -1 --oneline` after completion, avoiding a self-referential report hash. No previous commit was amended, reset or rebased, and no existing work was discarded. Local commits do not submit source to MonadScan or trigger remote CI/hosting by themselves.

Git writes required a sandbox permission grant because `.git` was mounted read-only. That grant was used only for the requested explicit-path staging/local commits, never push or remote changes. The initial documentation commit check stopped at EOF blank-line warnings; the existing staged group was verified and completed without touching log contents.

## Hosted website and activation guard

[Live hosted-browser check](evidence/task7c/hosted-browser.json): **5 passed** at **2026-10-16 17:12:58 UTC**. The existing website shows **DEMO STATS — NOT SAVED**, has **no mainnet-play toggle**, and Settings says **Production transactions disabled**. The browser had no wallet, blocked every non-GET request and external RPC, and reported no page errors. It hashed the complete 559,778-byte hosted script at `/assets/index-D82iYTir.js` as `92ce2d2d45e6b5cc2aaf3edcb1b3cd5b95878da7c6370df2e5c415e084c3bf77`.

Initial curl bundle downloads were incomplete/SSL-timed-out and were **not** used as full-bundle evidence; the live browser successfully loaded and hashed the complete response. This check does not infer the exact hosted Git revision or administrative Vercel settings.

The unchanged checked-in Vercel command explicitly builds **production simulation**, clearing local/RPC overrides. The verified manifest remains populated, but public mainnet mode additionally requires explicit build-mode selection and separate release approval. No environment/hosting settings, workflow or activation config was changed. Future Git pushes may trigger hosting if an integration exists; the owner must review that before authorizing a push. No push occurred here.

## Regression checks after organizing commits

| Check | Result |
| --- | --- |
| Frontend full relevant suite | **24 files / 391 passed**, [log](evidence/task7c/frontend-regression.log) |
| Deployment policy unit tests | **15 passed**, [log](evidence/task7c/deployment-policy-tests.log); synthetic providers only |
| Dual-RPC collector unit tests | **3 passed**, [log](evidence/task7c/deployment-collector-tests.log); synthetic readers, no network mutation |
| Manifest/ABI/guard/source-package audit | **PASS**, [result](evidence/task7c/integration-regression.json) |
| Offline public signed-transaction reconstruction | **PASS**, [result](evidence/task7c/captured-transaction-regression.json); verifies existing public signature, never signs |
| Current hosted simulation | **5 browser checks passed**, read-only |
| Preservation and staged scope | **PASS**; frozen source, manifest, gameplay/fonts/artwork and Vercel guard unchanged; all inventoried previous work tracked or explicitly ignored |

Task 7B production/mainnet builds and 33/49/10 integration browser results are reused: application code/configuration and build dependencies were unchanged by Task 7C. No successful build, Solidity suite, deployment verification or compilation was needlessly repeated. New hosted-browser code was exercised directly. Final source/script whitespace and syntax checks pass; raw historical evidence keeps its documented EOF exception.

## Remaining release blockers and next steps

1. **Owner source-publication decision:** authorize only the exact prepared package, submit manually, confirm explorer exact-match result and retain it. Source remains unverified at capture.
2. **Owner GitHub push decision:** review the local commit range from `ac0029f` through the final report commit, exclusions and whether a push would trigger Vercel. Nothing is pushed now. Keep private film/environment/credential material excluded.
3. **Owner frontend publication/activation decision:** identify exact artifact/revision/destination/settings. Vercel remains simulation-only; activating mainnet needs separate deliberate approval and validation of the actual hosted candidate.
4. **Risk/rights disposition:** unaudited, immutable/non-pausable game; incomplete collection governance/custody/delegated-permission attestations; no official MetaMask/Blockaid clearance; protected genuine-wallet/mobile acceptance; provisional artwork/branding/affiliation rights and operational RPC/history acceptance. The owner's observation that warnings disappeared is not provider clearance. Never bypass a current warning. No independent audit is claimed.

**GO for completed local preparation and reviewable commits. NO-GO for automatic source submission, push, Vercel publication or public mainnet activation.** Stop here for the separate owner decisions; no further chain transaction is needed for this preparation.

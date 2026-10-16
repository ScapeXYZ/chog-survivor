# Task 7D — successful public MonadScan source verification

2026-10-16. **PASS: published source independently confirmed as Exact Match on the public MonadScan Code page.** Current documentation and the local frontend status copy now reflect that result. Source verification is not an independent security audit, provider clearance or permission to publish/activate the frontend.

## Independent public verification

The owner reported successful Standard JSON verification. The task independently fetched the canonical contract address page using an unauthenticated GET, rather than relying on the owner's transient submission result:

**[CHOG SURVIVOR — published verified source](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code)**, Monad mainnet **143**.

[Verification result](evidence/task7d/verification-result.json) records the capture timestamp and raw page SHA-256. The public page displays **Source Code Verified**, **Exact Match**, contract **ChogSurvivor**, compiler **v0.8.28+commit.7893614a**, optimization **Yes / 200 runs**, **cancun EvmVersion** and **MIT** license. Its previous creator/Verify-and-Publish prompt is absent. This is the published address/code view, with no submission-result URL, authentication, account session or wallet.

The web-reader tool could not access the page; a normal read-only curl GET succeeded and returned the complete 460,594-byte page. The raw HTML remains locally preserved and Git-ignored under the existing policy. Parsed source/settings and ABI are retained as small, reviewable evidence:

- [Published editor source/settings](evidence/task7d/published-editor-data.json): the full `src/ChogSurvivor.sol` content exactly equals the frozen local source. The explorer presents compiler settings in an editor entry named `settings.json`; it is not an additional Solidity source file.
- [Published ABI](evidence/task7d/published-abi.json): all **12** constructor/function/event/error entries exactly equal the approved artifact ABI, ignoring entry order only. Constructor inputs are empty.
- Code-generating settings match the prepared Standard JSON: optimizer enabled **200**, **Cancun**, **IPFS metadata hash**, original remapping, no libraries and no viaIR. Omitted libraries/viaIR use the same empty/false defaults.
- The explorer's `outputSelection` requests ABI and bytecode, while the prepared input also requested metadata. This output-selection difference does not change code-generating settings or source. The source is exact and the explorer reports an exact deployed-code match; the unchanged artifact/runtime was already independently proved in Task 7A.

| Identity | Exact retained value |
| --- | --- |
| Game | `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390` |
| Genuine NFT binding | `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Deployment transaction | [`0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956`](https://monadscan.com/tx/0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956) |
| Compiler / constructor | **0.8.28+commit.7893614a** / **no arguments** |
| Frozen source SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| Creation Keccak-256 | `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Bound runtime Keccak-256 | `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` |

No Solidity, compiler setting, deployment manifest or transaction changed. No recompilation, redeployment, chain mutation, source resubmission or new RPC deployment-verification run was needed.

## Exact changed files

Existing files updated:

1. `README.md` — public exact-match source status/link and compiler summary; removed stale lower-page claims that no mainnet game was deployed and that previously completed local commits were still uncommitted. Public simulation and risk disclosures retained.
2. `docs/DEMO_DEPLOYMENT_GUIDE.md` — verified-source link/settings and completed source-publication status; future frontend activation remains separately gated.
3. `docs/JUDGE_QUICK_START.md` — independently confirmed source status and link, without presenting the public simulation as live gameplay.
4. `docs/HACKATHON_SUBMISSION_DRAFT.md` — exact-match source status/link; frontend publication, governance/custody and rights remain separate gates.
5. `frontend/src/GameContractInfo.tsx` — local Settings copy/link now says verified source, retaining unaudited and immutable-contract warning. This is a display-only change, not activation or publication.
6. `frontend/src/App.test.tsx` — updates the status-copy assertion while preserving the no-auto-connect/simulation/explorer-link checks.

New files: this report and the [Task 7D evidence directory](evidence/task7d/README.md). [Preservation and exact inventory](evidence/task7d/changed-files.json) records hashes and all new evidence files. Raw HTML and the initial diagnostic test log are ignored and remain local.

Tasks 7A–7C reports, earlier source-preparation packages and their pending/unverified observations are retained **unchanged as historical records**. This report supersedes only their current source-verification status; it does not falsify the earlier observation or rewrite evidence. All five prior local commits remain intact, starting this task at **8e5e537**. Existing ignored/private film material, environment files, captures and Anvil fixtures were not deleted, reset or staged.

## Validation

- **Public source/ABI/settings comparison: PASS.** Exact published frozen source, all 12 ABI entries, constructor and semantic compiler settings match; public exact-match badge confirmed.
- **Documentation/link checks: PASS**, [result](evidence/task7d/documentation-check.json). All four current docs contain the actual game/transaction links and exact-match disclosure; relative links resolve; hosted build still forces simulation.
- **Focused frontend regressions: 3 files / 15 passed**, [test log](evidence/task7d/frontend-regression.log), for App, manifest and environment guards. These cover visible source status, no automatic connection, correct explorer link, exact deployment fields and explicit mainnet opt-in boundaries.
- **TypeScript: PASS**, [log](evidence/task7d/typecheck.log). No dependency/build configuration change.
- **Preservation/whitespace: PASS**, frozen Solidity, approved artifact, gameplay, artwork/fonts, deployment manifest, hosting settings and previous evidence unchanged. `git diff --check` passes for changed source/docs. Evidence log EOF blank lines retain the established verbatim-log policy when committing.

Only documentation and display copy changed. Unchanged full gameplay/Forge/build/browser suites were not repeated; Task 7B/7C successful results retain their original scope. No current hosted-site deployment was performed or claimed. The public simulation last observed in Task 7C is unaffected by these local changes.

## Remaining gates and local commit

**Closed:** the pending public explorer source-verification gate for this exact deployed game. No resubmission is needed.

**Still open:** explicit GitHub push and Vercel/frontend activation approval for the exact revision/artifact; artwork/branding/affiliation rights; incomplete collection governance/custody/delegated-permission attestations; unaudited immutable/non-pausable contract risk; genuine protected-wallet/mobile and operational acceptance. The owner-reported absence of earlier wallet warnings remains an observation, not official MetaMask/Blockaid clearance. Never bypass a genuine warning.

These verified documentation/display changes and evidence are committed locally as **`docs: confirm public MonadScan exact-match source verification`**. Obtain the containing commit hash with `git log -1 --oneline` after completion, avoiding a self-referential report hash. No previous commit is amended or discarded.

**GO: record successful source verification. NO-GO: push, publication or public mainnet activation without separate owner approval.** No Solidity edit, redeployment, transaction, push, Vercel publication or gameplay activation occurred.

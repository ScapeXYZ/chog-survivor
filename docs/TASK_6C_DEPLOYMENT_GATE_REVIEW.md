# Task 6C — mainnet deployment gate review

Reviewed 2026-10-16. **Final recommendation: NO-GO for signing/broadcast or public mainnet activation.** Technical toolchain, artifact, fork compatibility and sender-readiness checks are now reproduced. Collection source/creation provenance is substantially stronger than Task 6A/6B, but governance completeness, genuine wallet-warning disposition, independent security acceptance and exact spending/release authorization remain open.

Approved **proposed public deployer**: `0x320eDAe253259053d53feD8eEe6D9C0274A91E85`. Network: Monad mainnet, chain **143**. This approves neither a transaction nor the limits recommended below. No private key/recovery phrase was read or exposed; no signature, broadcast, mainnet deployment, Anvil reset, commit, push or Vercel publication occurred. Fork actions/transfers and creation simulation affected only ephemeral local execution. Existing Task 5A/5B/6A/6B source/evidence was preserved; build/dry-run tooling regenerated its normal derived outputs.

## 1. Isolated Monad-aware validation — closed for this candidate

Read the [6A readiness report](TASK_6A_MAINNET_LAUNCH_READINESS.md), [6A runbook](TASK_6A_MAINNET_DEPLOYMENT_RUNBOOK.md), [6B checklist](TASK_6B_MAINNET_RELEASE_CHECKLIST.md), [6B approval record](TASK_6B_DEPLOYMENT_APPROVAL.md) and their evidence/scripts. Empty/interrupted 6B logs were not counted as passes.

[Monad's Foundry documentation](https://docs.monad.xyz/tooling-and-infra/toolkits/foundry) specifies Foundry 1.8+ with `--network monad`. Official **1.8.5**, commit `51a52c59cffd940f76eddd0b4bb1791aa4b5ac7f`, was downloaded to `/tmp/chog-task6c-toolchain`. Its archive SHA-256 matches the official GitHub release API digest: `6c66ffcc55fa4249197721baa3098bc208014ea1d8aa04b2ed50ac6bccffb226`. Only `forge`/`cast` were extracted; PATH and installed Foundry **1.7.1** were preserved. This is an official-digest check, not an independent binary audit or attestation verification. See [toolchain evidence](evidence/task6c/toolchain.json), official [release metadata](evidence/task6c/foundry-release.json), and [original version](evidence/task6c/original-foundry-version.txt).

All Forge commands used explicit `--offline --network monad --out /tmp/chog-task6c-out --cache-path /tmp/chog-task6c-cache`. The compiler remained **0.8.28+commit.7893614a / optimizer 200 / Cancun**; `foundry.toml` and the frozen contract were not edited. Fork hardfork selection follows chain ID/timestamp under the pinned tool.

| Check | Result / exact evidence |
| --- | --- |
| Frozen source SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`; [capture](evidence/task6c/frozen-source.sha256) |
| Isolated artifact parity | Creation and runtime template identical to pre-existing artifact; [parity](evidence/task6c/artifact-parity.json) |
| Creation Keccak-256 | `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Constructor-bound expected runtime | `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475`; [artifact report](evidence/task6c/game-artifact.json) |
| Full existing suite, Monad execution | **39 passed, 0 failed, 6 opt-in skips**, including fuzz/invariant/reference/achievement suites; [log](evidence/task6c/monad-tests.log) |
| Live mainnet-fork integration | **6 passed, 0 failed, 0 skipped**: identity, owner/non-owner, preview parity, daily lock, absence and simulated transfer/inherited state; [log](evidence/task6c/monad-fork.log) |
| New representative gas fork | **4 passed**, first action, repeat action, 30-day achievement sequence and smart-wallet wrapper; [log](evidence/task6c/representative-gas.log), [test](../test/Task6CGas.t.sol) |
| Gas suite without RPC | Clean opt-in skip; [log](evidence/task6c/gas-suite-opt-in.log) |
| Deployment wrapper dry run | Succeeds on chain 143 with the proposed sender, no broadcast; [log](evidence/task6c/deployment-dry-run.log) |

The new gas sample observed **33 `act` calls, 117,525–211,323 gas** in Forge's function report; the wrapper call observed **224,053 gas**. The 30-day sequence earned mask 125, covering multiple achievements. The broader Monad-mode suite observed `act` up to **277,247 gas** with fixture state. These are representative simulator measurements with call/setup warmth and harness effects, not complete transaction gas limits or worst-case proofs. The simple wrapper is not Safe/ERC-4337 validation, signature or bundler overhead. Forge's fork gas report showed deployment cost **0**, which is not a usable creation estimate; use RPC/dry-run evidence below. Future actions require fresh estimates for the actual holder, state and wallet.

The inspected dry-run wrapper accepts no caller flags and passes no broadcast option/key. Fixed an early-exit `rg -q` help check that could produce SIGPIPE under `pipefail`; the check now consumes all help output. Set its estimation multiplier to 100 to avoid the default 130% padding. It still selects no approved fee ceiling and cannot authorize a deployment. Its simulated CREATE address is a prediction only.

## 2. Fresh sender/network checks and independent provider — closed at captured state

[Primary RPC capture and full code](evidence/task6c/rpc-refresh.json), [request transcript](evidence/task6c/rpc1-transcript.json), and [independent comparison](evidence/task6c/independent-crosscheck-summary.json):

| Observation | Result |
| --- | --- |
| Primary | `https://rpc.monad.xyz` (QuickNode per official network reference), captured 2026-10-16 15:10:05 UTC |
| Finalized block | **113929685**, hash `0x522022e6225f091f2dd005b0bb928daa174dbbc1429a4b8381c822f80c59561a` |
| Chain | 143 |
| Balance at finalized snapshot | **0.4 MON** |
| Sender code | Empty (`0x`); no delegation code observed at snapshot |
| Latest / pending nonce | **0 / 0**; pending is provider-local, not a globally complete mempool assertion |
| Nonce-zero predicted CREATE | `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`; code empty at snapshot |
| Collection runtime | 17,264 bytes, Keccak-256 `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46` |
| Base / priority / suggested gas price | **100 / 2 / 102 gwei** |
| RPC creation estimate from proposed sender | **1,510,761 gas**; at 102 gwei: **0.154097622 MON** |
| Creation `eth_call` at 1,600,000 gas | Succeeds and returns exact expected game runtime |
| Independent provider | `https://rpc3.monad.xyz` (Ankr); [individual read transcript](evidence/task6c/rpc3-independent.json), 15:17:03 UTC |
| Cross-check | Chain 143, exact same block hash, identical collection bytes, same snapshot balance; latest/pending nonce 0/0 and suggested price 102 gwei |

Provider attribution comes from the retained [official network reference](evidence/task6c/network-reference.html) and [online reference](https://docs.monad.xyz/developer-essentials/network-information). Two matching provider observations are corroboration, not a consensus proof. Goldsky `rpc2` returned access failures/403 or empty batch results after a successful chain-ID diagnostic; Alchemy `rpc1` returned `Restricted JSON RPC method` for a batch. These unsuccessful probes are retained and not counted as cross-checks. The working Ankr individual requests closed the independent-provider check. Refresh all sender/network/fee checks immediately before any future signing authorization.

## 3. Collection provenance and governance — source reproduction closed; governance acceptance open

Earlier explorer-access failures are superseded by a successful read-only HTTPS retrieval of the [MonadScan collection page](https://monadscan.com/address/0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763#code). Retained [page](evidence/task6c/monadscan-page.txt), [access results](evidence/task6c/source-access.json), [standard compiler input](evidence/task6c/collection-standard-input.json), [compiler output](evidence/task6c/collection-compiler-output.json), [ABI](evidence/task6c/collection-abi.json), [extracted source](evidence/task6c/ChogMint.sol) and [RPC provenance/constructor/role capture](evidence/task6c/collection-provenance.json) make this independently reviewable. Etherscan source/creation API calls required an API key; HTML source was accessible without one. **No Sourcify request was made or retried.**

- Contract **ChogMint**, Solidity **0.8.28**, optimizer **800**, Cancun, `viaIR: false`, IPFS CBOR metadata. These are the collection settings, distinct from the frozen game's optimizer 200.
- Creation transaction [0x23347f41…a09ae4bd](https://monadscan.com/tx/0x23347f41b8c921039de31853994b29f21b2c9f2547d97145e64acc93a09ae4bd), block **101704036**, successful direct creation from `0x79bbEc62F13BF1756e2F29F465240814EC1876F4`. Sender/nonce CREATE derivation matches the collection. Local compiled creation prefix matches the transaction input; remaining constructor tuple was decoded. Full runtime, including metadata and constructor immutables, matches the fresh RPC bytes/hash.
- Constructor supply limit **1969**, reserve **256**. The source comment saying “1500-supply” is stale; it is not the deployed limit. Observed stage/reserve mint counts **1713/256**, total **1969**, `currentStage=255` (no open stage). Both supply budgets are exhausted at snapshot.
- Constructor treasury/admin: `0x84113421A8a564b594ee9Ae78c875310332d7023`; team main: `0x285074ee7A7AE5e0a2188949FE6bD71DE25492b7`. Initial royalty **500 bps**. Current treasury/team main match those constructor values.
- Known current roles at block **113930301**: creator has `DEFAULT_ADMIN_ROLE` and `ADMIN_ROLE`; treasury address has `ADMIN_ROLE` but not default admin; team-main address has neither. Both roles' administrator is `DEFAULT_ADMIN_ROLE`. Default admin can grant/revoke roles; role holders can renounce. This contract does not enumerate role members.

| Control | Reproduced-source finding |
| --- | --- |
| Admin mint/configuration | `ADMIN_ROLE` can reserve-mint within immutable reserve/supply ceilings, configure stage roots/caps/windows/prices/schedule, open stages and change team allotments. No present mint headroom at snapshot. |
| Treasury / proceeds | Admin can withdraw native sale proceeds only to current treasury; default admin can change treasury/team-main. This does not provide access to holder NFTs. |
| Royalties | Default admin can change default royalty receiver/bps, constrained by ERC-2981's denominator. Marketplace enforcement is external. |
| Metadata | Admin sets placeholder URI; provenance hash is nonzero and one-time. `reveal` is one-time and happened; `setBaseURI` reverts after reveal. `baseURI`, reveal flag and starting index have no later setter in reproduced source. Off-chain metadata availability is separate from this immutability. |
| Transfers / holder authority | Standard included ERC-721 owner/approved-operator transfer authorization. No transfer hook override adds a blacklist/operator filter/pause. An operator can transfer under ERC-721 approval, but cannot call game `act` unless itself the current owner. |
| Burn/remint/seizure | No exposed burn, arbitrary ownership rewrite or seizure entrypoint. Included ERC-721 internals are not externally callable. Sequential minting plus exhausted immutable ceilings provides no exposed token-ID reuse path in this matched implementation. |
| Upgrade/pause | No proxy/UUPS/diamond/upgrade/pause/freeze entrypoint in the reproduced source/dependencies. EIP-1967 slots remain zero. Raw opcode scans include bytes in compiler data and must not be mistaken for reachable delegatecall/upgrade evidence. |

**Remaining governance evidence:** full RoleGranted/RoleRevoked history probes exceeded provider range limits, so the known-address checks are not a complete member list. Do not infer there are only two admins. Signer custody, multisig membership/threshold/timelock, accountable team identity and written acceptance of the immutable game dependency are unconfirmed. An independently reviewed indexed role-event export from creation through a finalized block, checked against `hasRole`, is required to close membership without roughly 122,000 public 100-block requests. No such bulk crawl was attempted.

Official-facing [Chog website](https://www.chog.xyz/) and [Chog Linktree](https://linktr.ee/chognft) were consulted; the latter links to the collection marketplace and build site. The site's displayed `$CHOG` address is a different fungible-token address and is not NFT provenance. The retrieved website/build HTML did not contain an explicit canonical NFT address/governance attestation. Explorer bytecode proof establishes what code is at the nominated NFT address; it does not prove project-team authorship or approval. Earlier marketplace/mint corroboration remains supporting context only.

## 4. Wallet warning — unresolved, no bypass or clearance

Reviewed [Task 4W warning audit](TASK_4W_WALLET_AND_SECURITY_AUDIT.md), [6A public-list evidence](evidence/task6a/warning-public-list.json), [6B snapshot](evidence/task6b/approved-deployer-readonly.json) and `wallet-warning-evidence.mjs`. Exact/parent public-blacklist non-matches do not establish full fuzzy/proprietary-provider clearance. No genuine warning screenshot, exact provider reason, MetaMask version or confirmed review case/disposition is present. Synthetic wallets cannot close that gap.

[MetaMask's official website-warning guidance](https://support.metamask.io/stay-safe/safety-in-web3/deceptive-site-ahead-when-trying-to-connect-to-a-site/) directs site owners to [eth-phishing-detect issues](https://github.com/MetaMask/eth-phishing-detect/issues). A transaction-specific Blockaid alert uses the [MetaMask/Blockaid review portal](https://blockaid-false-positive-portal.metamask.io/) or the provider's [report portal](https://report.blockaid.io/), selected after identifying the actual alert. Capture the exact URL/path, UTC timestamp, wallet/platform/version, alert text/provider and public request details. Obtain the official response and retest with protections enabled. No issue, message, appeal or form was submitted by this task.

## 5. Integration and release-script review

**Technical fix:** the existing 500-block history assumption was wrong for the selected public RPC. A [500-block read-only probe](evidence/task6c/log-range-probe.json) returned `-32614`, “eth_getLogs is limited to a 100 range.” Mainnet history now uses **100-block chunks**, retaining 500 for existing local behavior. Each mainnet page covers at most **10,000 blocks** (100 chunks), with the existing older-page cursor and incomplete-history disclosure. Tests now assert the actual page boundaries. Pagination exists already; prior 6A/6B statements about requiring pagination after 50,000 blocks are superseded. A dependable archival provider/indexer, rate/backoff policy and operational monitoring still require launch review; a short public page is not an archival guarantee.

Reviewed `App`, `contracts`, `Adventure`, `Character`, `LocalContractAdventure`, history hooks/tests, manifest/info UI and every mainnet script. EIP-6963 discovery plus legacy injected fallback allows explicit wallet selection/cancel; labels are provider claims, not vendor authentication or Monad certification. No Phantom-specific assumption was introduced. Genuine extension/mobile/contract-wallet tests remain a frontend-release gate. The provided simple smart-wallet gas test is not evidence that the injected frontend supports arbitrary smart accounts.

Write boundary checks approved runtime, NFT binding, fresh owner/day/preview, simulation and gas estimate, then pins `act`, token/choice, originating account and chain 143. Connection alone never signs; simulation is the initial experience. Receipts require success, confirmation/finalized floor and canonical inclusion hash, then matching game/token/owner/choice events; timeouts retain the submitted hash. No NFT approval, deposit or transfer is requested. Added regression cases cover wrong RPC chain, failed gas estimation and finality behind the receipt. Unit/browser tests remain mocked and cannot replace post-deployment checks.

The `null` source manifest and `null` receipt remain unchanged. Environment addresses cannot activate mainnet; `VITE_CHOG_ENV=mainnet` also requires a valid reviewed source manifest. Vercel continues forcing simulation and clearing local/RPC overrides. `release-artifact.mjs` checks source/compiler/creation hash and patches immutable runtime values; `verify-mainnet-deployment.mjs` only prints a candidate after creation input/sender/value/receipt/finality/runtime/binding checks. It does not authenticate explorer source, enforce approved nonce/fee ceilings or independently confirm a second RPC; those are explicit operator gates, not implied by script success. The preflight's existing 6B `wx` evidence path prevents overwriting that capture; new 6C collectors use separate files.

Future signing must explicitly bind nonce and fees to the exact reviewed artifact. Frontend action gas is estimated and passed explicitly but has no application fee ceiling; the wallet presents actual fees and each action requires holder approval. Replacement/cancel transactions, genuine smart-account execution, provider outage/rate behavior and actual deployed-history pagination need release testing. A midnight change during wallet confirmation can execute a new day's encounter, as disclosed; the frozen ABI has no expected-day/slippage argument and was not changed.

## 6. Proposed spending limits — recommendations only, NOT APPROVED

[Monad gas guidance](https://docs.monad.xyz/developer-essentials/gas-pricing) charges the submitted gas limit rather than consumed gas. Avoid blind Ethereum padding. The independent reads agree on 102 gwei suggested price at capture; this is not a future quote.

| Proposed field | Recommendation / rationale |
| --- | --- |
| Deployment gas limit | **1,600,000**: about 5.91% above the 1,510,761 RPC estimate; successful creation `eth_call` at this exact limit. Re-estimate before signing and stop if it no longer fits. |
| Maximum fee per gas | **125 gwei** (`125000000000` wei), explicit EIP-1559 cap |
| Maximum priority fee | **2 gwei** (`2000000000` wei), subject to fresh inclusion conditions; stop for review if base fee + tip exceeds the cap rather than silently raising it |
| Transaction value | **0 MON**, no constructor arguments |
| Maximum one-attempt spend | **0.200000000 MON** = 1,600,000 × 125 gwei. At captured 102 gwei, the same limit would charge **0.1632 MON**. |
| Minimum reserve after worst-case fee | **0.1 MON**; require at least **0.3 MON** before signing under these proposed caps. Snapshot 0.4 MON would leave at least **0.2 MON** after the capped attempt. |
| Retry/replacement budget | **None recommended/authorized automatically**. Check submitted hash/nonce before any retry. Any new attempt or cap increase needs separate approval. |

The dry run's default EIP-1559 policy produced **202.5 gwei** and **0.3059291025 MON** at estimated gas, leaving under 0.1 MON from 0.4 MON. Do not adopt this default as an approved spend. It illustrates why explicit reviewed caps are required even after a successful simulation. These recommendations do not authorize a sender signature, reserve transfer or frontend action.

## 7. Changed-file and secret review

[Inventory](evidence/task6c/changed-file-security-inventory.json) records SHA-256/size and text-vs-binary coverage for tracked changes and all nonignored untracked files against the base revision. Reviewed security-sensitive changes: environment/chain/manifest gates, wallet selector, ownership/preview/write/receipt lifecycle, history range/pagination, explorer links, release/dry-run/artifact scripts and hosting overrides. Documentation/disclosure changes and demo-video scripts/assets were included in the scan; no video script or chain-mutating capture harness was run. Binary assets were hashed, not source-audited or granted a new usage license.

No project credential/private-key literal was identified. The two pattern hits in retained explorer HTML are false positives: explorer UI reads API-key input fields via `.val()`, with no credential value embedded in those statements. No ignored `.env`, signer key, browser wallet profile or home credential store was inspected. This is a scoped source/pattern review, not an independent audit or proof that secrets cannot exist elsewhere. No dependency manifests/lockfiles were changed by 6C and no installation lifecycle script was run.

| Validation after changes | Result |
| --- | --- |
| Production frontend suite | **24 files / 386 passed**; [log](evidence/task6c/frontend-tests.log) |
| Final focused security/history/config tests | **4 files / 23 passed**, including 3 new security cases; [log](evidence/task6c/focused-security-tests.log) |
| TypeScript + production Vite | Pass; existing vendor annotations and >500 kB chunk warnings; [log](evidence/task6c/frontend-build.log) |
| Synthetic enabled mainnet browser | **25 checks passed**, desktop/mobile multi-wallet, explicit confirmation, gas/chain, runtime mismatch and simulation safeguards; [final log](evidence/task6c/enabled-browser.log) |
| Shell/Node syntax and diff whitespace | Pass |

## 8. Authorization gate and disposition

**Closed for this exact candidate:** isolated Monad-capable tooling, unchanged frozen source/compiler/artifact parity, existing Monad-mode suite, six real-collection fork cases, representative gas samples, dry-run-only creation, fresh sender/network checks, independent-provider corroboration, explorer source/creation/runtime reproduction, and public history range mismatch.

**Still blocking Gate A:** independently accepted security review; complete collection role membership/custody and accountable project governance/canonical-address acceptance; unresolved genuine wallet warning under the retained 6A/6B policy; signer custody/process; exact release/diff/artifact approval, fresh sender nonce/balance/fee recheck and explicit owner approval of one deployment with exact gas/fee/total/reserve limits. The proposed sender alone does not close those gates.

**Post-authorization/post-deployment requirements:** finalized transaction and actual game runtime/binding/source verification, a real reviewed manifest/receipt and independent RPC verification. Public frontend activation additionally requires genuine wallet testing, archival/rate/operations decisions, asset permissions and hosting settings/revision plus separate Gate B publication approval. The immutable contract has no administrative pause, upgrade or rollback; disabling a frontend cannot disable direct calls or undo state.

**NO-GO remains. Stop here at the deployment authorization gate.** No signing or publication approval is requested or implied by this report; the unresolved evidence and recommended limits are ready for owner/reviewer consideration.

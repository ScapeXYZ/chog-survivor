# Task 6D — final security review packet

2026-10-16. **NO-GO at the deployment authorization gate.** This is a source/evidence self-review and a packet for an external reviewer, **not an independent audit, wallet-provider clearance or deployment approval**. No frozen-contract/application changes, signing, deployment, broadcast, Anvil reset, commit, push or Vercel publication occurred in 6D. No external review request was submitted.

## Evidence scope and classification

Read [6A readiness](TASK_6A_MAINNET_LAUNCH_READINESS.md), [6A runbook](TASK_6A_MAINNET_DEPLOYMENT_RUNBOOK.md), [6B checklist](TASK_6B_MAINNET_RELEASE_CHECKLIST.md), [6B approval record](TASK_6B_DEPLOYMENT_APPROVAL.md), [6C gate review](TASK_6C_DEPLOYMENT_GATE_REVIEW.md), the frozen contract, relevant frontend/scripts/tests and collection source dependencies. All **82** files under their evidence directories are indexed with hashes and JSON/log outcomes in [prior-evidence-index.json](evidence/task6d/prior-evidence-index.json). Empty/failed 6B logs and failed provider probes remain failures, not test passes.

**VERIFIED** means directly supported by reviewed source matched to an artifact, an identified chain snapshot, or an identified retained test result. It does not mean independently audited or guaranteed at future blocks. **INFERRED** means a stated consequence/interpretation of those observations. **UNKNOWN** means the packet lacks sufficient evidence; an absent selector or reverted speculative call alone cannot prove a power absent.

The [baseline comparison](evidence/task6d/source-baseline-comparison.json) found **31 relevant candidate files unchanged** from the 6C inventory. [Offline reproduction](evidence/task6d/offline-reproduction.json) separately matched 30 source/script/test entries, the frozen hash and game artifact; it checked 22 collection source-content hashes, decoded its creation constructor and matched its entire runtime to retained RPC code. No successful suite/build/browser rehearsal was repeated. New 6D scripts only collect evidence or verify consistency. The offline check uses retained compiler output; an external rebuild remains part of independent review.

Exact handoff inputs, including configuration, lockfile, forge-std, source/tests/scripts and game/collection artifacts, are SHA-256-pinned in the [145-file review manifest](evidence/task6d/review-artifact-manifest.json). A Git revision alone is insufficient: the working tree includes required modified and untracked files. Media/license permission and the hosted site's exact source revision are outside that source digest's assurance.

## Exact deployment candidate and recommended limits

| Field | Verified candidate / recommendation |
| --- | --- |
| Contract | `src/ChogSurvivor.sol:ChogSurvivor`, no constructor arguments, zero transaction value |
| Sender | `0x320eDAe253259053d53feD8eEe6D9C0274A91E85` — approved proposed sender only |
| Chain | Monad mainnet, **143** |
| Source SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| Compiler/settings | `0.8.28+commit.7893614a`, optimizer enabled **200**, **Cancun** |
| Exact artifact file | `out/ChogSurvivor.sol/ChogSurvivor.json`, SHA-256 `adf4c5c23213818fdcafb7ea55ca3e50a277156bccf7abe4a90a83cc8d0545f0` |
| Creation bytes / Keccak-256 | **6,772** / `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Bound runtime bytes / expected Keccak-256 | **6,688** / `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` |
| NFT binding | `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Recommended gas limit | **1,600,000** |
| Recommended maximum fee per gas | **125 gwei**, `125000000000` wei |
| Recommended maximum one-attempt cost | **0.2 MON**, `200000000000000000` wei |
| Recommended minimum reserve after capped cost | **0.1 MON**, `100000000000000000` wei |
| Minimum balance for those recommendations | **0.3 MON**; arithmetic is exact, not a spending authorization |
| Additional 6C recommendation | Maximum priority fee **2 gwei**; no automatic retry/replacement budget |

**VERIFIED:** 1,600,000 × 125 gwei = 0.2 MON. 6C RPC creation estimation and isolated dry run both reported **1,510,761 gas**; a read-only creation call at the proposed 1,600,000 limit returned the exact expected runtime. The dry run's default 202.5 gwei cap and 0.3059291025 MON requirement are **not** these recommendations and would breach a 0.1 MON reserve from 0.4 MON. Monad charges submitted gas limit; [official gas guidance](https://docs.monad.xyz/developer-essentials/gas-pricing).

**VERIFIED at 6D snapshot:** proposed deployer balance 0.4 MON, no code, latest/pending nonce 0/0, suggested gas price 102 gwei. Snapshot **113932652**, hash `0x3b11574b5e3471bb9c8c18a7bf74ab0f881deb9a55d89cb1933fc5696301a3dc`, captured 2026-10-16 15:25:04 UTC; [read-only capture](evidence/task6d/governance-current.json). These 6D observations use one RPC; the earlier [6C independent-provider comparison](evidence/task6c/independent-crosscheck-summary.json) is separately timestamped. Nothing combines them into a fresh two-provider attestation.

**UNKNOWN:** future inclusion conditions, approved signing process, authorized nonce/expiry, approved caps and owner authorization for a single transaction. Nonce-zero CREATE prediction `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390` remains a prediction; no game deployment receipt/manifest is published. A future signed transaction must bind the full creation input, zero value, chain, sender, nonce, gas and fee caps explicitly.

## Frozen-contract review and threat model

Primary assets: holder NFT ownership, token-bound progression/history, holder/deployer gas and user consent. Trust boundaries: Monad consensus, fixed NFT runtime/ownership oracle, wallet account/signing implementation, browser build/hosting and RPC/metadata providers. See [frozen source](../src/ChogSurvivor.sol), [source freeze](BACKEND_FREEZE.md), [game rules](GAME_RULES.md) and the external scenario checklist.

| Area | Conclusion / status / evidence |
| --- | --- |
| NFT binding | **VERIFIED:** constructor writes the nominated collection to immutable `CHOG_GENESIS`; no setter, owner/admin or registry redirect exists. `release-artifact.mjs` patches immutable runtime references and pins creation/source hashes. A runtime template with zero immutable placeholders is not deployed-code evidence. |
| Authorization | **VERIFIED:** each `act` calls the collection's `ownerOf(tokenId)` and requires `msg.sender == owner`; approvals, prior ownership, escrow beneficial ownership, `tx.origin` and relayer assertions confer no game authority. A smart account holding the NFT must call as that address. Included tests exercise operators, transfers and contract wallets. |
| External call/reentrancy | **VERIFIED:** `ownerOf` is declared view and uses Solidity's static-call boundary; game resolution then makes no untrusted mutable callback or payout. No signing/approval/deposit/transfer/custody function exists. **INFERRED:** a pathological ownership oracle can deny service or lie about ownership, so NFT-code/provenance acceptance is necessary; an arbitrary keeper cannot override it. |
| NFT existence and read semantics | **VERIFIED:** `preview` and `act` require a successful `ownerOf`; `characterOf`, `titleOf` and `eventFor` do not establish NFT existence. Zero/default character data must not be presented as verified ownership. The frontend separately checks ownership and binding. |
| Daily lock | **VERIFIED:** `hasActed` plus `lastActionDay == floor(block.timestamp / 86400)` prevents a second action for the same token/day, including after transfer. `hasActed` makes day-zero first play valid. Lock is token-based, not wallet-based. State changes/logs roll back atomically on revert. |
| Timestamp/encounter | **VERIFIED:** event = hash(collection, token ID, UTC day) modulo six, plus one; choices 1–3 map to 18 outcomes. This is deterministic and predictable, not VRF randomness. **INFERRED:** normal consensus timestamp behavior is assumed; UI time alone cannot authorize an action. |
| Confirmation race | **VERIFIED:** frozen `act` contains no expected-day or preview-hash input. A valid owner transaction accepted after midnight may resolve the new day. A transfer before inclusion can make the old owner's transaction revert and consume gas. **INFERRED:** these are residual user-consent/fee risks requiring reviewer/owner acceptance, not claims that frontend preflight locks chain state. |
| Progression identity | **VERIFIED:** the sole progression mapping is keyed by token ID, with no reset/owner migration path. Transferred NFTs retain all progression and daily status. If an ownership oracle ever reissued an ID, game state would persist; the matched NFT currently exposes no burn/reissue path. |
| Arithmetic | **VERIFIED:** XP clamps to 0…1,000,000,000, Trust/Scars to 0…100; byte streak saturates at 255, unmarked streak at seven, event/outcome counters saturate at uint32 maximum. Signed deltas report actual post-clamp differences. Consecutive-day bonus caps at seven; skipped days restart streaks. |
| Achievements/titles | **VERIFIED:** eight achievement bits accumulate without removal; only newly earned bits emit ascending achievement IDs. Requested positive Scars reset unmarked progress even at the cap. Title uses current values and explicit precedence, so it need not be permanent. Unit/reference/boundary tests exercise these semantics. |
| Monetary/admin surface | **VERIFIED:** `act` is nonpayable; the game has no token transfer, NFT custody, withdrawal, upgrade or pause. No arbitrary delegatecall/admin execution path exists in this source. **INFERRED:** disabling the frontend cannot stop direct calls, undo state or recover forced funds; no emergency on-chain rollback exists. |
| Outcome authenticity | **VERIFIED:** state and emitted `AdventureResolved`/`AchievementEarned` values come from the same on-chain result. Frontend mini-games, audio and simulation are not rewards inputs. A local preview is not a receipt. |

No independent audit opinion, formal proof or unconditional absence-of-vulnerabilities claim is made. The review found the above boundaries and residual risks; external reviewers must report their own severity findings and acceptance conditions.

## Collection governance and custody — classified findings

Canonical contract evidence is the [MonadScan source record](https://monadscan.com/address/0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763#code), its [retained standard compiler input](evidence/task6c/collection-standard-input.json), [compiler output](evidence/task6c/collection-compiler-output.json), [ABI](evidence/task6c/collection-abi.json), creation transaction [0x23347f41…a09ae4bd](https://monadscan.com/tx/0x23347f41b8c921039de31853994b29f21b2c9f2547d97145e64acc93a09ae4bd), [6C reproduction](evidence/task6c/collection-provenance.json) and fresh [6D chain observations](evidence/task6d/governance-current.json). This is distinct from the project's identity/custody attestation, which remains missing. No Sourcify requests were made.

**VERIFIED:** collection `ChogMint` uses Solidity 0.8.28, optimizer **800**, Cancun, `viaIR=false`; this differs intentionally from game optimizer 200. Creation block **101704036**, direct creator `0x79bbEc62F13BF1756e2F29F465240814EC1876F4`; input prefix, decoded constructor and CREATE derivation match. Full runtime hash is `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46`. 6D confirms creation-block canonical hash `0xc40741e3fecb786fdc07f1e71ff3998f469b9b5dc1d78f45b529b7f750411715` and unchanged collection runtime.

### Roles and custody

| Question/account | Classification and result |
| --- | --- |
| Ownable `owner()` | **VERIFIED:** reproduced collection uses AccessControl, not an exposed Ownable owner. A previous `owner()` probe reverted; absence is concluded from matched source, not that probe alone. |
| `DEFAULT_ADMIN_ROLE` | **VERIFIED:** zero bytes32; admin for itself and `ADMIN_ROLE`. It can grant/revoke roles; each holder can renounce its own role. No required delay/multisig threshold is imposed by the collection. |
| `ADMIN_ROLE` | **VERIFIED:** `0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775`. |
| Creator `0x79bb…1876F4` | **VERIFIED at snapshot:** default admin and admin; code `0x`. **UNKNOWN:** people/control, hardware custody, MPC/key-sharing policy and any off-chain signing threshold. Empty code does not prove a human custody setup. |
| Treasury `0x84113421A8a564b594ee9Ae78c875310332d7023` | **VERIFIED at snapshot:** admin, not default admin; current treasury and 5% royalty recipient in the sampled `royaltyInfo(1425,10000)` call. Code is EIP-7702 indicator `0xef0100` plus target below. |
| Team main `0x285074ee7A7AE5e0a2188949FE6bD71DE25492b7` | **VERIFIED at snapshot:** neither tested role; current team-main designation. Same EIP-7702 target indicator. Team-main designation alone does not confer admin powers. |
| Delegation target | **VERIFIED:** both indicators point to `0x63c0c19a282a1b52b07dd5a65b58948a07dae32b`; [code capture](evidence/task6d/delegator-code.json), target runtime hash `0xd4dee59ae6be4a997964e8f19ae6905f0a233c6ae88d9bc5d945bc60738376c1`. [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) defines this indicator. MetaMask's [canonical account documentation](https://support.metamask.io/configure/accounts/what-is-a-smart-account) names that target; MonadScan labels its source `EIP7702StatelessDeleGator`. |
| Interpretation of delegation | **INFERRED:** observed wallet routing is consistent with MetaMask's documented delegator. **UNKNOWN:** independently reproduced target runtime, active permission/delegation grants, delegation-manager policies, key holders and effective operational quorum. Neither code nor a target-address label establishes a multisig, safe custody or provider clearance. EIP-7702 code can change through account authorization; it is not a collection upgrade mechanism. |
| Complete role membership | **UNKNOWN:** AccessControl is not enumerable here. Known-account checks do not enumerate every grantee. 6C full-history probes failed provider range restrictions. A complete creation-to-finalized indexed role-event export and current `hasRole` cross-check is still needed; no 122,000-window public-RPC crawl or repeated failing probe was performed. |
| Canonical project/team attestation | **UNKNOWN:** [Chog Linktree](https://linktr.ee/chognft) links to project/marketplace/build resources, but no retrieved signed governance/custody acceptance binds this game to accountable collection governance. **INFERRED:** marketplace/project links corroborate naming only. The site's `$CHOG` fungible-token address is not NFT provenance. |

### Powers and restrictions

| Power/control | Classification / precise boundary |
| --- | --- |
| Mint/configuration | **VERIFIED:** admin configures roots, schedules, windows, stage caps/prices, team allotments and reserve minting. Immutable `maxSupply=1969`, `reserveMax=256`; stage/reserve minted 1713/256 exhaust both budgets at snapshot. Source's “1500” comment is not the deployed limit. **INFERRED:** no additional mint headroom under the matched current code. |
| Transfers | **VERIFIED:** included ERC-721 authorizes owner, token-approved address or approved operator; nonzero recipients and proper ownership checks apply. No overridden transfer hook adds a whitelist, blacklist, operator filter or admin transfer permission. Snapshot/fork transfer success proves only the sampled path/state, not a universal future service guarantee. |
| Approvals | **VERIFIED:** exposed `approve`, `getApproved`, `setApprovalForAll`, `isApprovedForAll`; transfer clears per-token approval. Token 1425's sampled `getApproved` was zero. **UNKNOWN:** all other token approvals/operator grants; zero per-token approval does not imply no approved operator. The game neither needs nor requests approvals. |
| Pause/freeze | **VERIFIED:** no holder-transfer/gameplay pause, blacklist or account-freeze entrypoint exists in matched collection source/dependencies. Admin can close mint stages. **VERIFIED:** separate `MetadataFrozen` guard forbids base-URI changes after reveal; it is not a transfer pause. |
| Burn | **VERIFIED:** no public/admin burn entrypoint; OpenZeppelin internal `_burn` is not exposed by `ChogMint`. Transfer to zero is rejected. |
| Remint/token-ID reuse | **VERIFIED:** source only mints sequential new IDs, with no burn or counter-decrement API. **INFERRED:** no current reachable reissue path in this reproduced runtime; hypothetical reuse semantics in the game do not establish an NFT remint power. |
| Upgrade | **VERIFIED:** no source proxy/upgrade/diamond/UUPS mechanism or arbitrary mutable delegatecall; standard EIP-1967 slots were zero in 6C. **INFERRED:** no contract-level upgrade route is exposed by this reproduced collection. This does not describe admin wallets' separate EIP-7702 routing. Raw opcode-like bytes in data are not evidence of reachable upgrade code. |
| Seizure/forced transfer | **VERIFIED:** no role-based seizure or ownership override API in matched source. **INFERRED:** approved operators or whoever controls an owning smart account can still transfer under ordinary authorization; that is distinct from a collection-admin seizure power. |
| Metadata | **VERIFIED:** revealed=true, base URI IPFS CID retained in capture, startingIndex=1461; reveal/provenance commitment are one-time, and revealed base URI cannot be reset through source APIs. Placeholder URI remains admin-settable but is unused by revealed `tokenURI`. **UNKNOWN:** content availability, intended artwork/commitment correctness and usage rights; a nonzero commitment is not a validation of its contents. |
| Treasury/royalties | **VERIFIED:** admin withdraws collection sale proceeds to treasury; default admin sets treasury/team main and default royalties. These functions cannot withdraw holder NFTs or game progression. **UNKNOWN:** external marketplace royalty enforcement and treasury's effective custodians/delegates. |

## Frontend, transaction and operations security

**VERIFIED source boundaries:** source manifest and receipt remain null. Environment addresses alone cannot activate chain-143 gameplay. Vercel's checked-in command forces production simulation and clears local/RPC overrides. Local mode remains narrowly gated to isolated chain 31338. Browsing/simulation starts walletless; explicit real mode and final confirmation are separate user actions. EIP-6963 discovery and legacy fallback select a connector; cancel does not connect. Displayed names are untrusted provider claims, not genuine-wallet certification; no Phantom support is assumed.

**VERIFIED transaction path:** fresh chain/owner/binding/day/preview checks and runtime hash precede simulation/estimation and the explicit wallet request. Request pins `act`, account, token/choice and chain. Receipt path checks success, confirmations/finalized floor and canonical inclusion, then matching game/token/owner/choice/outcome evidence. Context epochs prevent rewards being attributed to a different selected survivor/account. RPC/ownership/preview failures prevent new action requests. Timeout/revert/rejection differ from confirmed progression.

**Residual risks / classification:**

- **VERIFIED:** preflight cannot atomically reserve ownership/day across wallet delay; the contract remains authoritative at execution. Midnight disclosure and gas-loss-on-revert require informed acceptance.
- **VERIFIED:** transaction state/hash is component memory, with a hash/link retained on in-component timeout. **UNKNOWN/unverified:** durable recovery after reload/unmount, replacement/cancellation UX and a genuine signing-wallet end-to-end run. Do not describe timeout handling as a persistent transaction ledger. Contract daily lock prevents duplicate progression, but a retry can still waste gas.
- **VERIFIED:** gas is explicitly estimated and passed; application-level action gas/fee ceilings are not enforced. **INFERRED:** RPC/wallet fee suggestions can exceed user expectations; the wallet must show actual fees. Deployment recommendations do not approve holder-action costs.
- **VERIFIED:** mainnet history uses 100-block requests, up to 100 chunks per page (10,000 blocks), token topics, finalized boundary, ordering/deduplication and older-page cursor. Partial/error states remain disclosed. **UNKNOWN:** production archive/SLA/indexer, rate/backoff behavior and completeness under silent provider omission. An RPC response is not a proof of all historical logs.
- **VERIFIED:** metadata uses bounded fields, timeout and scheme checks, and React text rendering rather than injecting returned HTML. **INFERRED:** external gateways/images still affect privacy/availability; post-read payload-size checks do not guarantee bounded network buffering. Metadata is never an ownership/game authority.
- **VERIFIED:** runtime/chain/receipt checks trust the configured RPC's answers; no browser light-client proof is implemented. **INFERRED:** a malicious RPC or compromised delivered JS/wallet extension can mislead the UI; independent artifact/host review and trusted wallet confirmation are necessary.
- **VERIFIED:** checked-in host headers add nosniff/referrer/permissions policy; no CSP is configured here. **UNKNOWN:** actual hosted settings, served revision, security-provider reputation and genuine extension/mobile/smart-account behavior.
- **VERIFIED:** release scripts are read-only/dry-run entrypoints and do not approve deployment; the post-deployment verifier lacks enforced approved nonce/fee caps and second-provider/source attestation, which are operator checklist gates. No auto-broadcast command is included in this packet.

## Existing validation, reused without rerunning

| Retained evidence | Supported result / limitation |
| --- | --- |
| [6C Monad suite](evidence/task6c/monad-tests.log) | 39 pass, 0 fail, 6 opt-in skips; isolated 1.8.5 with Monad execution; fuzz/invariant/reference coverage, not a formal proof |
| [6C fork suite](evidence/task6c/monad-fork.log) | 6 pass, 0 fail, 0 skip against real collection fork; ephemeral actions/transfers only |
| [6C gas suite](evidence/task6c/representative-gas.log) | 4 pass; first/repeat/achievement/wrapper samples, not complete smart-wallet transaction overhead or worst-case limits |
| [6C frontend suite](evidence/task6c/frontend-tests.log) | 24 files / 386 pass; ran before three subsequently added security regressions |
| [Final focused security suite](evidence/task6c/focused-security-tests.log) | 4 files / 23 pass; includes wrong-chain, failed-gas-estimate and finality regressions; no claim of a later full 389-test run |
| [Build](evidence/task6c/frontend-build.log) | TypeScript/Vite pass; existing vendor/chunk warnings |
| [Enabled browser](evidence/task6c/enabled-browser.log) | 25 pass, desktop/mobile synthetic providers and intercepted RPC; no genuine MetaMask/Blockaid test |
| [6C secret inventory](evidence/task6c/changed-file-security-inventory.json) | Scoped changed/untracked file scan; two explorer-input `.val()` false positives; no project secret identified, not an absolute absence proof |
| [6D consistency check](evidence/task6d/offline-reproduction.json) | Unchanged candidate/source/artifact and collection-input/runtime consistency; not a repeated test suite |

## Warning status and precise evidence gaps

**VERIFIED available URLs:** project demo candidate `https://chog-survivor.vercel.app/`; source repository `https://github.com/ScapeXYZ/chog-survivor`; official [MetaMask alert guidance](https://support.metamask.io/configure/wallet/security-alerts), [URL-warning guidance](https://support.metamask.io/stay-safe/safety-in-web3/deceptive-site-ahead-when-trying-to-connect-to-a-site/), [MetaMask/Blockaid portal](https://blockaid-false-positive-portal.metamask.io/) and [Blockaid report portal](https://report.blockaid.io/). Current canonical GETs/hashes are retained in [access evidence](evidence/task6d/canonical-access.json).

**UNKNOWN:** exact flagged URL including path/query, redirect destination, wallet/browser/version/platform, UTC warning time, exact classification text and provider attribution, real screenshot, case ID and disposition. No file found in the prior evidence is a genuine warning capture; gameplay screenshots are not substitutes. The root demo URL is a candidate reference, not verified to be the exact warning-trigger URL. Public-list nonmatches are historical bounded observations, not provider clearance. A self-review cannot establish that the alert is a false positive.

The [external handoff](TASK_6D_EXTERNAL_REVIEW_HANDOFF.md) contains a ready-to-complete provider request, correct route selection and exact missing attachments. No screenshot was fabricated, no warning bypassed, and no form/deep link was executed. Static portal inspection matters: the MetaMask portal bundle includes a report route with a network submission effect on entry; opening a populated continuation/deep link may itself transmit data. Owner submission authorization must precede that step.

## Human/provider/owner blockers

These are distinct from ordinary coding tasks; no further local test rerun can supply them.

| ID / gate | Responsible party | Exact closure evidence |
| --- | --- | --- |
| H1 / deployment | Independent security reviewer | Named review of this exact source/artifact manifest, own reproduction/scenario results, severity findings and accepted residual risks; reviewer scope/identity/date, not a relabeling of this self-review |
| H2 / deployment | Chog Genesis accountable project owner/governance | Authenticated canonical NFT/creation attestation; complete finalized role-event export/current members; custody and signer/quorum policy; active EIP-7702/delegation permissions and responsible custodians; acceptance of immutable `ownerOf` dependency and incident responsibilities |
| H3 / retained deployment and frontend gates | Person observing warning + wallet provider + project owner | Genuine redacted screenshot/exact URL/version/classification; permission to submit the completed draft; provider case/disposition and protected genuine-wallet retest. Provider decides classification; owner cannot substitute a self-declared clearance |
| H4 / deployment authorization | Project owner and deployer custodian | Approve exact artifact/release digest, sender, chain, refreshed nonce, zero value, explicit gas/max fee/priority/total/reserve caps, expiry and one-attempt scope; attest secure signing process without disclosing secrets |
| H5 / frontend release | Owner/release operator and genuine wallet testers | Separately approved actual game receipt/manifest, served revision/host settings, supported-wallet results, archival/monitoring/incident owner and explicit publication permission; current fixture tests are not genuine-wallet evidence |
| H6 / public release | Rights holders/project owner | Written asset/font/branding permissions and external submission eligibility decisions where required; source/source-code ownership does not automatically grant NFT artwork rights |

Fresh balance/nonce/fee checks and post-deployment runtime/source verification remain technical operational steps, but they cannot substitute for H1–H4. **NO-GO remains; stop at authorization.** The handoff is prepared locally and has not been sent.

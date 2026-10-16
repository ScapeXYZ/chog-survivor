# Task 6E — final deployment decision

2026-10-16. **Preparation complete; NO-GO for signing/broadcast.** An exact unsigned Monad mainnet candidate is ready for review. Independent security acceptance, collection governance/custody acceptance, warning-policy disposition and explicit owner/custodian transaction authorization remain outstanding. No private keys/recovery phrases were requested, generated, exported, displayed or stored; no wallet was unlocked or signing/device/browser-wallet session opened. No deployment, broadcast, Anvil reset, commit, push or Vercel publication occurred.

## Owner warning observation — updated, not provider clearance

The project owner reports: **“the MetaMask/Blockaid warning is no longer appearing.”** [Recorded observation](evidence/task6e/owner-warning-observation.json). This updates the reported symptom; it is **not official provider clearance**, an independently reproduced protected-wallet result or a provider case/disposition. Exact retest URL/path, platform/version/time, screenshot and provider classification have not been supplied with the observation. The earlier provider request remains unsubmitted.

The owner and independent reviewer must explicitly disposition the retained Tasks 6A–6D warning gate: obtain provider disposition where their policy requires it, or document acceptance of the owner observation with a protected genuine-wallet retest and the remaining uncertainty. This task neither silently removes the prior gate nor claims the provider has cleared the site. No bypass or provider submission was performed.

## Confirmed artifact and unchanged review inputs

Read Tasks [6A](TASK_6A_MAINNET_LAUNCH_READINESS.md), [6B](TASK_6B_MAINNET_RELEASE_CHECKLIST.md), [6B approval](TASK_6B_DEPLOYMENT_APPROVAL.md), [6C](TASK_6C_DEPLOYMENT_GATE_REVIEW.md), [6D](TASK_6D_FINAL_SECURITY_REVIEW.md), [external handoff](TASK_6D_EXTERNAL_REVIEW_HANDOFF.md), [deployment runbook](TASK_6A_MAINNET_DEPLOYMENT_RUNBOOK.md) and current source/configuration/evidence. All **145** entries of the 6D review manifest still match; [comparison](evidence/task6e/source-manifest-comparison.json). No successful test, build or browser suite was repeated. Prior results and their scope remain as documented in 6C/6D; a self-review is not an independent audit.

[Offline confirmation](evidence/task6e/offline-confirmation.json):

| Identity | Exact candidate |
| --- | --- |
| Frozen source | `src/ChogSurvivor.sol:ChogSurvivor` |
| Source SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| Compiler/settings | Solidity `0.8.28+commit.7893614a`, optimizer enabled **200**, **Cancun** |
| Artifact file | `out/ChogSurvivor.sol/ChogSurvivor.json` |
| Artifact file SHA-256 | `adf4c5c23213818fdcafb7ea55ca3e50a277156bccf7abe4a90a83cc8d0545f0` |
| Creation bytecode | 6,772 bytes; Keccak-256 `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Constructor | **No arguments**; hardcoded immutable NFT binding `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Expected bound runtime | 6,688 bytes; Keccak-256 `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` |

Creation data contains only the pinned artifact bytecode, with no appended constructor parameters. The expected runtime patches the constructor immutable; the unpatched runtime template is not the expected deployed code. The new bounded `eth_call` returned exactly that bound runtime. Neither an expected runtime nor a predicted CREATE address is evidence that a game is deployed.

## Fresh read-only network and deployer checks

[RPC refresh](evidence/task6e/rpc-refresh.json), [full request/response transcript](evidence/task6e/rpc-transcript.json). Capture window: **2026-10-16 15:40:19–15:41:24 UTC**. Primary `https://rpc.monad.xyz`; independent `https://rpc3.monad.xyz`. Every network operation used an allowlisted read-only method; no wallet/signing API or mutating RPC method was used.

| Read | Result |
| --- | --- |
| Chain | **143**, both providers |
| Exact finalized snapshot | **113935700**, hash `0xe53d84173c2473086473faad45777e99284c10ba56a926efc7a2b9aadae8fe4b` |
| Deployer balance at snapshot | **0.4 MON** (`400000000000000000` wei), both providers |
| Deployer code | **`0x`**, both providers |
| Latest / pending nonce | **0 / 0**, both providers; pending observations are provider-local |
| Collection runtime | `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46`; exact bytes match across providers and prior reproduced source |
| Nonce-zero CREATE prediction | `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`; code empty at snapshot |
| Base / suggested priority / suggested price | **100 / 2 / 102 gwei**; suggested price matches across providers |
| Unbounded primary creation estimate | **1,510,761 gas** |
| Estimate with proposed 1,600,000 gas / 125 gwei cap / 2 gwei priority | **1,510,761 gas**, both providers |
| Bounded creation simulation | `eth_call` at recorded snapshot succeeds and returns exact expected game runtime |

The proposed gas limit is approximately 5.91% above the current estimate. At 102 gwei, **1,600,000 gas costs 0.1632 MON**; at the proposed maximum 125 gwei it costs **0.2 MON**. Starting from 0.4 MON leaves at least **0.2 MON** for this single capped, zero-value attempt, above the proposed 0.1 MON reserve. Require at least **0.3 MON** before future signing under these limits. This is one-attempt arithmetic, not an approved retry budget. Refresh state/nonce/fees immediately before authorization; a changed nonce/artifact/cap invalidates this sheet rather than silently regenerating it.

## Governance, custody and delegated permissions

**Verified at the recorded snapshot:** collection runtime remains identical to the source/creation reproduction in 6C/6D. `maxSupply=1969`, reserve=256, stage/reserve minted=1713/256, revealed=true, startingIndex=1461; treasury/team-main and known roles remain unchanged. Both role administrators are `DEFAULT_ADMIN_ROLE` (zero bytes32).

| Known account / control | Verified evidence | Unresolved attestation |
| --- | --- | --- |
| Creator `0x79bbEc62F13BF1756e2F29F465240814EC1876F4` | Default admin and admin, empty code | Who controls keys, hardware/MPC/quorum/incident policy |
| Treasury `0x84113421A8a564b594ee9Ae78c875310332d7023` | Admin, not default admin; EIP-7702 indicator points to target below | Custodians, active delegations/permissions, effective operational quorum |
| Team main `0x285074ee7A7AE5e0a2188949FE6bD71DE25492b7` | Neither tested role; same EIP-7702 indicator | Custodians/permissions; team-main label alone grants no admin role |
| Delegator target | `0x63c0c19a282a1b52b07dd5a65b58948a07dae32b`, runtime hash unchanged: `0xd4dee59ae6be4a997964e8f19ae6905f0a233c6ae88d9bc5d945bc60738376c1` | No independent target-runtime rebuild/acceptance or complete active permission audit |

**Verified source boundaries:** collection uses AccessControl, not an exposed Ownable `owner()`. Admins control bounded mint configuration/proceeds/metadata setup; default admin controls role grants, treasury/team-main and royalties. Existing ERC-721 approvals permit authorized transfers. The matched collection has no exposed transfer pause/freeze/blacklist, burn/remint, seizure or upgrade route; supply ceilings are exhausted. Revealed base URI cannot be changed via its APIs. Metadata availability and usage rights are separate. Game `act` still requires the exact current `ownerOf` address; NFT operator approvals confer no direct game authority.

**Inferred:** the two delegation indicators are consistent with MetaMask's documented EIP-7702 target, as investigated in 6D. This does not prove MetaMask was the warning classifier, identify custodians or establish a multisig. Delegated account routing can change without changing collection runtime.

**Unknown / not newly closed:** complete role membership (known-account probes are not enumeration); signed off-chain delegations and effective permissions; authenticated project canonical-address/governance acceptance; custody/quorum attestations; independent security acceptance. Code bytes cannot establish the absence of outstanding off-chain signed permissions. The complete indexed role-event export and accountable attestations requested in 6D remain necessary for human acceptance. No repeated failing role-history crawl, Sourcify request, provider appeal or signing challenge was performed.

## Frontend and asset/branding release separation

**Confirmed local state:** source manifest and deployment receipt remain **null**. Mainnet mode requires both `VITE_CHOG_ENV=mainnet` and a structurally valid reviewed game manifest containing chain 143, distinct nonzero game address, deployment block and runtime hash. Environment-supplied game addresses cannot activate the current candidate. Vercel's checked-in command forces `VITE_CHOG_ENV=production` and clears local/RPC overrides; simulation remains the public build. [Configuration evidence](evidence/task6e/frontend-mode-confirmation.json). Actual hosted settings/revision were not changed or independently re-attested in this task.

The code gate validates manifest fields; it cannot itself prove explorer verification or human approval. Those must precede any source-manifest change. No address/receipt was invented to activate gameplay. Frontend publication remains separate from a contract-only deployment decision.

[Permission review](evidence/task6e/asset-permission-review.json) and [asset inventory](../frontend/ASSET_INVENTORY.md):

- Three runtime illustrations remain provisional: ruined environment, refined survivor and moonlit fog. Obtain written owner/rights-holder confirmation for exact images, Chog name/likeness/branding and public UI/screenshots/video use. NFT ownership and verified metadata do not grant those rights.
- Lilita One's unmodified font and OFL notices are present, including the public license copy. Cinzel/IM Fell English notices are retained for the video's cached fonts. Preserve applicable notices/reserved-name conditions; a source inventory is not a legal rights attestation.
- Video/audio publication also needs owner confirmation of Remotion organization eligibility and retention of the documented Kokoro/engine/font/license notices. No video publication is authorized here.
- These are public-facing asset/use gates, not a claim that deploying Solidity distributes those image/font files. The owner must separately confirm authority for the contract's naming, collection integration and any claimed affiliation before contract deployment.

## Exact unsigned deployment transaction review sheet

Canonical proposal: [unsigned-deployment-candidate.json](evidence/task6e/unsigned-deployment-candidate.json). It contains the **entire creation data and unsigned serialized type-2 payload**, not a signing/broadcast instruction. Human-readable companion: [transaction-review-sheet.json](evidence/task6e/transaction-review-sheet.json); offline raw-RLP validation: [unsigned-field-verification.json](evidence/task6e/unsigned-field-verification.json).

| Transaction field | Exact proposed value |
| --- | --- |
| Type | **EIP-1559 / 0x02**; ordinary CREATE, no factory or CREATE2 |
| From | **`0x320eDAe253259053d53feD8eEe6D9C0274A91E85`**; signer must independently match this address |
| Chain ID | **143** |
| Nonce | **0**, based on fresh latest/pending 0/0; not reserved by this document |
| To | **Absent / contract creation**; never the collection or predicted new address |
| Data | Exact 6,772-byte artifact creation data; hash as above; no constructor arguments |
| Value | **0 MON / 0 wei** |
| Gas limit proposal | **1,600,000** |
| Maximum fee proposal | **125 gwei / 125000000000 wei** |
| Maximum priority fee proposal | **2 gwei / 2000000000 wei** |
| Access list | **Empty** |
| Maximum deployment spending | **0.2 MON**, one attempt; no additional value/transfer or automatic retry |
| Minimum remaining balance | **0.1 MON** |
| Candidate JSON SHA-256 | **`f7707ac8ae138a75b1b26777684f6235f91edf17c2980a1c585f39c3cce2643a`** |
| Unsigned signing-payload Keccak-256 | **`0xd1a256ad5ca962d06e9cb55243436faec4b58e77fd61b21309b6fc88012389e9`** |
| Signature / signed transaction hash / authorization | **None / none / none** |

The signing-payload digest is **not a transaction hash** and cannot be used to claim submission. No EIP-7702 authorization list, wallet batch, sponsor, additional call or access-list change is part of this type-2 proposal. Any signer/tool substitution or transaction-field change requires review, not an automatic cap or nonce update. No deployment receipt/block/address is approved for frontend activation.

## Signing method identified; no signing session started

The pinned **Foundry 1.8.5** [local CLI help](evidence/task6e/forge-script-help.txt) supports browser wallets (`--browser`), hardware wallets (`--ledger` / `--trezor`) and existing encrypted-keystore aliases (`--account`). Those capabilities were inspected only; no device, browser wallet, alias or credential store was opened.

1. **Preferred if the approved sender already belongs to a supported hardware device:** the custodian uses that existing device through a reviewed hardware-wallet client. Confirm the public address on-device equals the exact sender and that the device/client can review the chain-143 contract-creation transaction with these fields. A different device address is a different deployer and needs a new decision; do not move/import/export a seed to force a match.
2. **If this sender already lives in a local browser wallet:** Foundry's browser-wallet integration is a supported route for later owner-controlled signing, with the wallet showing the matching account, chain and exact creation/fee fields. Do not export the account into a CLI. If an existing encrypted Foundry keystore is the owner's established signer, its alias can instead be used through its local unlock/password flow; do not provision/import a key during this task.
3. **Unresolved signer choice:** no supplied evidence identifies which wallet/device actually controls the approved sender. The owner/custodian must select and attest the existing method, public address, supported contract-creation review and custody process. No hardware compatibility or meaningful device display has been tested here.

No raw-key flags, recovery phrase, key-entry prompts, password-in-arguments, unlocked public RPC or Anvil key are appropriate. No secret should be shared in chat or evidence. The existing wrapper is dry-run-only; it is not an exact authorized signing recipe. In this pinned CLI, `--gas-limit` aliases **block gas limit**, not the final transaction gas field. `--gas-estimate-multiplier 100` also does not set this exact 1,600,000 limit. A future reviewed wallet/tool must demonstrably preserve the unsigned proposal's transaction fields; otherwise stop and choose/review a suitable method. No executable signing or broadcast command is included.

## Independent reviewer acceptance and exact human sign-offs

[Concise independent acceptance form](evidence/task6e/INDEPENDENT_REVIEW_ACCEPTANCE.md) is **uncompleted**, attached to the exact candidate hash/digest and 6D threat-scenario handoff. Reviewer identity, independence/conflicts, own findings/reproduction, accepted residual risks and dated recommendation are required. The preparer cannot fill that role by self-certification.

| Approval | Responsible party / exact missing record |
| --- | --- |
| **A — independent security acceptance** | Named independent reviewer: exact code/artifact/candidate, findings, immutable ownerOf/day/transfer/no-pause risks and scoped deployment recommendation |
| **B — collection governance/custody acceptance** | Accountable Chog/project governance: canonical-address/affiliation acceptance, complete roles, key/quorum/active delegated-permission attestations and incident responsibilities; reviewer records any explicitly accepted exceptions |
| **C — warning-policy disposition** | Owner + independent reviewer: record the new observation and protected retest details; provider disposition if their retained gate requires it, or explicit acceptance of remaining provider-status uncertainty. Do not label either owner observation or risk acceptance “provider clearance” |
| **D — signer method/custody confirmation** | Deployer custodian: existing browser/hardware/keystore method controlling the exact public sender, local secure workflow and ability to preserve/review all transaction fields; no secrets supplied |
| **E — one deployment authorization** | Project owner + custodian: exact candidate file hash and signing-payload digest, sender/chain/current nonce/value/gas/max fee/priority/total/reserve, expiry and one-attempt scope; refresh RPC state before authorization |
| **F — naming/assets and later publication** | Owner/rights holders: authority for contract naming/collection affiliation; separately, exact artwork/font/branding/video use, real receipt/verified manifest, genuine wallet/host/archive/operations review and explicit frontend push/publication permission |

Approval fields A–F are **not supplied by this task**. Preparation is technically ready for review; the live network checks pass at their snapshot. **Final decision: NO-GO for signing/broadcast until A–E and contract-use authority in F are explicitly dispositioned and the exact transaction is authorized.** Public frontend release remains independently gated even after any future contract authorization. Stop here.

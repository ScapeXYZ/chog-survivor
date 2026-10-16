# Task 6D — external security and provider review handoff

2026-10-16. **PREPARED LOCALLY / NOT SENT / NOT APPROVED.** Companion: [final security review](TASK_6D_FINAL_SECURITY_REVIEW.md). The preparer is not an independent auditor. Reviewer identity, findings, governance attestations, provider disposition and owner authorization must be supplied by the appropriate parties. Nothing here authorizes signing, deployment or publication.

## 1. Review package and expected identities

Start from the current complete working tree in `~/chog-survivor`, including untracked candidate files; do not assume base Git revision alone reproduces it. Retain an external review copy and compare [review-artifact-manifest.json](evidence/task6d/review-artifact-manifest.json). It pins 145 source/config/lock/test/library/artifact files. Reports/evidence are indexed separately in [prior-evidence-index.json](evidence/task6d/prior-evidence-index.json). Do not bundle ignored environment files, wallet profiles, keystores or home credentials.

| Input | Expected |
| --- | --- |
| Frozen game source | `src/ChogSurvivor.sol`, SHA-256 `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| Game creation artifact | `out/ChogSurvivor.sol/ChogSurvivor.json`; file SHA-256 `adf4c5c23213818fdcafb7ea55ca3e50a277156bccf7abe4a90a83cc8d0545f0` |
| Creation bytecode | 6,772 bytes; Keccak-256 `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Expected immutable-bound game runtime | 6,688 bytes; `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` |
| Game compiler | Solidity 0.8.28+commit.7893614a; optimizer 200; Cancun |
| Foundry | Official 1.8.5 / `51a52c59cffd940f76eddd0b4bb1791aa4b5ac7f`, isolated; archive SHA-256 `6c66ffcc55fa4249197721baa3098bc208014ea1d8aa04b2ed50ac6bccffb226` |
| Collection | `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`, chain 143 |
| Collection runtime | `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46` |
| Collection build input/output | `docs/evidence/task6c/collection-standard-input.json` / `collection-compiler-output.json`; Solidity 0.8.28, optimizer **800**, Cancun, no viaIR |
| Collection creation | `0x23347f41b8c921039de31853994b29f21b2c9f2547d97145e64acc93a09ae4bd`, block 101704036 |
| Proposed deployment | Sender `0x320eDAe253259053d53feD8eEe6D9C0274A91E85`; chain 143; no constructor arguments; value 0 |
| Recommended limits, not approved | 1,600,000 gas; max fee 125 gwei; max one-attempt cost 0.2 MON; minimum remaining reserve 0.1 MON; require ≥0.3 MON starting balance; proposed priority cap 2 gwei |

Evidence scripts under `docs/evidence/task6d` do not import a wallet or use a signer. `verify-offline.mjs` has no network calls; governance collectors only read RPC. Inspect scripts before running. The original 1.7.1 installation must remain untouched. If `/tmp` tooling has disappeared, independently obtain the pinned official archive and verify the digest/provenance before execution; do not run a blind installer.

## 2. Independent reviewer checklist and commands

The preparer did **not** rerun unchanged successful suites in Task 6D. The commands below are a reproducibility checklist for the external reviewer. Run tests only in ephemeral Forge state; do not run old real-Anvil fixture/mint/transfer/capture harnesses. There is no broadcast or publication command in this packet.

### A. Pin the reviewed state before interpretation

- [ ] Record reviewer name/organization, UTC start/end, independence/conflicts, package digest and base Git revision plus dirty-tree inventory.
- [ ] Hash every review-manifest entry; stop on any unexplained mismatch. A new artifact/revision requires a new review record.
- [ ] Confirm the frozen source and null game manifest/receipt; no environment address may bypass them.

```bash
cd ~/chog-survivor
sha256sum src/ChogSurvivor.sol out/ChogSurvivor.sol/ChogSurvivor.json
node docs/evidence/task6d/verify-offline.mjs
node frontend/scripts/release-artifact.mjs
git diff --check
```

Expected: exact source/artifact hashes above, `approved:false`, collection constructor/runtime consistency, no baseline source mismatch. The helper validates against retained compiler output; it is not a substitute for an independent compiler run.

To verify the full handoff manifest without exposing file contents:

```bash
python3 - <<'PY'
import json, pathlib, hashlib
manifest = json.load(open('docs/evidence/task6d/review-artifact-manifest.json'))
for entry in manifest['files']:
    actual = hashlib.sha256(pathlib.Path(entry['path']).read_bytes()).hexdigest()
    assert actual == entry['sha256'], entry['path']
print('Manifest hashes match:', len(manifest['files']))
PY
```

Expected: **145 matching entries** for this packet. Keep the manifest's own SHA-256 from [packet-files.sha256](evidence/task6d/packet-files.sha256) in the signed external review record.

### B. Independently compile without touching installed tooling or baseline artifacts

Use a fresh temporary directory. The paths below name the already reviewed executables; verify they exist and match the expected versions first.

```bash
REVIEW_FORGE=/tmp/chog-task6c-toolchain/forge
REVIEW_SOLC=/home/temitope/.local/share/svm/0.8.28/solc-0.8.28
REVIEW_DIR=$(mktemp -d /tmp/chog-external-review.XXXXXX)
"$REVIEW_FORGE" --version
"$REVIEW_SOLC" --version
"$REVIEW_FORGE" build --offline --out "$REVIEW_DIR/out" --cache-path "$REVIEW_DIR/cache"
"$REVIEW_SOLC" --standard-json < docs/evidence/task6c/collection-standard-input.json > "$REVIEW_DIR/collection-output.json"
python3 - "$REVIEW_DIR" <<'PY'
import json, pathlib, sys
review = pathlib.Path(sys.argv[1])
old = json.load(open('out/ChogSurvivor.sol/ChogSurvivor.json'))
new = json.load(open(review/'out/ChogSurvivor.sol/ChogSurvivor.json'))
assert old['bytecode']['object'] == new['bytecode']['object']
assert old['deployedBytecode']['object'] == new['deployedBytecode']['object']
fresh = json.load(open(review/'collection-output.json'))
assert not [e for e in fresh.get('errors', []) if e['severity'] == 'error']
prior = json.load(open('docs/evidence/task6c/collection-compiler-output.json'))
a = fresh['contracts']['src/ChogMint.sol']['ChogMint']['evm']
b = prior['contracts']['src/ChogMint.sol']['ChogMint']['evm']
assert a['bytecode']['object'] == b['bytecode']['object']
assert a['deployedBytecode']['object'] == b['deployedBytecode']['object']
print('Independent compilation matches game and collection bytecode')
PY
```

Expected: zero compiler errors, exact game creation/runtime-template parity and collection creation/runtime-template parity. Decode collection constructor from its canonical transaction, patch maxSupply/reserveMax immutables as recorded in [6C provenance](evidence/task6c/collection-provenance.json), and compare the **entire** runtime including CBOR to a block-pinned `eth_getCode`. Confirm receipt sender, null destination, chain ID, status, CREATE address derivation and canonical creation inclusion. The standard input includes all 22 source contents, so no dependency installation is needed for collection reproduction.

### C. Inspect invariants, then reproduce tests if independently required

- [ ] Read game functions and reference model; evaluate threat scenarios below before relying on green logs.
- [ ] Read all warnings/skips. Explicitly opt into the real collection fork; a skipped fork is not a compatibility pass.
- [ ] Verify no test uses a live signer, `--broadcast` or existing Anvil RPC.

```bash
MONAD_RPC_URL= "$REVIEW_FORGE" test --offline --network monad --out "$REVIEW_DIR/out" --cache-path "$REVIEW_DIR/cache" --gas-report
MONAD_RPC_URL=https://rpc.monad.xyz "$REVIEW_FORGE" test --offline --network monad --out "$REVIEW_DIR/out" --cache-path "$REVIEW_DIR/cache" --match-contract MonadForkIntegrationTest -vv
MONAD_RPC_URL=https://rpc.monad.xyz "$REVIEW_FORGE" test --offline --network monad --out "$REVIEW_DIR/out" --cache-path "$REVIEW_DIR/cache" --match-contract Task6CGasTest --gas-report -vv
```

Expected: existing **39 non-fork tests pass**, opt-in integration/gas suites skip with no RPC; explicit integration **6 pass / 0 skip**; gas sample **4 pass**. Pin the external fork block/time in your own evidence where feasible. The existing fork uses current endpoint state, not a reproducible historical block fixture. No test-level gas total or zero fork-deployment report is an approved transaction limit. The simple smart-wallet wrapper is not a Safe/ERC-4337/7702 execution/security certification.

Frontend reproduction, if the external reviewer chooses to run it in the reviewed copy with the existing lockfile/dependencies:

```bash
VITE_CHOG_ENV=production npm test --prefix frontend -- --maxWorkers=2
VITE_CHOG_ENV=production npm test --prefix frontend -- --maxWorkers=2 src/MainnetContractAdventure.test.tsx src/survivalHistory.test.ts src/contracts.test.ts src/mainnetDeployment.test.ts
VITE_CHOG_ENV=production npm run build --prefix frontend
```

Expected: zero failures. Historical full suite is **386 passes**; the current source adds three security regressions, so a fresh full run is expected to include **389** unless the reviewed source changes. This is an expected count, not a claim that 6D ran it. Final retained focused run is **23 passes**. TypeScript/build should pass with known vendor annotation and chunk-size warnings. Review `frontend/vite.config.ts`: unit configuration fixes a read-only baseline independently of local environment files.

Optional synthetic browser command from `frontend`: `node scripts/mainnet-enabled-browser.mjs`. Expected **25 passing checks**, all external RPC intercepted, synthetic EIP-6963 wallets, isolated `/tmp` manifest/bundle. Inspect that transform targets only the manifest declaration. It proves no genuine-wallet/provider verdict. A real protected-wallet review is separate and must stop at any warning; no signing/broadcast is authorized here.

### D. Canonical chain/governance and custody verification

- [ ] Use [6D governance snapshot](evidence/task6d/governance-current.json), [delegator code](evidence/task6d/delegator-code.json) and [6C source/creation evidence](evidence/task6c/collection-provenance.json); independently read the same block hashes where archival RPC permits.
- [ ] Obtain a complete indexed RoleGranted/RoleRevoked/RoleAdminChanged export from creation through a named finalized block. Reconstruct members and check each with `hasRole`; reconcile constructor grants and role-admin relationships. Do not equate known-address probes with complete membership.
- [ ] Confirm creator default-admin/admin roles; treasury admin role; team main neither role at recorded snapshot. Re-read current roles before acceptance; changes require review.
- [ ] Inspect treasury/team EIP-7702 indicators and exact target code on **Monad**, not just the same address on Ethereum. Review actual active permissions/delegations/account control and request owner custody/quorum attestations. Empty creator code proves neither hardware custody nor a multisig.
- [ ] Inspect included ERC-721/AccessControl code for transfer/approval rules, internal burn visibility and unexposed upgrade/seizure/pause paths; no conclusions from selector guesses alone.
- [ ] Compare independent RPC observations on one exact finalized block; pending nonce is provider-local. Use the working officially listed `rpc3.monad.xyz` for comparison as in 6C if accessible; record failures rather than retrying unavailable services indefinitely.

Fresh read-only collector, inspect first: `node docs/evidence/task6d/read-governance.mjs`. It prints a newly timestamped JSON report; save it to a **new** destination outside the preserved evidence. `read-delegator.mjs` uses the saved 6D governance snapshot. The old `task6c-*` collectors use exclusive output paths and must not be rerun against existing capture names. No Sourcify request is required to reproduce the retained matched collection source.

Expected snapshot: collection runtime hash unchanged; supply 1969, reserve 256, stage/reserve minted 1713/256, revealed=true, startingIndex=1461; known roles as listed in final report. Any fresh difference is evidence to investigate, not a value to force back to the expected state. Complete members, human custody and canonical team approval remain unknown until independently supplied.

### E. Threat-scenario sign-off matrix

| Scenario | Required behavior / exact review surface |
| --- | --- |
| Wrong/absent NFT, invalid choice, arbitrary token ID | `preview`/`act` fail for absent NFT/invalid choice with no persisted mutation; default `characterOf` is not existence proof. `ChogSurvivor.t.sol`, `MonadForkIntegration.t.sol` |
| Approved operator, old owner, relayer, contract wallet | Only actual `ownerOf` address can call `act`; approved operator may transfer under NFT rules but cannot directly play. Smart-account execution must originate from owner address. `ChogSurvivorAchievements.t.sol` authorization case |
| Same-day replay, transfer then replay, midnight race | One successful action per token/day; transfer retains lock/state; next UTC day unlocks. Pending midnight transaction may execute new encounter; reviewer/owner must accept this immutable ABI behavior |
| Scar/XP/counter boundaries, skipped days, simultaneous achievements | Clamps/saturation, actual deltas, unmarked rule, monotonic bits, once-only logs and title precedence match reference model. `ReferenceModel.t.sol`, achievements/invariants |
| Wallet switch/disconnect/token switch during async work | Context invalidation blocks stale confirmation; receipt belongs to origin token/account. Existing local/mainnet/ownership tests and manual source review |
| Wrong chain/RPC, mismatched runtime/binding, stale owner/preview, failed estimate/simulation | No write request; error disclosed. `MainnetContractAdventure.test.tsx`, availability/session tests |
| Reverted receipt, finality behind receipt, forked inclusion, unrelated/malformed logs | No fabricated reward; retain submitted hash and distinguish uncertain status. Finality/timeout regressions plus direct receipt/log review |
| Replacement/cancel/reload during pending transaction | Independent reviewer must document current gaps; no durable pending ledger is claimed. Do not retry blindly: chain lock protects state, not gas expenditure |
| Multiple advertised providers / spoofed wallet names | Explicit selection and cancel; no automatic account prompt from navigation, no assumption a provider label authenticates vendor/network support. `App.test.tsx`, synthetic enabled browser |
| Broken/omitting/rate-limited archive RPC | Partial/error states; 100-block mainnet log chunks, 10,000-block pages, explicit older cursor; no claim that a provider's silent omission is detectable. History source/tests |
| Malicious gateway/metadata, compromised hosted bundle | Metadata never authorizes actions; review scheme/text handling, external requests, build/host provenance and wallet destination/fees. External-host trust remains |
| Collection role compromise, delegated-wallet compromise | Role limits do not grant NFT seizure/upgrade in matched source; treasury/royalty/mint-config and account permissions remain real powers. Independently accept key/delegation/custody risks |
| Deployment fee default drift or nonce changes | Stop when any exact approval field changes; no silent cap increase, reuse of stale CREATE prediction or automatic retry. Artifact/nonce/fee operator gates |

### F. External review deliverable

Return reviewer identity, independence/conflicts, exact package hash, tools/commands/block snapshots, scenario results, findings/severity/exploit prerequisites, open questions, evidence limitations, accepted immutable behaviors and dated recommendation. Separate contract deployment from frontend publication. A reviewer must not sign off a future edited manifest, unknown served bundle or unapproved fees by referring only to this report.

## 3. Wallet-provider review — precise current status

| Field | Available value / missing evidence |
| --- | --- |
| Candidate project URL | `https://chog-survivor.vercel.app/` |
| **Actual flagged URL/path/query and any redirect** | **UNKNOWN — must be captured from the genuine alert**; do not substitute the candidate root URL |
| Actual warning screenshot | **MISSING**; no existing gameplay screenshot is a provider-warning capture |
| Exact classification/text | **UNKNOWN**; do not assume “Warning”, “Malicious”, transaction simulation or phishing category |
| Provider attribution | MetaMask/Blockaid is reported context; exact underlying provider for this alert is **UNCONFIRMED** |
| Network / methods relevant to candidate | Monad 143; optional EVM connection and NFT reads; future enabled play requests `act(uint256,uint8)` only after confirmation. No approved game deployment exists |
| Wallet/browser/device/version / UTC time | **MISSING** |
| Case ID, disposition, protected retest | **MISSING — no submission/clearance claimed** |
| Public source | `https://github.com/ScapeXYZ/chog-survivor`; candidate working tree differs from public/hosted revision until owner verifies otherwise |

### Confirmed official routes and observed submission requirements

[MetaMask's current alert guidance](https://support.metamask.io/configure/wallet/security-alerts) distinguishes transaction reports from URL/token/address support review. For a transaction alert, its details/report action supplies transaction context. Otherwise use support, including what was flagged, network, screenshot and official reference links. The [website-warning page](https://support.metamask.io/stay-safe/safety-in-web3/deceptive-site-ahead-when-trying-to-connect-to-a-site/) also names [eth-phishing-detect issues](https://github.com/MetaMask/eth-phishing-detect/issues) for domain reviews. Route depends on the captured alert; do not assert an exact class before seeing it.

Static public portal inspection, saved with hashes in [canonical-access.json](evidence/task6d/canonical-access.json), [supplemental access](evidence/task6d/supplemental-canonical-access.json) and [form extracts](evidence/task6d/portal-form-extracts.json):

- [MetaMask/Blockaid portal](https://blockaid-false-positive-portal.metamask.io/) describes transaction misclassification and accepts optional contact email. Its continuation/report route can transmit a report on entry when supplied transaction data. **Do not open populated continuations/deep links until the owner approves submission.** No such route was executed here.
- [Blockaid's official contact page](https://blockaid.io/contact) links to the [report portal](https://report.blockaid.io/). Its `/mistake` route is for an existing false-positive report; developer project checks are separate. Observed form code offers domain/address, chain, wallet, conditional transaction hash, optional email/additional details and CAPTCHA, with a summary step; at least domain or address is required for that report flow. This is a source snapshot, not an assertion of every server-side requirement or a completed form submission.

No authenticated wallet context or provider classification API was available. No live genuine wallet was opened, no new warning screenshot produced, no hidden report endpoint called and no appeal submitted. Leave protections enabled; capture/review must not involve signing or bypassing a malicious-site warning. Redact unrelated accounts/balances and browser identifiers before an authorized submission; never include keys, recovery phrases or keystores.

### Draft provider review request — not submitted

**Subject:** Request to review reported CHOG SURVIVOR alert — exact classification pending confirmation

**To be completed by the owner/observer before sending:**

- Exact flagged URL/path/redirect or flagged entity: `[MISSING]`
- Exact alert wording/classification and attributed provider: `[MISSING]`
- Genuine warning screenshot, UTC time and MetaMask/browser/platform versions: `[MISSING]`
- Owner/domain-control evidence, authorized contact and actual hosted revision/bundle hash: `[MISSING]`
- Transaction-alert context, if applicable: `[attach the wallet-generated request details after privacy review; no invented game address or transaction hash]`

> We request a review of the attached alert associated with CHOG SURVIVOR. The project reference URL is https://chog-survivor.vercel.app/ and source reference is https://github.com/ScapeXYZ/chog-survivor. The exact flagged entity and observed wording are recorded above; please identify the relevant classification/provider and evidence needed for review.
>
> The reviewed local candidate supports walletless simulation and optional EVM wallet connection/NFT ownership reads on Monad chain 143. Its approved-mainnet manifest is empty. No deployed game address or live gameplay transaction is claimed. A separately enabled future candidate requires explicit wallet confirmation for a nonpayable `act(uint256,uint8)` call and MON gas; it requires no NFT approval, staking, transfer or custody. The currently served revision still needs owner confirmation and must be assessed separately from this local candidate.
>
> We can provide the attached source/artifact hashes, request inventory and self-review with its limitations. We have not established that the alert is a false positive and have not treated public blacklist nonmatches or mocked-wallet tests as clearance. Please advise on the reported classification, appropriate review route and requirements for a protected retest. We will keep protections enabled and record your response/case ID.

**Attachment plan:** genuine redacted alert capture and exact URL; owner/domain evidence; served revision/bundle/request inventory; the approved-to-share portions of the two 6D documents and artifact manifest; public canonical collection/explorer references. Local evidence is not yet published; attachment/publication permission must be explicit. Exclude the full workspace and all credential files. Do not include the CREATE prediction as a deployed game address. A public GitHub issue is a public disclosure, so approve its exact contents first.

## 4. Owner decision record and human-only blockers

All fields below remain **UNAPPROVED / UNSUPPLIED** unless separately recorded by their responsible party.

| Blocker | Who must act | Closure |
| --- | --- | --- |
| Independent security acceptance | Independent reviewer | Exact-hash findings and scenario report; explicit acceptance of immutable no-pause/rollback, midnight and ownership-oracle risks |
| Collection identity/full roles/custody | Chog governance and custodians | Authenticated canonical-address/creation statement; finalized complete role list; key/quorum/active delegated-permission attestations; incident and immutable-game acceptance |
| Actual warning evidence and official disposition | Observer + project owner + wallet provider | Exact alert capture, permission to submit finalized draft, provider case/response and genuine protected retest; no self-declared clearance |
| One deployment authorization | Owner + deployer custodian | Exact artifact, sender, chain, current nonce/fees/balance, value zero, 1,600,000/125 gwei/0.2 MON/0.1 MON recommendations explicitly approved or revised, priority cap, expiry and one-attempt limit |
| Frontend activation/publication | Owner/release operator | Later verified actual receipt/runtime/source and approved manifest; genuine supported wallets, archive/monitoring/host revision/settings, separate push/publication permission |
| Asset/branding/public submission permissions | Rights holders/project owner | Written use/publication clearance and eligibility decisions where applicable |

Fresh read-only RPC observations and later post-deployment verification are technical operational work; they do not replace these human/provider decisions. No keys or signatures belong in the handoff. **Final recommendation: NO-GO; stop at the authorization gate.**

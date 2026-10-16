# CHOG SURVIVOR — owner-accepted unaudited deployment preparation

Date: 2026-10-16. **Preparation GO; real wallet request, signing and broadcast STOPPED at the owner's final transaction-confirmation gate.** The owner explicitly instructed proceeding toward Monad mainnet without independent security review. This records that decision; it is not an audit, independent acceptance, collection attestation, provider clearance, signed authorization or completed deployment. The owner has not yet performed the new interface's exact transaction/risk confirmations. No real MetaMask account was accessed in this task.

## Decision and unresolved risks

The owner has chosen a separate **UNAUDITED — explicit owner risk acceptance** path. This supersedes the requirement for independent security acceptance only for that deliberately unaudited path. The original independent-review path remains available and locked under its unchanged `authorization.json`; do not invent a reviewer, approval reference or digest-based substitute for independent acceptance.

The following remain prominently disclosed and require individual owner acknowledgement:

- **No independent security audit or independent security acceptance.** Prior code review and automated tests are self-review evidence, with no guarantee against undiscovered vulnerabilities.
- **Incomplete Chog Genesis governance/custody attestations.** Complete role membership, canonical-project acceptance, controller identities/quorum and effective/off-chain delegated permissions remain unproven. Reproduced source/runtime and known-account probes cannot establish these facts.
- **No official MetaMask/Blockaid warning-policy clearance.** The earlier report that the warning stopped appearing is an owner observation. No provider clearance or protected genuine-wallet retest is claimed. Keep wallet protections enabled; stop if a warning appears, rather than bypassing it.
- **Immutable, non-pausable deployed game contract.** No administrator can pause, upgrade or reverse deployment/game state. Disabling the website cannot prevent direct calls.

The collection restrictions/control findings and custody unknowns in [6D security review](TASK_6D_FINAL_SECURITY_REVIEW.md), [6D handoff](TASK_6D_EXTERNAL_REVIEW_HANDOFF.md) and [6E decision](TASK_6E_DEPLOYMENT_DECISION.md) remain applicable. Runtime agreement is not a fresh role-history/custodian attestation. Branding, affiliation and asset-use permissions remain owner responsibilities; this task grants no rights and authorizes no frontend/video publication.

## Exact unchanged candidate

Read Tasks 6A–6F, supporting evidence, the deployment runbook, current local interface and [existing unsigned candidate](evidence/task6e/unsigned-deployment-candidate.json). No frozen contract, candidate or artifact was regenerated or changed.

| Item | Exact value |
| --- | --- |
| Sender | `0x320eDAe253259053d53feD8eEe6D9C0274A91E85` |
| Chain / type / nonce | Monad mainnet **143** / EIP-1559 **2** / **0** |
| Destination / value / access list | Contract creation: `to` absent / **0 MON** / empty |
| Gas / maximum fee / priority cap | **1,600,000 / 125 gwei / 2 gwei** |
| Maximum single-attempt cost | **0.2 MON**; no automatic retry/replacement allowance |
| Minimum reserve / starting balance | **0.1 MON / 0.3 MON** |
| Compiler | Solidity **0.8.28+commit.7893614a**, optimizer **200**, **Cancun** |
| Source SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| Artifact SHA-256 | `adf4c5c23213818fdcafb7ea55ca3e50a277156bccf7abe4a90a83cc8d0545f0` |
| Candidate JSON SHA-256 | `f7707ac8ae138a75b1b26777684f6235f91edf17c2980a1c585f39c3cce2643a` |
| Creation data Keccak-256 | `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` (6,772 bytes) |
| Unsigned signing-payload digest | `0xd1a256ad5ca962d06e9cb55243436faec4b58e77fd61b21309b6fc88012389e9` |
| Constructor / NFT binding | No arguments / `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Expected immutable-bound runtime | `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` (6,688 bytes) |
| Expected CREATE address | `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390` — prediction only |

The signing-payload digest is not a submitted transaction hash. Transaction-field changes require a newly reviewed candidate; the tool never adjusts nonce or raises caps automatically.

## Implemented safeguards

The [local tool](../tools/mainnet-deployment/README.md) remains separate from the public game. The independent path is the default. Choosing the unaudited path invalidates any prior wallet context, quote and confirmation. Its [owner decision record](../tools/mainnet-deployment/owner-risk-acceptance.json) records the instruction to prepare, explicitly states `independentAudit: false`, and binds the existing candidate and sender. It cannot pass the independent authorization validator.

Owner arming requires all four risk acknowledgements, confirmation of the complete exact transaction/artifact, confirmation of spending/reserve limits, the complete signing-payload digest and the exact phrase **I ACCEPT UNAUDITED MAINNET DEPLOYMENT RISK**. Typing/checking alone never opens a transaction request. A separate arm action precedes the final wallet-request action. Changing consent inputs, review path, wallet selection, account, chain or disconnect invalidates arming/context; account and chain are checked again before any future wallet write. Discovery labels do not authenticate an extension: the owner must verify the genuine MetaMask install.

Each preflight revalidates the source, compiler settings, artifact-file hash, creation bytes and bound runtime locally. Both fixed RPC providers (`https://rpc.monad.xyz`, `https://rpc3.monad.xyz`) must agree on chain 143, the same finalized block hash/base fee, balance, sender code, latest/pending nonce, collection bytes, predicted-address code and gas estimate. **Both providers independently execute bounded unsigned creation `eth_call`; both complete returned runtimes must equal the locally linked artifact.** This proves bytecode/NFT-binding parity, not governance/custody. A stale/future-dated finalized block is rejected (120-second age bound; at most 10 seconds future tolerance). The quote expires 60 seconds from preflight start.

Before any future explicit final wallet request, the tool repeats preflight and account/network checks, re-reads the appropriate decision/authorization record and rejects changed balance, estimate or base fee. Any nonce change, provider failure/disagreement, artifact/runtime/binding mismatch, nonempty sender code, occupied prediction, gas estimate above 1,600,000, base fee plus 2 gwei above 125 gwei or balance below 0.3 MON blocks the request. An attempt marker must persist before the single wallet write; rejection/timeout does not clear it or automatically retry.

The two RPCs are corroborating services, not a trustless proof or a globally atomic nonce reservation. Use one operator tab/profile and stop other sender activity. Account state may change after checking. Local storage does not coordinate other origins/profiles, and a compromised local machine or wallet can subvert the tool. MetaMask can allow editing fields: the owner must reject any final wallet fields differing from this sheet. Standard MetaMask confirmation signs **and broadcasts**, rather than producing an offline signature only.

## Evidence and validation

[Fresh read-only capture](evidence/unaudited-deployment/read-only-preflight.json): finalized block **113944907**, hash `0x3211021f7d20518667827ad82f3c677b0a587c69e4fa4a0e37076313b7d8d16c`. Both providers agreed: chain **143**, balance **0.4 MON**, sender code **0x**, latest/pending nonce **0/0**, predicted address empty, estimate **1,510,761**, base fee **100 gwei**, collection runtime `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46`, and exact expected creation runtime from both simulations. At the cap, 0.4 − 0.2 = **0.2 MON** remaining, above the **0.1 MON** minimum. This historical capture is not usable as a fresh signing quote.

- [Policy tests](evidence/unaudited-deployment/model-tests.log): **15 passed**. Covers exact fields/caps, missing/refused consent, independent/owner path separation, synthetic wallet rejection/no retry, account and chain changes between checks, stale nonce/quote, RPC disagreement, artifact/binding mismatches, reserve/gas/fee violations, storage failure and late/revoked/missing authorization/owner decision.
- [Actual collector tests](evidence/unaudited-deployment/preflight-tests.log): **3 passed**, with multiple failure scenarios. Exercises both simulations and provider chain/block/state/nonce/estimate disagreement, stale blocks and agreeing-but-invalid runtime/reserve/estimate. All readers are synthetic and read-only.
- [Browser checks](evidence/unaudited-deployment/browser-tests.json): **95 passed**, including both distinct review paths, missing owner consent, exact request, explicit separate confirmation, account/chain events, synthetic rejection/persistent retry block, no automatic account access, local-origin/Host guards and absent broadcast route. External browser requests blocked; **no genuine wallet used**. Synthetic fixture approval references are never written to the real independent record. Chromium required sandbox permission; no wallet extension/profile or secrets were loaded.
- [Unsigned-field verification](evidence/unaudited-deployment/unsigned-verification.json) and [artifact verification](evidence/unaudited-deployment/artifact-verification.json): exact candidate/compiler/bytecode retained.
- [Preservation](evidence/unaudited-deployment/preservation.json): all **145** review-manifest inputs and **82** indexed prior evidence files match. All old Task 6A–6F reports/evidence remain; historical 6F tool checksums describe its earlier tool version. Changed local-tool files intentionally supersede those historical tool hashes and are pinned in this packet's own manifest. The independent authorization record remains unchanged and `NOT_AUTHORIZED`.

No unchanged game/contract/frontend suite was repeated. New/changed tool code was bundled and tested through the browser harness. Public gameplay remains simulation with null mainnet deployment/receipt; the owner exception does not activate the frontend. No contract edits, signing, broadcast, deployment, Anvil reset, commit, push or publication occurred. No wallet secrets were requested or handled. No additional Sourcify request or provider appeal was made.

## Exact remaining owner steps — stop before final wallet request

1. Inspect this packet and current tool hashes. Start `node tools/mainnet-deployment/server.mjs` from the project root; manually open **http://127.0.0.1:9546**. Keep it local; do not publish/tunnel it.
2. Explicitly select **UNAUDITED — explicit owner risk acceptance**. Verify the genuine MetaMask extension. Manually select chain **143**, connect only the exact sender above and run fresh read-only preflight. Wrong account/network or any failed check means stop; no override is provided.
3. Compare every artifact/hash/transaction field and current reserve, acknowledge each unresolved risk and spending limit, enter the exact phrase/digest and choose **Confirm owner acceptance of unaudited risk**. Download the local review record if desired. No independent reviewer is asserted by these actions.
4. **STOP before “Request MetaMask deployment — confirmation broadcasts.”** This task does not authorize clicking it. A later explicit owner decision must authorize that single exact real-wallet request. Review genuine MetaMask's final transaction fields/protections; reject any warning or mismatch. Do not edit caps or bypass safeguards.
5. If later authorized and submitted, retain the actual transaction hash, check finalized receipt/runtime/NFT binding/source using the existing runbook and never retry an unknown outcome automatically. Frontend activation/publication requires a separate verified manifest and release decision.

**Unresolved critical technical failures:** none observed in the recorded new policy, collector, browser and live read-only checks. Genuine MetaMask final-transaction presentation/account control and final signed bytes have not been exercised; current RPC agreement must be reacquired at use. Human/project/provider evidence gaps remain explicitly accepted preparation risks, not verified facts. Independent-review completion is not a prerequisite for the deliberately unaudited owner path, and no independent acceptance is claimed.

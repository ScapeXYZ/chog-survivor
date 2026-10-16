# Task 6F — MetaMask deployment signing preparation

2026-10-16. **DEPLOYMENT NOT AUTHORIZED.** A local operator review workflow is prepared and validated with synthetic wallets. No real MetaMask connection, wallet signature, deployment or broadcast was performed. Independent security acceptance, collection governance/custody acceptance, warning-policy disposition and exact owner transaction approval remain required. Existing frozen source, public simulation, wallet integrations and prior evidence are preserved.

The owner now confirms that `0x320eDAe253259053d53feD8eEe6D9C0274A91E85` is controlled through **MetaMask**. This resolves the reported wallet type; it is an owner attestation, not a signature challenge, custody audit or deployment authorization. No key, recovery phrase, wallet profile or keystore was requested/accessed/generated/exported/stored.

## Chosen method and its boundary

Use the genuine, already installed MetaMask browser extension with the separate [local review tool](../tools/mainnet-deployment/index.html), served only on **`http://127.0.0.1:9546`**. It uses EIP-6963 discovery (explicit legacy fallback) and raw EIP-1193 requests. It never exports a key, uses an online IDE, recompiles via a third-party website or changes the public game frontend.

[MetaMask's transaction API](https://docs.metamask.io/metamask-connect/evm/guides/send-transactions/) supports `eth_sendTransaction`; the [Ethereum request specification](https://ethereum.github.io/execution-apis/api/methods/eth_sendTransaction/) defines contract creation and explicit transaction fields. This tool sends no recipient (`to` is omitted), the exact creation bytecode, type 2, chain `0x8f`, fixed nonce and explicit gas/max-fee/priority values. It never asks for a message, typed-data, token approval, wallet batch, EIP-7702 authorization or automatic network change.

**MetaMask confirmation signs and broadcasts. Standard `eth_sendTransaction` is not a sign-only/offline-signature export workflow.** The final button says that confirmation broadcasts. Do not click through a real wallet confirmation in this task. Real extension UI/version compatibility and its final displayed fields have not been exercised; protocol correctness and payload equality are validated here, not a claim that a wallet will never modify a field. If MetaMask changes a field, shows a warning or cannot show sufficient details to review the exact creation/caps, reject and stop.

Foundry 1.8.5's browser-wallet route remains an alternative for later review, but its gas-estimate settings do not by themselves pin the exact transaction gas. Its `--gas-limit` is a block-gas-limit alias. The local tool instead derives the exact EIP-1193 request from the existing 6E candidate and verifies it serializes to that candidate's unsigned payload. There is no executable broadcast command in this guide.

## Exact candidate to compare independently

Primary references: [6E decision](TASK_6E_DEPLOYMENT_DECISION.md), [unsigned JSON](evidence/task6e/unsigned-deployment-candidate.json), [6D external handoff](TASK_6D_EXTERNAL_REVIEW_HANDOFF.md), [6A deployment runbook](TASK_6A_MAINNET_DEPLOYMENT_RUNBOOK.md).

| Field | Required value |
| --- | --- |
| Sender | `0x320eDAe253259053d53feD8eEe6D9C0274A91E85` |
| Network | Monad mainnet, **143 / `0x8f`** |
| Type / nonce | EIP-1559 **0x02 / 0**; no automatic nonce update |
| Destination / value | **Contract creation: no `to` / 0 MON** |
| Constructor | **No arguments**; immutable collection `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Compiler | Solidity **0.8.28+commit.7893614a**, optimizer **200**, **Cancun** |
| Source SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| Artifact-file SHA-256 | `adf4c5c23213818fdcafb7ea55ca3e50a277156bccf7abe4a90a83cc8d0545f0` |
| Candidate JSON SHA-256 | `f7707ac8ae138a75b1b26777684f6235f91edf17c2980a1c585f39c3cce2643a` |
| Transaction creation data | **6,772 bytes**, Keccak-256 `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Unsigned signing-payload digest | `0xd1a256ad5ca962d06e9cb55243436faec4b58e77fd61b21309b6fc88012389e9` — not a transaction hash |
| Expected bound runtime | `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` |
| Gas limit / maximum fee / priority cap | **1,600,000 / 125 gwei / 2 gwei** |
| Maximum one-attempt spending | **0.2 MON**, value zero, no retry budget |
| Minimum remaining balance | **0.1 MON**; minimum starting balance **0.3 MON** |
| Access list | Empty; no sponsored/batch/extra authorization transaction |
| Expected CREATE address | `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`, prediction only |

Source/artifact/candidate hashes are checked at server startup. Data and unsigned-payload hashes are checked again in the browser; altered nonce/value/fees/destination/data are rejected. Full request data is available in the review disclosure before any wallet request. Its hex fields round-trip to the exact existing unsigned serialization in the new tests.

## Local-only preparation — safe to inspect without connecting

From the repository root, using existing Node 22 and the reviewed installed frontend dependencies:

```bash
node tools/mainnet-deployment/server.mjs
```

Open **`http://127.0.0.1:9546`** yourself. This command starts no wallet, browser, signing request or preflight automatically. Stop with Ctrl-C when finished. The server refuses startup if the pinned candidate/artifact/source changed. It builds the tool bundle in memory using already installed esbuild/Viem; no packages are installed or downloaded.

Keep it on loopback; do not bind to `0.0.0.0`, tunnel it, host it on Vercel, add it to the public game or expose the repository. Host/origin checks reject other hostnames/cross-origin requests; there is no CORS allowance, arbitrary filesystem route, generic RPC forwarding or broadcast endpoint. CSP uses same-origin scripts/styles/connections, no remote scripts, frames or forms. The server's only POST endpoint runs its internally fixed read-only preflight. Its two RPC hosts are fixed. The server has no wallet, secret or signing API.

The start page shows the exact sender/network/source/artifact/candidate/data/payload/runtime identities and gas/fee/cost limits. The expected remaining balance is displayed from a fresh successful preflight, not inferred from an old screenshot or prior balance. Clicking **Run read-only preflight** alone does not connect MetaMask.

### Step 1 — explicit account/network verification

Only the owner may choose **Connect selected MetaMask**. This requests account access, not a signature. Select the exact deployer and manually select Monad mainnet **143** in MetaMask using the [official network reference](https://docs.monad.xyz/developer-essentials/network-information). The tool never adds/switches networks automatically. Wrong account/network blocks further steps. An account/chain/disconnect event invalidates preflight and independent confirmation.

Discovery names/`rdns`/`isMetaMask` are claims, not cryptographic vendor authentication. Verify the genuine extension/install yourself. Use one operator tab/profile, close other signing workflows and avoid concurrent sender activity; no UI or RPC check reserves nonce 0. This tool does not prove who controls the MetaMask account or whether it is backed by hardware.

### Step 2 — explicit read-only preflight

Click **Run read-only preflight** after confirming the account/network. The server checks primary `rpc.monad.xyz` and independent `rpc3.monad.xyz`:

- Chain 143 and the exact same finalized block hash.
- Balance at that block, sender code empty, predicted creation address unused, latest/pending nonce both **0**, and matching collection runtime bytes/hash.
- Creation estimate >0 and ≤1,600,000 with the proposed explicit EIP-1559 caps; base fee plus proposed priority fits 125 gwei.
- A bounded creation `eth_call` returns the exact expected runtime, thereby confirming the hardcoded constructor binding for this creation input.
- Both providers agree on compared state/estimates; balance covers 0.2 MON plus 0.1 MON reserve.

The result shows current balance, maximum cost, minimum reserve and expected remaining MON at the cap. It expires after **60 seconds**. Any failure, changed nonce, sender delegation code, RPC mismatch, changed runtime, inadequate reserve or increased estimate stops the workflow. It does not silently alter the unsigned candidate.

### Step 3 — independent confirmation, separate from wallet consent

An independent reviewer must first complete [the acceptance form](evidence/task6e/INDEPENDENT_REVIEW_ACCEPTANCE.md) and the owner must supply the exact transaction approval. The tool's [authorization record](../tools/mainnet-deployment/authorization.json) is checked in as **`NOT_AUTHORIZED`**, with all approval references/expiry unset. It stays that way in this task.

A future separately approved record must bind this candidate SHA-256 and unsigned-payload digest, include an unexpired authorization and references for independent security, governance/custody, warning-policy disposition and exact one-attempt transaction approval. The code validates these fields; it does **not** authenticate a person's identity or turn reference strings into genuine signed approvals. Do not populate them merely to make a button active. Re-review the tool itself along with any proposed authorization change.

After actual approvals, a second reviewer compares the full displayed candidate and request with the signed-off sheet. The owner checks that this comparison occurred, enters the complete unsigned-payload digest and clicks **Complete independent confirmation**. Typing/checking alone never invokes MetaMask signing. Under the current record, this step and the final request remain blocked even if DOM buttons are manipulated.

### Step 4 — future authorization only: final wallet request

**Not permitted now.** Only after every gate below is closed may the owner take the separate final action, **Request MetaMask deployment — confirmation broadcasts**. It re-reads authorization, reruns live preflight, compares the reviewed quote, rechecks the selected account/network and context, and checks authorization again immediately before the wallet request. A changed balance/base fee/estimate demands a new review rather than carrying stale confirmation forward.

Before its sole `eth_sendTransaction`, it persists an attempt marker. A rejected, interrupted or unknown request remains marked; no automatic retry button is offered. A returned hash is retained in the local record. Reload does not silently resend. Local storage is a per-origin/profile guard, not a globally atomic nonce lease or a guaranteed recovery ledger. Do not clear it, open a different profile/origin or restart a signing workflow to bypass an unresolved attempt. Check MetaMask activity and canonical chain nonce/receipt first; any retry needs a new explicit decision. A local review record can be downloaded without sending it anywhere.

In MetaMask, independently compare the exact selected sender, chain, contract-creation destination, value zero, nonce 0, full creation data/data hash and gas/fee caps above. Keep security protections enabled. Reject warnings, unexpected messages, approval/batch/authorization requests, extra value/recipient or changed caps. A wallet can let its user edit a request; the local tool cannot guarantee MetaMask's eventual signed bytes equal its request. If exact review cannot be completed, stop. Do not treat a signature prompt as evidence of authorized deployment.

## Validation performed for the new workflow

These checks concern new tool code. Unchanged game/contract suites were not repeated.

| Check | Result / exact evidence |
| --- | --- |
| New fail-closed policy tests | **10 passed**, including exact payload, tampering, chain/account, nonce/runtime/reserve/fee limits, independent-step gate, stale preflight, persistence, expiry and mid-preflight authorization revocation; [log](evidence/task6f/policy-tests-final.log) |
| Browser workflow | **43 checks passed**, synthetic wallets only, external browser requests blocked; [final log](evidence/task6f/browser-tests-verified.log). Tests cover load/navigation without prompts, real current lock, forced DOM clicks, exact synthetic request after all distinct steps, wrong-chain rejection and persisted retry block, cross-origin/Host guards and absent broadcast endpoint |
| Live new-server preflight | Read-only, no wallet: **both providers matched**, block **113938346**, hash `0xa10f8b88a9976d7e54f77b42bc561ceeebf21e480806e4667d91f4cc12a43b63`; 0.4 MON, nonce 0/0, 1,510,761 gas, base fee 100 gwei, runtime exact; [capture](evidence/task6f/live-readonly-preflight.json), checked 2026-10-16 15:53:45 UTC |
| Current candidate/game/review inputs | Unchanged 145-file review manifest; frozen source and existing unsigned proposal retained |
| New local bundle | Compiles in memory without dependency install, network script or public-game changes |

The browser's only synthetic final request was **rejected by a fake provider with no signer**. No real wallet, signature, network transaction or provider reputation decision was exercised. Initial Chromium sandbox failure was rerun with permission. A Host-header test initially used fetch, which does not preserve that header override; the final test uses raw HTTP and retains the earlier failed harness output for traceability. The final log is the authoritative browser result.

Safe checks for an external reviewer:

```bash
node tools/mainnet-deployment/model.test.mjs
node tools/mainnet-deployment/browser-test.mjs
node docs/evidence/task6e/verify-unsigned.mjs
```

The browser test starts ephemeral loopback servers with synthetic configuration/providers and rejects external browser requests. It does not change `authorization.json`; synthetic fixture approval references are not real approvals. Review source before running, particularly any changes to the only wallet-write boundary in `model.mjs`.

## Final authorization gate

**NOT AUTHORIZED** until all of the following are recorded and bound to the exact transaction/tool version:

1. Named independent security acceptance, including this local signing tool and its residual wallet/RPC/recovery assumptions; the preparer cannot self-certify an independent audit.
2. Accountable collection governance/canonical-address, complete role membership, custody/quorum and active delegated-permission evidence or explicitly accepted reviewer/owner exceptions. MetaMask control of the deployer does not establish collection-governance custody.
3. Wallet-warning policy disposition: owner reports the warning is absent, but no official provider clearance is claimed. Record protected retest details and provider disposition if required by the retained policy, or explicit acceptance of remaining uncertainty.
4. Explicit owner/custodian approval of the exact candidate/tool hashes, sender, chain, refreshed nonce/balance, zero value, 1,600,000 gas, 125 gwei maximum fee, 2 gwei priority, 0.2 MON maximum spend, 0.1 MON reserve, expiry and one-attempt scope; confirm naming/affiliation authority.

After any future authorized submission, preserve the hash; do not retry on timeout. Follow the existing read-only post-deployment receipt/runtime/binding/source verification runbook. Actual verified deployment manifest and frontend publication require separate review/approval. **Stop here after preparation and validation; do not request a real signing confirmation.**

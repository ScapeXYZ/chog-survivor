# Task 6E — exact unsigned deployment preparation

Decision: [TASK_6E_DEPLOYMENT_DECISION.md](../../TASK_6E_DEPLOYMENT_DECISION.md). No approval/signature/broadcast/publication is implied.

## Review files

- `owner-warning-observation.json`: owner's report that the warning no longer appears; explicitly not official provider clearance or independently reproduced.
- `offline-confirmation.json`: unchanged frozen source, compiler, game artifact and prior collection-source/runtime consistency; no successful suite rerun.
- `source-manifest-comparison.json`: all 145 Task 6D review inputs match their hashes.
- `rpc-refresh.json` / `rpc-transcript.json`: primary and independent provider reads, exact finalized-block comparison, current sender/code/nonces/fees, creation gas estimates, bounded creation eth_call and known collection role/delegation state. Provider-local pending nonces do not reserve a nonce.
- `unsigned-deployment-candidate.json`: exact EIP-1559 fields, full creation bytecode and unsigned serialized payload; source/artifact/runtime identities and proposed caps. **Contains no key/signature/signed transaction.** Its signing-payload digest is not a transaction hash.
- `transaction-review-sheet.json`: readable fields, creation-byte length and candidate-file hash without repeating full data/payload.
- `verify-unsigned.mjs` / `unsigned-field-verification.json`: offline round-trip plus raw nine-field RLP validation, including empty creation destination, zero nonce/value, empty access list and absence of signatures. Viem's parsed object may omit empty zero quantities/access list, so raw RLP is compared explicitly.
- `frontend-mode-confirmation.json`: null source manifest/receipt and forced Vercel simulation; no hosting change or hosted-revision attestation.
- `asset-permission-review.json`: exact runtime artwork and retained license hashes, plus owner/rights confirmations still needed.
- `forge-script-help.txt`: pinned 1.8.5 signing capabilities and option semantics; no wallet session initiated. `--gas-limit` is the block-gas-limit alias, not proof of exact transaction gas.
- `INDEPENDENT_REVIEW_ACCEPTANCE.md`: blank human reviewer acceptance form; not an independent audit or owner authorization.
- `packet-files.sha256`: checksums for the decision and this evidence directory except the checksum file itself; verify from repository root.

## Safe reproducibility

Run `node docs/evidence/task6e/verify-unsigned.mjs` for offline candidate-field checks and `node docs/evidence/task6d/verify-offline.mjs` for artifact/source consistency. These use no network or signer. Full prior suite logs and external reviewer reproduction commands remain in Task 6D; they were not repeated for unchanged inputs in Task 6E.

`prepare-candidate.mjs` is a read-only, method-allowlisted RPC collector and unsigned serializer. It uses no signer and writes evidence with exclusive `wx` creation. Inspect it before a future refresh and select new output filenames in a separately reviewed copy rather than overwriting these snapshots. It stops if nonce, balance/reserve, runtime, estimate or independent-provider checks fail. It never grants authorization, reserves a nonce, submits a transaction or silently updates a signed payload.

Live capture used only `eth_chainId`, `eth_getBlockByNumber`, `eth_getCode`, `eth_getBalance`, `eth_getTransactionCount`, `eth_gasPrice`, `eth_maxPriorityFeePerGas`, `eth_estimateGas`, and `eth_call`. Creation simulation changes no persistent chain state. No Anvil endpoint was contacted. No key/password/recovery material or wallet profile was read, generated or saved.

# Task 6B — mainnet release checklist

2026-10-16. **NO-GO for deployment and public mainnet activation.** This resumes existing preparation; Task 5A, 5B and 6A work remains preserved. No transaction signing/broadcast, deployment, Anvil reset, GitHub push or Vercel publication was performed.

## Existing evidence reviewed

- [Approved-deployer RPC snapshot](evidence/task6b/approved-deployer-readonly.json) already checks `0x320eDAe253259053d53feD8eEe6D9C0274A91E85` at 2026-10-16 14:53:26 UTC: chain 143, 0.4 MON, empty account code, latest/pending nonce 0/0. Estimate 1,510,761 gas at 102 gwei = 0.154097622 MON; the recorded 0.1 MON reserve is covered. These observations are stale-able, from one RPC, and confer no signing authority. No duplicate RPC capture was necessary.
- Expected nonce-zero CREATE address: `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`. This is a prediction, **not a deployed/verified game address**.
- Existing artifact, preflight and post-deployment verification scripts were inspected and retained. `release-artifact.mjs` passes against the local artifact. Frozen source SHA-256 remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`; compiler 0.8.28, optimizer 200, Cancun. Creation Keccak-256 `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29`; immutable-bound expected runtime `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475`.
- `toolchain.json` records an isolated Foundry 1.8.5 download review. Empty Monad test/fork logs and incomplete initial frontend logs do **not** establish successful Task 6B runs. Task 6A test results remain historical evidence only.
- Game information UI and manifest tests already existed. The checked-in manifest and deployment receipt remain null; Vercel remains configured for simulation.

## Completed local integration and validation

- [x] EIP-6963 multi-provider discovery enabled with legacy injected fallback. Existing chooser lets the user select the intended connector or cancel. No hardcoded Phantom integration or claim of Phantom/Monad compatibility.
- [x] Guard empty/pending connection attempts and display connection failure/rejection feedback.
- [x] Extend existing enabled-build rehearsal with two synthetic EIP-6963 providers and no `window.ethereum`, explicit selection/cancel and desktop/mobile checks. Fix its manifest substitution to target only the manifest declaration, preserving the validator and null receipt.
- [x] Production frontend suite: **24 files, 386 tests passed**; [log](evidence/task6b/resumed-frontend-tests.log).
- [x] After final UI change, focused App, manifest and mainnet action suites: **3 files, 13 tests passed**; [log](evidence/task6b/resumed-focused-tests.log).
- [x] Enabled-build desktop/mobile browser rehearsal: **25 checks passed**, including EIP-6963 discovery/selection/cancel, gas/chain checks, explicit confirmation and runtime mismatch rejection; [final log](evidence/task6b/resumed-enabled-browser-success.log). No uncaught browser errors.
- [x] TypeScript/production Vite build passes; [log](evidence/task6b/resumed-frontend-build.log). Vendor annotation and >500 kB bundle warnings remain.

The synthetic browser rehearsal uses intercepted RPC, fake accounts and a rejected synthetic transaction request. It does not prove genuine wallet support, real signing, live game operation or source verification. Passive `eth_accounts` reads are permitted; account-access prompts and writes require explicit interaction. Initial failed rehearsal logs are retained for traceability; use the final pass log for results.

## Unfinished release gates

- [ ] Complete/reproduce Monad-mode Solidity tests and fork tests with the reviewed pinned toolchain; record successful logs, artifact parity and representative action/smart-wallet gas estimates. No frozen contract changes needed.
- [ ] Obtain canonical collection provenance, reproducible source and complete governance/restriction map plus independent security acceptance, as required by Task 6A.
- [ ] Resolve genuine MetaMask/Blockaid warning and test real compatible wallets on Monad without bypassing protections. Public blacklist non-match is not provider clearance.
- [ ] Record Sourcify/explorer verification limitation: prior access was unavailable/blocked; no new verified-source proof exists. No repeated Sourcify requests were made during this resume. A runtime comparison alone cannot close source verification.
- [ ] Refresh sender balance, latest/pending nonce, network, collection code and fees with an independent RPC immediately before any future approval; define explicit gas, fee and total spending caps.
- [ ] Obtain Gate A approval using [deployment approval](TASK_6B_DEPLOYMENT_APPROVAL.md); signing/broadcast remain prohibited in this task.
- [ ] After separately authorized deployment: finalized receipt, creation transaction, exact full runtime and NFT binding verification; independent RPC and explorer source confirmation. Existing verifier prints only a candidate and never activates the app.
- [ ] Review real manifest/receipt, enabled-release rehearsal, genuine wallet behavior, history/indexer policy beyond 50,000 blocks, operational owner and rollback plan.
- [ ] Confirm artwork/font/branding permissions, hosting settings/revision and explicit Gate B push/publication approval.

Follow the detailed [Task 6A runbook](TASK_6A_MAINNET_DEPLOYMENT_RUNBOOK.md). Both deployment and frontend publication remain blocked independently.

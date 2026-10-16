# Task 7B release evidence

Task 7A's deployment/receipt/source-compilation proof is reused. This folder captures new release integration work only.

- `start-tree.json`, `git-start.txt`: exact pre-7B public/nonignored tree and dirty Git status/history; no ignored credentials or wallet profiles inspected.
- `integration-audit.json`: offline manifest/ABI/environment/source-package comparison.
- `frontend-tests.log`: full 391-test frontend suite.
- `build-candidates.json`, `build-run.json`, mode build logs: fresh temporary production/mainnet outputs and per-file hashes.
- `mainnet-browser.log`: 33 exact-artifact, synthetic MetaMask/Rabby checks including chain-change rejection. All RPC intercepted; synthetic write is rejected by a fake provider.
- `simulation-browser.json`: 49 exact-artifact walletless/responsive checks; external requests blocked.
- `mainnet-readonly-browser.json`: 10 checks with actual live mainnet frontend reads, public observer identity and RPC transcript. No signer exists; mutating RPC and wallet methods are rejected. First bounded history page only, no full archive sweep.
- Retained `*-failed.log`: observer-harness corrections (passive account probe and explicit multi-wallet choice), not contract failures. Final result supersedes those failures.
- `task7b-existing-files.patch`, `change-inventory.json`, `packet-files.sha256`: isolated existing-file patch, complete task change/preservation inventory and final packet hashes. Checksum/inventory files exclude themselves to avoid self-hashing cycles; exact scopes are recorded.

Safe reproduction from `frontend` after inspecting source:

```sh
npm test
node scripts/task7b-audit-integration.mjs
node scripts/mainnet-enabled-browser.mjs --verified-manifest --artifact-dir /tmp/chog-task7b-candidates-Y76dq9/mainnet
node scripts/public-demo-preflight.mjs --artifact-dir /tmp/chog-task7b-candidates-Y76dq9/production
node scripts/task7b-mainnet-readonly-browser.mjs --artifact-dir /tmp/chog-task7b-candidates-Y76dq9/mainnet
```

Browser commands require local Chromium/socket permission. The last additionally requires read-only network access and uses a synthetic public-address observer, not a genuine wallet. No signing/transaction route exists in that harness. Temporary artifacts can disappear; rebuild into fresh directories and record new inventories before using a new candidate. The candidate builder uses exclusive evidence creation; choose a deliberately new evidence destination in a follow-up rather than overwrite this completed capture. Never treat these commands as publication/activation approval.

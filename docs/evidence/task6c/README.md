# Task 6C evidence index

See [deployment gate review](../../TASK_6C_DEPLOYMENT_GATE_REVIEW.md) for interpretation, findings and limitations. No signing, network broadcast, Anvil mutation or publication was performed.

## Reproduction commands used

Repository root unless specified. `/tmp/chog-task6c-toolchain/forge` is the verified isolated 1.8.5 executable; installed 1.7.1 was preserved. All network calls were read-only. Initial sandbox DNS failures were recorded separately and rerun with permission.

```bash
sha256sum src/ChogSurvivor.sol
/tmp/chog-task6c-toolchain/forge test --offline --network monad --out /tmp/chog-task6c-out --cache-path /tmp/chog-task6c-cache --gas-report
MONAD_RPC_URL=https://rpc.monad.xyz /tmp/chog-task6c-toolchain/forge test --offline --network monad --out /tmp/chog-task6c-out --cache-path /tmp/chog-task6c-cache --match-contract MonadForkIntegrationTest -vv
MONAD_RPC_URL=https://rpc.monad.xyz /tmp/chog-task6c-toolchain/forge test --offline --network monad --out /tmp/chog-task6c-out --cache-path /tmp/chog-task6c-cache --match-contract Task6CGasTest --gas-report -vv
FOUNDRY_OUT=/tmp/chog-task6c-out FOUNDRY_CACHE_PATH=/tmp/chog-task6c-cache CHOG_FORGE_BIN=/tmp/chog-task6c-toolchain/forge MONAD_DEPLOYER=0x320eDAe253259053d53feD8eEe6D9C0274A91E85 bash script/mainnet-dry-run.sh
node frontend/scripts/release-artifact.mjs
VITE_CHOG_ENV=production npm test --prefix frontend -- --maxWorkers=2
VITE_CHOG_ENV=production npm test --prefix frontend -- --maxWorkers=2 src/MainnetContractAdventure.test.tsx src/survivalHistory.test.ts src/contracts.test.ts src/mainnetDeployment.test.ts
VITE_CHOG_ENV=production npm run build --prefix frontend
```

Browser rehearsal: `node scripts/mainnet-enabled-browser.mjs` from `frontend`; isolated `/tmp` bundle, intercepted RPC and synthetic providers only. `enabled-browser.log` records **25 checks passed**. No real wallet was used.

Read-only collectors: `frontend/scripts/task6c-readonly.mjs` and `task6c-provenance.mjs`. Evidence writes are exclusive (`wx`) so rerunning requires a newly reviewed output destination; do not overwrite the captures. The initial primary/Goldsky collector produced a partial report: primary passed, Goldsky failed. It now explicitly exits nonzero for partial captures. Ankr individual HTTPS calls closed the independent cross-check; `rpc3-independent.json` contains exact requests/responses and `independent-crosscheck-summary.json` contains comparisons. Failed RPC2/Alchemy probes are retained, not successful evidence. The zero-byte RPC2 batch response is a failure, not an empty JSON-RPC result.

Explorer reproduction: `collection-standard-input.json` contains Solidity source/settings decoded from the public explorer's source editor (including its settings.json entry). Local Solidity 0.8.28 `--standard-json` produced `collection-compiler-output.json`; `task6c-provenance.mjs` compares the creation prefix, decodes constructor data and patches both immutable values to compare the entire deployed runtime. The API source/creation endpoints returned missing/invalid-key errors, while HTML source was accessible. `source-access.json` records HTTP outcomes. No Sourcify request occurred.

`collection-provenance.json` retains real transaction/receipt, constructor, current state, known-account roles and failed complete-role-history attempts. Byte opcode offsets are not reachability analysis; compiler data/metadata can contain opcode-valued bytes. Source reproduction plus review establishes the control findings, not the raw opcode hint scan.

`changed-file-security-inventory.json` covers hashes/sizes of changed and nonignored untracked artifacts. Two credential-pattern hits are explorer UI reads of empty/user-input API key fields, not project credentials. Binary media were hashed, not independently audited. No ignored environment file or signer credential store was read.

The gas report's per-function numbers are simulator call costs with fixture warmth; test-level gas includes harness work. Its zero deployment-cost entry is unusable as a creation estimate. RPC estimate plus dry run both gave 1,510,761 gas; creation eth_call succeeded at 1,600,000. The default dry-run EIP-1559 fee recommendation is **not** the proposed/approved spending limit. No spending limit is approved.

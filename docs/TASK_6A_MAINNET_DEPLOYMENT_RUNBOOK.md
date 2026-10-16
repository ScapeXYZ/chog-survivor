# Task 6A — Monad mainnet deployment runbook

Status: **PREPARATION ONLY / NO-GO**, 2026-10-16. No deployment approval is implied by this document. Never run a command that signs or broadcasts during Task 6A.

## Reproduce the candidate safely

Use the repository root, an isolated reviewed Foundry 1.8+ installation and Node 22. Do not replace the existing Anvil tooling/process or edit frozen compiler settings. Review downloaded tooling provenance/checksums before execution. The currently installed Foundry 1.7.1 is insufficient; the wrapper intentionally stops.

```bash
sha256sum src/ChogSurvivor.sol
forge --version
forge build --offline
forge test --offline --gas-report
MONAD_RPC_URL=https://rpc.monad.xyz forge test --offline --match-contract MonadForkIntegrationTest
cd frontend
npm ci
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm test
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
node scripts/mainnet-readiness.mjs
npm audit --json
```

Review collection provenance/restrictions first. Retain the git revision plus dirty-tree diff, full source/settings/artifact hashes and tool versions. Check source SHA-256 equals `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`. Source/compiler/optimizer/EVM must remain 0.8.28 / 200 / Cancun; compare creation bytecode to the readiness report. Any mismatch stops the process.

`script/PrepareMonadMainnet.s.sol` imports the frozen game and checks chain 143, collection code and binding. Foundry `startBroadcast` marks the simulated creation; **no network broadcast occurs unless a separate `--broadcast` invocation is authorized**. The wrapper `script/mainnet-dry-run.sh` accepts no flags, reads no key, supplies no `--broadcast`, checks the frozen source and requires Monad tooling. After prerequisites close, set only the approved **public** sender and simulate:

```bash
MONAD_DEPLOYER=0xAPPROVED_PUBLIC_SENDER script/mainnet-dry-run.sh
```

Replace the placeholder with a valid address. This invocation has not been completed because the tooling gate stops first. Inspect the exact pinned tool's `forge script --help` for `--monad` semantics. Run the full tests with its Monad execution setting and compare gas/artifacts. A dry-run's expected address is not a deployed address.

## Approval checklist — stop before signing

- [ ] Collection team attests canonical address, creation provenance and complete authority/restriction map; reproduce verified collection runtime.
- [ ] Independent reviewer accepts immutable ownerOf dependency, transferred-token state, burn/remint consequences and lack of emergency pause/upgrade.
- [ ] Official wallet warning review disposition recorded and genuine MetaMask behavior retested without bypassing warnings.
- [ ] Monad-capable tooling is reviewed and pinned; all tests and representative Monad gas estimates pass.
- [ ] Approved public deployer, wallet type/signing process, chain 143, balance, pending/latest nonce, expected address and zero deployment value recorded.
- [ ] Approve exact source/creation hash, constructor with **no arguments**, compiler/settings, maximum gas limit, maximum fee per gas and total MON exposure. Sample estimate 0.154097622 MON is not a spending limit.
- [ ] Verify chain, collection runtime/binding, fee conditions and sender balance/nonce again using an independent RPC; sufficient MON/reserve confirmed.
- [ ] No unreviewed changes after artifact approval. Record immutable release revision and artifact digest.
- [ ] Owner explicitly approves **contract deployment only**, naming the above artifact, sender, chain, nonce and spending ceilings. No key/phrase should be sent in chat or committed.

**Gate A is currently CLOSED.** A future operator may prepare the same `forge script` invocation using a hardware wallet or encrypted keystore with explicit sender and approved gas/fee settings. Adding `--broadcast` is a separate authorized operation; no ready-to-run broadcast command is included here. Never use a frontend key, paste a private key in CLI arguments, or reuse any Anvil development key.

## Post-deployment checks and verification (future Gate A approval required)

Retain the submitted hash immediately; do not resend on timeout. Check receipt status, creation address, deployer/nonce/value, finalized inclusion block/hash, actual fees and runtime bytecode against a locally linked artifact with the constructor immutable address. A runtime template containing immutable placeholders is not the expected deployed runtime. Confirm `CHOG_GENESIS()` equals the canonical collection. Read `characterOf`, `titleOf`, `preview` for a real eligible token and a nonexistent one; these are read-only. Do not perform a holder action without separate holder authorization.

Prepare verification payloads offline before approval:

```bash
forge verify-contract --chain 143 --compiler-version v0.8.28+commit.7893614a --num-of-optimizations 200 --evm-version cancun --show-standard-json-input "$GAME_ADDRESS" src/ChogSurvivor.sol:ChogSurvivor > /tmp/chog-mainnet-standard-input.json
```

After deployment, source publication requires separate authorization if not included in Gate A. The following commands publish verification metadata, **not transactions**; they have not been run. `GAME_ADDRESS` must be the confirmed game address, never the collection or an estimated address. Store any explorer API key outside frontend `VITE_*` variables and logs.

```bash
forge verify-contract --chain 143 --compiler-version v0.8.28+commit.7893614a --num-of-optimizations 200 --evm-version cancun --verifier etherscan --verifier-url 'https://api.etherscan.io/v2/api?chainid=143' --watch "$GAME_ADDRESS" src/ChogSurvivor.sol:ChogSurvivor
forge verify-contract --chain 143 --compiler-version v0.8.28+commit.7893614a --num-of-optimizations 200 --evm-version cancun --verifier sourcify --watch "$GAME_ADDRESS" src/ChogSurvivor.sol:ChogSurvivor
```

Recheck current explorer API support and help for the pinned Foundry version before using these prepared commands. Do not claim verification until a full source match, compiler settings and immutable binding are visible and independently reproduced.

## Frontend activation — separate Gate B

Current public build remains:

```text
VITE_CHOG_ENV=production
```

The checked-in Vercel command overrides inherited mode and clears local/RPC overrides. No public environment address is sufficient to activate mainnet. After a verified deployment, review a source manifest containing `chainId: 143`, the exact game `address`, actual receipt `deploymentBlock`, and Keccak-256 of actual runtime `runtimeCodeHash`. Replace `null` only in that separately approved release. Do not invent a start block or hash.

The future approved build uses `VITE_CHOG_ENV=mainnet` and public `https://rpc.monad.xyz` (or a reviewed browser-safe HTTPS provider). Review the Vercel command change explicitly; never allow public localhost overrides. `VITE_LOCAL_*` remains empty. No private RPC credential, deployer key, recovery phrase or verification API key belongs in any `VITE_*` value. `.env.example` documents the safe preparation state.

Gate B requires redacted hosting settings/root `frontend`/Node 22/build revision review, a fixture-backed enabled-build browser rehearsal, genuine MetaMask warning recheck, real game read verification, history range/rate and indexer policy, artwork/branding permission, independent security approval, monitoring owner and explicit owner approval to push/publish/deploy the frontend. Initial browsing and demo stay walletless; mainnet play is explicitly selected and each `act` requests a separate wallet confirmation. **Gate B is currently CLOSED.**

## Fees and operations

Refresh deployment estimate with the approved sender, pending nonce and current fee policy. Estimate first/repeat/achievement-heavy actions and smart-wallet overhead under Monad gas rules. Preserve each calldata/account/gas/price quote and approve total exposure; MON native funds are needed for gas, but the game charges no payable NFT/game entry fee. The frontend estimates each `act`, simulates it and sends the explicit gas estimate to the wallet; estimates can become stale and execution can revert. Wallet confirmation is still mandatory.

A 500-block history chunk and 100-chunk cap prevent unbounded browser RPC work; approximately 50,000 blocks is only a short window on a fast network. Arrange an archive/indexer or paginated history before that boundary. The candidate reports incomplete history rather than claiming completeness. Track RPC failures/rate limits, reverted actions, pending hashes, runtime/binding changes and missing history; never collect secrets or raw wallet identifiers unnecessarily.

## Rollback and incident response

1. Stop publication and new write UI immediately. With explicit hosting approval, restore the last reviewed simulation build or set manifest to `null` and mode to `production`; verify the served asset hash. Preserve submitted hashes and advise checking finality before retrying.
2. Preserve receipts, block hashes, source/artifact hashes, release revision, RPC responses, UTC timeline and provider warnings. Avoid secret material in evidence. Assign an incident owner and assess scope before communications.
3. If RPC is wrong/stale, fail closed and compare independent providers. If game runtime or NFT binding differs, disable the frontend and investigate. If a deployer key is suspected compromised, secure remaining signer funds through the approved owner process; do not ask holders for approvals or recovery phrases.
4. The frozen contract has **no administrator pause, upgrade, migration, withdrawal or state rollback**. Disabling a frontend cannot prevent direct contract calls or undo transactions. Game progression is immutable per token ID. A replacement contract/address would require a new explicit deployment and migration/product decision, with no implied historical-state restoration.
5. For collection governance actions/burn/remint, document affected token IDs and ownership changes; the game cannot override ownerOf. For wallet warnings, keep protections enabled and request official review through the matching provider route. Only announce recovery with verifiable evidence and owner-approved communications.

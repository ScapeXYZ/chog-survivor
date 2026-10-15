# Task 4O — Monad testnet readiness audit

Date: October 15, 2026. Repository baseline: `b3f96e0` (dependency security verification). Scope: audit and non-destructive verification only. Only this report is added; no contract/frontend deployment, signing, broadcast, wallet import, faucet claim, publication, Git push, Anvil restart/reset or chain time/state change occurred.

## Decision: NO-GO for functional testnet deployment under the current restrictions

Two independent blockers prevent real testnet gameplay:

1. **The frozen game requires an NFT contract at its hard-coded address. That address currently has no code on Monad testnet.** Deploying the game would not install or select an NFT fixture. Its constructor could succeed, but `preview` and `act` would fail against the missing dependency.
2. **The frontend has no supported Monad-testnet contract mode.** It permits contract-backed play only on isolated Anvil 31338; production chain 143 is read-only/demo. Adding chain 10143 to a wallet or substituting an RPC URL does not enable a safe testnet write path.

Local tests, dependency health and the static build pass. They do not make these architectural blockers disappear. **Do not spend testnet gas deploying the frozen game while its NFT dependency is absent.**

## 1. Official network and wallet verification

Official references reviewed:

- [Monad testnet network information](https://docs.monad.xyz/developer-essentials/testnet)
- [Official Foundry deployment guide](https://docs.monad.xyz/guides/deploy-smart-contract/foundry)
- [Add Monad testnet to a wallet](https://docs.monad.xyz/guides/add-monad-to-wallet/testnet)
- [Deployment/tooling summary](https://docs.monad.xyz/developer-essentials/summary)
- [Gas pricing](https://docs.monad.xyz/developer-essentials/gas-pricing)
- [Monad/Ethereum differences](https://docs.monad.xyz/developer-essentials/differences)
- [Official Foundry template](https://github.com/monad-developers/foundry-monad)
- [Source-verification guide](https://docs.monad.xyz/guides/verify-smart-contract/foundry)

| Item | Verified finding |
|---|---|
| Public testnet chain ID | **10143**, hexadecimal **0x279f**; stated explicitly in the official deployment configuration and confirmed by live `eth_chainId`. |
| Public HTTPS RPC | **https://testnet-rpc.monad.xyz**, official guide and successful read-only RPC check. |
| Currency | Testnet **MON**, 18 decimals; corroborated by installed Viem's `monadTestnet` definition and official network documentation. Test funds are not mainnet assets. |
| Faucet | Official network page links **https://faucet.monad.xyz**; access/amounts/eligibility can change. No claim was attempted. |
| Explorer | Use the testnet explorer linked by the official network page, e.g. **https://testnet.monadscan.com**, after checking the selected chain. No game deployment/explorer record exists from this task. |
| Wallet compatibility | EVM/EIP-1193 injected-wallet integration is suitable in principle. The app currently uses Wagmi 2.19.5 `injected()`; no WalletConnect/mobile deep-link path is configured. A real extension/device test on 10143 remains pending. |

The official testnet page's extracted table omitted some dynamically rendered values, and some guessed documentation URLs failed. Network ID/RPC were independently obtained from the explicit official Foundry configuration and the actual RPC; no third-party chain-list entry was treated as authoritative. Installed Viem 2.57.4 supplies a testnet definition, but the app does not currently activate it. Do not hard-code its older explorer/block-time metadata without checking current Monad documentation.

The official network page records a testnet genesis reset on December 16, 2025. Testnet persistence is not a guarantee across future resets. Store chain/deployment/block hashes in evidence; a chain ID alone does not establish continuity.

### Read-only public RPC evidence

Using only `eth_chainId`, block/code reads and `eth_gasPrice`:

```text
Endpoint:       https://testnet-rpc.monad.xyz
Chain ID:       10143
Pinned block:   71335428
Block hash:     0x2cd96e6246d93876eb19be30338a6268ba4c00d8a6324ea3569fe9d27b4fc1f3
Fixed NFT:      0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763
eth_getCode:    0x
Gas price:      102000000000 wei (102 MON-gwei)
```

Raw result: `/tmp/chog-4o-testnet-read.json`. This is a point-in-time observation, not a claim that the address can never be deployed. No token ownership/existence claim is made on this chain. No account was signed or funded.

## 2. Contract, fixture and deployment review

### Frozen NFT binding

`src/ChogSurvivor.sol` has a **zero-argument constructor** assigning immutable `CHOG_GENESIS` to `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`. There is no collection constructor argument, setter, proxy, owner/admin override or chain-specific fixture option.

Both `preview(tokenId, choiceId)` and `act(tokenId, choiceId)` call that address's `ownerOf(tokenId)` on the **same chain**. Mainnet ownership is not read across chains. Holding a genuine Chog Genesis NFT on Monad 143 does not provide a testnet NFT on 10143. `characterOf` can return default zero fields for arbitrary IDs without proving NFT existence; it must not be used as evidence that the dependency works.

The contract does not independently authenticate NFT branding/provenance: it trusts `ownerOf` at its fixed address. The local demo works because fixture code was deliberately installed at that numeric address on isolated Anvil, with explicit fixture labels. That is not a genuine Chog collection and is not a configurable public-testnet fixture mechanism.

### Existing scripts

The only deployment script is `script/local-anvil.sh`:

- requires exact `http://127.0.0.1:8545` and chain 31338;
- uses `anvil_setCode` to install `LocalCanonicalTestNFT` at the fixed address;
- mints local fixture IDs and deploys the game through an unlocked development account.

**Do not repoint or run this script against testnet.** Normal public RPC does not grant arbitrary code installation at chosen addresses. A separately deployed fixture at a different address will not satisfy the frozen game. CREATE/CREATE2 do not provide a practical general mechanism for choosing an arbitrary existing 160-bit address without the corresponding original deployment conditions/control.

`src/LocalCanonicalTestNFT.sol` is explicitly local-only, with unrestricted minting and simplified owner-only transfer mechanics. Its name, metadata and comments disclose that purpose. It is not an approved public testnet collection. No new fixture or fixture policy is approved by this audit.

### What would resolve the NFT blocker?

- Within current restrictions: a legitimate, reviewed and controllable NFT dependency must already become available **at the existing fixed address on chain 10143**, with a usable token and verified transfer behavior. No such deployment or authorized path was found. Do not assume another party can provide it at will.
- If that cannot be established, remain with the existing Anvil demonstration and walletless public simulation.
- A separately labeled testnet artifact with a configurable fixture would require a **new explicit scope/architecture approval outside these restrictions**, independent review and honest provenance. It is not the frozen contract deployed unchanged. No such artifact, address change or implementation is created or authorized here.

Do not interpret a successful game deployment or a zero-valued character read as resolution of the NFT blocker.

## 3. Frontend/environment readiness

| Surface | Current behavior / blocker |
|---|---|
| `contracts.ts` | Supports active chain 143 or valid localhost 31338 only. `approvedGameAddress` is populated only in local mode. No approved testnet game address/start block or supported mode exists. |
| `LocalContractAdventure.tsx` | Explicit `localMode` and `LOCAL_CHAIN_ID` gates protect selection/confirmation; preflight checks chain 31338. They must not be bypassed by changing an environment variable. |
| `Adventure.tsx`, `Character.tsx`, `useSurvivalHistory.ts` | Contract-backed routing/history are local-mode gated. Testnet would need a separately reviewed chain/deployment-scoped path, labels and event start block. |
| Ownership/availability | Must keep current-owner checks, token/wallet/chain scopes, block-pinned preview, receipt-block floor, async invalidation and fail-closed RPC behavior. |
| RPC substitution | Pointing `VITE_MONAD_RPC_URL` at testnet while keeping chain 143 is a chain/configuration mismatch, not testnet support. Do not repurpose local variables or overwrite `.env.local`. |
| Public-chain timing | Preflight currently requires the two latest-block reads to have identical number/hash. On a rapidly advancing public chain this can reject safe confirmations frequently. Validate usability and freshness semantics with controlled fast-block mocks before enabling real testing; do not simply remove authorization/day/preview validation. |
| History/RPC | Public RPC may impose rate/batch/log-range limits. Recent block-pinned reads and older receipt timestamps need suitable state access; journal indexing needs complete deployment-to-head logs and honest partial/error states. |

A future frontend preparation task, if approved after the NFT decision, would define explicit testnet chain/RPC/explorer/game/start-block settings, retain mainnet writes disabled, preserve Anvil mode byte-for-byte, label all fixture/testnet data, and test wrong-chain/account/token/day/receipt transitions. No testnet frontend settings were added in this audit.

The existing NFT state is **per token ID within a particular game deployment and chain**. Deploying on a new chain does not migrate Anvil #2006's XP, achievements, journal or lock. Ordinary NFT transfers within the same deployment preserve them; do not claim cross-chain continuity or automatic migration.

## 4. Toolchain, permissions and gas

### Deployment requirements

- Dedicated test-only deployer and two test-controller wallets; use an encrypted keystore or hardware/browser signer, not Anvil's publicly known seed/keys. Keep secrets out of the repo, CLI history, logs and `VITE_*` variables. No signer was imported or selected here.
- Sufficient testnet MON for reviewed gas/fee limits and account balance rules. Use only official faucet entrypoints; no mainnet funds, NFT purchases or approval grants are required for this plan.
- No game-owner role or special deployment permission exists: any appropriately funded EOA could create the contract, but the NFT dependency remains mandatory for useful play.
- `act` is nonpayable and reads NFT ownership; it needs **no NFT approval to the game**, custody, staking or token allowance. NFT transfers require the NFT contract's own authorized owner/operator semantics.
- Exact source/compiler/optimizer/EVM/artifact identity, verified runtime including immutable substitution, zero constructor arguments, deployment receipt/address/block/hash and source verification must be recorded.

The official tooling summary requires Viem >=2.40; current **2.57.4** meets that recommendation. The current Foundry guide recommends **1.8+ with Monad execution rules**. Installed **Forge 1.7.1** and current default config have no Monad-specific network setting. Existing Ethereum/Cancun tests do not validate Monad-specific gas/opcode/account behavior. Approve a separate toolchain/profile preparation before simulation/deployment; do not upgrade tooling or edit the default config during this audit.

Compiler remains Solidity **0.8.28**, optimizer **200**, target **Cancun**. Artifact creation/runtime lengths are **6,772 / 6,688 bytes**, below even the older Ethereum code-size limits. No size blocker was found. Bytecode compatibility must still be exercised against the target's actual rules before funding a deployment.

### Gas evidence and budget limitations

- Local Foundry gas report: deployment **1,498,315 gas**; `act` observations include successful/reverting/fuzz contexts and are not a target-network transaction quote.
- Compiler gas estimates report `infinite` for creation/`act`; this means static analysis could not bound them, not that execution requires infinite gas.
- Official [gas pricing](https://docs.monad.xyz/developer-essentials/gas-pricing) charges the **transaction gas limit**, not only gas used, with an EIP-1559-compatible effective price. Avoid arbitrary oversized safety limits. Monad-specific repricing means Ethereum-local measurements cannot determine the final limit.
- At the observed **102 gwei**, an **illustrative** 2,000,000-gas limit would charge **0.204 test MON**. This is arithmetic, **not** an approved limit, estimate or funding guarantee. No USD valuation is appropriate for test funds.
- No actual deployer, funded balance, approved transaction or live creation `eth_estimateGas` was supplied; therefore no exact deployment/act/transfer cost or maximum spend is approved. Once blockers clear, estimate unsigned creation/action/transfer against the chosen signer and current state, inspect fees and balance, and obtain a fresh bounded budget approval before signing. Do not reuse local/Ethereum gas estimates as Monad quotes.

## 5. Contract security and transfer continuity

Source review and passing tests support these existing properties:

- Current `ownerOf(tokenId)` alone authorizes an action; the daily lock belongs to the token. Another owner cannot reset it by receiving the NFT.
- State/events are keyed by NFT ID; transfer does not clear XP, Trust, Scars, streak, achievements, title inputs or historical actor attribution.
- One confirmed action per NFT per **contract UTC day**; wallet delays can cross a day and resolve the next encounter, so only confirmed events/state determine the reaction/outcome.
- The game is noncustodial, with no value transfer/reward token, pause, admin, migration or upgrade path. A deployed defect cannot be repaired in place by an operator.
- The dependency remains a trust/availability oracle. NFT `ownerOf` changes, restrictions, burn/reissue or upgrades can affect control/usability. A reused numeric ID inherits old game history; transfer continuity is not a guarantee of NFT immutability or non-reissue.
- Existing governance/source/authority unknowns documented in `FINAL_RELEASE_RISK_REVIEW.md` remain unresolved. Local/fork compatibility tests are not an independent audit or blanket public-release approval.

Preserve exact choice IDs/rewards, fresh error-free scoped previews, duplicate-submit protection, pending origin tracking, verified receipt filtering, UTC timestamps and the separation of current from historical owner. Do not create journal/progression from simulations, pending or rejected transactions.

## 6. Approval-gated deployment and E2E plan

This is a conditional plan, not authorization. **Gate 0 currently fails.** No broadcast command should be run merely because later steps are listed.

| Gate | Concrete requirement / approval |
|---|---|
| 0 — NFT architecture | Confirm a reviewed usable dependency at the unchanged fixed address on 10143, with controlled test tokens and transfers. Otherwise retain Anvil or request a newly scoped alternative. Do not deploy an unusable game. |
| 1 — Preparation | Approve a separate testnet-ready toolchain/profile and frontend mode without changing local defaults, frozen source, canonical address or authorization. Review public-chain timing/RPC behavior and mocked regressions. |
| 2 — Artifact/network/signers | Approve source/artifact hashes, exact chain 10143/RPC, public deployer/controller addresses, NFT token IDs and their verified owners, keystore/hardware signing method, fee cap and maximum test-MON spend. Never provide private keys in the approval record. |
| 3 — One deployment | Recheck chain, NFT code/source/owner/transfer readiness, nonce, balance and unsigned estimate. Approve exactly one game-creation transaction, sender, no constructor arguments and zero value. No mint/transfer/action is implied. |
| 4 — Verification/config | Verify receipt/status, deployed runtime/binding and deployment block/hash, then approve source publication and frontend address/start-block configuration as distinct steps. No production/mainnet write path is enabled. |
| 5 — E2E transactions | Prepare exact per-transaction sender, token, choice/recipient, expected evidence and fee cap. Obtain explicit approval before each approved action/transfer batch. Stop on ownership/network/eligibility/receipt mismatch. |

Example **future deployment command only**, after gates 0–3 pass and the Monad-aware toolchain is approved (not runnable as a recommendation in the current NO-GO state):

```sh
forge create src/ChogSurvivor.sol:ChogSurvivor \
  --network monad --chain 10143 \
  --rpc-url https://testnet-rpc.monad.xyz \
  --account chog-testnet-deployer --broadcast
```

No constructor collection argument can be added. Never substitute `script/local-anvil.sh`, `--unlocked`, a raw private key, `anvil_setCode` or mainnet RPC. Use the official verification guide with exact compiler/settings and no constructor arguments only after source-publication approval. A newly scoped alternate artifact, if ever authorized, would need a different command/review; the example does not authorize one.

### Conditional E2E acceptance sequence

1. Read chain and game/NFT bytecode/binding; verify an approved token T belongs to fresh controller A, character state and `preview.canAct`. Obtain owner data on 10143, not mainnet/Anvil. Use archive/log support and a trusted deployment start block.
2. Test injected-wallet connect/disconnect, wrong chain, account switch and rejection without broadcasting. Verify three original cards, accessibility/Skip and that interaction performance does not change contract choice/rewards.
3. After explicit action approval, A chooses a card, completes/retries/skips, reviews a fresh scoped contract preview and signs **one** `act(T, selectedChoiceId)` with zero value. Derive choice ID from the existing encounter definition, not card-category assumptions.
4. Require successful receipt and matching `AdventureResolved`/actual achievement events; verify updated state, reaction, title, journal hash/UTC and immediate authoritative daily lock. Never treat consensus inclusion, a wallet success message or a preview as the confirmed outcome.
5. After separate transfer approval, A signs `transferFrom(A, B, T)` if supported by the reviewed NFT. Verify Transfer evidence/current B owner and identical survivor state/history. Historical action stays attributed to A. Use read-only calls to confirm B inherits AlreadyActed and A gets NotTokenOwner; do not spend gas on deliberately reverting checks.
6. Test pending receipt with wallet/token switches, rejected requests, RPC lag/failure and duplicates through mocks/read-only simulation. On a naturally later UTC day, fresh contract reads must establish eligibility before any separately approved B action. **Never advance/reset public or local chain time.**
7. To exercise all three mini-game categories with real confirmations on one day, use three separately verified/approved tokens, one action each; do not reuse a locked survivor or assume local fixture IDs exist on testnet. Finalize exact transaction count/IDs/signers before approval.
8. Retain chain/game/NFT/token/receipt/block evidence, verify mobile/desktop and keyboard/reduced motion, and label any fixture/testnet data clearly. Transfers preserve history in that deployment, not across chains/resets.

No public testnet E2E or physical-wallet signing was performed in this audit. Existing local real-chain evidence and mocked Chromium checks do not substitute for it.

## 7. Non-destructive verification performed

| Check | Result |
|---|---|
| Official docs and public RPC | Chain/RPC verified; fixed NFT address **no code** at pinned testnet block. Calls were read-only. |
| Frontend, current local env | **373 passed, 0 failed, 0 skipped**, 22 files. Unit config isolates env; local suites opt in with fixtures, not live Anvil writes. |
| Frontend, explicit production/demo env | **373 passed, 0 failed, 0 skipped**, 22 files. |
| Foundry offline + gas report | **39 passed, 0 failed, 6 skipped**, 45 tests across 7 suites. Six optional Monad-mainnet fork tests skipped without RPC. Isolated test EVM only. |
| TypeScript | Passed. |
| Production build | Passed; existing annotation/chunk-size warnings remain. |
| Offline dependency security | **73 passed**. No package change/install needed. |
| Contract/config | Frozen source and `foundry.toml` hashes match the freeze record. |
| Local environment | `.env.local` SHA-256 unchanged from audit start: `e5bd1cda1991147968b341eb72f634335b421e2d04ac1fe5e49d9d81f73a8304`. No localhost-Anvil RPC method was required or called by this audit. |
| Diff | `git diff --check` passed. No source, scripts, fonts, settings or existing tracked files modified. |

Foundry/source hash: `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` for the frozen contract; `3bc024dfc0a3c3565148c933a37b4190f58e0c5f7222e18d0e129b4653897ecc` for `foundry.toml`.

Logs: `/tmp/chog-4o-tests-local.log`, `-tests-production.log`, `-foundry.log`, `-typecheck.log`, `-build.log`, `-dependency-check.log`, `-gas-estimates.json`, `-testnet-read.json`. These are local audit evidence, not deployments or publication URLs. Task 4N's existing 515 mocked Chromium checks were reviewed, not rerun here; no application code changed.

## Recommended next decision

Resolve the fixed-address NFT requirement before commissioning deployment or frontend write work. Under unchanged contract/address restrictions and the observed empty testnet address, continue the existing Anvil + walletless judging approach. If the owner wants a separate explicitly labeled fixture-based testnet build, first request a new scope that identifies which currently prohibited artifact/binding differences would be permitted, while leaving the frozen original untouched. No such exception is inferred or implemented by this report.

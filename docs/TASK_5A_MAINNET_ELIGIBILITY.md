# Task 5A — Monad mainnet and genuine Chog eligibility

Reviewed 2026-10-16 (Africa/Lagos); read-only RPC capture began 2026-10-15 23:10:34 UTC. **Technical holder compatibility: demonstrated for sampled token #1425 in an ephemeral fork. Mainnet launch: NO-GO pending the gates below.** No mainnet transaction, signature or deployment occurred. The existing Anvil node was not contacted or changed.

## Independent network and collection evidence

Official [Monad network information](https://docs.monad.xyz/developer-essentials/network-information) specifies mainnet chain 143 and `https://rpc.monad.xyz`; the downloaded Markdown exposes those values even where the research browser rendered empty table cells. Fresh calls independently confirmed chain `0x8f`.

The immutable address in the frozen game is `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`. Fresh results at block **113740200** (`0x6c789a8`), hash `0x4fb8b38bde982bd1a1fb37fb9e2e87665276e4770ad4b9031ed24c9c96343202`:

| Read | Observation |
| --- | --- |
| `eth_getCode` | 17,264 runtime bytes, retained in [collection-runtime.hex](evidence/task5a/collection-runtime.hex) |
| Runtime Keccak-256 | `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46`, independently matches earlier owner-supplied evidence |
| `supportsInterface(0x80ac58cd)` | true |
| `name()` / `symbol()` | Chog Genesis / CHOG |
| `totalSupply()` | 1,969 at the captured block; not a token-ID range or maximum-supply guarantee |
| `ownerOf(1425)` | Nonzero owner returned successfully; exact response retained in evidence |
| EIP-1967 implementation, admin, beacon slots | All zero at this block; not proof against custom proxies or other privileged powers |

[Read-only RPC transcript](evidence/task5a/monad-readonly.json) retains request arguments, responses and block context. Block data was reduced to identity/time/gas fields; code is retained in full. Queries used a single provider, not independent consensus verification. Marketplace links corroborate the address, while on-chain `name()` is self-reported rather than creator authentication. Official collection governance must still attest the deployment/source.

## Genuine-holder behavior

The existing six `MonadForkIntegrationTest` tests passed with `MONAD_RPC_URL=https://rpc.monad.xyz` on Foundry's in-memory fork. The suite fetches latest state separately from the pinned transcript; no exact shared fork block is claimed. It verified real collection code/interface, sampled owner, game binding, preview/action parity, rejection of non-owner, next-day eligibility, same-day lock, direct nonexistent-token rejection and transfer/progression inheritance. All six passed with **zero skips**, including the collection `transferFrom` path. The nonexistent ID was `uint256.max`; the test first directly confirmed its `ownerOf` reverts rather than assuming it is absent. This extends the earlier evidence that lacked such a check.

`act` calls the collection's `ownerOf(tokenId)` and requires `msg.sender` to equal that owner. The game never calls `approve`, `setApprovalForAll`, `transferFrom` or a custody/staking function. **No NFT approval or deposit is needed.** An approved marketplace operator, delegate or former owner cannot act merely because it has an NFT approval. A directly held genuine Chog can therefore use the frozen game in principle, subject to an approved deployment and live availability. A smart-contract wallet that owns the token must itself call the game; a beneficial owner whose NFT is held by an escrow/staking contract is not the `ownerOf` controller. No particular user's holdings were authenticated.

A sampled successful fork transfer does not establish that every token, recipient or future block is unrestricted. Collection pause/freeze/blacklist, burn/remint, seizure, operator filtering, metadata and upgrade authority remain unverified. No approvals were granted even inside the fork. Fork actions/transfers are simulated local execution over real collection state, **not mainnet transactions** and not new #2006 evidence.

## Source, governance and restrictions gate

[MonadScan source view](https://monadscan.com/address/0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763#code) returned 403 to the research browser. [Sourcify v2 lookup](https://sourcify.dev/server/v2/contract/143/0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763) returned null creation/runtime matches. The legacy Sourcify metadata URL returned a removed-v1-API response; it is not a valid source-verification result. This does not prove that verified source is unavailable everywhere.

The full code was disassembled locally. Opcode-shaped bytes near trailing auxiliary data cannot establish executable delegation; this review does not infer upgradeability or immutability from a textual opcode scan. Zero standard proxy slots and a matching hash are useful baseline evidence, not a complete authority audit.

Remedy: obtain the canonical creation transaction, reproducible verified source/ABI/compiler/settings, constructor/factory provenance, privileged role/upgrade/pause/transfer/burn/remint map, relevant controller addresses and accountable collection-team acceptance of the immutable dependency. Reproduce runtime bytecode and inspect control flow. Repeat representative reads immediately before separately approving deployment. See [the existing governance closure package](CANONICAL_NFT_GOVERNANCE_REVIEW.md).

## Compiler, toolchain and gas

The frozen source remains Solidity **0.8.28**, optimizer **200**, EVM **Cancun**. Local artifact compiler is `0.8.28+commit.7893614a`; creation bytecode 6,772 bytes and runtime template 6,688 bytes. Frozen source SHA-256 remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

The current [Monad deployment summary](https://docs.monad.xyz/developer-essentials/summary) supports Cancun-era opcodes, recommends Foundry 1.8+ with Monad execution enabled and Viem 2.40+. Installed Viem is **2.57.4**, but Foundry is **1.7.1**. The summary states a 30M transaction gas limit and charges the submitted gas limit; Ethereum gas results are not exact Monad budgets. No toolchain or frozen configuration was changed.

Isolated Foundry gas report: deployment cost **1,498,315**; observed `act` calls up to **166,517** gas in that instrumented suite, including reverts in its range. These are local EVM observations, not a complete worst-case Monad bound. Recorded #2006 local action used 164,354 gas; it is also not a mainnet fee quote.

A fresh read-only `eth_estimateGas` with the frozen creation bytecode returned **1,510,761**. `eth_gasPrice` returned **102,000,000,000 wei** (102 MON-gwei): multiplication gives **0.154097622 MON** at that sample, before any selected gas-limit buffer or price movement. This is an estimate, not a guaranteed cost or spending authorization. The sampled NFT-owner address was used only as the estimate sender; no deployer was approved and no signing key was used. [Estimate transcript and artifact hash](evidence/task5a/deployment-estimate.json).

Remedy: use a separately reviewed Monad-capable Foundry installation/profile without changing the frozen source or current Anvil configuration; reproduce creation/runtime artifacts, exercise the full suite under the correct gas schedule, and repeat estimation with the approved deployer, balance, nonce, fee policy and bounded gas limit immediately before approval. Do not blindly apply Ethereum padding because Monad charges the submitted limit. Verify source/immutable binding after a future separately authorized deployment.

## Frontend and launch gates

Production config forces production mode, clears local/RPC overrides, uses public Monad RPC and injected wallets, and **hard-disables a production game address**. An environment variable alone cannot enable live play. No approved production journal deployment start block or write path exists. This correctly preserves safe public simulation, but is a launch blocker.

A future approved launch needs a separate frontend change for the exact approved chain/address/ABI/binding/start block, receipt verification, finalized-history strategy, RPC range/rate behavior and wallet rejection handling, with preserved ownership/UTC/transfer rules and regression tests. Never relabel simulated results as confirmed transactions.

**NO-GO for mainnet deployment** until collection provenance/restrictions, Monad toolchain/gas readiness, an exact deployment plan/deployer, production frontend support, independent security review and explicit owner approval are closed. MetaMask/Blockaid classification also requires official provider review; code/fork success does not clear a reputation warning. No deployment is recommended merely to meet the deadline.

# Chog Genesis discovery — Milestone 11.5

Date: 2026-10-12. Baseline: `66cfe42ca1f750d00d65c65e4169dc9ec7252c8c`.
Investigation was read only, before UI implementation. No API keys, indexer,
wallet signatures, transactions, deployments or unbounded scans were used.

## Collection verified

Repository Solidity and frontend agree on Chog Genesis:
`0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`, Monad mainnet chain **143**.
Fresh `eth_chainId`, `eth_getCode`, `name`, `symbol`, ERC-165 and ERC-721 reads
confirmed the address's deployed read surface. Runtime is 17,264 bytes, Keccak
`0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46`,
matching the prior collection review. This does not resolve collection source,
governance, upgradeability or deployment approval; game deployment stays NO-GO.

RPC request/response evidence, including block numbers/hashes, is in
[TASK_11_5_DISCOVERY.json](evidence/TASK_11_5_DISCOVERY.json).
Full block headers are reduced to number/hash/timestamp and runtime to length/hash;
contract-call parameters/results and RPC errors are retained.

## Enumeration methods checked

| Method | Evidence | Decision |
| --- | --- | --- |
| ERC-721 Enumerable | ERC-165 itself and ERC-721 return true; Enumerable `0x780e9d63` and invalid `0xffffffff` return false. `tokenOfOwnerByIndex(ownerOf(1425), 0)` reverts despite that owner's balance being one. `totalSupply()` returns 1969 at the probe block. | Unsupported. Supply/balance alone cannot identify tokens; no range scan. |
| Collection extension | Instruction-aware runtime selector inspection found `tokensOfOwner(address)` (`0x8462151c`). Actual ABI-decoded calls succeed. At finalized block `0x6b9f6dc`, balances zero, one and twelve match distinct returned IDs; canonical `ownerOf` confirms every ID for the nonempty wallets at that same block. The pinned block hash remains stable. | Suitable with bounded calls, per-candidate ownership verification and balance/count reconciliation. No assumption about Enumerable or unverified implementation semantics. |
| Transfer logs | Canonical receipt for known mint transaction `0x14ed5d31b93253cbfcd1c955e1c41a356b999550b713408a202b83679a828a2d` confirms token 1047 mint. Two bounded recent log windows return empty successfully. Collection creation block, source and complete initial-state coverage remain unverified. | Not sufficient to reconstruct complete holdings. No historical indexing implemented. |
| External indexer | OpenSea documents chain/account NFT listing, collection filtering and cursor pagination. Its docs require an API key, and note visibility/policy omissions. Actual Monad API coverage and complete collection coverage were not established. | Not approved or integrated; unnecessary for the verified custom getter path. No keys requested or created. |

ERC-721 explicitly makes enumeration optional and permits constructor assignment
without mint Transfer events; logs need independent completeness evidence.
[ERC-721 specification](https://eips.ethereum.org/EIPS/eip-721).

## Reliability, RPC and pagination

The extension is expensive: a 7,500,000-gas call fails with `out of gas` for
the one-token holder, while zero-balance calls succeed. A **50,000,000-gas**
budget succeeds for observed balances 1, 12 and 73. For the 73-token holder,
the investigation deliberately verifies only eight candidates; this is partial
evidence, not a verified complete inventory. No browser enumerates a token range.

The application therefore discovers only on an explicit click. Every attempt
pins a finalized block, checks RPC chain and the recorded runtime hash, fetches
balance and candidate IDs, then verifies at most **24** distinct IDs using
canonical `ownerOf`. It rechecks the pinned block hash. Complete holdings require
no duplicate candidates, exact balance/count agreement and every candidate passing
ownership verification. Only complete empty evidence permits an empty-holdings
statement, explicitly at the recorded block. Any failed owner read, changed owner,
duplicate, omitted candidate or verification cap produces partial results.
Collection/network/code/hash/getter failures produce an unavailable state.

The extension has no independently verified pagination surface. The UI caps
verification rather than claiming to paginate it; larger wallets use partial
results and manual token verification. There are at most 30 logical RPC reads
per attempt, sequential ownership checks, 20-second per-read deadlines, and no
automatic expensive getter polling. Existing transport retries may continue an
underlying request after a deadline; late results cannot update UI or start new
discovery steps. Account, chain, selection, focus, unmount and 30-second snapshot
expiry invalidate results. A selected token uses the existing current-owner query
again; a snapshot does not grant controller status or enable gameplay.

Monad's documentation places calls over 8.1M gas in its smaller high-gas pool;
public provider caps differ. RPC throttling, timeouts or lower custom-provider gas
budgets can make discovery unavailable. No rate-limit SLA was independently
established. Manual lookup remains usable. Official log-range guidance is 100
blocks for `rpc.monad.xyz` and differs by public provider; a successful 101-block
probe does not establish a supported larger limit. These constraints support
avoiding browser history scans.
[Monad JSON-RPC documentation](https://docs.monad.xyz/reference/json-rpc/overview).

OpenSea documents a maximum account-list page size of 200 and `next` cursors;
API keys and rate-limit handling would require a separately approved design.
[Account listing](https://docs.opensea.io/reference/get_nfts_by_account),
[authentication](https://docs.opensea.io/reference/auth),
[API key limits](https://docs.opensea.io/reference/api-keys).

## Conclusion

Read-only discovery is implemented without new permissions, keys, providers,
dependencies or infrastructure. Its assurance is narrow: these are real
collection reads and independently verified ownership snapshots, conditional on
the canonical contract's existing ownership oracle. They are not governance
verification, NFT metadata verification or a live game deployment.
Verified artwork remains unavailable; the portrait remains decorative.
Progression, daily eligibility and survival history remain unavailable without
an approved game deployment. Adventure remains a separate local demonstration.

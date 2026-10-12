# Canonical NFT Governance and Upgradeability Review — Task 8H.2

Date: 2026-10-12. Scope: read-only investigation of Chog Genesis,
`0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763`, on Monad mainnet (chain ID
143). This is an evidence review, not an independent audit or release
approval. No transaction, signature, broadcast, private key, deployment, or
production change was used.

## Recommendation: NO-GO remains

Do not deploy Chog Survivor until the canonical collection's source/provenance,
upgrade/delegation architecture, and privileged authority are independently
verified and explicitly accepted by accountable Chog Genesis governance. The
game's immutable authorization and existence oracle is `ownerOf`; therefore
collection control or availability risk is a release gate.

## Sources consulted

| Source | What it supports | Limitation |
|---|---|---|
| [Monad Developers GitHub](https://github.com/monad-developers) | Monad's verified GitHub organization states mainnet chain ID 143, RPC `https://rpc.monad.xyz`, and names MonadVision/MonadScan as explorers. | Network context only; it does not attest to Chog Genesis source or governance. |
| [MonadScan indexed transaction](https://monadscan.com/tx/0x14ed5d31b93253cbfcd1c955e1c41a356b999550b713408a202b83679a828a2d) | An indexed transaction page shows a `Transfer` mint log from the zero address and a `Minted` event emitted by the canonical collection, for token ID 1047. | This is a later mint transaction, not the collection-creation transaction and not verified source. Event decoding/labels alone do not prove implementation semantics or authority. |
| [OpenSea Chog Genesis item](https://opensea.io/item/monad/0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763/1428) | Public marketplace listing labels the collection Chog Genesis, ERC-721, Monad, and uses the canonical contract address. | Marketplace metadata is corroborative, not authoritative source or governance evidence. |
| [Chog Linktree](https://linktr.ee/chognft) | A public Chog-branded link directory links to the project website, OpenSea collection, Discord, and build site. | The directory does not publish the canonical contract source, creator/deployer, role holders, or governance policy; it is not treated as cryptographic or legal authority. |
| [MonadVision address page](https://monadvision.com/address/0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763) and [MonadScan address page](https://monadscan.com/address/0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763) | Intended primary explorer address records. | Both address pages returned an internal error to the research browser. No verified-source, compiler, creation, ABI, or role conclusion was taken from inaccessible pages. |

The review also searched the exact address together with "Contract Creator" and
"Contract Source Code Verified." It found no authoritative verified-source
record, source repository, or deployment transaction attributable to Chog
Genesis. This is a **NOT FOUND in the consulted public sources** result, not
proof that no such material exists elsewhere.

## Existing read-only chain evidence

The following is retained user-supplied WSL/RPC evidence, not a fresh RPC query
by this review. [MONAD_COLLECTION_VERIFICATION.md](MONAD_COLLECTION_VERIFICATION.md)
records the commands and provenance.

| Observation | Status | Evidence boundary |
|---|---|---|
| Chain ID 143, collection code present, ERC-165 ERC-721 support, and `ownerOf(1425)` succeeds | VERIFIED, point in time | User WSL capture at block 112631758. |
| Collection runtime code Keccak-256 `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46` | VERIFIED, point in time | User WSL capture at block 112631758; full code hex was not retained in this workspace, so no independent decode is possible here. |
| Standard EIP-1967 implementation/admin/beacon slots all zero | VERIFIED, point in time | User WSL capture; exact standard slots and values are documented in the collection-verification record. |
| Direct collection mint activity | VERIFIED, limited | The indexed MonadScan transaction above contains the collection's zero-address `Transfer` and `Minted` logs for token 1047. |
| Verified source, compiler version/settings, flattened source, ABI, contract-creation transaction, deployer identity, constructor arguments | NOT FOUND | Not available through the consulted accessible public records. |
| Current runtime hash/slot values at a newly observed block | UNKNOWN | No live RPC call was possible from this review environment. |

Zero standard EIP-1967 slots are not evidence of immutability. They do not rule
out a custom proxy, EIP-1167 clone, diamond, alternate beacon/delegatecall
scheme, custom upgrade logic, or mutable privileged functionality in ordinary
runtime code.

## Authority/control assessment

| Capability relevant to `ownerOf` or existence | Classification | Basis |
|---|---|---|
| Ordinary ERC-721-compatible ownership query | VERIFIED, point in time | ERC-165 support and `ownerOf(1425)` WSL evidence; marketplace corroboration. |
| Mint capability exists or existed | VERIFIED, limited | Indexed `Minted` and zero-address `Transfer` logs show mint activity. This does not identify who could mint, whether minting is still enabled, or any authorization condition. |
| EIP-1967 implementation/admin/beacon currently configured at captured block | VERIFIED, point in time | All three captured standard slots are zero. |
| Standard EIP-1967 proxy upgrade path | NOT FOUND in checked standard slots | This is not a finding that no upgrade path exists. |
| Owner/admin/role holders; `owner()`, `admin()`, AccessControl roles | UNKNOWN | No verified ABI/source or reliable read-only call evidence. |
| UUPS, custom proxy, diamond, delegatecall, or other upgrade path | UNKNOWN | No decoded runtime bytecode or verified source. |
| Privileged mint, burn, remint, forced transfer, seizure, approval override | UNKNOWN | Mint logs do not establish present power, caller eligibility, or whether other privileged methods exist. |
| Pause/freeze/blacklist controls affecting `ownerOf` or transfers | UNKNOWN | No source, ABI, or read-only function evidence. |
| Metadata base URI, contract URI, renderer, or metadata-change authority | UNKNOWN | `tokenURI(1425)` succeeded in prior WSL capture, but no source/ABI establishes mutability or controller. |
| Token burn/reuse semantics and absent-token `ownerOf` behavior | UNKNOWN | No read-only call to a known absent token is retained. |

## Deployment provenance

The accessible MonadScan transaction is evidence of a mint, not the contract
deployment. No authoritative collection-creation transaction hash, deployer,
factory, constructor arguments, or creation block was found. The third-party
collection page says "Created 3 Sep 2026," but that is not treated as deployment
provenance because it does not provide a verifiable creation transaction or
source link.

## Required closure package for Chog Genesis

Request these exact artifacts or read-only attestations from the project team:

1. The canonical deployment transaction hash, deployment block/hash, deployer
   or factory address, full creation input, and resulting collection address.
2. Explorer-verifiable source, compiler version/settings, constructor arguments,
   ABI, and a reproducible build whose runtime bytecode matches a fresh
   `eth_getCode` capture at a recorded block.
3. A complete authority map: owner/admin/role addresses, multisig membership and
   threshold, timelocks, upgrade manager/factory/beacon/diamond facets, and the
   process for changing each authority.
4. Source or ABI-plus-read-only call transcript covering upgrade/delegatecall,
   `ownerOf`, mint, burn, remint, forced transfer, pause/freeze/blacklist,
   approvals, token URI/base URI/contract URI, royalties, and any operator
   filter or transfer restriction.
5. A fresh read-only RPC evidence bundle: chain ID, block number/hash, full
   code hex and Keccak-256, EIP-1967 slots, relevant role/owner calls, a known
   absent-token `ownerOf` result, and representative `tokenURI` results.
6. Written accountable-governance approval of the immutable Chog Survivor
   dependency and an incident policy for collection upgrade, pause, burn,
   remint, or `ownerOf` availability changes.

Until the package is independently checked and separately approved, the
canonical NFT governance/source risk remains unresolved and release is NO-GO.

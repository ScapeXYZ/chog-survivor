# Monad Canonical Collection Verification — Task 8D.5

Date: 2026-10-12. Scope is strictly read-only verification of
`0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763` on Monad mainnet through
`https://rpc.monad.xyz`.

## Assessment: CONDITIONAL

**PASS — collection existence and basic ERC-721 ownership compatibility.**
Captured user WSL terminal output establishes the expected mainnet chain ID,
nonempty deployed collection code (as evidenced by the captured runtime hash),
ERC-721 interface support, and a successful `ownerOf(1425)` call.

**INCOMPLETE — proxy, upgradeability, privileged NFT functions, and governance.**
The standard EIP-1967 slots being zero does not prove immutable or
non-upgradeable code. Custom proxy patterns, custom storage slots, a diamond,
delegated authority, or privileged collection functionality remain unverified.

## Evidence provenance and block context

The primary evidence is user-provided WSL terminal output captured in
[`reports/collection-verification/live-check.txt`](../reports/collection-verification/live-check.txt).
It is treated as real read-only RPC evidence, not as a fresh query executed by
Codex. Codex did **not** rerun these calls: this environment's previous attempt
to resolve `rpc.monad.xyz` failed with `curl: (6) Could not resolve host`.

| Item | Captured observation | Provenance |
|---|---|---|
| RPC hostname | `rpc.monad.xyz` | specified target / WSL capture context |
| chain ID | `143` (`0x8f`) | WSL terminal capture |
| block number | `112631758` | WSL terminal capture |
| collection | `0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763` | requested canonical address |
| runtime code hash | `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46` | WSL terminal capture |
| ERC-165 `supportsInterface(0x80ac58cd)` | `true` | WSL terminal capture |
| `ownerOf(1425)` | succeeded | WSL terminal capture; returned address intentionally not repeated here |
| `tokenURI(1425)` | succeeded; returned an `ipfs://` URI | WSL terminal capture |

These are point-in-time observations at the recorded block context. NFT ownership
can change after that block; this report makes no claim about a current owner.

## Reproducible read-only commands

The captured values correspond to the following read-only checks; use the same
RPC and record the block before comparing results on a later run:

```sh
RPC=https://rpc.monad.xyz
NFT=0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763

cast chain-id --rpc-url "$RPC"
cast block-number --rpc-url "$RPC"
code=$(cast code "$NFT" --rpc-url "$RPC")
cast keccak "$code"
cast call "$NFT" 'supportsInterface(bytes4)(bool)' 0x80ac58cd --rpc-url "$RPC"
cast call "$NFT" 'ownerOf(uint256)(address)' 1425 --rpc-url "$RPC"
cast call "$NFT" 'tokenURI(uint256)(string)' 1425 --rpc-url "$RPC"
```

No nonexistent-token `ownerOf` call was supplied or rerun. Its revert/return
behavior is therefore **unknown** and is not inferred from ordinary ERC-721
expectations. No verified explorer metadata or collection source was supplied;
none is claimed.

## Standard proxy-slot evidence and limitations

The following standard EIP-1967 slots were checked read-only in the user's WSL
terminal after the earlier capture and returned 32 zero bytes:

| Slot | Slot address | Observed value | Provenance |
|---|---|---|---|
| implementation | `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbd` | `0x` + 32 zero bytes | WSL terminal capture |
| admin | `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6104` | `0x` + 32 zero bytes | WSL terminal capture |
| beacon | `0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d51` | `0x` + 32 zero bytes | later user-supplied WSL terminal check |

The earlier truncated admin-slot query is invalid and is not used as evidence.
The later complete zero-admin result above is the only admin-slot evidence used.

Zero values in these three *standard* slots do not establish that the collection
is immutable, non-proxied, non-upgradeable, or ungoverned. Runtime bytecode has
not been independently decoded here; EIP-1167, beacon variants outside the
standard slot, diamonds, custom delegation/upgrade logic, and role-based or
owner-based NFT powers are not ruled out. No `owner()`, `admin()`,
`implementation()`, `proxiableUUID()`, source-code, or explorer claim is made.

## Chog Survivor binding and authorization assumption

The locally compiled game creation artifact contains the canonical address once:

```sh
jq -r '.bytecode.object' out/ChogSurvivor.sol/ChogSurvivor.json |
  tr '[:upper:]' '[:lower:]' |
  grep -o 'c96d31f8626c6d03fae5dcd3d61e3fb9f4a73763' | wc -l
# 1
```

`src/ChogSurvivor.sol:79-81` fixes that address in the immutable. At lines
101-105, `act` directly reads `CHOG_GENESIS.ownerOf(tokenId)` and requires
`msg.sender == owner`; approvals and operators do not authorize action.
The captured successful `ownerOf(1425)` result is compatible with this direct
owner model at block `112631758`. It does not prove behavior for every token,
burned/nonexistent tokens, or future collection code/ownership state.

Monad testnet was not queried and must not be assumed to contain this mainnet
collection at the same address.

## Remaining release checks

1. Preserve an exact code hex dump at a recorded block and independently decode
   it for standard and custom proxy/delegation patterns.
2. Obtain verified source/explorer metadata, if available, and inspect all
   privileged/upgrading/governance methods and roles.
3. Make and record a read-only nonexistent-token `ownerOf` call using an ID
   known to be absent; do not guess an absent token ID.
4. Repeat chain ID, code hash, interface, and `ownerOf` checks immediately
   before deployment because live ownership and collection behavior can change.

No deployment, broadcast, signature, wallet transaction, or production change
was performed in this review.

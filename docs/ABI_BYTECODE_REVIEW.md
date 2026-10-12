# ABI, bytecode, and deployment-readiness review (Stage 2D Task 8B)

## Reproducible local inspection

All facts below are from the locally rebuilt artifact unless labeled an assumption.

```sh
forge build --offline
forge inspect ChogSurvivor abi
jq '{creation_bytes:(.bytecode.object|length/2),runtime_bytes:(.deployedBytecode.object|length/2),metadata_compiler:.metadata.compiler,metadata_settings:.metadata.settings}' out/ChogSurvivor.sol/ChogSurvivor.json
jq -r '.bytecode.object' out/ChogSurvivor.sol/ChogSurvivor.json | tr '[:upper:]' '[:lower:]' | grep -bo c96d31f8626c6d03fae5dcd3d61e3fb9f4a73763
forge fmt --check && forge test -vv
```

## Verified artifact facts

| Item | Measurement / value |
|---|---|
| Artifact | `out/ChogSurvivor.sol/ChogSurvivor.json` |
| Solidity compiler | `0.8.28+commit.7893614a` |
| EVM target | Cancun |
| Optimizer | enabled, 200 runs |
| Metadata | IPFS bytecode hash; source key `src/ChogSurvivor.sol` |
| Creation bytecode | 6,785 bytes |
| Runtime bytecode | 6,701 bytes |
| EIP-170 runtime limit | 24,576 bytes; **17,875 bytes margin** |
| EIP-3860 init-code limit | 49,152 bytes; **42,367 bytes margin** |
| Libraries / link references | none |
| Constructor parameters | none; nonpayable |

The approved collection address
`0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763` occurs once in creation bytecode, at
hex-character offset 36. This matches the source assignment at
`src/ChogSurvivor.sol:79-81`. The constructor writes it into the immutable, so the
unlinked artifact runtime template need not contain the final immutable value literally.
The deployed instance must be inspected after deployment to confirm its immutable getter.

## ABI review

The artifact contains exactly the following externally visible items:

| Type | Items |
|---|---|
| Constructor | `constructor()` nonpayable |
| Functions | `CHOG_GENESIS()`, `act(uint256,uint8)`, `characterOf(uint256)`, `eventFor(uint256,uint64)`, `preview(uint256,uint8)`, `titleOf(uint256)` |
| Events | `AdventureResolved(...)`, `AchievementEarned(uint256,uint8,uint64)` |
| Custom errors | `InvalidChoice(uint8)`, `AlreadyActed(uint256,uint64)`, `NotTokenOwner(uint256,address)` |
| Receive/fallback | none |

This matches the ABI shape in `SPEC.md`, including struct return types and the two event
schemas. No unexpected privileged method, owner/admin setter, collection-address setter,
pause, upgrade hook, proxy entry point, payment function, ERC-20/ERC-721 transfer,
approval, withdrawal, delegatecall, or library link exists in the artifact.

## Deployment configuration review

`foundry.toml` pins `solc_version = 0.8.28`, Cancun, optimizer enabled/200 runs, and
read-only filesystem permission. It has no RPC URL, private key, deployer, broadcaster,
chain ID, verifier key, or verification configuration. No deployment scripts or broadcast
files were found. `.env.example` names only an optional read-only `MONAD_RPC_URL` and
explicitly excludes private keys/mnemonics.

This is safe by default for local test commands, but it is not a deployment plan. A
release process must add a reviewed, out-of-repository deployment configuration and
verification command without committing secrets.

### Network assumptions

- **Verified locally:** no chain ID is set in `foundry.toml`; local compilation does not
  select Monad mainnet or testnet.
- **Target assumption supplied for release planning:** Monad **mainnet is chain ID 143**.
- **Not assumed:** the canonical mainnet Chog Genesis contract exists at the same address
  on Monad testnet. Testnet use requires an explicit, read-only code/`ownerOf` check and
  either the same verified collection address or a separately approved deployment plan.

No network call was made during this review.

## Findings and release blockers

1. **Blocker — target-chain collection verification.** Before any deployment, verify on
   the selected chain that the fixed address has the intended collection code and a
   conforming `ownerOf`; the game cannot be repointed if it does not.
2. **Blocker — chain selection.** Pin the intended chain ID in the reviewed deployment
   procedure. Never infer testnet compatibility from mainnet address equality.
3. **Blocker — post-deploy bytecode/immutable verification.** Compare the deployed code
   and `CHOG_GENESIS()` result to this artifact and approved address, then publish source
   verification metadata.
4. **Informational — README drift.** `README.md:3` still says the repository contains no
   production contract/deployment implementation, which is now inaccurate. Update it in
   a documentation task before release so operators do not rely on stale scope claims.

No production ABI or bytecode defect was found. This review does not substitute for a
target-chain bytecode comparison, source verification, or live collection check.

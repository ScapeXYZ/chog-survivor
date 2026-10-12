# Backend Freeze and Release Evidence — Task 8H.1

Date: 2026-10-12. This is a reproducible backend-source and local-artifact
record for human review. It is not a deployment record, source verification of
the canonical NFT, an independent audit, or release approval. No production
Solidity, tests, ABI, deployment configuration, signing, broadcast, or live
transaction was changed for this record.

## Freeze scope and approved rules

The frozen backend is `src/ChogSurvivor.sol`, configured by `foundry.toml`.
It is a single immutable, noncustodial game contract bound by its constructor
to Chog Genesis at `0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763`. It has no
owner, proxy, upgrade, pause, asset-custody, or deployment-time collection
parameter.

Approved gameplay includes deterministic UTC-day events, strategic waiting,
the existing XP/Trust/Scar/title rules, and Interpretation B for Unmarked
Week. Interpretation B is human-approved and regression-tested: an action
qualifies only if its post-modifier, pre-clamp requested Scar delta is
non-positive. A positive request resets `unmarkedStreak`, including at 100
stored Scars when the effective logged `scarsDelta` is zero due to clamping.
Zero/negative requests qualify; achievement bit 7 remains set after unlock.
See [UNMARKED_WEEK_DECISION.md](UNMARKED_WEEK_DECISION.md).

## Reproducible source and artifact identity

These are SHA-256 hashes of files or decoded artifact bytes present in this
workspace at record time; they are not historical commitments and do not prove
that any contract has been deployed. Run from the repository root:

```sh
sha256sum src/ChogSurvivor.sol foundry.toml \
  out/ChogSurvivor.sol/ChogSurvivor.json
jq -r '.metadata.sources["src/ChogSurvivor.sol"].keccak256' \
  out/ChogSurvivor.sol/ChogSurvivor.json
jq -r '.bytecode.object' out/ChogSurvivor.sol/ChogSurvivor.json \
  | sed 's/^0x//' | xxd -r -p | sha256sum
jq -r '.deployedBytecode.object' out/ChogSurvivor.sol/ChogSurvivor.json \
  | sed 's/^0x//' | xxd -r -p | sha256sum
cast keccak "$(jq -r '.bytecode.object' out/ChogSurvivor.sol/ChogSurvivor.json)"
cast keccak "$(jq -r '.deployedBytecode.object' out/ChogSurvivor.sol/ChogSurvivor.json)"
```

| Item | Value |
|---|---|
| `src/ChogSurvivor.sol` SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| `foundry.toml` SHA-256 | `3bc024dfc0a3c3565148c933a37b4190f58e0c5f7222e18d0e129b4653897ecc` |
| `out/ChogSurvivor.sol/ChogSurvivor.json` SHA-256 | `8236e066fecf2ee1e899054d7e37f349f5104830e9df7a60b5270ec40e1c5083` |
| Artifact metadata source Keccak-256 | `0xd4e71a88b4e93318c87c13d621310bc3ba93aec1d856f1d6032b87292f9bd5f2` |
| Creation bytecode bytes / SHA-256 / Keccak-256 | 6,772 / `8718449c213d66745bbdc7dc0c635fdc8349b7757106f36e9db02c8d3e2e974a` / `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Runtime bytecode bytes / SHA-256 / Keccak-256 | 6,688 / `717b3465ac40cc34074c0244c4a292cf391416b7803f55704df2ca0d82c7f82c` / `0xc51d328e70b9eb418acbc7f327571fbe343882edd1700532c200612082093d9f` |

The runtime hash is for the locally generated artifact only. No deployment
address or target-chain game bytecode was supplied or queried, so no deployed
game-contract bytecode match is asserted.

## Compiler and build settings

`foundry.toml` pins Solidity `0.8.28`, EVM `cancun`, optimizer enabled with
200 runs, and standard Foundry `src`, `test`, `script`, `out`, and `lib`
paths. The local artifact metadata reports compiler
`0.8.28+commit.7893614a`, `evmVersion: cancun`, optimizer enabled/200 runs,
`viaIR: null`, and metadata bytecode hash `ipfs`. The local Foundry binary is
`forge 1.7.1` commit `4072e48705af9d93e3c0f6e29e93b5e9a40caed8`.

Consistency check: the artifact metadata names only
`src/ChogSurvivor.sol` as a production source and embeds the source Keccak-256
above; its compiler settings agree with `foundry.toml`. Rebuilding with the
commands below is required before relying on these local artifact hashes.

## Verification evidence and provenance

| Evidence | Result | Provenance and limitation |
|---|---|---|
| Full Foundry suite | 42 passed, 0 failed, 0 skipped across 6 suites; invariant: 256 runs, 128,000 calls, 0 reverts. | User-supplied WSL terminal output for the updated Interpretation B tree. No raw log matching this 42-test run is present locally. |
| Dedicated Monad fork suite | 6 passed, 0 failed, 0 skipped against chain 143. | User-supplied WSL terminal output; point-in-time local-fork evidence only. No matching updated raw log is present locally. |
| Archived fork reports | `fork-test.txt` records 6/0/0; `full-suite.txt` records the earlier 40/0/0 run. | Local files under `reports/fork-integration/`; the full-suite file predates the updated Interpretation B test count and must not be relabeled as 42/42 evidence. |
| Codex-local validation | 36 passed, 0 failed, 6 skipped (42 total) across 6 suites; invariant: 256 runs, 128,000 calls, 0 reverts. | `MONAD_RPC_URL` is unavailable locally, so the six fork tests are skipped here and are not live-chain evidence. |

Reproduce the local checks with:

```sh
forge fmt --check
forge build --offline
forge test -vv
```

The full suite includes the invariant campaign in the current configuration.
The current local fork-test skip condition is intentional: tests call
`vm.skip` when `MONAD_RPC_URL` is empty; it does not contradict the separately
provenanced WSL execution.

## Static analysis

[STATIC_ANALYSIS_REVIEW.md](STATIC_ANALYSIS_REVIEW.md) records Slither 0.11.3
and Solhint 5.0.5 against the pinned compiler/settings. It reports no confirmed
Critical, High, or Medium issue. Remaining findings are documented
informational classifications plus the accepted low UTC-boundary/timestamp and
external-collection availability risks. This is tool-assisted review, not an
independent audit or security guarantee.

## Release block and Git limitation

Release remains **NO-GO**. The canonical NFT's verified source, authority and
governance model, custom proxy/delegation path, upgrade controls, pause/burn/
remint/forced-transfer powers, and reliable `ownerOf` semantics remain
unverified. The immutable game depends on that collection for both existence
and authorization. Required closure evidence remains in
[FINAL_RELEASE_RISK_REVIEW.md](FINAL_RELEASE_RISK_REVIEW.md).

The workspace has a `.git` directory but it is not a valid Git worktree:
`git rev-parse --show-toplevel` fails with "not a git repository." Therefore
this record has no commit ID, clean-tree assertion, or Git diff provenance. No
Git repository was initialized or repaired.

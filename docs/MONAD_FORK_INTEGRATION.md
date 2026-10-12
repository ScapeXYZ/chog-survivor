# Monad Mainnet-Fork Integration — Tasks 8F.1–8F.2

Scope: local Foundry fork integration only for Chog Genesis at
`0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763` on Monad chain ID 143. No
transaction is signed or broadcast: `vm.createSelectFork`, `vm.prank`, and any
`transferFrom` mutate only Foundry's disposable local fork state.

## Assessment: CONDITIONAL — fork execution PASS; human release review remains

**PASS — user-executed WSL evidence.** The user ran the dedicated suite against
`https://rpc.monad.xyz`; it passed all 6 tests with 0 failures and 0 skips. The
user also supplied a full-suite run: 40 passed, 0 failed, and 0 skipped. These
are point-in-time local-fork results, recorded in
[`reports/fork-integration/fork-test.txt`](../reports/fork-integration/fork-test.txt)
and
[`reports/fork-integration/full-suite.txt`](../reports/fork-integration/full-suite.txt).

**BLOCKED only for Codex-local live execution.** In this environment,
`MONAD_RPC_URL` was absent and `rpc.monad.xyz` did not resolve through DNS.
Codex therefore did not make an RPC request and its earlier ordinary local run
skipped the six opt-in fork tests. That local limitation is distinct from, and
does not negate, the supplied WSL results.

The test suite itself asserts chain ID 143; the successful WSL suite therefore
confirms its execution against the intended Monad chain. This does not replace
the broader point-in-time collection evidence or limitations in
[MONAD_COLLECTION_VERIFICATION.md](MONAD_COLLECTION_VERIFICATION.md).

## Execution evidence

The supplied WSL commands and results are:

```sh
export MONAD_RPC_URL='https://rpc.monad.xyz'
forge test --match-contract MonadForkIntegrationTest -vv
# 6 passed; 0 failed; 0 skipped

forge test -vv
# 40 passed; 0 failed; 0 skipped
```

The dedicated fork suite passed these exact tests:

- `testDirectlyVerifiedNonexistentTokenCannotPreviewOrAct`
- `testForkIdentityAndCanonicalERC721`
- `testOneActionPerUtcDay`
- `testRealNonOwnerIsRejected`
- `testRealOwnerAuthorizationAndPreviewParity`
- `testSimulatedRealTransferPreservesTokenKeyedHistoryAndChangesAuthority`

The full-suite report covers six suites: the 12 achievement tests, 1 balance
test, 10 reference-model tests, 10 core tests, the 6 fork tests above, and the
one invariant campaign (`256` runs and `128,000` handler calls with zero
reverts). It contains no skipped or failed test.

## Suite coverage

`test/MonadForkIntegration.t.sol` reads `MONAD_RPC_URL` with `vm.envOr` and
creates/selects a fork only when it is supplied. On a reachable RPC it verifies:

- chain ID 143, nonempty runtime code, ERC-165 ERC-721 support (`0x80ac58cd`),
  and a dynamically resolved `ownerOf(1425)`;
- deployment of `ChogSurvivor` only inside the local fork, canonical-address
  binding, current-owner authorization, non-owner rejection, and preview/action
  parity;
- the same-day action rejection and a next-UTC-day action;
- token-keyed history across a simulated local-fork `transferFrom`, including
  old-owner rejection and new-owner authorization. If the collection rejects a
  transfer at the selected block, that one test is reported skipped rather than
  treating transferability as established;
- direct real-collection verification that `ownerOf(type(uint256).max)` reverts,
  followed by game preview/action rejection for the same independently checked
  absent ID.

Every Foundry test begins from its own isolated state snapshot. The simulated
transfer cannot alter Monad mainnet or the token's actual ownership.

## WSL execution

Use a trusted read-only Monad RPC endpoint; never place a private key in the
environment or repository.

```sh
cd /home/temitope/chog-survivor
export MONAD_RPC_URL='https://rpc.monad.xyz'
forge test --match-contract MonadForkIntegrationTest -vv
```

If the endpoint is unavailable, preserve the exact RPC/DNS error and leave this
assessment BLOCKED. A successful run is still point-in-time evidence: collection
code, ownership, transferability, and behavior can change at later blocks.

## Local verification result

With `MONAD_RPC_URL` absent, Codex-local commands completed successfully:

```sh
forge fmt --check
forge build --offline
forge test -vv
```

The local run reported 33 passed, 0 failed, and 6 skipped. The six skipped tests
are exactly the `MonadForkIntegrationTest` cases, each with reason
`MONAD_RPC_URL is not set; Monad fork suite not run`. They are not treated as
executed fork evidence.

## Limitations and release review

The suite validates runtime behavior at the fork block, not source provenance,
upgrade/governance posture, marketplace behavior, or an exhaustive token sample.
It does not prove the collection is immutable, nor does it eliminate the game
contract's documented dependence on the canonical collection's `ownerOf`
availability and semantics. The dynamically resolved owner can change after the
fork block; ERC-721 support, absence of `type(uint256).max`, and transferability
were checked only at that fork state. The simulated transfer is a local state
mutation, not evidence of a mainnet transaction. Human review is required before
release.

# Chog Survivor Stage 2D Task 8A security review

## Scope and methodology

Reviewed `src/ChogSurvivor.sol` against `SPEC.md`, `GAME_RULES.md`, `SECURITY.md`,
`BALANCE_REPORT.md`, and the Foundry unit, achievement, reference-model, fuzz, and
invariant suites. This is a repository review, not an independent third-party audit.
No production source, deployment configuration, or rules were modified.

`slither` and `solhint` were checked with `command -v`; neither executable is installed.
They were not installed and no static-tool pass is claimed. Consequently there are no
raw Slither/Solhint findings to preserve. Foundry compiler lint warnings are recorded
below separately and are not security findings.

## Public/external surface review

| Surface | Evidence | Review result |
|---|---|---|
| Constructor / collection binding | `src/ChogSurvivor.sol:79-81` | Fixed nonzero canonical address assigned to an immutable; no constructor input, owner, proxy, upgrade, pause, withdrawal, payable, fallback, or receive path. |
| `characterOf` | `83-85` | Reads token-keyed history without ownership gating. This is consistent with noncustodial public history and permits retained history inspection after a burn. |
| `eventFor` | `87-89` | Deterministic keccak schedule is bounded to 1..6. No caller entropy or external dependency. |
| `preview` | `91-99` | Validates choice, uses canonical `ownerOf` for existence, and invokes the same private resolver as action. Same-day result is status-only at `156-164`. |
| `act` | `101-137` | Requires `msg.sender == ownerOf(tokenId)`, blocks a duplicate `(tokenId, day)`, commits all state before logs, saturates counters, and emits badge bits in ascending order. Approvals/operators are not consulted. |
| `titleOf` | `139-141` | Purely derives title from stored state; its availability for nonexistent IDs is not an authorization path or asset action. |

## Findings

### Critical / High / Medium

No confirmed Critical, High, or Medium vulnerability was identified in the reviewed
source and tests.

### Low — canonical collection availability is a fixed dependency

`act` and `preview` call `CHOG_GENESIS.ownerOf` at `97` and `103`. If the canonical
collection reverts, is paused, ceases to provide `ownerOf`, or is replaced through a
feature outside this contract, gameplay becomes unavailable. This is a realistic
availability dependency, but not a privilege-escalation vulnerability in this contract:
the address is immutable and the MVP intentionally trusts that collection.

Recommendation: before deployment, independently verify canonical collection code,
upgradeability/governance posture, and `ownerOf` behavior on the target chain. Treat a
collection migration or upgrade as a release blocker because this immutable game cannot
be repointed.

### Low — validator-selected timestamp within protocol tolerance affects day selection

The day is `uint64(block.timestamp / DAY)` at `98` and `106`. A block near UTC midnight
can be included on either adjacent valid timestamp side, affecting the deterministic
event, one-action-per-day check, and streak boundary. This is the documented timestamp
model, not hidden randomness.

Recommendation: disclose UTC-boundary behavior to players; do not use this game for
wagering or time-critical commitments. No rule change is recommended by this review.

### Informational — malicious/nonstandard ERC-721 behavior

`ownerOf` is the only external call. Because it is declared `view`, Solidity uses a
`STATICCALL` in `preview`/`act`; a malicious implementation cannot persist state or
successfully reenter a state-changing `act` through that static context. It can return
an arbitrary owner or revert. The former is inherent in trusting the canonical NFT;
the latter is the availability finding above. A normal ERC-721 approval or
`setApprovalForAll` has no effect because authorization compares the returned owner to
`msg.sender` at `104`. Contract-wallet owners remain supported.

The mock-backed tests explicitly cover approved spender/operator rejection, transfer
history retention, smart-wallet ownership, burned/nonexistent tokens, and no logs/state
change on rejected calls.

### Informational — arithmetic, storage, and event integrity

- The consecutive predicate uses subtraction guarded by `day > lastActionDay`
  (`167-169`), avoiding `lastActionDay + 1` overflow.
- XP and attribute results are calculated signed then clamped (`186-191`); counter,
  streak, Unmarked, and gate additions saturate (`122-127`, `222-231`, `275-280`).
- The packed `CharacterView` and nested mapping layout were independently inspected and
  exercised using verified test-only slots; no storage collision was found.
- State is committed before `AdventureResolved` and `AchievementEarned` logs
  (`112-134`). The latter loop is fixed at eight iterations and therefore bounded;
  ascending IDs follow directly from loop order.
- The reference model checks preview/action/log equivalence under fuzzed multi-day,
  transfer, skipped-day, repeated-outcome, and simultaneous-achievement sequences.

### Informational — lint warnings

Foundry reports unchecked-cast advisories around the timestamp-to-`uint64` conversion
(`98`, `106`) and clamp casts (`266`, `272`), plus test-only timestamp/cast advisories.
The explicit tests cover maximum stored days and clamp boundaries. They are warnings,
not static-analysis findings or confirmed overflow vulnerabilities.

## 365-day result reconciliation

There is no simulation-model mismatch demonstrated by the available evidence.

The older core test deliberately uses *three different token IDs*: cautious token 7001,
reckless 7002, compassionate 7003 (`test/ChogSurvivor.t.sol:237-248`). It reports
7,809 / 11,607 / 7,586 XP respectively. `BALANCE_REPORT.md` reports all three policies
for token 1425, yielding 7,861 / 10,931 / 7,482 XP. The choice arrays are the same
documented cautious/reckless/compassionate arrays in both locations; the differing
deterministic `(tokenId, day)` event schedules change row frequencies and therefore
totals. The standalone simulator has a 7001 cautious anchor of 7,809 XP, Trust 100,
Scars 19 (`test/BalanceAnalysis.t.sol:183-186`), matching the older result.

The differing comparison population (one ID per policy versus one common ID for all
policies) is a presentation/fairness limitation, not a contract discrepancy. Future
balance reports should aggregate the same token-ID sample for every policy.

## Release blockers and limitations

1. **Blocker before production:** verify the actual canonical collection on the target
   chain, including code, `ownerOf`, and upgrade/governance behavior. This review used
   `vm.etch` mocks, not a live-chain check.
2. **Blocker before production:** human approval of the documented reckless-XP versus
   Trust/Scar/title trade-off. The balance report is heuristic, not an exhaustive search.
3. Static analyzers were unavailable; run pinned Slither and Solhint versions in CI or
   a controlled audit environment before release.

Subject to those blockers, the reviewed contract has **no confirmed code-security
finding requiring a rule or implementation change**.

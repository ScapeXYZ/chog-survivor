# Foundry coverage and test-gap review (Stage 2D Task 8C)

## Commands and scope

```sh
# Production-only coverage: excludes test and helper source files.
forge coverage --exclude-tests --report summary --report lcov --report-file lcov.info --no-match-contract ChogSurvivorInvariantTest

# Default invariant campaign is validated separately; coverage instrumentation makes it slow.
forge test --match-contract ChogSurvivorInvariantTest -vv
forge fmt --check && forge build --offline && forge test -vv
```

Foundry disables optimizer and viaIR for source-map accuracy during coverage. Thus coverage
gas figures are not comparable to normal optimized test gas. `lcov.info` is generated locally
and is not a source-controlled release artifact.

The LCOV summary below is **only** `src/ChogSurvivor.sol`; test contracts, mocks, standalone
models, and helpers are excluded from both numerator and denominator.

| Metric | Covered | Total | Percentage |
|---|---:|---:|---:|
| Lines | 138 | 138 | 100.00% |
| Statements | 177 | 178 | 99.44% |
| Branches | 38 | 39 | 97.44% |
| Functions | 20 | 20 | 100.00% |

## Uncovered production branch

The only uncovered branch is `src/ChogSurvivor.sol:264`: `_clampXp(value <= 0)`.

Classification: **unreachable under approved game invariants**. Stored XP is unsigned and
nonnegative. The smallest possible requested XP change from the approved table is +9; the
only negative modifiers are compassionate low-Trust (-2) and repeated outcome (-3), leaving
at least +4 XP. Streak XP is nonnegative. Therefore an actionable, valid documented state
cannot make `priorXp + xpChange <= 0`. The branch remains prudent defensive code for a future
rule change or altered storage, but adding `vm.store` corruption solely to increment coverage
would not test approved behavior.

Every other branch, including both counter saturation guards, same-day status, authorization
revert, all modifier threshold directions, clamp upper bounds, title precedence, Unmarked
qualification/reset, and badge loop paths, was executed.

## Specification-to-test traceability

| Requirement area | Direct evidence |
|---|---|
| Canonical immutable address; day zero; event hash and boundaries | `ChogSurvivor.t.sol:testCanonicalAddressAndDayZeroFirstAction`, `testEventFormulaAndBoundary` |
| 18 outcomes, base table, actionable preview/action parity | `testAllBaseOutcomesAndPreviewMatchesAction`; `ReferenceModel.t.sol:testReferenceModelThirtyDaySequence` |
| Current owner only; approvals/operators; transfers; contract wallets; burns | `ChogSurvivorAchievements.t.sol:testApprovalsOperatorsTransfersAndContractWalletAuthorization`; `ChogSurvivor.t.sol:testTransferBeforeActionBurnAndSmartWalletOwnership` |
| UTC replay and failed-call state/log invariance | `testAuthorizationTransferAndSameDayStatus`, `testExactResolutionLogAndFailedCallDoesNotMutate`; seeded reference sequences |
| Trust/Scars/streak/repeat/skip/uint64 boundaries | `ReferenceModel.t.sol:testExplicitTrustAndScarBoundaries`, `testStreakAndExtremeDayBoundaries`, `testReferenceModelRepeatOutcomeAfterSkippedDays` |
| XP and uint32 counter saturation | `testXpCapEffectiveDeltaAndTitlePrecedence`, `testOutcomeCountUint32SaturatesThroughAct`, `testEventCountUint32SaturatesThroughAct` |
| All achievements, ordering, transfer persistence | all `ChogSurvivorAchievements.t.sol` tests, especially `testMultipleAchievementsEmitAscendingThenCannotReplayAfterTransfer` |
| Unmarked lifecycle and 100-Scar cap | `testUnmarkedWeekSevenRiskFreeActionsAndNoDuplicate`, `testPositiveScarRequestBelowCapResetsUnmarkedWeekAndSkippedDayRestartsIt`, `testPositiveScarRequestAtCapResetsUnmarkedWeek`, `testZeroAndNegativeScarRequestsQualifyAtCap`, `testUnmarkedWeekPersistsAfterLaterRiskyAction` |
| Exact event ABI/data/topics | `testExactResolutionLogAndFailedCallDoesNotMutate`; reference model `_assertLogs` and simultaneous-achievement test |
| Stateful fuzz/transfer/token isolation | `testFuzzSeededInterleavedReferenceSequences`, `testSeededInterleavedReferenceSequences` |
| Stored bounds and monotonic badges | `ChogSurvivorInvariant.t.sol:invariant_allStoredBoundsAndMasksHold` (256 runs / 128,000 calls in default suite) |
| Fixed-policy and independent balance checks | `testDeterministicBalanceSimulation`; `BalanceAnalysis.t.sol:testStandaloneBalanceAnalysis` |

## Remaining gaps

- No live-chain integration check has been run in this task; the target canonical collection,
  chain ID, and `ownerOf(1425)` remain deployment-release checks.
- The default invariant campaign does not contribute to the LCOV number above because coverage
  instrumentation was run with that slow suite excluded. It is run in the normal full suite.
- Static analyzers Slither and Solhint are unavailable locally; see `SECURITY_REVIEW.md`.
- Balance analysis is heuristic and not an exhaustive optimizer.

No small high-value test was added: the sole uncovered branch is unreachable in approved
gameplay, and existing tests already cover every reachable production source branch.

## Assessment

**CONDITIONAL PASS.** Local production coverage is strong and no reachable uncovered branch
was found. Release remains conditional on the target-chain, static-analysis, source-verification,
and human balance-approval blockers already recorded in the security and ABI reviews.

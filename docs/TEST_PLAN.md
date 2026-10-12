# Test plan (post-approval implementation)

This plan reflects the implemented Foundry unit, fuzz, invariant, reference-model,
balance, achievement, and read-only fork tests. They never broadcast.

## Required coverage

- Constructor fixes the exact collection address with no collection-address parameter and exposes no admin or payable route. Foundry tests install mock ERC-721 runtime code with `vm.etch` at that canonical address and initialize its storage there; production code has no test-only injection hook.
- Current owner succeeds for all 18 outcomes; nonowner, approval/operator, former owner, and nonexistent token fail.
- Every base reward and outcome ID matches the table. Test all modifier boundaries: Trust 34/35/69/70, Scars 19/20, streak 0/1/7/8/254/255, repeat result, skipped day, and each clamp.
- Test `floor(timestamp / 86_400)` immediately either side of every boundary; duplicate daily action fails.
- Test first action on day zero and later days: it has no streak bonus and sets streak to 1. Test overflow-safe consecutive-day detection at extreme `uint64` stored days without evaluating `lastActionDay + 1`; test streak, XP, outcome-count, and event-count saturation without wrapping.
- Transfer after action blocks recipient that day; transfer before action permits recipient; transfer never changes character history.
- Test a burned/nonexistent token's `ownerOf` failure for preview and act, retained state non-actionability, EOA owners, and smart-contract-wallet owners. Confirm approvals/operators and former owners cannot act.
- Test every achievement threshold, Pathfinder mask, strict title precedence, counter saturation, and one-time badge logs across transfers. For Unmarked Week, test seven qualifying consecutive actions with non-positive post-modifier, pre-clamp requested Scar delta, first-action initialization, positive requested Scar reset below and at the 100-Scar cap, missed-day reset, saturation at 7, cap-safe zero/negative requests, and persistence after later risky actions.
- Test same-day preview as a non-actionable status: valid requested IDs, zero deltas/new achievement bits, current `*After` values/title, no logs; invalid IDs still fail and `act` fails.
- Decode and compare `AdventureResolved`/`AchievementEarned` topics and data against the specified ABI.

## Properties and release gates

- For arbitrary actionable valid state/day/choice, preview immediately before action equals action return and decoded log, including actual post-clamp signed deltas and newly earned achievements. Assert explicitly that no such equivalence is promised for same-day non-actionable previews.
- `eventFor` follows the hash formula and remains 1–6. Long fuzzed action/transfer sequences preserve bounds, one action per token/day, monotonic achievements, and token-keyed history.
- A reference model of the reward pipeline agrees after arbitrary actions, including effective deltas (`after - before`), day-zero handling, saturating arithmetic, and Unmarked Week. Assert no asset balance change and no asset transfer/approval selector.
- A read-only Monad integration check confirms collection code and `ownerOf(1425)`; it must not transact.
- Require formatter/compiler checks, static analysis where available, ABI snapshot, independent review, source verification plan, and manual constructor-bytecode inspection before release.

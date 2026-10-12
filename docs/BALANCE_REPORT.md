# Chog Survivor balance analysis (Stage 2C Task 7)

## Scope and reproducibility

This is a deterministic, test-only analysis of the approved rules, not a claim of
playtesting or of an optimum strategy. The independent simulator is
[`test/BalanceAnalysis.t.sol`](../test/BalanceAnalysis.t.sol). It has its own reward
table, tag table, clamps, title calculation, achievement calculation, and event hash;
it neither imports nor calls `ChogSurvivor`.

Run it with:

```sh
forge test --match-contract BalanceAnalysisTest -vv
forge test -vv
```

The event schedule uses the fixed collection address and representative token IDs 1,
1425, and 777777. Horizons are 30, 90, and 365 UTC calendar days. The runner accepts
`_run(tokenId, horizon, policy)`; it is deliberately bounded to three representative
adaptive runs in one EVM test because Solidity test memory is monotonically allocated
for copied array-bearing state. Each individual run is deterministic and has no seed.

## Strategies

| Policy | Selection rule |
|---|---|
| Cautious | Documented low-scar row for each event. |
| Reckless / greedy XP | Highest base-XP row for every event; these coincide. |
| Compassionate | Documented Trust-heavy row for each event. |
| Adaptive | Compassionate while Trust <75; greedy while Scars <25; cautious thereafter. |
| Mythic preserving | Cautious route throughout. |
| Achievement focused | Build Bridge/Gate/Scars, then take cautious rows while Unmarked progress is below seven. |
| Wait for event 6 | Skip every non-Shadow-Beast day and take choice 3 on event 6. |

These are fixed heuristic policies, not a global search. No beam-search optimality is
claimed. The pruning assumption is that a policy has only the state inputs described
above; it does not branch on unbounded historical paths. The separate seeded reference
model fuzzing covers random state transitions, transfers, and skipped days.

## Results

Representative observed outputs (token 1425; `XP/action` is XP divided by actions and
`XP/calendar` is XP divided by horizon) are below. Title IDs: 1 Scarred Pathfinder,
2 Trusted Trailblazer, 3 Mythic Survivor.

| Horizon | Policy | XP | Trust | Scars | Title | Badges | Actions | Longest streak | Mythic day |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 30 | Cautious | 627 | 100 | 4 | 3 | 6 | 30 | 30 | 24 |
| 30 | Reckless/greedy | 871 | 0 | 100 | 1 | 5 | 30 | 30 | — |
| 30 | Compassionate | 556 | 100 | 37 | 2 | 6 | 30 | 30 | — |
| 30 | Adaptive | 639 | 100 | 28 | 2 | 7 | 30 | 30 | 26 |
| 30 | Mythic preserving | 627 | 100 | 4 | 3 | 6 | 30 | 30 | 24 |
| 30 | Wait event 6 | 123 | 0 | 39 | 0 | 1 | 5 | 1 | — |
| 90 | Cautious | 1,908 | 100 | 11 | 3 | 6 | 90 | 90 | 24 |
| 90 | Reckless/greedy | 2,664 | 0 | 100 | 1 | 5 | 90 | 90 | — |
| 90 | Compassionate | 1,793 | 100 | 100 | 1 | 6 | 90 | 90 | — |
| 90 | Adaptive | 1,983 | 100 | 26 | 2 | 7 | 90 | 90 | 26 |
| 90 | Wait event 6 | 268 | 0 | 93 | 0 | 1 | 11 | 2 | — |
| 365 | Cautious | 7,861 | 100 | 19 | 3 | 6 | 365 | 255 | 24 |
| 365 | Reckless/greedy | 10,931 | 0 | 100 | 1 | 5 | 365 | 255 | — |
| 365 | Compassionate | 7,482 | 100 | 100 | 1 | 6 | 365 | 255 | — |

For token 1 at 365 days, the same ordering held: cautious 7,865 XP / 19 Scars,
reckless 10,955 XP / 100 Scars, compassionate 7,610 XP / 100 Scars, adaptive 8,202
XP / 25 Scars, and event-6 waiting 1,571 XP over 65 actions. Thus waiting has a low
calendar-day return (~4.3 XP/day) despite about 24.2 XP/action; uninterrupted reckless
play is about 30 XP/day. Token-ID schedule variation changed results modestly, not the
conclusion.

## Findings

- Reckless/greedy is the clear XP maximizer among the examined policies: roughly 39%
  more 365-day XP than cautious for token 1425, at permanent Trust collapse and Scar cap.
- Cautious is a strong Mythic route: it reaches Mythic around day 24 and retains it at
  day 365, while producing about 72% of reckless XP.
- The adaptive threshold policy improves Mythic-compatible XP versus cautious on token
  1 (8,202 versus 7,865) but is brittle: token 1425 finishes at 26 Scars and loses
  Mythic. This is a useful warning against treating a simple threshold heuristic as an
  optimal management strategy.
- Unmarked Week uses the approved risk-free-action rule: a positive post-modifier,
  pre-clamp requested Scar delta never qualifies, including at Scars 100 where the
  effective logged delta can be zero. The dedicated lifecycle tests verify this
  behavior. This removes the former Scar-cap badge shortcut; it is a gameplay rule,
  not a contract defect.
- In these simple policies, all eight achievements were not reached within 365 days;
  achievement-focused play needs more deliberate sequencing, so no badge appears
  trivially automatic. The cautious route reliably reaches six badges; reckless reaches
  five because it forfeits Trust/Unmarked-oriented progress.

## Recommendation

**KEEP RULES for the current approval stage; do not silently tune rewards.** The XP
gap is material and should be accepted explicitly before production because the design
intentionally trades XP for Trust/Scars/title paths. If human review decides that the
gap is too large, the smallest justified experiments are the already documented ones:
reduce a particular reckless row by 1–2 XP or add one Scar to that row, rather than a
global modifier. The Scar-cap interpretation has been decided: Unmarked Week tracks
risk-free requested Scar changes, not merely post-clamp stored-state change.

Unresolved limits: this is not an exhaustive dynamic program, does not prove strategy
dominance, and does not model player utility for titles or badges. No deployment,
broadcast, or live-chain query was used.

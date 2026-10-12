# Unmarked Week at the Scar Cap — Tasks 8G.3–8G.4

Status: **APPROVED AND IMPLEMENTED — Interpretation B, risk-free action.**
Human approval requires a positive post-modifier, pre-clamp Scar request to
reset Unmarked Week even when stored Scars is already 100. Deterministic
events/strategic waiting and existing XP/title progression remain accepted and
unchanged.

## Historical analysis: former actual-post-clamp rule

Before Task 8G.4, the implementation used Interpretation A. In `_resolve`, the requested
base Scar delta is loaded at
[ChogSurvivor.sol:166](../src/ChogSurvivor.sol#L166), the high-Scar tag modifier
is applied at [180-183](../src/ChogSurvivor.sol#L180), and the result is clamped
to `[0,100]` at [188](../src/ChogSurvivor.sol#L188). The contract then derives
the public/effective `scarsDelta` from final state at [191](../src/ChogSurvivor.sol#L191),
not from the requested delta.

The Unmarked predicate is exactly:

```solidity
if (result.scarsAfter <= prior.scars) {
    result.unmarkedStreakAfter = consecutive
        ? _incrementByte(prior.unmarkedStreak, 7)
        : 1;
}
```

at [193-195](../src/ChogSurvivor.sol#L193). Otherwise the zero-initialized
result resets the counter. `_earned` sets badge bit 7 once that final streak is
at least 7 at [219](../src/ChogSurvivor.sol#L219). Thus:

- **attempted/requested Scar delta** is the pre-clamp `scarsChange` after the
  outcome and tag modifiers; and
- **actual/effective Scar delta** is `scarsAfter - prior.scars`, reported as
  `scarsDelta`.

At prior Scars 100, any positive requested amount clamps back to 100, giving an
actual/effective delta of zero. Under the former predicate it qualified. This
was not an arithmetic overflow or static-analysis vulnerability.

The independent reference and balance models formerly matched this rule: they clamp at
[ReferenceModel.t.sol:288](../test/ReferenceModel.t.sol#L288) and evaluates
`n.scars <= m.scars` at [290](../test/ReferenceModel.t.sol#L290). The balance
model uses the same final-state predicate at
[BalanceAnalysis.t.sol:113](../test/BalanceAnalysis.t.sol#L113).

## Interpretation comparison

| Interpretation | Qualification predicate | At Scars 100 after a reckless action requesting positive Scars | Meaning |
|---|---|---|---|
| A — current actual-damage rule | `scarsAfter <= priorScars` | Qualifies: final Scars stay 100; effective delta is 0. | “No additional actual Scar damage today.” |
| B — risk-free-action rule | The post-modifier, pre-clamp requested Scar delta must be `<= 0` (and action must remain consecutive). | Does not qualify: a positive damage request resets/does not advance Unmarked, even though clamping leaves Scars at 100. | “Choose no Scar-increasing action today.” |

Interpretation B is not an implementation detail of A: it needs a distinct
pre-clamp predicate retained through resolution and mirrored in the reference
and balance models. Merely checking `scarsDelta` cannot implement B because it
is deliberately the effective post-clamp delta.

## Implemented rule: Interpretation B

`src/ChogSurvivor.sol` now tests `scarsChange <= 0` after all outcome/tag
modifiers and before `_clamp100`. The effective public `scarsDelta` and the
Scar cap remain unchanged. The independent reference model and balance model
use their own corresponding pre-clamp requested-delta variables. This is an
approved gameplay-rule revision made before deployment, not an ABI, event,
authorization, title, or asset-accounting change.

## Seven-day scenario analysis

| Starting state and player behavior | A — actual damage | B — risk-free action | Incentive/fairness observation |
|---|---|---|---|
| Scars 0; act seven consecutive days using each event’s no-Scar/Scar-reducing cautious route | Qualifies. Actual Scars do not rise. | Qualifies. Requested Scar change is non-positive. | Both reward deliberate low-risk play; no interpretation difference. Existing lifecycle test covers seven qualifying days. |
| Scars 99; take a positive-Scar action (for example, the current test’s event-1 choice 2) | Does not qualify: final Scars increase to 100, so the run resets. | Does not qualify. | The cap does not help until the token is already exactly at 100. |
| Scars near 100; take seven consecutive cautious/no-Scar choices | Qualifies where each final Scar value is unchanged or reduced. | Qualifies where each requested post-modifier delta is non-positive. | Both preserve an available disciplined route; deterministic events do not prevent it because the player chooses among the daily event’s three outcomes. |
| Scars 100; take seven consecutive reckless, positive-Scar choices | Qualifies. Every requested increase clamps to 100, so every effective delta is zero. | Does not qualify; each positive requested delta prevents or resets progress. | A permits intentional cap exploitation for the badge; B preserves the badge as a risk-avoidance signal. |
| Scars 100; take seven consecutive non-positive-request choices | Qualifies. | Qualifies. | B does not make the badge impossible at the cap; it changes the required action selection. |

The cap strategy under A is controllable rather than dependent on waiting: after
reaching 100, the player can act every UTC day and choose positive-Scar,
typically higher-XP reckless outcomes. It still carries the prior cost of Scar
cap/Trust/title trade-offs, but it makes the **Unmarked** badge semantically
counterintuitive if players read it as risk-free play. Under B, a cap player can
still earn the badge, but must use the event-appropriate non-positive Scar
choice for seven uninterrupted days; this restores a visible choice cost.

Neither result is a technical exploit of assets, authorization, or accounting.
They are different achievement semantics and incentives. Interpretation A favors
the strict “actual damage” reading and consistency with all effective-delta
reporting. Interpretation B favors the achievement name’s ordinary
“risk-free-action” reading and reduces the cap incentive.

## Historical consistency and completed test impact

The pre-approval code and documentation were internally consistent with A:

- [GAME_RULES.md:49](GAME_RULES.md#L49) expressly says clamping makes a
  requested increase qualify; its badge table repeats the final-state predicate
  at [line 64](GAME_RULES.md#L64).
- [SPEC.md:61](SPEC.md#L61) defines reported deltas as effective post-clamp
  values, consistent with the code.
- [BALANCE_REPORT.md:81-84](BALANCE_REPORT.md#L81) calls the Scar-cap result
  intentional but gameable.
- `testUnmarkedWeekCountsClampedPositiveScarRequestAtCap` at
  [ChogSurvivorAchievements.t.sol:481-503](../test/ChogSurvivorAchievements.t.sol#L481)
  explicitly seeds `(Scars, unmarkedStreak) = (100, 6)`, takes an action that
  requests `+5` plus the high-Scar modifier, and asserts effective delta 0,
  streak 7, and badge bit 7. The reset/gap tests at [452-479](../test/ChogSurvivorAchievements.t.sol#L452)
  and reference-model equality checks cover the broader lifecycle.

No frontend or separate UI achievement-description string is present in this
repository. The UI-facing phrase “Unmarked Week” by itself is ambiguous: it can
mean no actual new marks (A) or no mark-risking choices (B). The normative
`GAME_RULES.md` text resolves the ambiguity today in favor of A, but any player-
facing copy should state the selected predicate rather than rely on the title.

The approved B change has replaced the cap test with a reset/non-qualification
assertion, added zero/negative-at-cap and post-unlock-persistence coverage, and
updated the normative rules, specification, test plan, balance model/report, and
reference model. Existing stored progress and already emitted badges would make
this semantic change incompatible after deployment without a new contract or an
explicit migration policy.

## Decision record

Human approval selected **Interpretation B, risk-free action**. Unmarked Week
means seven consecutive daily actions with a non-positive post-modifier,
pre-clamp requested Scar delta. A Scar-capped token may still earn it through
safe choices, but cannot earn it by selecting positive-Scar actions whose stored
increase is hidden by clamping.

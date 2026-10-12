# Chog Survivor game rules (MVP approval draft)

## Daily loop

A UTC day is `floor(block.timestamp / 86_400)`: it starts at `day * 86_400` and ends immediately before `(day + 1) * 86_400`. There is no season reset. A token resolves at most one event per day; waiting/skipping is allowed and breaks its streak. The event is deterministic for `(collection, tokenId, day)`, so an actionable preview and action agree at the same state and period.

`eventId = uint8(uint256(keccak256(abi.encodePacked(CHOG_GENESIS, tokenId, day))) % 6) + 1`.

Choice IDs are 1–3. `outcomeId = (eventId - 1) * 3 + choiceId`; this uniquely and permanently maps 1–18. Tags are modifier categories, not hidden outcomes.

## Outcomes and base rewards

Each delta is `(XP, Trust, Scars)`. XP, Trust, and Scars represent different paths rather than a single score. There is no random reward, rarity multiplier, metadata trait, wallet multiplier, or hidden branch.

| Event (ID) | Choice (ID) / outcome ID | Tag | Base delta |
|---|---:|---|---:|
| Broken Bridge (1) | Reinforce (1) / 1 | cautious | +12, +5, 0 |
|  | Leap the gap (2) / 2 | reckless | +22, -2, +5 |
|  | Guide others around (3) / 3 | compassionate | +9, +9, +1 |
| Hungry Stranger (2) | Share rations (1) / 4 | compassionate | +10, +10, 0 |
|  | Question them (2) / 5 | cautious | +15, +2, +1 |
|  | Drive them away (3) / 6 | reckless | +19, -6, +3 |
| Midnight Storm (3) | Hold the shelter (1) / 7 | cautious | +13, +3, 0 |
|  | Rescue a call (2) / 8 | compassionate | +17, +8, +3 |
|  | Run through it (3) / 9 | reckless | +24, -3, +6 |
| Ancient Gate (4) | Solve the runes (1) / 10 | cautious | +18, +4, 0 |
|  | Open it for all (2) / 11 | compassionate | +12, +11, +1 |
|  | Force the seal (3) / 12 | reckless | +26, -4, +5 |
| Lost Chog (5) | Lead them home (1) / 13 | compassionate | +11, +12, +1 |
|  | Mark a safe path (2) / 14 | cautious | +16, +5, 0 |
|  | Chase the distant cry (3) / 15 | reckless | +23, -1, +4 |
| Shadow Beast (6) | Set a ward (1) / 16 | cautious | +17, +3, 0 |
|  | Distract it away (2) / 17 | compassionate | +14, +9, +2 |
|  | Face it head-on (3) / 18 | reckless | +27, -5, +7 |

## History-dependent modifiers

Apply these, in order, to every base row:

1. An action is consecutive only when `hasActed` is true, `day > priorLastActionDay`, and `day - priorLastActionDay == 1`; use this subtraction form, never `priorLastActionDay + 1`, to avoid arithmetic overflow. A consecutive action adds `min(priorStreak, 7)` XP and sets streak to saturating `min(priorStreak + 1, 255)`. Any nonconsecutive action (including the first action) adds zero streak XP and sets streak to 1. Thus a first action on day zero is valid, has streak 1, and earns no streak bonus. `hasActed`, rather than `lastActionDay == 0`, identifies that first action.
2. For compassionate choices, add +2 XP at prior Trust ≥70 and -2 XP below 35. For reckless choices, add +2 XP below 35 and -2 XP at Trust ≥70. Cautious choices receive zero.
3. At prior Scars ≥20, reckless choices add +2 Scars and cautious choices subtract 1 Scar. Compassionate choices receive zero.
4. If the immediately preceding action used this exact `outcomeId`, subtract 3 XP; otherwise zero. This remains applicable after skipped days.

Use signed intermediate arithmetic for rewards, then clamp XP to `[0, 1,000,000,000]` and Trust/Scars to `[0,100]` before casting to storage widths. `xp`, outcome counters, and event counters use saturating additions: XP caps at 1,000,000,000 and `uint32` counters cap at `type(uint32).max`; they never wrap. Streak is a saturating `uint8` value capped at 255. The returned and logged signed deltas are the actual post-clamp differences (`after - before`), not pre-clamp requested deltas. No other history-dependent modifier exists.

## Unmarked Week

An action qualifies only when its post-modifier, **pre-clamp requested Scar delta** is non-positive. Seven qualifying **consecutive daily actions** earn Unmarked Week. On the first action, a qualifying result starts `unmarkedStreak` at 1. On a later action, increment it only if the action is consecutive under the same overflow-safe day test above and it qualifies. Any positive requested Scar increase resets it to 0, even if Scars is already 100 and storage clamping makes the effective applied delta zero. A gap resets the run: the next qualifying action starts at 1, and the next risky action is 0. `unmarkedStreak` saturates at 7; further consecutive qualifying actions leave it at 7. It is an achievement-progress counter, not a measure of total scar-free days.

## Achievements and titles

Permanent badges, set after clamping:

| Bit | Badge | Exact criterion |
|---:|---|---|
| 0 | First Light | First resolved event. |
| 1 | Bridge Builder | Outcome 1 resolved three times total. |
| 2 | Kindred Spirit | Trust reaches 80. |
| 3 | Stormforged | Scars reaches 30. |
| 4 | Gatekeeper | Any Ancient Gate outcome (10–12) resolved three times total. |
| 5 | Pathfinder | Each event ID resolved at least once. |
| 6 | Seven Suns | Streak reaches 7. |
| 7 | Unmarked Week | `unmarkedStreak` reaches 7: seven consecutive daily actions with non-positive post-modifier, pre-clamp requested Scar delta. |

One title is derived, never stored, using this strict precedence: `Mythic Survivor` (XP ≥500, Trust ≥75, Scars ≤25); else `Trusted Trailblazer` (Trust ≥70, Scars ≤45); else `Scarred Pathfinder` (XP ≥300, Scars ≥25); else `Wandering Chog`. Exactly one title ID is returned for every state; achievement emission does not depend on title changes.

## Dominant-strategy and balance review (analytical; no playtesting)

The table below audits every choice against its two alternatives. “Trade-off” identifies why it is not strictly dominant in the stated state, rather than claiming an observed play result.

| Outcome | Trust/Scars-bound and long-horizon trade-off |
|---:|---|
| 1 Reinforce | Low XP but +5 Trust/no Scars; protects Mythic and Unmarked progress. |
| 2 Leap | Strong XP, especially Trust <35, but -Trust/+Scars; at Scars ≥20 adds another Scar. |
| 3 Guide | Highest Bridge Trust (+9) but low XP and +1 Scar; at Trust <35 it loses 2 XP. |
| 4 Share | Best Hungry trust/no Scar route; gives up 5 XP to Question and 9 XP to Drive. |
| 5 Question | Middle XP with +1 Scar and modest Trust; a flexible compromise, not a specialist. |
| 6 Drive | XP lead but -6 Trust/+3 Scars, worsened at Scars ≥20; conflicts with high-Trust titles. |
| 7 Hold | Low-risk Storm option; Rescue buys +4 XP/+5 Trust for +3 Scars. |
| 8 Rescue | Trust-efficient but +3 Scars; at high scars it threatens both Unmarked and Mythic constraints. |
| 9 Run | Storm XP maximum, boosted at low Trust, but -3 Trust/+6 Scars (+2 at Scars ≥20). |
| 10 Solve | Gate XP-focused low-scar option; sacrifices 7 Trust to Open. |
| 11 Open | Gate Trust maximum for -6 XP/+1 Scar; assists Trust titles but may block Unmarked. |
| 12 Force | Gate XP maximum but -4 Trust/+5 Scars (+2 at Scars ≥20); poor for capped-scar titles. |
| 13 Lead | Lost Chog Trust maximum, with +1 Scar and 5 XP below Mark. |
| 14 Mark | Moderate XP/+5 Trust/no Scar; safely advances low-scar long-horizon goals. |
| 15 Chase | XP lead but -1 Trust/+4 Scars (+2 at Scars ≥20); pressure rises over time. |
| 16 Ward | Beast low-scar XP option; Distract trades 3 XP and +2 Scars for +6 Trust. |
| 17 Distract | Trust-heavy Beast option but +2 Scars and lower XP; cannot strictly dominate Ward. |
| 18 Face | Overall base XP maximum but -5 Trust/+7 Scars (+2 at Scars ≥20), strongly at odds with Mythic. |

At Trust ≥70, compassionate choices gain 2 XP while reckless choices lose 2; below 35 the reverse applies. At Scars ≥20, cautious choices remove one Scar while reckless choices gain two, making cautious options comparatively stronger for scar-constrained long horizons. Repeat-outcome -3 XP prevents immediate repetition from being free, but does not prevent choosing the same tag across events. Skipping permits event selection only by forgoing the next consecutive-day bonus; it does not reset Trust, Scars, counters, achievements, or repeat history.

No numerical change is recommended before simulation: each row retains a visible XP, Trust, Scars, or title-path cost. This is not a claim that balance has been validated. Outstanding simulation questions are whether reckless XP advantages overwhelm scar costs before titles matter, whether cautious high-scar Scar reduction makes Unmarked Week too reliable, whether compassionate XP penalties below Trust 35 create a recovery trap, and how often deterministic event waiting is rational despite the streak loss. If simulation finds a material dominance pattern, the smallest candidate adjustments are a 1–2 XP reduction to the implicated reckless row, a 1-Scar increase to its base cost, or a 1–2 XP increase to its directly dominated cautious/compassionate alternative—applied only to the measured row, not globally.

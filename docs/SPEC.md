# Chog Survivor contract specification (MVP approval draft)

## Architecture and authority

The MVP architecture is exactly one noncustodial game contract. Its constructor sets immutable `CHOG_GENESIS` to `0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763`. The rules and collection binding are immutable: there is no owner, upgrade proxy, pauser, admin mutation, withdrawal, payable entry point, fallback, or asset accounting. A defect or balance correction requires a separately deployed contract; existing history is not migrated by this MVP.

`act(tokenId, choiceId)` authorizes only `msg.sender == CHOG_GENESIS.ownerOf(tokenId)`. `ownerOf` proves both existence and present ownership; approvals, operators, past owners, and metadata do not authorize. History is keyed only by `tokenId`. Transfers do not migrate, reset, fork, or erase it: a recipient can act immediately only if that token has not acted in the current UTC day.

The canonical period, event formula, reward table, modifier order, badge thresholds, title precedence, and bounds are normative in [GAME_RULES.md](GAME_RULES.md).

## State

Each token has `uint32 xp` (0..1,000,000,000), `uint8 trust` (0..100), `uint8 scars` (0..100), `uint8 streak` (0..255), `uint8 unmarkedStreak` (0..7, saturated), `uint64 lastActionDay`, `uint8 lastOutcomeId` (0..18; zero is none), `uint8 eventMask` (six low bits), `uint256 achievementMask` (bits 0–7 only), and `bool hasActed`. It also has `outcomeCount[1..18]` and `eventCount[1..6]`, each `uint32` and saturating at `type(uint32).max`. `hasActed` distinguishes an action on day zero from no action.

All invalid choice/event/outcome IDs revert; none are coerced. A burned/nonexistent collection token is unavailable because `ownerOf` reverts, although its historical storage remains.

## ABI shape

Names and tuple field order below are ABI commitments:

```solidity
interface IChogSurvivor {
    struct CharacterView {
        uint32 xp; uint8 trust; uint8 scars; uint8 streak; uint8 unmarkedStreak;
        uint64 lastActionDay; uint8 lastOutcomeId; uint8 eventMask;
        uint256 achievementMask; bool hasActed;
    }
    struct Preview {
        uint64 day; uint8 eventId; uint8 choiceId; uint8 outcomeId;
        int32 xpDelta; int16 trustDelta; int16 scarsDelta;
        uint32 xpAfter; uint8 trustAfter; uint8 scarsAfter; uint8 streakAfter;
        uint8 unmarkedStreakAfter; uint256 newlyEarnedAchievementMask;
        uint256 achievementMaskAfter; uint8 titleId; bool canAct;
    }
    function CHOG_GENESIS() external view returns (address);
    function characterOf(uint256 tokenId) external view returns (CharacterView memory);
    function eventFor(uint256 tokenId, uint64 day) external view returns (uint8);
    function preview(uint256 tokenId, uint8 choiceId) external view returns (Preview memory);
    function act(uint256 tokenId, uint8 choiceId) external returns (Preview memory);
    function titleOf(uint256 tokenId) external view returns (uint8);
}
```

Title IDs are 0 `Wandering Chog`, 1 `Scarred Pathfinder`, 2 `Trusted Trailblazer`, 3 `Mythic Survivor`. Anyone may preview an existing token, but `preview` must call `ownerOf` so a burned/nonexistent token fails just as an action does. Its stored historical state remains in contract storage after a burn and is not readable through this required ownership-checked preview path.

`preview` validates `choiceId` even when non-actionable. If the token has already acted on the current day, it returns a **non-actionable status**, not a hypothetical next result: `canAct=false`; `day` is the current day; `eventId` and `outcomeId` identify the current event and requested valid choice; all three deltas and `newlyEarnedAchievementMask` are zero; every `*After` value and `achievementMaskAfter` equals current stored state; and `titleId` is derived from that current state. `act` reverts in this case. If `canAct=true`, the preview is actionable and, absent a change of day, character state, or token ownership, it must exactly equal `act`'s return, including achievements and title. Its shared resolution fields must exactly equal `AdventureResolved`, including effective deltas and badge mask. No function accepts a timestamp, entropy, proof, signature, URI, callback, or reward recipient.

## Logs

```solidity
event AdventureResolved(
    uint256 indexed tokenId, address indexed owner, uint64 indexed day,
    uint8 eventId, uint8 choiceId, uint8 outcomeId,
    int32 xpDelta, int16 trustDelta, int16 scarsDelta,
    uint32 xpAfter, uint8 trustAfter, uint8 scarsAfter,
    uint8 streakAfter, uint8 unmarkedStreakAfter, uint256 achievementMaskAfter
);
event AchievementEarned(uint256 indexed tokenId, uint8 indexed achievementId, uint64 indexed day);
```

`xpDelta`, `trustDelta`, and `scarsDelta` in both `Preview` and `AdventureResolved` are signed **effective applied deltas**: `after - before` after all modifiers and final clamping. They are not the requested/pre-clamp table deltas. Unmarked Week deliberately uses a separate internal predicate: its post-modifier, pre-clamp requested Scar delta must be non-positive, so a positive request fails even when the 100-Scar clamp yields `scarsDelta == 0`. Emit exactly one `AdventureResolved` per successful action. Compute newly earned bits against the pre-action mask after all outcome, counter, state, and title-relevant calculations; set those bits and emit one `AchievementEarned` per newly set bit, in ascending bit order. Because bits never clear and state is token-keyed, transfer cannot replay an achievement or its log. Failed calls and previews emit nothing.

## Frozen MVP decisions and remaining approval items

1. The numerical balance is provisional pending simulations. No playtesting is represented or implied by this draft.
2. The collection binding and rules are immutable, with no administrator or upgrade route.
3. Waiting for a favorable deterministic event is allowed; an intervening missed day breaks the streak. This is an intentional transparency trade-off.
4. A token for which `ownerOf` reverts, including a burned token, cannot preview or act. Its token-keyed historical state remains and does not transfer to a replacement token.
5. Approval should focus on the known balance risks recorded in `GAME_RULES.md` and the irreversibility above, then require simulation before a production deployment.

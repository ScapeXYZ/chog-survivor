# Frozen MVP Frontend Blueprint — Task 8H.5

Status: planning only. No frontend implementation, package installation,
deployment, or mainnet game-contract address is approved. Chog Survivor
mainnet deployment remains blocked by the canonical-NFT governance/source gate.

## Product boundary and user disclosure

The game is NFT-native and **token-ID keyed**. Progress, achievements, streaks,
and the same-day lock belong to the numeric Chog Genesis token ID, not a wallet.
They follow an ordinary transfer. Human product approval accepts that, if the
external NFT collection ever burns and reissues the same numeric ID, the
reissued token inherits that existing game history. The UI must say this plainly
where a player selects a token and in the first-use disclosure.

The UI must not claim or imply that it proves Chog Genesis immutability,
governance safety, source verification, non-reuse of token IDs, or permanent
availability. Those properties remain unresolved; see
[CANONICAL_NFT_GOVERNANCE_REVIEW.md](CANONICAL_NFT_GOVERNANCE_REVIEW.md).

## Minimal responsive experience

### Screens and states

1. **Connect / network gate** — Connect an EIP-1193 wallet. Require Monad
   chain ID 143 before enabling reads tied to the selected account or any write.
   On a wrong chain, show the expected network and a wallet-switch request; do
   not silently switch or sign anything.
2. **Choose Chog** — Display discovered eligible IDs when available and always
   offer a numeric manual-ID field. Selection is provisional until the UI calls
   collection `ownerOf(tokenId)` and sees the connected account.
3. **Character dashboard** — Show selected ID, title, XP, Trust, Scars, streak,
   Unmarked streak, achievement progress, last action day/outcome, and a clear
   UTC countdown. Render the selected token ID prominently, not merely the
   wallet address.
4. **Daily encounter** — Show the current event and three choices. For a
   selected choice, run `preview` and render the returned effective XP/Trust/
   Scar deltas, after-values, streaks, newly earned badge bits, and title ID.
   Show `canAct=false` as "already resolved today," never as a failed preview.
   Choice IDs are exactly 1, 2, and 3; labels and explanatory base rewards are
   frozen display content from the event table in `GAME_RULES.md`.
5. **Confirm action** — Recheck account, chain ID, and `ownerOf` immediately
   before presenting the wallet request. Explain that a changed day, ownership,
   or state can invalidate a prior preview. Submit only `act(tokenId, choiceId)`.
6. **Pending / result** — Keep a visible pending state keyed by transaction
   hash. After a confirmed receipt, decode game events when available and
   refetch authoritative state. Show achievements/title from the confirmed
   result, not optimistic local mutation. Provide a retry/refetch control for
   delayed or unavailable receipts.

The layout should be a single-column mobile flow (wallet/network, token picker,
character card, encounter/choices, activity/result) that becomes a two-column
dashboard on larger screens. Choices must have touch-sized controls, plain-text
status/error messages, and no hover-only content.

### UTC countdown

Calculate the display countdown from a current chain timestamp when available,
not only the device clock: `next = (floor(chainTimestamp / 86400) + 1) * 86400`.
Refresh around the boundary, then refetch `characterOf`, `titleOf`, and the
three previews. The countdown is advisory; the contract's `block.timestamp`
and `act` result decide eligibility. Near midnight, warn that a wallet
transaction may be mined in the adjacent UTC day.

## Frozen game-contract ABI surface

Until a separately approved deployment publishes an address and matches the
frozen artifact, the following is an ABI blueprint only. It does **not** supply
an address.

### Reads (`eth_call`)

| Function | Exact signature / result | UI use |
|---|---|---|
| `CHOG_GENESIS` | `CHOG_GENESIS() external view returns (address)` | Confirm the deployed game is bound to the expected canonical collection before enabling it. |
| `characterOf` | `characterOf(uint256 tokenId) external view returns (CharacterView memory)` | Read stored token-ID history. Do not use alone to establish that an NFT currently exists or is owned. |
| `eventFor` | `eventFor(uint256 tokenId, uint64 day) external view returns (uint8)` | Optional display/check of current event; use the day from chain time. |
| `preview` | `preview(uint256 tokenId, uint8 choiceId) external view returns (Preview memory)` | Per-choice actionable/status result. Reverts if collection `ownerOf` reverts. |
| `titleOf` | `titleOf(uint256 tokenId) external view returns (uint8)` | Map IDs 0–3 to the frozen title names. |

`CharacterView` field order is: `xp`, `trust`, `scars`, `streak`,
`unmarkedStreak`, `lastActionDay`, `lastOutcomeId`, `eventMask`,
`achievementMask`, `hasActed`. `Preview` field order is: `day`, `eventId`,
`choiceId`, `outcomeId`, `xpDelta`, `trustDelta`, `scarsDelta`, `xpAfter`,
`trustAfter`, `scarsAfter`, `streakAfter`, `unmarkedStreakAfter`,
`newlyEarnedAchievementMask`, `achievementMaskAfter`, `titleId`, `canAct`.
Signed deltas are effective post-clamp values. Unmarked Week's distinct
pre-clamp requested-Scar predicate is not exposed as a separate ABI field.
Title IDs are exactly 0 `Wandering Chog`, 1 `Scarred Pathfinder`, 2 `Trusted
Trailblazer`, and 3 `Mythic Survivor`.

### Write (`eth_sendTransaction` through the connected wallet)

| Function | Exact signature / result | UI behavior |
|---|---|---|
| `act` | `act(uint256 tokenId, uint8 choiceId) external returns (Preview memory)` | The sole game write. Send only from the connected current `ownerOf(tokenId)` address. A transaction receipt does not expose Solidity return data reliably to a wallet UI; refetch and decode events after confirmation. |

The UI must surface the contract's actual custom-error names when available:
`InvalidChoice(uint8 choiceId)`, `AlreadyActed(uint256 tokenId, uint64 day)`,
and `NotTokenOwner(uint256 tokenId, address caller)`. It should also handle a
collection-level revert from the `ownerOf` call without inventing a reason.

### Events

Use events for confirmed-action presentation and optional activity history, not
as the sole state source.

```solidity
event AdventureResolved(
    uint256 indexed tokenId, address indexed owner, uint64 indexed day,
    uint8 eventId, uint8 choiceId, uint8 outcomeId,
    int32 xpDelta, int16 trustDelta, int16 scarsDelta,
    uint32 xpAfter, uint8 trustAfter, uint8 scarsAfter,
    uint8 streakAfter, uint8 unmarkedStreakAfter, uint256 achievementMaskAfter
);
event AchievementEarned(
    uint256 indexed tokenId, uint8 indexed achievementId, uint64 indexed day
);
```

### Separate canonical-NFT calls

These are calls to Chog Genesis, not Chog Survivor ABI methods:

| Call | Role and fallback |
|---|---|
| `ownerOf(uint256)` | Required selection/authorization validation. Revert means nonexistent, burned, unavailable, or otherwise unreadable; treat it as unavailable rather than guessing which. |
| `balanceOf(address)` | Standard ERC-721 balance can be used as a lightweight eligibility hint, but it cannot enumerate IDs. |
| `supportsInterface(bytes4)` and `tokenOfOwnerByIndex(address,uint256)` | Optional discovery only. Attempt indexed enumeration only after ERC-721 Enumerable support (`0x780e9d63`) is positively confirmed; any revert/absence falls back to manual entry. Do not assume it exists. |
| `tokenURI(uint256)` | Optional artwork/label enhancement only. Never require it for play and tolerate revert, invalid URI, gateway failure, or mutable metadata. |

An offchain indexer, marketplace API, or cached token list may improve initial
ID discovery, but it is neither authorization nor lifecycle proof. Every
selected ID must still be validated with a fresh `ownerOf` call before read
flows that require existence and immediately before a write.

## Data freshness and failure handling

| Condition | Required UI behavior |
|---|---|
| Disconnected wallet | Permit only general rule/help content. Disable selection confirmation and writes; do not present a guessed ownership state. |
| Wrong chain | Mark game unavailable and disable write/ownership-sensitive reads until chain 143 is selected. |
| Selected ID is owned by another account | Display read-only/unavailable-for-action status after `ownerOf` comparison; refetch on account or chain change. |
| `ownerOf`, `preview`, or RPC fails | Distinguish unavailable data from no character. Preserve no stale claim as current; offer retry and manual network/RPC recovery guidance. |
| Burned/nonexistent or collection-reverting ID | Treat as unavailable for play. `characterOf` may contain retained historical data, but do not present it as an active playable NFT. |
| Account/token transfer while page is open | Listen for wallet account/chain changes; refetch ownership before writes and after confirmation. A reverted `act` is authoritative. |
| Stale preview | Attach the token ID, choice, chain block/time, and connected account to displayed preview state. Re-preview after a material state/account/day change and immediately before user confirmation when practical. |
| Delayed/dropped/replaced transaction | Keep the submitted hash/status; never increment locally. On receipt, refetch state and events. On timeout, offer explorer link once a deployment address is approved, plus refresh/replacement guidance without resubmitting automatically. |
| Same-day action | Render `preview.canAct == false` as resolved-today status; disable action. If `act` still reverts `AlreadyActed`, refresh state instead of treating it as a contract defect. |

## Static content mapping

Bundle the frozen event/choice names, base-reward explanation, achievement names
(bits 0–7), and title labels from [GAME_RULES.md](GAME_RULES.md) as versioned
display content after frontend approval. The contract remains authoritative for
outcome, modifiers, effective deltas, title, and badges. Do not infer reward
results from static content in place of `preview`.

The achievement display map is fixed: 0 First Light, 1 Bridge Builder, 2
Kindred Spirit, 3 Stormforged, 4 Gatekeeper, 5 Pathfinder, 6 Seven Suns, and 7
Unmarked Week. A frontend must present bit 7 as seven consecutive qualifying
risk-free actions under the approved Interpretation B—not as merely seven days
with no effective Scar increase at the cap.

## Recommended stack (no installation in this task)

Use a small TypeScript React application (for example, Vite) with `viem` for
typed public/wallet clients and ABI encoding/decoding, plus a minimal EIP-1193
wallet connector such as wagmi. Use responsive CSS or a lightweight utility
layer; avoid a backend for the MVP. A public Monad RPC endpoint is sufficient
for reads, with a configurable fallback RPC list and explicit degraded state.
No server, indexer, wallet custody, private key, or game-admin API is needed.

## Deployment-address handoff

The frontend must ship with no game-contract address until deployment has
separate human approval. After deployment, the deployer/release owner must
publish a signed or review-approved release manifest containing: chain ID 143,
the ChogSurvivor address, deployed transaction hash/block, creation/runtime
bytecode hashes, frozen source/artifact hashes from
[BACKEND_FREEZE.md](BACKEND_FREEZE.md), and the canonical `CHOG_GENESIS`
address. Frontend configuration may consume that reviewed manifest only after
human approval; it must check `CHOG_GENESIS()` against the manifest before
enabling gameplay. It must never discover an address from a social post,
unverified indexer, or user input.

## Frontend test requirements

Use mocked EIP-1193/provider and contract responses plus a local Anvil/Foundry
fixture for transaction flows. Cover at minimum:

1. Disconnected wallet, rejected connection, account change, and wrong chain.
2. Current owner versus non-owner; approvals/operators must not be presented as
   authorized actors.
3. Manual-ID selection when enumeration is absent/reverts, and optional
   enumeration when support is verified.
4. Transfer before selection, transfer after a displayed preview, and transfer
   after a same-day action.
5. Burn/nonexistence/reverting `ownerOf`, including retained `characterOf`
   history not being shown as an active playable token.
6. All three daily choices: displayed preview fields exactly match mocked
   `act`/`AdventureResolved` results when state/time/owner are unchanged.
7. Same-day non-actionable preview (`canAct=false`), `AlreadyActed` receipt
   failure, and UTC-boundary refresh/countdown behavior.
8. Pending, delayed, reverted, replaced, and confirmed transactions; no
   optimistic permanent state mutation.
9. Achievement bits and title IDs, including permanent unlocked achievements
   and the approved Unmarked Week explanation.
10. Keyboard, screen-reader, narrow-phone, tablet, and desktop responsiveness;
    choice controls remain usable without hover.

## Phased checklist and approvals

| Phase | Deliverable | Required human approval before proceeding |
|---|---|---|
| 0 — Architecture | This blueprint, frozen ABI confirmation, product disclosure copy. | Approve frontend scope and token-ID inheritance disclosure. |
| 1 — Frontend coding | Repository/app choice, dependency lockfile, implementation, local fixtures/tests. | Separate approval to create frontend files/install packages. |
| 2 — Integration | Approved release manifest, RPC configuration, wallet/read/write integration, QA evidence. | Separate approval after game deployment and manifest verification. |
| 3 — Release | Accessibility/mobile review, error-state review, published integration evidence. | Separate release approval; canonical-NFT governance NO-GO must be cleared or explicitly resolved by the required process. |

This document does not authorize any later phase.

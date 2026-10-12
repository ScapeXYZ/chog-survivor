# MVP Architecture Decision — Task 8H.4

## Decision: A — retain immutable token-keyed progression

### Human decision record — Task 8H.5

Human product approval **accepts token-ID-keyed progression and historical
inheritance if a burned numeric ID is reissued**. This acceptance concerns the
documented product/fairness behavior only; it does not establish anything about
the canonical collection's lifecycle controls or governance.

For a time-constrained hackathon MVP, retain the existing immutable,
token-keyed architecture without lifecycle detection, admin controls,
upgradeability, an external indexer, or a second character system. A current
Chog Genesis owner is authorized by `ownerOf(tokenId)`; progression belongs to
that token ID and follows ordinary transfers. This is exactly the frozen
contract's current behavior.

The known possibility that an external collection might burn and later reissue
the same numeric ID is a documented **product-continuity/fairness risk**:
the reissued ID would inherit the old ID's game history. It is not an
authorization break in Chog Survivor, because only the current `ownerOf` value
can act. It must be disclosed wherever token-keyed progression is described.

This architecture decision does **not** clear the separate release NO-GO in
[CANONICAL_NFT_GOVERNANCE_REVIEW.md](CANONICAL_NFT_GOVERNANCE_REVIEW.md). Unknown
collection source, administrator authority, upgradeability, forced-transfer,
pause, burn, remint, and `ownerOf`-availability risks are external dependency
risks. They remain release-blocking until explicitly accepted or independently
verified; changing the game-state key cannot prove those collection properties.

## What `ownerOf` can and cannot prove

For a standard ERC-721 call at a particular block, `ownerOf(tokenId)` can prove
only that the collection currently returns an address for that number. Chog
Survivor can cryptographically enforce that `msg.sender` equals that returned
address at action time. It can also enforce its own one-action-per-day rule and
persist history under the numeric ID.

It cannot, from `ownerOf` alone, prove original mint provenance, an unbroken
lifecycle, whether a prior burn happened, whether the same ID was reissued,
whether a current owner is an ordinary holder or a privileged forced-transfer
recipient, or whether the collection may change its future behavior. A burn
followed by a remint to the same address is observationally indistinguishable
to this contract from the token having remained owned by that address. Ethereum
event history is not generally readable by contracts; an offchain event indexer
can supply evidence to people, but cannot be presented as a complete onchain
security solution.

## Option comparison

| Option | Cryptographically enforceable | Not detectable / residual risk | Complexity and trust | Core-design implication |
|---|---|---|---|---|
| **A. Existing token-keyed progression** | Current owner authorization, token-ID state, daily lock, and transfer-persistent history. | Burn/re-mint or ID reuse; collection governance/upgrade/forced-transfer/pause behavior. | No change. Trust remains the fixed canonical collection's live `ownerOf`. | Preserves the intended NFT-native design: the character is the token ID and transfers with it. |
| **B. Generic onchain lifecycle protection** | At most, record observations made by the game (for example, a past owner). | A same-owner burn/remint, any lifecycle event before first game interaction, and any unseen history. `ownerOf` has no generation number. | No complete implementation exists without collection-specific, verified lifecycle support. An event indexer/oracle adds trust and still is not complete onchain proof. | A claimed generic detector would create false assurance and adds failure modes without solving reuse. Reject for MVP. |
| **C. NFT-independent character identity** | A game-owned character key can be separate from token ID; current NFT ownership can gate use or creation. This prevents a reissued ID from *automatically* selecting old token-ID state only if state is not keyed by that ID. | It still cannot prove NFT lifecycle or collection governance. If a character is wallet-keyed, wallet loss, transfer, multi-wallet behavior, and sybil/one-NFT-many-character policy become game rules. | Material redesign: state key, authorization flow, events, views, ABI, titles/achievements, UX, and all models/tests need revision. No administrator is required, but a new identity policy is. | Stops being token-persistent progression; it is a holder-gated or wallet-character game. It is appropriate only if that deliberate product change is preferred. |

## Why B is not a safe solution

The game could remember `lastObservedOwner`, but an owner change merely proves a
transfer *or* a remint to someone else; no owner change proves nothing. It could
call `ownerOf` before and after an action, but it cannot observe a burn/re-mint
between calls or before first use. It cannot consume another contract's
historical `Transfer` logs onchain. A custom collection function such as a
monotonic per-ID mint generation would solve this only if the canonical
collection publicly exposes it, its semantics are verified, and its
upgrade/governance posture is accepted. No such interface is currently
verified. Therefore B should not be represented as lifecycle protection.

## Why C is not selected now

C can avoid ID-history collision only by changing the product boundary: the
game character must belong to a game-defined identity (typically an address or
an explicitly created character ID), not the NFT number. Current NFT ownership
would then be an eligibility check rather than the character identity. That
can be a valid future product, but it abandons the existing guarantee that a
recipient receives the token's character history. It also creates policy work
for character creation, multiple held NFTs, transfers, wallet migration, and
the event seed. Those are unnecessary hackathon risks when the desired core
design is token-native, token-persistent progression.

## Exact implementation scope for the selected MVP

**No production or test change is required for this decision.** Retain:

- `mapping(uint256 tokenId => Character)` as the sole character-state key;
- the fixed canonical address and direct `ownerOf(tokenId)` existence/current-
  owner check in `preview` and `act`;
- current transfer-persistent history, same-day lock, events, ABI, achievements,
  titles, and Interpretation B rules;
- no owner, administrator, oracle, indexer dependency, pause, upgrade, or
  migration path.

Before any deployment decision, add only product disclosure—not a false
technical promise—that character progress follows the numeric NFT ID and would
also follow a later reissue of that ID if the external collection permits one.
The deployment/release decision must separately resolve or explicitly accept
the canonical-NFT governance gate.

## Concrete acceptance tests for the frozen design

The current lifecycle/ownership suites already cover current-owner-only action,
ordinary transfer persistence, same-day lock across transfer, burn
non-actionability while retained storage remains, smart-contract owners,
nonexistent-token failure, and fork parity. For human acceptance of A, the
following precise tests must be present or added in the next implementation
change; they are listed here only and are **not** changed by this decision.

1. **Reissue semantics:** with the ERC-721 mock, act as owner A for ID `n`, burn
   `n`, then remint `n` to owner B on a later day. Assert B is authorized and
   observes/continues the exact prior `CharacterView`, achievement mask,
   counters, and streak rules for `n`.
2. **No fresh character on reissue:** assert the remint does not reset XP,
   Trust, Scars, event mask, last outcome, daily lock, or achievement bits.
   This confirms the disclosed token-ID semantics rather than implying that the
   contract detected the lifecycle.
3. **Same-day reissue:** act, burn, and remint the same ID within one UTC day;
   assert the new owner remains blocked by `AlreadyActed` until the next day.
4. **Burn boundary:** after burn, `preview` and `act` must revert through the
   collection; `characterOf` must still expose the retained token-ID history.
5. **Ordinary transfer boundary:** transfer without burn must preserve the same
   state and permit only the new current owner on the next eligible day.
6. **No privileged escape hatch:** source/ABI review must continue to show no
   game admin, reset, migration, or alternate identity function.

Passing these tests demonstrates the selected semantics, not that the external
collection cannot reissue IDs. That distinction is required in release copy and
human approval.

## Risk classification and approval request

| Risk | Classification for this MVP | Required decision |
|---|---|---|
| Token-ID reuse carrying forward old game state | Tolerable only as a documented product/fairness risk if the project accepts token-keyed identity. | Human product approval of the disclosed semantics. |
| Unknown canonical collection governance, upgradeability, forced-transfer, pause/burn/remint powers, or `ownerOf` availability | External dependency / release blocker, not cured by A, B, or C. | Preserve NO-GO until verified or explicitly accepted under the release-governance process. |
| An offchain indexer missing, censoring, or misclassifying lifecycle events | Not an authorized security control. | Do not use one as a claimed onchain lifecycle solution. |

Human approval is requested for Option A's token-keyed/reuse semantics only. It
is not approval to deploy while the independent canonical-NFT governance gate
remains unresolved.

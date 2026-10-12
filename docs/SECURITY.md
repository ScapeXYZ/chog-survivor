# Security model and invariants

## Trust boundary

The game trusts only immutable Chog Genesis `ownerOf` for authorization. It does not trust metadata, `tokenURI`, a marketplace, frontend, indexer, relayer, caller input, or randomness oracle. Monad's block timestamp supplies the day boundary.

## Invariants

1. `CHOG_GENESIS` is set once to the stated collection and never changes.
2. Every successful action has a current `ownerOf(tokenId)` caller; no approval or former owner suffices.
3. At most one resolution exists per `(tokenId, UTC day)`, even across transfers.
4. State/counters are keyed only by token ID, never wallet address.
5. The contract never receives/sends native currency, ERC-20, ERC-721, or ERC-1155 assets and exposes no approval, transfer, or withdrawal function.
6. Stored values stay within specified bounds; signed intermediate math clamps safely and counters saturate.
7. Event, outcome, reward, modifiers, and an actionable preview are determined only by canonical state, token ID, and day—no hidden entropy.
8. Same actionable pre-state/day gives exactly matching preview, action return, and resolution log, including post-clamp effective deltas and achievement result. A same-day preview is explicitly non-actionable and is not a hypothetical action.
9. Failed/invalid/same-day calls make no state change and emit no logs.
10. Achievement bits only set, achievement logs occur once in ascending bit order, survive transfers, and titles are derived with canonical precedence rather than mutable.
11. An `ownerOf` revert (including a burn/nonexistent token) prevents preview and action; retained token-keyed storage cannot be acted upon or replayed.

## Controls and limits

Use checks-effects-interactions: validate/calculate, persist state including day, then emit. The single `ownerOf` call is an authorization/existence check before persistence; contracts that own NFTs are supported because authorization is `msg.sender == ownerOf(tokenId)`, not `tx.origin` or an EOA test. A smart-contract wallet must call directly or through its own authorized execution path; ERC-721 approvals/operators never authorize this game call. Apart from `ownerOf`, make no external calls, callbacks, delegatecalls, value calls, or loops over unbounded user-controlled data. The constructor has no collection-address parameter: it fixes the documented nonzero canonical address. ERC-165 validation is optional defense-in-depth only, not authorization. No receive/fallback function and all calls are non-payable.

Owning many NFTs permits playing them all; that is inherent in token-based access. Transfers may coordinate play but cannot create a second same-day action for a token. Deterministic previews are deliberately unsuitable for wagering or scarcity games. Production needs independent review of source/bytecode, constructor argument, collection behavior, timestamp boundaries, and the complete test plan.

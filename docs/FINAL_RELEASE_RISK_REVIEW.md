# Final Canonical NFT Governance and Release-Risk Review — Task 8G.1

Date: 2026-10-12. Scope: `ChogSurvivor` and its immutable dependency on Chog
Genesis at `0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763`, Monad mainnet chain
143. This is a repository and evidence review, not an external audit. No
production source, rule, deployment, signing, broadcast, or live transaction
was performed.

## Decision: NO-GO — do not release without governance/source approval

The game contract and point-in-time fork compatibility checks are PASS. The
canonical NFT's verified source, privileged methods, proxy architecture beyond
three standard slots, upgrade authority, pause/burn controls, transfer controls,
and governance are UNKNOWN. Since `ownerOf` is the game’s only existence and
authorization oracle, those unknowns are a release gate, not a cosmetic due-
diligence item.

## Evidence register

| Subject | Verified evidence | Status |
|---|---|---|
| Network/collection identity | User WSL capture reports chain ID 143, block 112631758, code hash `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46`, ERC-721 interface support, and successful `ownerOf(1425)`. | PASS, point-in-time. |
| Standard proxy slots | The captured EIP-1967 implementation, admin, and beacon slots are all zero. | Informational only; not proof of immutability or absence of custom proxy/delegation. |
| Runtime gameplay compatibility | User-supplied WSL terminal output for the updated Interpretation B tree reports fork suite 6/6 and full suite 42/42, including 256 invariant runs, 128,000 handler calls, and no reverts. No matching updated raw log is present locally; archived reports retain the earlier 40-test run. | PASS, point-in-time user-supplied local-fork evidence. |
| Game binding | `ChogSurvivor` constructor fixes the canonical address; no owner, proxy, pause, asset, or deployment-time collection parameter exists. | PASS from source. |
| Explorer/source metadata | Task 8H.2 public research found marketplace/explorer corroboration of the collection address and an indexed mint event, but no authoritative verified source, compiler settings, creator/deployment transaction, ABI, or authority disclosure. The MonadVision/MonadScan address pages were inaccessible to the research browser. See [CANONICAL_NFT_GOVERNANCE_REVIEW.md](CANONICAL_NFT_GOVERNANCE_REVIEW.md). | UNKNOWN. |
| Ownership/admin, pause, mint/burn, transfer restrictions, governance | No verified ABI/source or read-only method results establish their presence or absence. | UNKNOWN. |

Primary local evidence is [MONAD_COLLECTION_VERIFICATION.md](MONAD_COLLECTION_VERIFICATION.md),
[MONAD_FORK_INTEGRATION.md](MONAD_FORK_INTEGRATION.md),
[SECURITY_REVIEW.md](SECURITY_REVIEW.md), and
[STATIC_ANALYSIS_REVIEW.md](STATIC_ANALYSIS_REVIEW.md), with retained WSL captures
under `reports/collection-verification/` and `reports/fork-integration/`.

## Canonical-NFT privilege risk map

| Potential verified/unknown collection capability | Effect on `ownerOf` authorization and availability | Effect on token-keyed progress | Rating / required evidence |
|---|---|---|---|
| Current ordinary ERC-721 ownership | Fork tests confirmed the current owner of token 1425 can act; a non-owner is rejected. | Transfer preserves the same token ID’s history; the recipient can act on the next UTC day. | PASS, limited to fork state/tested token. |
| Owner/admin can upgrade code or alter ownership semantics | Could make `ownerOf` revert, return an unexpected owner, or change transfer/burn behavior, disabling or redirecting authorization. | Existing game history remains at the ID, but its future usability follows changed collection semantics. | High release dependency; UNKNOWN until source, implementation path, and authority are verified. |
| Pause/freeze/restriction of `ownerOf` or transfers | `preview` and `act` both revert if `ownerOf` reverts; transfer freeze affects who can continue a token’s progress. | State is not erased, but can become unavailable or economically stranded. | Medium availability/fairness risk; UNKNOWN. |
| Privileged burn or remint | A burn makes `ownerOf` revert and blocks future play. A later re-use of the same ID, if collection semantics allow it, would expose retained game history to the new owner. | History is intentionally keyed by ID and not reset/migrated. | High product/governance risk; UNKNOWN. |
| Admin mint or forced transfer | A privileged actor could become `ownerOf` and therefore gain action authority, by design of the immutable game dependency. | Progress follows the ID after the collection’s ownership change; no wallet-bound protection exists. | High trust assumption; UNKNOWN. |
| Ordinary holder transfer | Tested only as a local fork simulation: old owner was rejected and recipient continued the same history. | Deliberate token-keyed persistence; a same-day action remains blocked across transfer. | PASS for tested fork behavior. |

`ownerOf` is called through `STATICCALL` before game persistence. A malicious or
nonstandard collection cannot successfully reenter a state-changing `act` from
that static context, but it can deny service by reverting or determine the
reported owner. The game cannot be repointed after deployment.

## Gameplay acceptance review

### Decision update — Task 8G.3

- **Accepted:** deterministic events and strategic waiting.
- **Accepted:** existing XP progression and title thresholds.
- **Accepted product behavior (Task 8H.5):** progress is token-ID keyed and
  historical state is accepted to follow a later reissue of the same numeric ID
  if the canonical collection permits one. This does not verify non-reuse or
  alter the canonical-NFT governance deployment hold.
- **Accepted, approved, implemented, and regression-tested:** Unmarked Week follows the risk-free-action
  rule: any positive post-modifier, pre-clamp Scar request resets progress,
  including at Scars 100. See [UNMARKED_WEEK_DECISION.md](UNMARKED_WEEK_DECISION.md).
  This does not change the overall NO-GO assessment or the unresolved
  canonical-NFT governance/source gate.

| Topic | Technical conclusion | Release/product decision required |
|---|---|---|
| UTC midnight | `block.timestamp / 86_400` is an intentional UTC-day boundary. Validators may choose a valid timestamp near midnight, changing adjacent-day event, replay, and streak outcomes. | Low timing/fairness risk; disclose it and prohibit wager/time-critical use. |
| Deterministic events | Event ID is public deterministic keccak output of collection address, token ID, and day. Waiting for a favorable event is explicitly allowed, at the cost of breaking streak. | Not a PRNG vulnerability for this non-wager game; explicitly accept strategic waiting/fairness trade-off. |
| XP/title balance | Independent heuristic simulation shows reckless/greedy policy has about 39% more 365-day XP than cautious for token 1425, while ending at Trust 0/Scars 100 versus a low-scar Mythic path. It is not an exhaustive optimizer or playtest. | Human balance sign-off required; do not call this a security defect. |
| Unmarked Week at Scars 100 | The approved rule uses the post-modifier, pre-clamp requested Scar delta. A positive request resets progress even if the cap yields effective delta zero. Dedicated lifecycle tests cover positive, zero, negative, cap, and persistence cases. | Approved gameplay rule; not an arithmetic/security defect. |
| Transfers/history | Authorization follows current NFT ownership, but progress, badges, and same-day lock follow token ID. | Deliberate gameplay/economic property; disclose to buyers and marketplace users. |

## Explicit gates

| Gate | Status | Release condition |
|---|---|---|
| Game-code integrity | PASS | Existing source/static-analysis/fork evidence shows no confirmed Critical/High/Medium code defect. Interpretation B is accepted and regression-tested. Maintain the tested artifact/configuration. |
| Canonical collection runtime compatibility | PASS, point-in-time | Recheck chain ID, code hash, interface support, and `ownerOf` immediately before deployment. |
| Canonical collection governance and upgradeability | NO-GO / blocking | Obtain verifiable source or bytecode analysis plus documented authority, proxy/delegation, pausing, mint/burn, forced-transfer, and upgrade controls. Human approval must accept the residual trust model. |
| Gameplay economics and disclosure | NO-GO / blocking | Deterministic waiting, XP/title thresholds, and risk-free Unmarked semantics are approved; approve/disclose UTC behavior and transfer-persistent progress. |
| NO-GO triggers | NO-GO if observed | Do not deploy if collection review reveals unapproved authority to alter `ownerOf`/ownership, unaccepted pause/burn/remint/forced-transfer powers, an unresolved proxy/upgrade path, a code-hash/interface mismatch, or an inability to operate `ownerOf` reliably. |

## Required closure evidence

1. Preserve full runtime bytecode and a pre-deployment block number/hash; compare it
   to the reviewed hash and decode it for proxy/delegatecall/custom dispatch paths.
2. Obtain verified collection source/ABI from a trustworthy project/explorer source,
   or conduct an independently recorded bytecode/selector analysis.
3. Read-only-test and record applicable ownership/admin/role, pause, transfer,
   mint, burn, proxy, and upgrade methods. Absence must be demonstrated from source
   or bytecode analysis, not assumed from standard EIP-1967 zero slots.
4. Have accountable collection governance owners explicitly approve the immutable
   `ownerOf` dependency and incident posture.
5. Obtain human gameplay/product sign-off for every conditional decision above.

Until those closure items are complete, this review is **NO-GO**, not a
production-release approval.

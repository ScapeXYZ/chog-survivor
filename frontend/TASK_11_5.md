# Milestone 11.5 — Real Chog discovery

Baseline: `66cfe42ca1f750d00d65c65e4169dc9ec7252c8c`. Tracked tree was clean.
The existing untracked `design/chog-parchment-reference.png` stays untouched
and unstaged. Milestone 11.4 was inspected, not repeated.

## Feasibility before implementation

Read Solidity, BACKEND_FREEZE, CANONICAL_NFT_GOVERNANCE_REVIEW, collection
verification records, contracts, App, Character, Adventure, useSurvivorIdentity,
utilities, relevant tests, styles, responsive scripts and milestone documentation.
App's submitted token ID already persists across Character/Adventure; both
screens verify canonical `ownerOf` through an account/network-scoped query.
Manual input does not establish identity. No automatic holdings discovery existed.

Fresh RPC evidence confirms the canonical collection on Monad (143), denies
Enumerable support and identifies a working custom `tokensOfOwner(address)`.
At a single finalized block, zero-, one- and twelve-token wallets were checked:
every returned ID passed canonical `ownerOf`, was distinct, and the count matched
`balanceOf`. The block hash and runtime hash were recorded and rechecked.
An explicit technical feasibility report was delivered before UI editing.
Transfer logs lack independently verified completeness; an external indexer is
unnecessary. See [feasibility and provider considerations](../docs/CHOG_DISCOVERY_FEASIBILITY.md)
and [actual RPC evidence](../docs/evidence/TASK_11_5_DISCOVERY.json).

## Implemented

Character gains a compact **Your Survivors** section using existing parchment
colors, fonts and button styling. **Find my Chogs** performs explicit read-only
discovery using the existing public RPC. No new key, dependency, service, wallet
configuration, canonical ABI/address or game ABI change.

Discovery checks the RPC chain, verified collection runtime hash, finalized
block and balance. Its custom getter uses a 50M-gas eth_call budget; ownership
checks use canonical ownerOf, limited to 24 candidates per attempt. All reads
are pinned to the block, which is confirmed again before presentation.
Completeness requires distinct IDs, every owner check and balance agreement.
Larger/duplicate/missing/mismatched/failed candidates are partial, never a
definitive empty inventory. Only verified owned IDs receive selection buttons.

Loading, unavailable and retry states are explicit. Account/chain/selection
changes discard stale results, including late async responses. Window focus,
unmount and 30-second snapshot expiry also invalidate them without expensive
automatic discovery polling. Every read has a 20-second deadline. The installed
viem readContract API does not accept gas, so discovery uses explicit gas-bounded
call plus ABI encoding/decoding; tests verify the actual call payloads.

Selection sets the existing App token and synchronizes the manual input.
The existing current-owner hook rechecks it before controller status is shown.
Character → Adventure → Character continuity remains unchanged. Manual uint256
entry works even when discovery is unavailable. No verified NFT artwork or
timeline entries are added. Progression/history remain unavailable without an
approved game deployment; Adventure remains a local demo with no saved choices.

## Validation

- `npm run typecheck`: passed.
- `npm test`: **110 tests in 8 files passed**, including 25 new discovery cases
  and all 85 existing tests. Covers disconnected/unknown/wrong chain, zero/one/
  multiple ownership, candidate verification, loading, RPC/retry, incomplete
  enumeration, transfers, account/chain/token/disconnect races, focus/expiry,
  deadlines, runtime/network/block changes, manual fallback, shared navigation
  and no writes/signatures/broadcasts.
- `npm run build`: passed. Existing dependency annotation and bundle-size
  warnings remain; no dependencies or build configuration changed.
- `git diff --check`: passed.
- Existing responsive browser workflow passed at 1440, 1920, 1280, 1024, 768,
  390, 360 and 320px. No horizontal overflow or clipped controls. Original
  margins, grid breakpoints, undistorted portrait, visible corners and aligned
  header remain. Eight achievement marks and unavailable journal are preserved.
- Home and Adventure viewport screenshots are byte-identical to 11.4 artifacts
  at all eight widths. Character changes only by the authorized small discovery
  section and manual-fallback description, with no parchment redesign.
- The **actual shipped discovery reader** was separately imported in the local
  browser and invoked with the existing RPC client. Three public-address reads
  returned complete verified inventories of **1, 12 and 0**, at finalized blocks
  112852933, 112852938 and 112852949 respectively. No connected wallet, mocked
  NFT responses or signatures were used for this check. Evidence is recorded.

Reproduce responsive QA with local Vite on 5173 and Chromium CDP on 9222:

```sh
CHOG_PROFILE_OUTPUT=/tmp/chog-task115 CHOG_COMPARE_BASELINE=/tmp/chog-task114 CHOG_CHECK_JOURNEY=1 node scripts/character-smoke.mjs
```

Screenshots: `/tmp/chog-task115/character-full-1440.png` and
`/tmp/chog-task115/character-full-390.png`; all eight widths, Home and Adventure
comparisons and navigation screenshots are in that directory. Screenshots
show the disconnected-wallet state, not simulated NFT holdings.

## Exact files changed

- `src/discoverSurvivors.ts`: bounded verified collection discovery reader.
- `src/YourSurvivors.tsx`: compact explicit discovery/selection states.
- `src/YourSurvivors.test.tsx`: discovery and integration regressions.
- `src/Character.tsx`: small discovery integration and manual fallback copy.
- `src/character.css`: new section/chip styles only; original styles untouched.
- `src/App.test.tsx`, `src/Character.test.tsx`, `src/Adventure.test.tsx`,
  `src/SurvivorJourney.test.tsx`: public-client mocks for existing test harnesses.
- `scripts/character-smoke.mjs`: disconnected discovery and clipping assertions.
- `README.md`: capabilities and constraints.
- `TASK_11_5.md`: this milestone record.
- `../docs/CHOG_DISCOVERY_FEASIBILITY.md`: feasibility report and primary sources.
- `../docs/evidence/TASK_11_5_DISCOVERY.json`: live read-only evidence.

Solidity SHA-256 remains
`5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.
No Solidity, Foundry tests, ABI/address, deployment, connector, Home/Adventure
source/style, assets, encounter rules or shared ownership-hook changes.

## Remaining limits and preview

Public RPC high-gas availability/rate limits can fail; no verified custom
pagination exists. More than 24 candidates yields partial discovery. Inventory
is a recorded-block snapshot, not transfer monitoring or a durable ownership
grant. Custom collection source/governance still requires the existing review;
code changes disable discovery until separately investigated. No NFT metadata
or game deployment is verified by this milestone. Game deployment remains NO-GO.

Run `npm run dev -- --host 127.0.0.1` in frontend, open the local URL, choose
**Character**, connect on Monad and press **Find my Chogs**. Use manual lookup
if discovery fails. Selecting a Chog rechecks it; Adventure stays a local demo.
Stop after 11.5 for review; no deployment, gameplay writes or history indexing.

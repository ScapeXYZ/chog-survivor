# Milestone 11.4 — NFT-centric Character ↔ Adventure journey

Approved baseline: `8f26f47cf72b1b36c9e96ec301efc877854e3e5f`.
Tracked files were clean before editing. The user's existing untracked
`design/chog-parchment-reference.png` remains untouched and unstaged.

## Inspection and existing flow

Reviewed frozen Solidity, SPEC, GAME_RULES, BACKEND_FREEZE, App, Character,
Adventure, contracts, game-data, utilities, styles and frontend tests before
editing. The NFT's canonical `ownerOf` determines existence and its controller;
game state and action history are keyed by token ID. The backend remains frozen
and deployment remains NO-GO.

App already holds one `selectedToken`, passed to Character and Adventure. Manual
uint256 entry is submitted explicitly in Character. Before this milestone,
Character alone verified ownership; Adventure received the numeric ID only for
its local seed. Existing navigation retained the ID across screens.

Adventure uses `demoEventIndex(selectedToken ?? 0n, deviceUtcDay)`, with the frozen
Keccak formula converted to a zero-based array index. Its HUD/title/chronicle
are explicit fixtures. Choice previews show base deltas only, save no effects,
and snapshot the encounter so an open popup cannot change at device-day rollover.
No authoritative game encounter, action eligibility or completed action is inferred.

## Implemented identity sharing

`useSurvivorIdentity` extracts Character's existing canonical `ownerOf` read,
account-chain cache scope, loading/error gates, controller comparison, failure
classification and exact ownership messages. Character and Adventure now use
that same hook/query key for App's selected token. No new holding discovery,
metadata read or external service is introduced. The account's actual chain
ID is used rather than wagmi's configured-chain fallback.

The read stays stale on mount, refreshes on window focus and polls every 30
seconds while mounted. Query arguments change with the token; scope changes
with wallet account/chain. Pending, refetching, failed, zero-owner or gated reads
never display a cached verified identity. Explicit nonexistent-token evidence
remains separate from ambiguous collection reverts and RPC failure.

Adventure adds one compact strip between the existing HUD and scene:

- No token: no selected Chog; local demonstration remains available to everyone.
- Requested ID: explicitly unverified, with loading, wallet/network or read failure.
- Verified owner: CHOG #ID, verified NFT identity and connected controller status.
- Verified non-owner: same CHOG identity, with another wallet as controller.
- Every state: an explicit local-demonstration disclosure; choices never change
  NFT progression or save its story.

The strip provides **View survivor profile**, returning to Character with the
same selected token, and an ownership-only refresh when an ID is selected.
Character → Adventure uses the unchanged global navigation. App gains only
the Adventure-to-Character callback. Character's rendered JSX and parchment
CSS remain identical to the approved baseline.

HUD, scene artwork/props, encounter heading, seed formula, choices, fixtures,
chronicle and result popup are unchanged. New CSS targets the identity strip
only. Verified ownership does not turn Adventure into live gameplay; arbitrary
requested numeric seeds are still explicitly local simulations, not NFT proof.

## Backend parity evidence

`scripts/game-data.parity.test.mjs` runs in Vitest's Node environment and reads
the actual frozen Solidity and rulebook. It verifies all six event IDs, three
choices per event, eighteen outcome IDs, every choice name/tag and all 54 base
XP/Trust/Scar deltas. Solidity's `xs`, `ts`, `ss` and tag arrays match the frontend.
The event formula is checked for token 0, token 1425 and uint256 max at three
days, including day zero. No modifier, clamp or achievement condition is edited.

Solidity SHA-256 remains
`5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`, matching
BACKEND_FREEZE. Source/configuration/ABI/address/game-data/asset/dependency diffs
against the approved baseline are empty. Adventure calls neither `eventFor`
nor `preview`, and treats neither as evidence of completed gameplay.

## Exact scoped files

- `src/useSurvivorIdentity.ts`: shared read-only identity hook extracted from Character.
- `src/Character.tsx`: uses the shared hook; JSX/game reads stay unchanged.
- `src/Adventure.tsx`: identity strip, ownership refresh and profile navigation.
- `src/adventure.css`: strip-only styles and responsive layout.
- `src/App.tsx`: profile-return callback; Home/wallet/navigation JSX preserved.
- `src/SurvivorJourney.test.tsx`: sixteen ownership, navigation and safety cases.
- `src/Adventure.test.tsx`: account-chain mock and read-hook assertion update.
- `scripts/game-data.parity.test.mjs`: three source-backed parity tests.
- `scripts/character-smoke.mjs`: optional journey checks and Character comparisons.
- `README.md`: journey capabilities and limitations.
- `TASK_11_4.md`: this record.

No Solidity, Foundry tests, ABI, addresses, deployment/connector configuration,
Home styles, Character styles, reward data, game mechanics, artwork, dependencies
or lockfiles changed. No deployment, signing, broadcasting or transaction
submission occurred. `act()` remains unavailable and its button disabled.

## Validation

- `npm run typecheck`: passed.
- `npm test`: 85 passed across seven files (66 previous, 16 journey, 3 parity).
- `npm run build`: passed; existing nonfatal dependency annotation warnings remain.
- `git diff --check`: passed.
- Existing Character tests remain unchanged, including uint256 boundaries,
  CharacterView/title mapping, freshness/error handling and no fabricated history.
- Journey unit tests cover disconnected wallet, unsupported/unknown chain, no
  token, unsubmitted/pending ID, verified owner/non-owner, zero owner/nonexistent
  NFT, RPC retry, account/chain/token switching, ownership changes, both navigation
  directions, unchanged local consequences and no writes/signatures/broadcasts.
- Existing Adventure read-hook mock assertion now distinguishes render-time
  hook invocation from an RPC request. Choices still cannot invoke game reads;
  disconnected ownership queries remain disabled. Original demo safety assertions
  and popup/focus tests are preserved.
- Journey Chromium checks passed at 1440×900, 1920×1080, 1280×900, 1024×768,
  768×1024, 390×844, 360×800 and 320×740. Profile layout/ornaments/portrait ratio,
  strip/control bounds, max uint256 entry, selected ID round trips, unsaved popup
  consequences and disabled gameplay passed. No wallet requests occurred.
- Home and Character **viewport** PNGs match retained approved 11.3.1 captures
  byte-for-byte at all eight sizes. Character JSX/CSS and Home source/styles
  are preserved. Six full Character PNGs match too; 1920px and 768px full-page
  repaints differ despite identical dimensions/layout and viewport pixels.
  The harness records full-page equality separately instead of claiming that
  every full capture is identical. An isolated copy of the approved commit also
  produced repaint differences. Full sheets were checked through source/layout
  evidence and visual inspection; this is a screenshot reproducibility limit.
- Existing Adventure Chromium regression passed at all six original sizes:
  three result themes, keyboard/modal fit, inert background, focus restoration,
  Home preservation and no wallet requests. New desktop/mobile journey shots
  were visually inspected.

The parity test uses built-in Node file reads in the test environment, avoiding
browser sandbox source imports and extra type/dependency changes. The initial
test harness also corrected a case-sensitive popup button query; product popup
behavior was unchanged. Final required checks passed.

## Preview and review screenshots

Open `http://127.0.0.1:5173/`, select **Character**, enter/check a token ID, then
choose **Adventure** in navigation. Select **View survivor profile** to return.
No wallet is needed for visual review; without verification the ID remains
unverified and every choice stays a local preview. Leave the game address unset.

```sh
cd ~/chog-survivor/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Review PNGs under `/tmp/chog-task114/` include:

- `adventure-journey-full-1440.png` and `adventure-journey-full-390.png`:
  realistic manual token 1425, disconnected/unverified journey.
- `character-full-1440.png` and `character-full-390.png`: preserved parchment.
- `adventure-max-full-WIDTH.png`: uint256 boundary stress state.

No fabricated owner or live game response is used in browser screenshots.
Conditional ownership cases use unit mocks and are not live transfer evidence.

With local Vite/Chromium endpoints and retained baseline artifacts:

```sh
CHOG_PROFILE_OUTPUT=/tmp/chog-task114 \
CHOG_COMPARE_BASELINE=/tmp/chog-task1131 \
CHOG_COMPARE_CHARACTER=1 CHOG_COMPARE_ADVENTURE=0 CHOG_CHECK_JOURNEY=1 \
node scripts/character-smoke.mjs
node scripts/adventure-smoke.mjs
```

## Limits and stop point

No enumeration, verified NFT artwork, approved game deployment, live daily
eligibility or chronological history becomes available in this milestone.
Ownership is a point-in-time read, with polling/refetch, not a transfer watcher.
Collection governance verification and deployment NO-GO remain unchanged.

Stop after Milestone 11.4 and await review.

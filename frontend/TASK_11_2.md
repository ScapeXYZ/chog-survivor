# Milestone 11.2 — NFT-native Survivor Profile

Baseline: clean `main` at `97f6416dc363ce11f39910c4341dbf08019975e4`.
Milestone 11.1's audit was supplied in the session; relevant Solidity, ABI,
frontend and freeze details were checked against the repository before editing.
This milestone stops for human screenshot approval. Game deployment remains
NO-GO and all production gameplay transactions remain disabled.

## Implemented

Dedicated `Character.tsx` and scoped `character.css` replace the inline
Character dashboard. The profile uses the existing dark-fantasy typography,
gold/parchment, blue-grey and crimson palette in a continuous survivor ledger.
Home JSX, Adventure markup/styles, assets, fonts, navigation handlers and
wallet implementation remain unchanged. A Character-only mobile shell selector
provides four readable, 44px navigation targets.

The profile presents “The wallet controls the survivor. The Chog carries its
story.” A verified token ID is the identity; the current owner is its controller.
Transfer inheritance, token-ID reissue policy and the NFT governance limitation
are explained without providing transfer controls or claiming live transfer QA.

Manual unsigned-decimal IDs accept zero through uint256 max. Entry/requested
IDs remain distinct from verified identity. Canonical `ownerOf` reads require a
connected wallet on Monad, using the connected account's actual chain ID rather
than wagmi's configured-chain default. Owner/non-owner, disconnected, wrong chain, loading,
zero owner, explicit nonexistent-token error, ambiguous contract revert and RPC
failure have separate presentations. Automatic enumeration is not assumed;
there is no holdings list or “zero Chogs” claim.

Account/chain-specific query scope, stale-on-mount reads, window-focus refresh,
30-second polling and explicit refresh revalidate ownership. Cached data is
hidden during errors/refetch. Refresh stops if fresh ownership/binding fails
or the wallet/token context changes before the response arrives.

Conditional game reads use the existing configured approved-address boundary
and require the canonical collection binding plus verified NFT existence.
`characterOf` maps XP, Trust, Scars, stored streak, Unmarked run, `hasActed`,
last action day/outcome, event mask and permanent achievement mask. `titleOf`
provides the actual title, without a hardcoded fallback. Titles and stat reads
have independent unavailable/error handling. An environment variable is not
deployment approval: leave the existing game-address configuration unset.

With no approved game deployment, Character intentionally displays unavailable
progression/title/achievement status and no fixture stats. Adventure remains
its existing explicitly labeled local demo. The Character notice distinguishes
its read-only unavailable state from Adventure's simulated values.

The daily section explains one action per NFT per UTC day and inherited daily
locks. Recorded action state is displayed only when actually returned. Current
eligibility remains unverified: no browser clock is presented as chain time,
and no gameplay action is enabled. Stored streak continuation is explained.

Survival History is an intentional unavailable state. It does not invent an
empty-history claim or timeline entries. No event-log infrastructure or external
service was added. Full history remains a future approved-deployment feature;
private counters are not exposed by frozen getters.

## Exact scoped files

- `src/Character.tsx` — profile and read-only queries.
- `src/character.css` — profile-only design and responsive layout.
- `src/Character.test.tsx` — ownership, progression, failure and safety tests.
- `src/App.tsx` — Character integration, removal of inline demo fallback,
  profile-only notice/shell class. Existing Home, Adventure and wallet JSX/handlers
  are preserved.
- `src/utils.ts` — enforce uint256 token-ID upper bound.
- `src/utils.test.ts` — boundary and invalid-input tests.
- `src/Adventure.test.tsx` — replace the obsolete expectation that Character
  displays Adventure fixture stats; all Adventure checks remain.
- `scripts/character-smoke.mjs` — local Chromium Profile QA, no NFT/game mocks.
- `README.md` — capabilities, configuration and limitations.
- `TASK_11_2.md` — this record.

No Solidity, Foundry tests/configuration, frozen ABI/address configuration,
game-data mapping, Home/Adventure styles, artwork, fonts, dependencies or
lockfile changed. No artwork generation, deployment, signing or broadcasting
occurred. No new gameplay mechanics or external services were introduced.

## Validation actually executed

- `npm run typecheck`: passed.
- `npm test`: 63 passed, 0 failed in five files; 25 dedicated Character cases.
- `npm run build`: passed. Existing dependency Rollup annotation warnings remain
  nonfatal.
- `git diff --check`: passed.
- Baseline source comparison: Home/Adventure/Settings JSX, navigation and wallet
  handlers preserved; Solidity, Foundry config, contract configuration, game-data,
  Adventure, shared CSS, Home CSS and protected assets have no baseline diff.
- Existing `scripts/adventure-smoke.mjs`: passed at 1440×900, 1920×1080,
  1024×768, 390×844, 360×800 and 320×740. Modal themes, keyboard interaction,
  focus restoration, overflow and Home preservation passed; no wallet requests.
- New Profile browser checks: passed at the same six viewport sizes, including
  max uint256 manual entry, identity unverified/disconnected, unavailable stats,
  no fabricated timeline, visible controls and Home return. No wallet requests.
- New Home screenshots match approved Task 10.2 `after-home-WIDTH.png` files
  byte-for-byte at all six sizes, with the existing browser QA's frozen clock
  and reduced motion for reproducibility.
- Desktop and full-page phone Profile screenshots were visually inspected.

The initial long-input browser measurement mistook an input's intentional
internal text scrolling for a clipped control; the harness now checks its outer
bounds. A genuine 360px navigation clip was then fixed with Character-only CSS.
The final browser checks passed. Unit tests mock read responses and wallet hooks;
browser QA uses a disconnected wallet and no fabricated ownership responses.
There is no fresh real-wallet/RPC or live game deployment validation.

## Preview and browser reproduction

```sh
cd ~/chog-survivor/frontend
npm run dev -- --host 127.0.0.1
```

Open the URL Vite prints and select **Character** in the existing navigation.
No wallet is needed to review the disconnected/unavailable layout. Connect an
injected wallet on Monad and enter a known token ID for an actual read-only NFT
ownership query, subject to wallet/RPC availability. Leave the game address unset.
Home and Adventure continue to work independently.

With a local Chromium debugging endpoint, run:

```sh
CHOG_PREVIEW_URL=http://127.0.0.1:5174/ \
CHOG_BROWSER_URL=http://127.0.0.1:9223 \
node scripts/character-smoke.mjs
```

Use the actual server/browser ports. Optional `CHOG_COMPARE_APPROVED=1` compares
Home against retained `/tmp/chog-task102/after-home-WIDTH.png` artifacts when
they are available. Profile screenshots are in `/tmp/chog-task112/`, including
`character-WIDTH.png` and `character-full-WIDTH.png`. These temporary artifacts
are QA evidence, not human approval.

## Remaining limits and stop point

No approved game deployment exists. Conditional progression/title read paths
are verified with tests only; current production progression, exact chain-day
eligibility and chronological history are unavailable. No enumeration support,
complete wallet holdings discovery, transfer watcher or indexer is established.
Collection governance/source approval remains unresolved. Nonexistent-token
classification is used only when the returned error identifies that condition;
unknown collection errors cannot safely establish it.

Await screenshot approval before proceeding beyond Milestone 11.2.

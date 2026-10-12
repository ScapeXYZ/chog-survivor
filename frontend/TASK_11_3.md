# Milestone 11.3 — Parchment survivor character sheet

Implementation baseline: `c98ccde41b43fa78d8b1c36dd25d260de3fa9e04`.
Tracked files were clean before editing. The user supplied the untracked
`design/chog-parchment-reference.png` during this milestone; it was visually
inspected as the primary layout reference and left untouched and unstaged.

## Presentation

The former dark ledger is now one continuous aged parchment sheet, with warm
brown ink, fine double rules, decorative corner scrolls and an arched portrait
frame. The reference's left portrait, center records, right marks and bottom
journal structure are adapted to Chog Survivor. Lilita One provides the main
game heading and survivor identity; existing Cinzel and IM Fell English provide
section labels and readable fantasy text.

The portrait contains an explicitly decorative compass seal, with an unavailable
artwork caption. It never represents an NFT image or a fabricated selected Chog.
The verified numeric identity remains distinct from requested/manual input.
Current owner and controller verification, retry and refresh are unchanged.

The center displays the actual survivor title, XP, Trust, Scars, stored streak,
Unmarked run and last recorded action where readable. Trust and Scars meters
use the frozen 0–100 ranges and appear only for returned state. XP and streak
have no invented maximum, level or progression target. No approved game
deployment currently exists, so progression remains unavailable without fixtures.

All eight achievement names and criteria are preserved. Earned, not earned
and unavailable marks have different treatments and explicit text. The bottom
Survival History journal uses empty ruled parchment with an unavailable notice;
no event-log reader, dates, decisions, inventory or fabricated timeline is added.
Token-bound inheritance and the one-action-per-NFT-per-UTC-day rule remain clear.

## Scope

- `src/Character.tsx`: presentation and decorative inline SVG; read logic unchanged.
- `src/character.css`: parchment, typography, borders, meters and responsive layout.
- `src/Character.test.tsx`: preserves existing tests; adds three safeguard tests.
- `scripts/character-smoke.mjs`: optional output directory and baseline screenshot
  comparison; resets the page per size, captures normal and max-ID states,
  checks artwork/achievement/unavailable-meter safeguards and reports clipped controls.
- `README.md`: current presentation and data limitations.
- `TASK_11_3.md`: milestone record.

No App/Home/Adventure source or shared/approved styles, wallet configuration,
game-data, contract ABI/addresses, Solidity, backend tests, assets, fonts,
dependencies or lockfiles changed. There are no writes, signatures, broadcasts,
deployments, newly enabled gameplay actions or new gameplay mechanics.
No artwork-generation tool was used. CSS paper grain and inline SVG ornamentation
are code-native UI decoration, not NFT or encounter illustrations.

## Validation

- `npm run typecheck`: passed.
- `npm test`: 66 passed in five files, including all original 63 tests and three
  new Character safeguard cases. No original functional assertions were removed.
- `npm run build`: passed; existing nonfatal dependency Rollup annotation
  warnings remain.
- `git diff --check`: passed.
- Character browser checks passed at 1440×900, 1920×1080, 1024×768, 390×844,
  360×800 and 320×740: no overflow, clipped controls, NFT image substitution,
  fabricated history, unavailable-state meters or wallet requests. Manual
  uint256-max entry and keyboard input focus passed.
- Current Home and Adventure screenshots match retained 11.2 PNGs byte-for-byte
  at all six sizes, using the existing frozen clock and reduced motion harness.
- Existing Adventure browser checks passed at all six sizes, including all
  three result themes, modal fit, keyboard behavior and focus restoration.
- Desktop full-sheet, mobile full-sheet and mobile viewport screenshots were
  visually inspected. Screenshot QA does not constitute human visual approval.
- Protected-source diff against `c98ccde` is empty for App, Home/Adventure
  styles, Adventure source, shared CSS, wallet/contract configuration, game-data,
  assets, backend source/tests/configuration and dependency manifests.

During validation, a duplicate meter fallback text initially caused one existing
stat assertion to fail; native meter semantics now expose its range/value
without duplicating the visible numeric label. Browser checks found narrow
navigation clipping; a Character-only 360px rule resolved it. The final runs
passed. Each viewport now reloads before screenshot capture so stress-test
token selection cannot spill into the next review screenshot.

## Preview and reproducibility

```sh
cd ~/chog-survivor/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/` and select **Character**. A wallet is unnecessary
for visual review. Leave `VITE_CHOG_SURVIVOR_ADDRESS` unset.

With Chromium already listening on local debugging port 9222:

```sh
CHOG_PROFILE_OUTPUT=/tmp/chog-task113 \
CHOG_COMPARE_BASELINE=/tmp/chog-task112 \
node scripts/character-smoke.mjs
node scripts/adventure-smoke.mjs
```

`CHOG_COMPARE_BASELINE` is optional and requires the retained Milestone 11.2
Home/Adventure PNGs. `CHOG_PREVIEW_URL` and `CHOG_BROWSER_URL` still support
custom local endpoints for the Character harness. Browser QA uses an empty
injected-wallet stub and performs no fabricated NFT/game reads.

Review screenshots: `/tmp/chog-task113/character-full-1440.png` and
`/tmp/chog-task113/character-full-390.png`. Viewport screenshots are also present
as `character-1440.png` and `character-390.png`; max-ID stress screenshots use
`character-max-WIDTH.png`. These artifacts are local QA evidence, not approval.

## Limits and stop point

Verified NFT artwork, enumeration, approved game deployment, exact current
chain-day eligibility and chronological history remain unavailable. Conditional
game reads are covered by mocks, not a deployed game or fresh transfer tests.
Game deployment remains NO-GO. Gameplay transactions remain disabled.

Stop after Milestone 11.3 and await human visual approval.

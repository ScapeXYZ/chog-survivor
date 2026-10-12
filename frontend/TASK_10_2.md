# Task 10.2 — Adventure presentation polish

Baseline: `22571ad`. This task stops here for human screenshot review and visual
approval. It does not proceed to Task 10.3.

## Files changed

- `src/Adventure.tsx`: decorative mist/canopy layers and encounter seals,
  concise demo-stat label, category-themed result markup, and choice-first heading.
- `src/adventure.css`: Adventure-only scene, HUD, control-deck, popup,
  readability, responsive and reduced-motion polish.
- `src/Adventure.test.tsx`: preserves all 25 original test cases, updates the
  dialog-name assertion to its selected choice, and adds four focused checks.
- `scripts/adventure-smoke.mjs`: before/after Home screenshot comparison,
  360px coverage, clipped-control checks, and all three result-theme checks.
- `TASK_10_2.md`: implementation, verification and review instructions.

## Visual changes

The existing gateway remains the scene's focal point. Original CSS branch
silhouettes at the edges, two independently drifting local fog layers, stone
surface marks, a fine inner frame and restrained lantern accents add depth.
The title is paired with a small parchment seal whose original geometric
decoration varies by the existing event ID. These seals are decorative,
hidden from assistive technology, and do not represent interactive objects.
The illustrated control deck has a warm parchment surface, inset edge and a
small amber joining tab separating it from the environment.

The HUD aligns stat labels and values in four consistent columns with clear
dividers. Its fixture is immediately labeled **DEMO STATS — NOT SAVED**.
The 184 XP, 62 Trust, 14 Scars and three-day streak are unchanged. Local Demo,
game title, all four stats and Back to Home remain present.

Choices have raised numbered tabs, beveled edges, offset charcoal shadows,
coordinated category accents, readable titles and an inset Preview Choice
row. Cautious uses mist teal, compassionate amber, and reckless muted rose.
Hover raises the control slightly; pressing lowers it; selection outlines it
with its category color. Focus has a separate, high-contrast outline.

The existing parchment modal retains its rounded charcoal border, reward
indicators, pink return button, simulation disclaimer and native dialog
lifecycle. The actual selected choice is now the main heading and accessible
dialog name. The generic phrase is secondary. Teal geometric framing,
rounded amber decoration and sharper rose decoration distinguish the three
categories without implying additional effects. Trade-off prose, outcome
IDs, all base deltas, and the modifiers/clamping warning remain unchanged.

Lilita One remains the locally licensed display font; its bundled SIL OFL
license and attribution are untouched. Supporting text uses the existing
system sans-serif stack. HUD captions, seed information, narrative, action
labels, result descriptions, disclosures and instructions are larger and
more consistently spaced. The existing midnight, slate, teal, parchment,
amber, rose, charcoal and ivory palette is retained, with darker text shades
where needed for contrast.

## Responsive and accessibility behavior

Below 1100px the stats occupy a dedicated HUD row. Phone layouts use four
compact stat columns, readable seed wrapping, and stacked choice controls.
The compact emblem is omitted on phones while the game title remains.
Adventure's existing mobile navigation now uses four equal columns and
44px targets, correcting a clipped Settings label without changing Home.
Decorative elements are reduced on phones so the gateway stays recognizable.

The native modal still blocks background interaction, supports Tab/Escape,
restores choice focus, and restores body scrolling. Popups fit within the
viewport; long content can scroll inside the dialog on short screens.
Existing reduced-motion support now also explicitly covers Adventure's
pseudo-elements and popup children. No sound or animation dependency was added.

## Preservation and local-demo safety

App.tsx, styles.css, landing.css, game-data.ts, contracts.ts, App.test.tsx,
Home assets, fonts, dependencies, ABI, addresses and backend files have no
changes from `22571ad`. Home navigation, ENTER THE WILD, CONNECT WALLET,
Character, Settings and canonical ownerOf reads are preserved.

No game state model or rule changed. All six encounters and 18 choices still
use the same deterministic selection and documented base deltas. A preview
only opens local React result state. It does not mutate stats or achievements,
call act or contract preview, request signatures, broadcast transactions,
or save anything. Onchain gameplay remains disabled. No narrative consequence
or numeric reward was invented for this task.

## Validation actually executed

- `npm run typecheck`: passed.
- `npm test`: 29 passed, 0 failed across four files. The 25 existing cases
  remain, with four added checks for explicit demo stats and the three result
  themes, headings, unchanged explanations and return behavior.
- `npm run build`: passed. Existing Rollup annotation warnings in wallet
  dependencies remain nonfatal.
- `git diff --check`: passed; scoped diff reviewed before committing.
- Protected-file comparison against `22571ad`: no changes to App.tsx, shared
  CSS, Home CSS, game data, contract surface or assets.
- Headless Chromium at 1440×900, 1920×1080, 1024×768, 390×844, 360×800
  and 320×740: no horizontal overflow or clipped navigation/choices;
  touch-sized choice controls; loaded local display font; all three result
  themes fit without horizontal overflow; Enter opens results; Escape and
  return buttons close them and restore focus; background focus is blocked.
  No injected wallet requests occurred.
- Home PNG screenshots captured before the Adventure edits and after the
  final polish are byte-for-byte identical at all six sizes. The existing
  Home UTC clock was frozen and reduced motion enabled only in the browser
  harness for reproducible comparison. Home source, animations and assets
  were not edited. Layout/font/color comparison after Back to Home also passed.
- Nine representative new foreground/background color pairs were calculated
  using WCAG relative luminance; all exceeded 4.5:1. This covers category
  captions, result headings, numbered accents and the pink return control,
  rather than constituting a full accessibility audit.

Browser screenshots use the Ancient Gate encounter and all three categories.
Unit tests cover every frozen encounter/choice. Browser coverage is Chromium;
wallet behavior is covered with mocks rather than a real wallet session.
The first expanded clipped-control check measured a stale navigation layout;
the harness now waits for a settled paint before measuring controls.

## Review artifacts and reproduction

Screenshots are in `/tmp/chog-task102/`:

- `before-home-WIDTH.png` / `after-home-WIDTH.png`
- `before-adventure-WIDTH.png` / `after-adventure-WIDTH.png`
- `after-result-WIDTH-cautious.png`
- `after-result-WIDTH-compassionate.png`
- `after-result-WIDTH-reckless.png`

With Vite on 127.0.0.1:5173 and headless Chromium on debugging port 9222,
`node scripts/adventure-smoke.mjs` runs the current smoke checks using Node 22
without additional packages. `CHOG_REVIEW_PHASE=before` captures a baseline;
`CHOG_REVIEW_PHASE=after` compares against those baseline Home screenshots.
The checked baseline in this run was captured before the Adventure edits.
Screenshots are temporary review evidence, not human visual approval.

## Exact local preview instructions

```bash
cd ~/chog-survivor/frontend
npm run dev -- --host 127.0.0.1
```

Open the local URL Vite prints (normally http://127.0.0.1:5173/; use its
printed port if already occupied). Select ENTER THE WILD. Preview each of
the three choices, then select TRY ANOTHER CHOICE or press Escape. Use Back
to Home to return to the approved landing page. No wallet or game deployment
is required; leave existing deployment configuration unchanged.

## Remaining illustration limitations

The existing background remains cinematic artwork rather than a newly drawn
cartoon encounter set. CSS framing, decorative seals, stones and silhouettes
add presentation depth but cannot replace commissioned layered 2D scenes.
Future refinement needs approved encounter-specific environment layers and
an authorized clean-alpha survivor from the existing character-art brief.
No character, bitmap art, stock image, generated image, new font, or sound
was introduced during this task.

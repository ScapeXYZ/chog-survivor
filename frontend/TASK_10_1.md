# Task 10.1 — local Adventure preview

Task 10.1 stops here, awaiting the user's screenshot and visual approval.

## Implementation

The approved Home JSX, ENTER handler, wallet handlers, landing.css, styles.css,
and all existing bitmap assets remain identical to baseline commit 43c275d.
The existing screen state navigation renders Adventure only after entering it.
Back to Home and the existing Home navigation restore the original screen.
Character, Settings, canonical ownerOf reads, and wallet connection are preserved.

Adventure presents a compact HUD, a framed ruined forest with existing artwork
and fog, outlined CSS lanterns and stones, and a parchment decision panel.
Three physical-looking choice buttons open a centered parchment result dialog.
Native modal dialog behavior isolates the background, supports Escape and Tab,
and restores choice focus and body scrolling on return or unmount. Motion is
restrained and disabled for reduced-motion preferences. Mobile stacks choices
and compacts the HUD rather than shrinking text.

The display face is locally bundled Lilita One (SIL OFL 1.1); supporting text
uses the system sans-serif stack. All added selectors target Adventure.
Palette: midnight #17232D, slate #293B46, teal #77999C, parchment #EEDFC5,
amber #E0A943, rose #CB5C72, charcoal #202126, ivory #F5EDE0.

The six frozen events, three labels per event, tags, base deltas and outcome
IDs match GAME_RULES.md. Encounter selection uses its packed keccak formula
with the selected token (or clearly labeled demo token 0) and device UTC day.
Narratives set the scene only; consequence explanations paraphrase documented
trade-offs, as the rulebook has no approved story-consequence text.

Previews use only React state, never call contract preview or act, never sign
or send transactions, and never change stats, achievements or canonical NFT
progress. Rewards are explicitly rulebook base deltas before history modifiers
and clamping, not calculated effective rewards. The HUD and chronicle clearly
label the existing fixture as simulated. The onchain action remains disabled.
An open result snapshots its encounter across UTC rollover.

## Changed files

- src/App.tsx: Adventure component integration and screen-specific shell class.
- src/Adventure.tsx: HUD, scene, choices, modal and local preview lifecycle.
- src/adventure.css: scoped presentation, responsive layouts, reduced motion.
- src/game-data.ts: frozen tags/base deltas, narratives, trade-offs and seed formula.
- src/Adventure.test.tsx: navigation, wallet preservation, 18 rulebook choices,
  popup/focus/reset/unmount behavior, rollover and no-write assertions.
- src/assets/fonts/LilitaOne-Regular.ttf and OFL.txt: local display font and license.
- scripts/adventure-smoke.mjs: dependency-free Chromium DevTools smoke checks.
- ASSET_INVENTORY.md and TASK_10_1.md: font provenance, art gaps and this report.

## Validation actually executed

- npm run typecheck: passed.
- npm test: 25 passed, 0 failed in 4 files.
- npm run build: passed; existing dependency annotation warnings from wallet
  dependencies remain, with no build failure.
- git diff --check: passed.
- Baseline source comparison: Home JSX, ENTER and wallet handlers identical;
  landing.css, styles.css and contracts.ts have no diff.
- Headless Chromium: 1440×900, 1920×1080, 1024×768, 390×844, 320×740.
  No Adventure horizontal overflow; three touch-sized choices; local display
  font loaded; Enter opens popup; native modal blocks background focus; Tab
  stays isolated; popup fits viewport; Escape restores focus; Home layout,
  colors and fonts unchanged after return. No injected wallet requests occurred.

The browser checks run with reduced motion for stable layout comparisons.
Snapshots require a settled paint after navigation and viewport changes;
the first test-harness attempts measured stale layout and were corrected.
Screenshots are in /tmp/chog-adventure-WIDTH.png and /tmp/chog-result-WIDTH.png.
These are review artifacts, not user visual approval. Browser coverage is
Chromium only; unit tests mock wallet hooks rather than exercising a real wallet.

To rerun browser checks, start Vite at 127.0.0.1:5173 and a local headless
Chromium with --remote-debugging-port=9222. Then run
`node scripts/adventure-smoke.mjs` from frontend. The script uses Node 22's
built-in WebSocket and writes temporary screenshots; no extra dependency or
wallet is required.

## Exact local preview instructions

```sh
cd ~/chog-survivor/frontend
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173/ (or the port Vite prints). Click ENTER THE WILD.
Click any Preview Choice, inspect its base trade-off, and select TRY ANOTHER
CHOICE or press Escape. Try the other two choices. Back to Home returns to
the approved landing screen. Character and Settings remain in the top navigation.
No wallet or game address is required; leave the deployment configuration unchanged.

## Limitations and next artwork needs

There is no saved local progression, live game action, full effective reward
calculation, or fabricated daily eligibility. Repeated choices intentionally
reset the popup without incrementing stats. Device time is a demo seed, not
authoritative chain time.

The existing cinematic environment is reused rather than replaced. Dedicated
approved hand-illustrated scene layers for each encounter and an authorized
clean-alpha survivor are still needed for a fully illustrated production game.
See ASSET_INVENTORY.md and docs/CHOG_CHARACTER_ART_BRIEF.md. No character art
was generated, modified or introduced into Adventure. No APIs, contracts,
addresses, ABI, Solidity, Foundry, deployment or signing behavior changed.

# Task 4Q — Public demo technical blockers

Date: 2026-10-15. Task 4P report reviewed. No deployment, push, commit, blockchain transaction, Anvil reset, asset replacement or dependency installation was performed.

## Fix and source of the literals

Both production bundle occurrences of `http://127.0.0.1:8545` originated in `frontend/src/contracts.ts`: the unconditional `localAnvil` chain metadata and the explicitly configured local transport. Production now guards local metadata and validation with the existing build-time `VITE_CHOG_ENV === 'local'` switch. Vite eliminates those branches in the public build. Both HTTP transport factories resolve the active configured chain's default URL rather than duplicating the local endpoint in an unconditional argument.

Local mode still requires the same exact loopback URL, valid local game address and explicit local environment selection. It still selects chain 31338 and resolves its transport to the original Anvil endpoint. Production selects only chain 143, retains existing public read behavior, and never enables a game address. Contract ABIs, addresses, authorization, daily lock, rewards and gameplay are unchanged. The exported local-chain placeholder aliases the production chain outside local mode so unused local metadata is not constructed.

Regression assertions verify configured chain lists and resolved client transport URLs in production and local mode. Existing fail-closed tests for invalid local configuration remain intact.

## Verification results

| Verification | Final result |
|---|---|
| Full suite with existing `.env.local` selecting local Anvil | 22 files passed; 373 passed, 0 failed, 0 skipped |
| Full suite with explicit production/demo overrides | 22 files passed; 373 passed, 0 failed, 0 skipped |
| TypeScript `npm run typecheck` | Passed |
| Explicit production build, including TypeScript | Passed |
| Production-artifact Chromium, external requests blocked | 49 passed, 0 failed |
| Production-artifact Chromium, existing Google Fonts allowed | 49 passed, 0 failed |
| `git diff --check` and new-file whitespace checks | Passed |

The initial attempt to run both suites alongside the build caused import timeouts (372 passed/1 failed in each suite). Final runs were serialized between suites and passed without changing timeouts or weakening assertions. An intermediate transport typing error was corrected before final verification. One initial test command was invoked from the repository root, which has no npm package; no tests ran there. Results above come from the frontend directory.

Build retains existing vendor PURE-annotation and large-chunk warnings. No clean dependency installation, real wallet transaction or actual provider deployment was tested.

The strengthened `frontend/scripts/public-demo-preflight.mjs` scans the artifact before opening Chromium for loopback URLs, common private-key/credential patterns, standard public Anvil mnemonic, credential-bearing URLs, environment files and source maps. It also checks all four screens at 320, 375, 768 and 1440px, image loading, no page overflow, demo labels, all three current interactions' Skip-to-preview flow, absence of wallet confirmation/injected wallet, bundled Adventure display font, existing license text, browser errors and RPC requests. Reduced motion is enabled. This smoke test does not claim all-encounter completion coverage; the full frontend suite covers interaction behavior.

A separate text scan of all built JS/CSS/HTML/license files found:

- Zero `localhost`, `127.0.0.1` or `[::1]` mentions.
- Zero private LAN HTTP(S) URLs, configured local game address, tested private credential patterns or standard Anvil mnemonic.
- No environment files or source maps in the artifact.

These scans are bounded checks, not proof against every possible secret. Only approved `frontend/dist` content should be hosted. Never upload the workspace or `.env.local`.

## Artwork provenance and clearance

Reviewed `frontend/ASSET_INVENTORY.md`, `docs/CHOG_CHARACTER_ART_BRIEF.md`, Task 4K staging plan and Task 4M provenance findings. The inventory attributes runtime illustration assets to original Codex image-generation output during Tasks 9A.3/9A.6, but explicitly marks them provisional and not release-approved. Recorded origin is not public-release permission or Chog branding permission. No new grant was found in the reviewed project records.

| Asset | Runtime use | Required clearance |
|---|---|---|
| `frontend/src/assets/ruined-wild-environment-provisional.webp` | Home and reused Adventure environment | Rights/IP review and explicit public-release approval |
| `frontend/src/assets/moonlit-fog-overlay-provisional.webp` | Runtime fog overlay | Rights/IP review and explicit public-release approval |
| `frontend/src/assets/survivor-creature-refined-provisional.webp` | Runtime Home survivor | Rights/IP review, Chog likeness/branding clearance and explicit release approval; do not call it official collection art |
| Same three basenames with `.png` extensions | Source artwork, absent from public artifact | Same clearance before source/repository/media redistribution |
| `frontend/src/assets/survivor-creature-provisional.webp` and `.png` | Superseded, non-runtime draft | Rights/IP and branding clearance before redistribution |
| `design/chog-parchment-reference.png` | Non-runtime layout reference; JPEG data despite extension | Source/creator/license and redistribution permission unresolved |
| `design/chog-identity-reference.png` | Non-runtime visual reference | Collection artwork/likeness permission and source redistribution rights; reference inspection grants no license |
| `design/chog-landing-reference.pdf` | Non-runtime visual reference | Source and embedded character-art redistribution permission; reference inspection grants no license |

Screenshots/video/evidence containing provisional assets need corresponding clearance. Private backup or a Git commit grants no rights. The three runtime WebP files remain in the build for local verification only; **do not publicly deploy them before approval**. No asset was removed, replaced, generated or published. Existing CSS/SVG interface illustration was not changed. The existing local Lilita One font retains its SIL OFL notice; all established font imports, families, weights and typography remain unchanged.

## Walletless simulation and deployment boundary

Home still explicitly labels LOCAL DEMO and the absence of an approved game deployment. Adventure marks stats unsaved and preview values simulated, explains no signature/on-chain submission, and disables the on-chain action. The three choices and Skip work without an injected wallet or network RPC. Simulated previews do not establish genuine progression, journal or transfer continuity. Existing real local evidence remains separate.

Use Task 4P's exact Vercel settings: root `frontend`, Vite, Node 22.x, install `npm ci`, output `dist`, origin-root hosting and this explicit build command:

```sh
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
```

Keep local values and private credentials out of Vercel settings. This is still necessary because `.env.local` can affect Vite builds. Navigation remains state-based; no new path routes or rewrites were introduced. No hosting service was contacted or configured.

**Remaining release blockers:** runtime artwork/branding clearance, approval of the exact Vercel artifact/destination, and post-deployment verification of the actual public URL without an authentication wall. The loopback-literal technical blocker from Task 4P is resolved for the explicitly configured public build.

## Files changed for Task 4Q

- `frontend/src/contracts.ts`: build-time guard and default-chain transport resolution.
- `frontend/src/contracts.test.ts`: production/local transport regression assertions.
- `frontend/scripts/public-demo-preflight.mjs`: artifact exposure regression checks; this file already existed untracked from Task 4P.
- `docs/TASK_4Q_TECHNICAL_PREFLIGHT.md`: this report.

Existing untracked Task 4O/4P reports were preserved. Generated build output remains ignored. Stop before deployment.

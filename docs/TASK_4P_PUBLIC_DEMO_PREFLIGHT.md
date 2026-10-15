# Task 4P — Public judge demo preflight

Date: 2026-10-15. Reviewed revision: `b3f96e0` plus the existing untracked Task 4O report. Read Task 4J, Task 4K preparation/staging, Task 4O and the existing deployment guide. No deployment, publication, commit, push, transaction or Anvil change was performed.

## Decision

The explicitly configured production artifact works as a walletless simulation without Anvil, a wallet extension or RPC connectivity. **Public release remains blocked by artwork clearance.** Two inactive loopback URL literals remain in shared chain configuration: a strict requirement for zero internal URL strings is not satisfied. No application changes were made to remove them; approve a separate narrowly scoped configuration cleanup if literal removal is required.

The simulation does not demonstrate real persistent progression, confirmed reactions, achievements, journal or transfer continuity. Use the clearly distinguished existing local verification evidence for those claims. Task 4O's testnet blockers do not prevent static simulation hosting.

## Verification performed

| Check | Actual result |
|---|---|
| Explicit production build, including TypeScript project build | Passed |
| Artifact Chromium, all external requests blocked | 46 passed, 0 failed |
| Artifact Chromium, existing Google Fonts allowed and other external services blocked | 46 passed, 0 failed |
| Navigation and image checks | Home, Adventure, Character, Settings at 320, 375, 768 and 1440px; no page overflow or broken image elements |
| Simulation preview | All three current choice cards open their interaction; Skip reaches explicit simulation disclosure; no local-action confirmation button |
| Browser dependencies | No injected `window.ethereum`; no RPC requests; no uncaught page errors or missing runtime responses |
| Font checks | Bundled Adventure display font available; license text matches source after trailing whitespace normalization; online pass loaded existing Cinzel and IM Fell English faces |
| Artifact scan | No tested private-key assignments, PEM keys, standard Anvil mnemonic, configured local game address or private LAN URLs found |
| Diff whitespace | `git diff --check` passed; new files also checked separately |

These are smoke checks of the built artifact, not a new full gameplay/unit regression run. They exercise Skip for all three types, rather than claiming completion coverage for every encounter. Reduced motion was enabled. No real wallet or transaction was used. Google Fonts contain unused/lazy faces, so not every declared face downloaded; no font family, import or typography was changed. Offline browsers retain existing fallback behavior. Existing external font origins must remain allowed by hosting policy.

Build warnings: existing vendor PURE annotation warnings and approximately 560 kB main JS chunk; build succeeded. No dependency installation or upgrade was needed. The output contains nine files: HTML, two JS chunks, CSS, three runtime WebP images, local TTF and font license; no source maps, environment files or documentation/evidence are included.

Reproducible checks from repository root, after building:

```sh
node frontend/scripts/public-demo-preflight.mjs
node frontend/scripts/public-demo-preflight.mjs --allow-fonts
git diff --check
```

Requires installed Playwright Chromium and permission to bind the temporary static server on 127.0.0.1:5190. That server only hosts the artifact; application RPC requests to Anvil are neither needed nor permitted. Temporary screenshots: `/tmp/chog-4p-desktop.png` and `/tmp/chog-4p-mobile.png`. The script fails on missing assets, page errors or any attempted external service other than existing Google font origins. It is a smoke test, not an exhaustive security scanner.

## Disclosure and safety

Home explicitly states “LOCAL DEMO” and that no approved game deployment exists. Adventure marks demo stats as unsaved, describes simulation-only base values, and says no wallet signature or on-chain action occurs. The on-chain action is disabled. “LOCAL” describes the existing mode label and is not evidence that a publicly hosted page needs localhost.

`frontend/src/contracts.ts` still defines local-chain metadata and a local transport alongside the production chain. Consequently `http://127.0.0.1:8545` occurs twice in the minified main bundle. These are public defaults, not credentials; neither was requested during walletless browser checks. The production artifact excludes the configured local game address. Optional genuine NFT reads/wallet connection are distinct from this walletless simulation and can require the existing public Monad RPC. Do not expose Anvil or provide private RPC credentials.

All `VITE_*` values are browser-visible. The scan is bounded and does not prove the absence of every possible secret. Only `dist` is website content. Never upload `.env.local`, workspace files, development scripts, private credentials, local blockchain state or the whole repository as static files.

## Artwork requiring release approval

The asset inventory explicitly limits these runtime assets to provisional local development:

- `ruined-wild-environment-provisional.webp`.
- `moonlit-fog-overlay-provisional.webp`.
- `survivor-creature-refined-provisional.webp`, including Chog branding/IP clearance.

Their source PNGs, superseded creature art and screenshots containing them require corresponding clearance before repository/video/evidence publication. Existing private GitHub backup does not grant release rights.

`design/chog-parchment-reference.png` is an unresolved-rights layout reference, actually JPEG data despite its extension. It has no runtime import and is absent from the built artifact. Do not publicly distribute it without provenance/permission. The local Lilita One font has the existing SIL OFL notice in the artifact; keep it. No artwork was replaced or generated.

## Exact Vercel proposal — approval required before execution

| Setting | Value |
|---|---|
| Source | Existing private GitHub repository; select the approved revision only |
| Root directory | `frontend` |
| Framework | Vite |
| Node.js | 22.x (local verification: 22.23.2) |
| Install command | `npm ci` |
| Build command | Explicit production command below |
| Output directory | `dist` relative to `frontend` |
| Hosting path | Origin root `/` |
| Required public env | `VITE_CHOG_ENV=production` in both Preview and Production |
| RPC credentials / signing keys | None |

```sh
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
```

This is the exact command verified here. Empty Monad RPC uses the existing public default for optional reads; it is not required for simulation. Do not set local variables or a purported production game address. Remove inherited local/private RPC settings from both hosting environments. Vite also loads `.env.local` during production builds, so explicit overrides matter; no local env file should be uploaded. Clean-checkout `npm ci` was not rerun in this preflight.

No Vercel configuration file exists or is needed for the current navigation. Screens use React state rather than URL paths. `/` loads Home; reload resets navigation. `/adventure` and `/character` are not supported screen deep links. The artifact was tested with a strict file server, without SPA fallback. Do not advertise nonexistent deep links or introduce routing changes for this release. If path routing is added later, review provider SPA rewrites separately. No functions/backend, Anvil tunnel or contract deployment is required.

After artwork clearance, approve the exact revision/artifact, Vercel account/project, public visibility and environment before connecting/importing the repository: import may deploy immediately. A private source repository can remain private. After an authorized deployment, verify the exact stable HTTPS production URL from an unauthenticated browser and another network. Deployment protection must not prevent judge access. Recheck assets/fonts, disclosures and walletless navigation on the actual provider; these provider-specific checks cannot be completed before deployment.

Official configuration references checked: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel build settings](https://vercel.com/docs/builds/configure-a-build), [deployment protection](https://vercel.com/docs/deployment-protection), [Vite environment loading](https://vite.dev/guide/env-and-mode).

## Remaining blockers and next approval

1. Obtain explicit runtime artwork and branding release clearance. No public upload is currently approved by the asset inventory.
2. Decide whether to accept inactive public loopback defaults or authorize their removal from the public bundle. This audit does not claim zero internal URL literals.
3. Approve one concrete Vercel destination, artifact/revision and public deployment. Then perform actual hosted URL/authentication checks.

Optional polish: existing “Local MVP” document title and “LOCAL DEMO” label could be made clearer for a hosted simulation in a separately approved copy-only task. They currently disclose simulation and do not prevent play. No feature expansion, testnet deployment or Hall of Fame is needed for this preflight.

Changes for Task 4P: this report and `frontend/scripts/public-demo-preflight.mjs` only. Existing untracked `docs/TASK_4O_MONAD_TESTNET_READINESS.md` was preserved. Generated `frontend/dist` remains ignored. Contracts, fonts, gameplay, rewards, configuration and deployment scripts were not edited.

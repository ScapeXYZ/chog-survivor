# Task 4K — safe staging and release plan

This is a review list, **not a staging command**. No `git add`, commit, push, remote setup, publication or deployment was performed. Avoid `git add .` and `git add -A`; stage only individually reviewed paths after authorization. Baseline before Task 4K: 15 modified tracked files and 29 untracked entries (including Task 4J report), no staged changes or configured Git remote.

## Required untracked source and tests

The current runtime imports these recent components/helpers/styles; their tests and retained pure engines must be included in the reviewed source revision. None is generated build output. Crown engine files remain because the existing test suite covers them; they do not reintroduce a Crown UI. For a complete tested checkout, review the full list:

```text
frontend/src/AdventureOwnership.test.tsx
frontend/src/ConfirmedSurvivorReaction.tsx
frontend/src/LocalContractAdventure.test.tsx
frontend/src/MiniGamePanel.test.tsx
frontend/src/MiniGamePanel.tsx
frontend/src/NewOwnerNotice.tsx
frontend/src/SurvivorJournal.test.tsx
frontend/src/SurvivorJournal.tsx
frontend/src/SurvivorTrial.test.tsx
frontend/src/SurvivorTrial.tsx
frontend/src/adventureSession.ts
frontend/src/crownChallenge.test.ts
frontend/src/crownChallenge.ts
frontend/src/mini-game-data.test.ts
frontend/src/mini-game-data.ts
frontend/src/mini-game.css
frontend/src/survivor-trial.css
frontend/src/survivorReflection.test.ts
frontend/src/survivorReflection.ts
frontend/src/survivorTrial.test.ts
frontend/src/survivorTrial.ts
frontend/src/useAdventureAvailability.test.tsx
frontend/src/useAdventureAvailability.ts
frontend/src/useAdventureDialog.ts
frontend/src/useSurvivalHistory.test.tsx
```

## Existing modified tracked files requiring review

These predate Task 4K and are **not all newly changed by this task**. They carry earlier gameplay, ownership, journal and QA work; review them with their associated new files before creating a release revision:

```text
frontend/scripts/adventure-smoke.mjs
frontend/scripts/task12-e2e.mjs
frontend/src/Adventure.test.tsx
frontend/src/Adventure.tsx
frontend/src/App.tsx
frontend/src/Character.tsx
frontend/src/LocalContractAdventure.tsx
frontend/src/SurvivorJourney.test.tsx
frontend/src/adventure.css
frontend/src/character.css
frontend/src/contracts.test.ts
frontend/src/survivalHistory.test.ts
frontend/src/survivalHistory.ts
frontend/src/useSurvivalHistory.ts
frontend/vite.config.ts
```

Task 4K additionally updates `README.md`, `frontend/README.md`, `frontend/.env.example` and `docs/HACKATHON_SUBMISSION_DRAFT.md` as documentation only. Do not stage an outdated entrypoint while omitting its untracked imports.

## Documentation, evidence and license additions

Review these explicit paths for a preparation revision:

```text
docs/TASK_4J_JUDGE_ACCESS_AUDIT.md
docs/JUDGE_QUICK_START.md
docs/DEMO_DEPLOYMENT_GUIDE.md
docs/DEMO_VIDEO_OUTLINE.md
docs/TASK_4K_STAGING_PLAN.md
docs/TASK_4K_PREPARATION.md
docs/evidence/task4h-2006/README.md
docs/evidence/task4h-2006/verification.json
docs/evidence/task4h-2006/SHA256SUMS.json
frontend/public/licenses/LilitaOne-OFL.txt
```

`verification.json` is a curated allowlist from the completed real Task 4H record, not a mock result. `SHA256SUMS.json` verifies the evidence payload bytes. Only public development addresses, receipts/logs and state are retained. Absolute workstation paths, browser profiles, seed phrases, private keys, execution scripts and the temporary directory are excluded. The public font notice preserves the already bundled OFL text (Task 4L normalizes two original trailing spaces for a clean Git whitespace check); no font file or typography changed.

## Browser tooling — separate review

- `frontend/scripts/mini-game-integration-smoke.mjs`: required to reproduce the documented 515-check mock browser regression; intercepts RPC/wallet calls and starts local Vite servers. Safe from live-chain writes; review before inclusion.
- `frontend/scripts/task4h-real-anvil-e2e.mjs`: optional historical verification harness; can submit real transactions when execution flags are supplied. Not needed to serve the app. Include only after explicit tool/source review, clearly retaining its execution safeguards; never run it as a build or generic smoke check.
- Existing tracked `frontend/scripts/task12-e2e.mjs` contains the standard public Anvil development mnemonic and can mutate local state. It is not a production secret, but never reuse/fund those credentials; do not execute it during preparation. Its changes remain in the tracked-review list above.

## Artwork and screenshots requiring release approval

| Asset | Use | Pending decision |
|---|---|---|
| `frontend/src/assets/ruined-wild-environment-provisional.webp` and source PNG | Runtime Home/Adventure background | Asset inventory says provisional/not release-approved; obtain sign-off for public app/repo/video. |
| `frontend/src/assets/moonlit-fog-overlay-provisional.webp` and source PNG | Runtime fog | Same pending release status. |
| `frontend/src/assets/survivor-creature-refined-provisional.webp` and source PNG | Runtime survivor | Same pending status; not authentic Chog art or proof of branding permission. |
| `frontend/src/assets/survivor-creature-provisional.webp` and source PNG | Superseded non-runtime draft | Not required for hosting; assess repository redistribution separately. |
| `docs/evidence/task4h-2006/confirmed-reaction.png` | Recorded real reaction | Contains the existing provisional artwork; retain locally for review, gate public release. |
| `docs/evidence/task4h-2006/inherited-journal.png` | Recorded inherited journal | Same screenshot/artwork release review. |
| `docs/evidence/task4h-2006/wallet-a-daily-lock.png` | Recorded inherited daily lock | Same screenshot/artwork release review. |
| `design/chog-parchment-reference.png` | Untracked design reference, not runtime | Not required for the app; leave out of the proposed staging set pending provenance/redistribution review. |

The three curated screenshot paths above are **conditional evidence additions**, not cleared publication assets. They are unchanged captures, not newly generated or replacement artwork. The app's existing artwork is already tracked but that does not resolve its recorded release status. See `frontend/ASSET_INVENTORY.md`; this plan is not a legal clearance.

## Exclude from staging and hosting

- `.env`, `.env.local`, all non-example env files, wallet state, keystores, keys, mnemonic exports, private API credentials and browser profiles.
- `node_modules/`, `.venv-security/`, `frontend/dist/`, `out/`, `cache/`, `broadcast/`, Anvil data and compiler/build-info outputs. Host only the approved built `dist` files; do not commit that generated folder.
- Temporary `/tmp` logs/scripts/screenshots, new bulk generated reports, duplicate source screenshots and unreviewed binaries. Existing tracked historical evidence is not blanket authorization to add every report.
- Do not stage newly generated deployment or contract artifacts. Do not change contracts, rewards, addresses, UTC rules, fonts or authorizations as “release cleanup.”

`.gitignore` already excludes common env, dependencies, builds and reports. Git ignore does not protect a previously tracked secret. Every `VITE_*` value ships to the browser.

## Pre-publication security and reproducibility gate

1. Review each explicit path; verify all runtime imports, docs links and evidence hashes in a complete checkout.
2. Run dedicated release/history secret scanning before publication; Task 4K's heuristic scan is limited, not a certification. Recognize the documented public Anvil test seed separately from actual credentials. Do not print candidate secret values in logs.
3. Build using explicit production/demo environment overrides and the existing lockfile; run both suites, typecheck and mock browser checks.
4. Confirm screenshots/app artwork release status, unchanged font notices and exact source revision. Check `git diff --cached` remains empty until staging is authorized.
5. Obtain approval before staging/committing if requested as a next step, and separately before pushing/publishing/deploying. This task prepares the list only.

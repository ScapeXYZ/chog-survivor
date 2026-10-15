# Task 4L — GitHub backup preparation and local commit

Date: October 15, 2026. Branch: `main`. Existing history is preserved; the new commit is a normal descendant of `edd5be3`. No history rewrite, reset or force-push is authorized or performed.

## Destination and push status

No Git remote is configured. GitHub read-only authentication identified `ScapeXYZ`; `ScapeXYZ/chog-survivor` returned HTTP 404. No suitable authorized private destination could be verified (404 can mean absent or inaccessible). Under Task 4L, do not create a repository automatically. A local reviewed backup commit is prepared; **no GitHub push or off-machine backup has occurred**. Read its exact hash with `git log -1 --format=%H` after commit.

To create the private destination and push after the owner chooses to run the requested setup commands:

```sh
cd /home/temitope/chog-survivor
gh repo create ScapeXYZ/chog-survivor --private --source=. --remote=origin
gh repo view ScapeXYZ/chog-survivor --json visibility,url
# Verify visibility is PRIVATE before the next command.
git push --set-upstream origin main
```

These commands were not executed. If creation reports an existing/inaccessible repository or origin already exists, stop and verify its ownership, visibility and history rather than overwriting it. Default `git push` refuses non-fast-forward updates; never add `--force`. No public repository, deployment or chain write is included.

## Reviewed files

This commit collects previously approved uncommitted Adventure/mini-game, ownership, reaction/journal, eligibility-refresh, test isolation and submission preparation work, together with tests, license notice and local evidence. All existing tracked artwork remains in history. The local evidence screenshots are retained for private backup/review, not public release clearance. The historical real-Anvil harness is retained as reviewed source with its explicit execution flag/chain/owner/transaction guards; it was not run.

Task 4L's only source addition is two warning comments identifying the standard public Anvil test mnemonic in `frontend/scripts/task12-e2e.mjs`; it does not alter execution. Two trailing spaces in the copied public font license notice were removed for clean staged whitespace checks, preserving the full copyright/license text; no font file was modified. Current README/staging/deployment language reflects that text-preserving normalization. Task 4K's byte-identity checks remain historical records of that earlier preparation.

Explicit commit paths:

```text
README.md
docs/DEMO_DEPLOYMENT_GUIDE.md
docs/DEMO_VIDEO_OUTLINE.md
docs/HACKATHON_SUBMISSION_DRAFT.md
docs/JUDGE_QUICK_START.md
docs/TASK_4J_JUDGE_ACCESS_AUDIT.md
docs/TASK_4K_PREPARATION.md
docs/TASK_4K_STAGING_PLAN.md
docs/TASK_4L_GITHUB_BACKUP.md
docs/evidence/task4h-2006/README.md
docs/evidence/task4h-2006/SHA256SUMS.json
docs/evidence/task4h-2006/confirmed-reaction.png
docs/evidence/task4h-2006/inherited-journal.png
docs/evidence/task4h-2006/verification.json
docs/evidence/task4h-2006/wallet-a-daily-lock.png
frontend/.env.example
frontend/README.md
frontend/public/licenses/LilitaOne-OFL.txt
frontend/scripts/adventure-smoke.mjs
frontend/scripts/mini-game-integration-smoke.mjs
frontend/scripts/task12-e2e.mjs
frontend/scripts/task4h-real-anvil-e2e.mjs
frontend/src/Adventure.test.tsx
frontend/src/Adventure.tsx
frontend/src/AdventureOwnership.test.tsx
frontend/src/App.tsx
frontend/src/Character.tsx
frontend/src/ConfirmedSurvivorReaction.tsx
frontend/src/LocalContractAdventure.test.tsx
frontend/src/LocalContractAdventure.tsx
frontend/src/MiniGamePanel.test.tsx
frontend/src/MiniGamePanel.tsx
frontend/src/NewOwnerNotice.tsx
frontend/src/SurvivorJournal.test.tsx
frontend/src/SurvivorJournal.tsx
frontend/src/SurvivorJourney.test.tsx
frontend/src/SurvivorTrial.test.tsx
frontend/src/SurvivorTrial.tsx
frontend/src/adventure.css
frontend/src/adventureSession.ts
frontend/src/character.css
frontend/src/contracts.test.ts
frontend/src/crownChallenge.test.ts
frontend/src/crownChallenge.ts
frontend/src/mini-game-data.test.ts
frontend/src/mini-game-data.ts
frontend/src/mini-game.css
frontend/src/survivalHistory.test.ts
frontend/src/survivalHistory.ts
frontend/src/survivor-trial.css
frontend/src/survivorReflection.test.ts
frontend/src/survivorReflection.ts
frontend/src/survivorTrial.test.ts
frontend/src/survivorTrial.ts
frontend/src/useAdventureAvailability.test.tsx
frontend/src/useAdventureAvailability.ts
frontend/src/useAdventureDialog.ts
frontend/src/useSurvivalHistory.test.tsx
frontend/src/useSurvivalHistory.ts
frontend/vite.config.ts
```

## Exclusions and security review

- Leave `design/chog-parchment-reference.png` untracked: non-runtime design reference with unresolved provenance/redistribution status, excluded by the reviewed staging plan. This backup is complete for the runnable source, tests, required artwork and documentation; it intentionally excludes that reference and machine-specific/private/generated data.
- No `.env.local`, private keys, wallet credentials, node data, Anvil state, `node_modules`, `dist`, Foundry output/cache/broadcast or temporary working files are added. Existing `.gitignore` already covers common env/key/build paths; no settings were changed.
- Source and reachable-history pattern scans found no non-fixture PEM keys, provider tokens or literal key assignments. Manual classification found the known public Anvil test mnemonic in the local E2E harness and known public mnemonic/key fixtures in vendored `forge-std` tests. They are development-only, not private production credentials; never fund/reuse them on public networks. Secret values are not reproduced here.
- The scan covers tracked/candidate text and reachable Git history but is heuristic, not a dedicated scanner certification. Binary secrets, unknown formats, unreachable objects and external credentials are not exhaustively audited. No scanner/dependency was installed.
- Largest current candidate file is approximately 3.76 MB. No current candidate or reachable historical blob exceeds 50 MiB; Git LFS is not required for current size limits.
- Artwork and screenshots retain unresolved **public release** status per `frontend/ASSET_INVENTORY.md` and Task 4K staging plan. A private development backup does not grant public art/branding redistribution rights.
- Frozen game contract hash remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`. No gameplay, contract, NFT address, reward, daily lock, font or authorization was changed by Task 4L.

## Verification before staging/commit

- Current local-environment frontend suite: **373 passed, 0 failed, 0 skipped**, 22 files.
- Explicit production/demo environment frontend suite: **373 passed, 0 failed, 0 skipped**, 22 files.
- Production/demo build: passed. Existing dependency PURE annotation and approximately 560 kB main JS chunk warnings remain non-blocking.
- TypeScript: passed, `npm run typecheck`.
- `git diff --check`: passed; staged whitespace/security/exclusion checks must pass before commit.
- No transaction-capable browser harness was executed; no live Anvil access or modification was needed.

## Remaining risks

GitHub backup is incomplete until the owner provides/creates a private destination and the normal push succeeds. Keep the local working directory and commit safe in the meantime. Artwork permission, final dedicated secret scanning and public demo/repository/video release approval remain separate future gates. Re-create ignored local env settings from the example/guide on a new machine; private settings and live Anvil state are deliberately not backed up in Git.

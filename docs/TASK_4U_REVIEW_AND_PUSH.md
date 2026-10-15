# Task 4U — Reviewed Vercel preparation revision

Date: 2026-10-15. The user explicitly authorized review, selective staging, commit with `chore: prepare Chog Survivor Vercel demo`, and a non-force push to `origin/main`. Vercel deployment and blockchain transactions remain prohibited.

## Review scope

Read Task 4T and the existing Task 4K staging plan. Reviewed every modified/untracked file: deployment guide, frontend environment/transport guard and regression assertions, production-artifact preflight script, Vercel JSON, and Tasks 4O–4T reports. No other uncommitted files were present at the start. Remote `main` was checked live at `b3f96e0ee20f8da143ee8fa72d95b4d212821b6b`, identical to local HEAD; there were no unpushed commits before this task. GitHub reports `ScapeXYZ/chog-survivor` as private with default branch `main`; visibility is not changed by this task.

The reviewed frontend change removes local-only metadata/literals from public builds while retaining exact Anvil chain/transport selection in explicit local mode. No contract ABI, NFT address, game rule, reward, wallet authorization, artwork, font or typography is changed. Prior Tasks 4Q/4T passed both 373-test environments; this task reran the requested build/security checks and the artifact Chromium smoke against unchanged frontend source.

## Exact inclusion and exclusions

Include only `.gitignore`, `docs/DEMO_DEPLOYMENT_GUIDE.md`, reports `docs/TASK_4O_MONAD_TESTNET_READINESS.md`, `TASK_4P_PUBLIC_DEMO_PREFLIGHT.md`, `TASK_4Q_TECHNICAL_PREFLIGHT.md`, `TASK_4R_ARTWORK_RELEASE_AUDIT.md`, `TASK_4S_ARTWORK_PROVENANCE.md`, `TASK_4T_VERCEL_PREPARATION.md`, this report, `frontend/src/contracts.ts`, `frontend/src/contracts.test.ts`, `frontend/scripts/public-demo-preflight.mjs` and `frontend/vercel.json`.

The existing tracked `frontend/scripts/dependency-security-check.mjs` is already present in the base revision and remains unchanged. Security/audit reports and the artifact preflight are included without installing or upgrading dependencies.

To satisfy the explicit exclusion of unresolved non-runtime reference artwork, remove these three paths **from the new Git tree only**, using `git rm --cached`, and add exact root-relative ignore entries:

- `design/chog-identity-reference.png`
- `design/chog-landing-reference.pdf`
- `design/chog-parchment-reference.png`

Their local bytes are preserved. They were already pushed in earlier commits and remain in existing remote history; this task does not purge historical content or imply public redistribution clearance. No force push/history rewrite is authorized or needed. Existing runtime artwork and its source files remain unchanged; artwork/branding clearance is still required before public hosting or broader publication.

No `.env`/`.env.local`, secret/key file, dependency directory, build output, compiler artifact, browser state or local Anvil state is included in the reviewed changes. Existing example env templates are unchanged. Temporary verification files remain under `/tmp`; `frontend/dist` remains ignored. No live local-chain harness is run.

## Verification before staging

| Check | Result |
|---|---|
| Production build using exact `frontend/vercel.json` command | Passed, including TypeScript; existing annotation/chunk warnings only |
| Offline dependency security and compatibility check | 73 passed |
| Registry-backed `npm audit --json` | Exit 0; zero vulnerabilities at all severities |
| Production-artifact Chromium, all external requests blocked | 49 passed, 0 failed; no RPC dependence, missing assets or uncaught errors |
| Working-tree / reachable-history secret pattern scan | No candidate secrets found across 235 reviewed working paths and 325 reachable Git blobs |
| `git diff --check` | Passed |

Secret checks cover PEM private keys, AWS access IDs, GitHub/OpenAI token formats, private-key/secret assignments and credential-bearing URLs without logging values. The known public Anvil test mnemonic occurs in the pre-existing local harness, vendored Foundry tests and the new preflight's detection regex; these are documented fixture/detector literals, not production credentials. The artifact preflight rejects that mnemonic in the public bundle. This bounded scan is not an exhaustive secret-scanner certification.

Network checks initially failed on sandbox DNS and were rerun with approved network access. Chromium used an approved temporary local static server/headless browser. No security assertion failed or was weakened. Local result files: `/tmp/chog-4u-build.log`, `-npm-audit.json`, `-chromium.json`, `-secret-scan.json`, `-preservation.json` (all prefixed `/tmp/chog-4u`).

Before committing, inspect the exact staged file list/diff, reject prohibited additions, repeat staged whitespace/secret checks, and compare preserved artwork/font/contract/local-env hashes. Push only the reviewed commit to `origin/main`, without force. The final task response records the actual resulting commit and push status; this pre-commit report does not preclaim success.

No Vercel project was imported, linked or deployed. No repository visibility change, blockchain transaction, Anvil reset or on-chain state mutation was performed. Runtime artwork/branding clearance and a separately authorized concrete Vercel deployment remain outside this push.

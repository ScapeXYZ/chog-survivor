# Task 4N — Safe dependency security remediation

Date: October 15, 2026. Baseline `3a65935`; read `TASK_4M_DEPENDENCY_AUDIT.md` before implementation. The pre-existing untracked Task 4M report is preserved. No files are staged, committed or pushed by this task.

## Result

The final local dependency graph reports **zero vulnerabilities** in both full and production-only npm audits. All seven distinct advisories behind the eight Task 4M GitHub alerts are absent from the local audit result. GitHub's remote alerts will not close until an approved lockfile update is pushed and rescanned; this task does not push or dismiss alerts.

No existing application source, contract, address, script, artwork, font or style file changed. No blockchain transactions, live Anvil modification, reset, time change, deployment or publication occurred.

## Dependencies and files changed

- `frontend/package.json`: pins **Vitest 4.1.11**, adds the bounded wallet overrides below. Existing direct Wagmi, Viem, React, Vite, TypeScript and Query declarations remain unchanged.
- `frontend/package-lock.json`: package-manager-generated matching lockfile. Locked package paths decrease from **678 to 624** (including the root); obsolete worker/parser/nested wallet libraries are removed rather than forced into incompatible leaf versions.
- `frontend/scripts/dependency-security-check.mjs`: **73 offline checks** for patched/removed dependency paths, wallet URI round-tripping, every installed UUID consumer's module resolution/v4/validation/bounds guards, SDK ESM loading and injected-connector availability. It does not connect providers, send RPC or request a transaction.
- `docs/TASK_4N_SECURITY_REMEDIATION.md`: this report.

### Test tooling

**Vitest 3.2.7 → 4.1.11** and its matching `@vitest/*` packages. The new release removes Tinypool, includes `@vitest/mocker@4.1.11` and accepts the existing Vite/Node versions. Required Vitest internals such as Chai, lexer, std-env, tinyexec and tinyrainbow follow the runner's dependency constraints. No separate override of worker internals or mismatched Vitest packages is used.

The tooling-only phase passed all 373 tests before the wallet candidate was applied.

### Wallet dependencies — Wagmi 2 retained

The application still uses **Wagmi 2.19.5**, root **Viem 2.57.4**, **Vite 6.4.4**, **TypeScript 5.9.3** and the original injected wallet flow.

```json
"overrides": {
  "@walletconnect/utils": "2.22.0",
  "@metamask/sdk": { "uuid": "11.1.1" },
  "@metamask/sdk-communication-layer": { "uuid": "11.1.1" },
  "@metamask/utils": { "uuid": "11.1.1" }
}
```

These are compatibility-checked overrides of pinned transitive dependencies, not global decoder/ws/UUID replacements:

1. **WalletConnect utils 2.21.0/2.21.1 → 2.22.0**, within the same major. This parent release no longer depends on `query-string`, `decode-uri-component` or nested Viem 2.23.2. It removes every vulnerable ws 8.18.0 and decoder 0.2.2 path. Its required crypto/type dependencies follow its published constraints; no unrelated direct dependency is upgraded. All 202 old utility exports remain with unchanged value types; the candidate adds 11 exports.
2. **UUID 8.3.2 / 9.0.1 → 11.1.1**, scoped to MetaMask SDK, communication and utils consumers, including nested utils versions. This crosses UUID majors, so both CommonJS and ESM loading, v4/validate and the fixed v3/v5/v6 short-buffer guards were explicitly checked before acceptance. No SDK API, wallet connector, authorization or transaction argument was changed.
3. Unaffected ws **7.5.13**, **8.21.0**, **8.21.3** and **8.22.0** remain. No ws 7.x-to-8.x override is introduced.

## Advisory resolution compared with Task 4M

| GitHub alert | Advisory / affected package | Final local resolution |
|---|---|---|
| #8 critical | GHSA-5gmw-xhrv-c9v3, Tinypool worker-option gadget | Tinypool removed by Vitest 4.1.11. |
| #7 critical | GHSA-85c8-ppgw-ccpr, Tinypool run-options gadget | Tinypool removed. |
| #6 moderate | GHSA-82fw-gwwq-j7x9, Vitest mock file read | Vitest 4.1.11. |
| #5 moderate | Same advisory, `@vitest/mocker` | All mocker copies 4.1.11. |
| #4 moderate | GHSA-vcc3-ghjq-m6fr, URI decoder CPU DoS | Old decoder/query-string parent chain removed by utils 2.22.0. |
| #3 high | GHSA-96hv-2xvq-fx4p, ws memory exhaustion | All vulnerable 8.18.0 paths removed; remaining versions patched/unaffected. |
| #2 moderate | GHSA-w5hq-g745-h8pq, UUID buffer bounds | Every locked UUID copy 11.1.1; bounds behavior checked. |
| #1 moderate | GHSA-58qx-3vcg-4xpx, ws close-memory disclosure | Vulnerable ws paths removed; remaining versions patched/unaffected. |

| npm audit scope | Task 4M | Task 4N |
|---|---|---|
| Full installed graph | 26 package entries: 2 critical, 1 high, 23 moderate | **0**, all severities zero |
| Production dependencies | 23 package entries: 1 high, 22 moderate | **0**, all severities zero |

The former 26 npm entries included inherited parent severity, not 26 distinct advisories. There are **no known remaining vulnerabilities reported by the current registry audit**. This does not certify the absence of unknown vulnerabilities. Some optional connector SDK packages retained by Wagmi 2 carry upstream deprecation notices; they remain maintenance debt rather than findings hidden from this audit.

## Compatibility findings and rejected approaches

- **Wagmi 3 was not applied.** Read-only metadata and the [official migration guide](https://wagmi.sh/react/guides/migrate-from-v2-to-v3) showed removal of `useConnect().connectors`, used by the current app. Avoided that breaking API migration instead of changing the wallet UI or forcing a major parent upgrade.
- **No decoder leaf override.** Old query-string is CommonJS while patched decoder 0.5.0 is ESM-only. Updating the same-major utils parent removes that boundary entirely.
- **UUID cross-major use was verified.** The current legacy consumers retain the named APIs they use, load in both module systems and resolve the patched version. All ten installed UUID-consuming package paths receive bounds and v4/validate checks in the permanent script.
- **Wallet URI formatting changes query order when expiry is present.** Old and new parsers produce equal values for both forms; required fields and expiry round-trip. Current injected gameplay never uses WalletConnect pairing URIs. This observed serialization difference is documented, not mistaken for a protocol failure or hidden by altering application behavior.
- **Resolver issue:** npm 10.9.8 crashed in Arborist with `Cannot read properties of null (reading 'edgesOut')` before modifying project files. Used a temporary **npm 11.6.2** executable in `/tmp` to resolve candidate lockfiles, without `--force` or `--legacy-peer-deps`; no global/project npm version was changed. A metadata TLS failure was retried through the exact npm tarball without disabling TLS verification.
- The isolated wallet resolution printed a readable-stream peer warning, but the final tree validates with **no `npm ls --all` problems**, and regular project **npm 10 `npm ci --ignore-scripts` succeeds** against the final lockfile. No invalid peer graph was accepted.
- Install lifecycle scripts were disabled. Existing Playwright Chromium was used; no browser installation, chain setup or transaction-capable E2E harness was run.

Before applying wallet changes, the isolated candidate passed **219 checks**: all 202 old utility exports/value types, parsing/formatting semantic parity and SDK/UUID/connector module checks. After applying, the durable script expanded UUID validation to every consumer and passed **73 checks**.

## Verification

| Check | Final result |
|---|---|
| Reproducible install | `npm ci --ignore-scripts` passed using existing project npm 10.9.8; full tree valid. |
| Local `.env.local` frontend suite | **373 passed, 0 failed, 0 skipped**, 22 files, Vitest 4.1.11. |
| Explicit production/demo frontend suite | **373 passed, 0 failed, 0 skipped**, 22 files. |
| Foundry | **39 passed, 0 failed, 6 skipped**, 45 total across 7 suites. Skips are optional Monad-fork tests with no configured RPC. Tests use isolated test EVM; no live Anvil calls. |
| TypeScript | Passed. |
| Production build | Passed. Existing dependency annotation and >500 kB JS chunk warnings remain non-blocking. |
| Offline dependency/wallet checks | **73 passed**; no network, RPC or transaction calls. |
| Chromium regression | **515 passed, 0 failed**: all 18 interactions; injected connection; original choice/preview arguments; rejection and mocked receipt confirmation; ownership changes, UTC rollover lock, journal, keyboard/touch, reduced motion, fonts and mobile/desktop layouts. No uncaught browser errors. |
| npm audit | Full and `--omit=dev` both **zero vulnerabilities**, successful exit. |
| Source/asset preservation | All pre-existing `frontend/src`, `frontend/scripts`, `src` and `script` files match pre-task SHA-256 values. New verification script is separate. |
| Diff and index | `git diff --check` passed; no staged files, commits or pushes. |

Production build retained the previous content-addressed JS, CSS, font and scene asset filenames, including `index-CYiXaubC.js`, `index-C9o6GoDU.css` and `LilitaOne-Regular-DWEPn4H6.ttf`. Existing visual/game source and assets are unchanged; there is no font replacement or typography change. Frozen contract SHA-256 remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

### Reproduction commands

From the project root, `forge test --offline` and `git diff --check`. From `frontend`:

```sh
npm ci --ignore-scripts
npm ls --all
node scripts/dependency-security-check.mjs
npm audit --json
npm audit --omit=dev --json
npm test
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm test
npm run typecheck
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
node scripts/mini-game-integration-smoke.mjs
```

The Chromium command intercepts all local wallet/RPC calls and does not submit real transactions. Do not substitute `npm run test:e2e` or execute the real Task 4H harness. That older tooling can change the live local chain.

Evidence/logs: `/tmp/chog-4n-tests-local.log`, `-tests-production.log`, `-foundry.log`, `-typecheck.log`, `-build.log`, `-browser.log`, `-audit.json`, `-audit-production.json`, `-final-tree.json`, `-dependency-check.log`, `-wallet-compat.json`. These are local verification artifacts, not publication links.

## Review boundary

Review the package/lockfile diff, scoped overrides and verification script before committing or pushing. GitHub rescanning/alert closure requires that later authorized push; no remote change is made here. No deployment or real-wallet transaction verification is claimed. Future connector additions or dependency updates must rerun the checks; do not remove the scoped overrides without confirming upstream fixed requirements.

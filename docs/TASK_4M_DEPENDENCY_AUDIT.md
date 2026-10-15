# Task 4M — Dependabot investigation and minimal remediation plan

Audit date: October 15, 2026. Branch `main`, baseline `3a65935`. Origin is `https://github.com/ScapeXYZ/chog-survivor.git`; a read-only GitHub check confirms the repository is **private**. This task changes only this report: no dependency installation, audit fix, package/lockfile edit, contract/gameplay/font change, commit, push, deployment or blockchain transaction.

## Summary and audit reconciliation

The repository has exactly **8 open Dependabot alerts: 2 critical, 1 high, 5 medium/moderate**, all against `frontend/package-lock.json`. They represent **7 distinct advisories across 6 packages**: Vitest and its mocker have separate alerts for the same advisory, and Tinypool and ws each have two advisories.

The current full `npm audit --json` reports **26 vulnerable package entries** (2 critical, 1 high, 23 moderate). `npm audit --omit=dev --json` reports **23 entries** (0 critical, 1 high, 22 moderate). These totals include parent packages inheriting transitive vulnerability severity; they are not 26 distinct new advisories. The full audit's direct advisory objects contain the same seven unique advisory URLs as GitHub. For example, npm rates Vitest critical through Tinypool, whereas GitHub separately lists the Vitest file-read advisory as medium.

The lockfile and installed dependency tree agree (`npm ls --all --json` succeeded). Relevant installed direct versions are **Vitest 3.2.7, Vite 6.4.4, Wagmi 2.19.5 and Viem 2.57.4**. Manifest caret ranges are not the installed versions.

## All eight alerts

Patched versions below are the first patched releases for the applicable advisory, not an instruction to install every package directly.

| GitHub alert | Severity | Affected installed dependency | Vulnerable range | First patch | Actual exposure in this project |
|---|---|---|---|---|---|
| [#8](https://github.com/ScapeXYZ/chog-survivor/security/dependabot/8) | Critical | `tinypool@1.1.1` | `<=2.1.0` | **2.1.1**, but use **2.1.2+** to cover #7 too | Transitive **test/CI worker tooling**, via Vitest. Not emitted browser code. [Advisory: worker-option pollution](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3). |
| [#7](https://github.com/ScapeXYZ/chog-survivor/security/dependabot/7) | Critical | `tinypool@1.1.1` | `<2.1.2` | **2.1.2** | Same test/CI chain; a separate polluted `run()` options path. [Advisory](https://github.com/advisories/GHSA-85c8-ppgw-ccpr). |
| [#6](https://github.com/ScapeXYZ/chog-survivor/security/dependabot/6) | Medium | direct `vitest@3.2.7` | `>=2.1.0 <4.1.11` | **4.1.11** | **Test/development-server tooling**. Relevant vulnerable mock-redirection implementation is not configured as a public dev-server plugin here. [File-read advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9). |
| [#5](https://github.com/ScapeXYZ/chog-survivor/security/dependabot/5) | Medium | `@vitest/mocker@3.2.7` | `>=2.1.0 <4.1.11` | **4.1.11** | Transitive through Vitest; same file-read advisory as #6, not a second independent exploit. |
| [#4](https://github.com/ScapeXYZ/chog-survivor/security/dependabot/4) | Medium | `decode-uri-component@0.2.2` | `<=0.4.2` | **0.5.0** | Installed **production wallet dependency**, through `query-string@7.1.3` and WalletConnect utilities; absent from current production chunks. [Malformed-input CPU DoS](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). |
| [#3](https://github.com/ScapeXYZ/chog-survivor/security/dependabot/3) | High | four nested `ws@8.18.0` copies | `>=8.0.0 <8.21.0` | **8.21.0** | Installed **production/Node wallet dependency**, through nested Viem 2.23.2; vulnerable Node receiver, not native browser WebSocket. Absent from current browser chunks. [Memory-exhaustion advisory](https://github.com/advisories/GHSA-96hv-2xvq-fx4p). |
| [#2](https://github.com/ScapeXYZ/chog-survivor/security/dependabot/2) | Medium | `uuid@8.3.2` and nested `9.0.1` | `<11.1.1` | **11.1.1** | Installed **production wallet dependency**, through MetaMask SDK/utilities. Absent from current browser chunks; no application use of affected v3/v5/v6 buffer APIs found. [Bounds-check advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq). |
| [#1](https://github.com/ScapeXYZ/chog-survivor/security/dependabot/1) | Medium | same four nested `ws@8.18.0` copies | `>=8.0.0 <8.20.1` | **8.20.1**, but choose **8.21.0+** for #3 too | Same installed Node wallet chain; misuse of a typed-array close reason can disclose uninitialized memory. Not current browser code. [Disclosure advisory](https://github.com/advisories/GHSA-58qx-3vcg-4xpx). |

### Preconditions and impact

- **Tinypool:** these are prototype-pollution gadgets, not proof that this repository exposes an unauthenticated public RCE endpoint. They require a pollution primitive/attacker-controlled execution conditions; their consequences can include execution with developer/CI permissions. Treat them as urgent tooling fixes. The second advisory additionally depends on supplying a `run()` options object. Neither is a Solidity vulnerability.
- **Vitest/mocker:** unauthenticated file-read exposure concerns standalone mocker/interceptor plugins on reachable Vite HMR servers. Vitest's own browser-mode RPC has token authentication. This project uses `vitest run`/jsdom, not the standalone plugins or Vitest browser mode; Playwright smoke scripts are separate. Do not expose development/test servers or supply them CI signing credentials while awaiting repair.
- **ws:** DoS concerns Node ws frame processing; the disclosure needs a typed-array close reason. Browser clients use native WebSocket. Existing root `ws@8.22.0`, root Viem's `ws@8.21.0`, and engine.io-client's `ws@8.21.3` are already beyond both 8.x thresholds. The separate `ws@7.5.13` is not in these 8.x alert ranges; the DoS advisory also describes a 7.5.11 backport, so do not force that 7.x consumer onto 8.x unnecessarily.
- **UUID:** affected function names v3/v5/v6 are API methods, not package version numbers. The problem is silent partial writes to caller-supplied output buffers, not a demonstrated arbitrary native-memory overwrite. Application source does not call them. Sampled SDK source maps use v4/validate; this is supporting evidence, not an exhaustive proof about every transitive consumer.
- **Decoder:** malformed percent-encoded input can consume CPU. No metadata/encounter path in application source directly imports this package. Absence from the present artifact limits browser exposure, but does not remediate installation-time dependency debt or future connector usage.

## Dependency paths and production reachability

Representative installed paths:

```text
vitest@3.2.7 -> tinypool@1.1.1
vitest@3.2.7 -> @vitest/mocker@3.2.7
wagmi@2.19.5 -> @wagmi/connectors@6.2.0
  -> @walletconnect/ethereum-provider@2.21.1 / @reown/appkit family
     -> @walletconnect/utils@2.21.0 or 2.21.1
        -> viem@2.23.2 -> ws@8.18.0
        -> query-string@7.1.3 -> decode-uri-component@0.2.2
  -> @metamask/sdk@0.33.1 / sdk-communication-layer@0.33.1 -> uuid@8.3.2
  -> MetaMask RPC/providers/utils (utils 8.5.0, 9.3.0, 11.12.1) -> uuid@9.0.1
```

The root Viem is already patched with respect to these ws alerts; upgrading only the direct `viem` declaration cannot dislodge the four WalletConnect-pinned `viem@2.23.2` copies.

I performed an **in-memory production-mode Vite/Rollup build** with `build.write=false` and a temporary audit-only `generateBundle` hook, recording actual emitted chunk module membership. No configuration/plugin was added to the project. The two JS chunks contained 422 module records; positive controls included React, root Viem and `@wagmi/core`. There were **zero emitted modules** for Tinypool, Vitest/mocker, ws, UUID, query-string, decode-uri-component, MetaMask SDK, WalletConnect or Reown. The application config uses only `injected()`, which is re-exported from `@wagmi/core`; unused connector families are tree-shaken away.

This is direct evidence about this **current production static build**, not a universal “not exploitable” declaration or an advisory dismissal. Development/Node module loading, future connector changes, SSR or a different bundling configuration could introduce these paths. Keep alerts open until repaired and the final graph rechecked.

## Smallest safe remediation sequence — proposed only

### 1. Fix the four tooling alerts with one direct test-runner update

Proposed first isolated change: pin **`vitest@4.1.11`** and regenerate the lockfile with the normal package manager. Its published metadata:

- uses patched `@vitest/mocker@4.1.11` and matching Vitest internals;
- **does not depend on Tinypool**, removing the old worker pool if no other consumer exists;
- accepts Vite `^6 || ^7 || ^8`, so existing Vite 6.4.4 need not be upgraded merely for this fix;
- supports Node `^20 || ^22 || >=24`, including the verified Node 22.23.2.

This is a controlled **Vitest major migration**, requiring both full suites and mock/timer/environment-isolation checks. Do not override Tinypool 1.x with 2.x under Vitest 3, independently mismatch mocker versions, weaken tests or auto-upgrade Vite. npm currently suggests Vitest 5.0.5; that is not the smallest verified patched target.

After approval, an implementation branch could use `npm install --save-dev --save-exact vitest@4.1.11` from `frontend`; **this command was not run**. Verify all four alerts disappear and no other Tinypool consumer survives.

### 2. Fix both ws alerts together

Candidate minimal change: a narrowly scoped override of **ws to 8.21.0 or a reviewed newer 8.x patch**, specifically under the nested `viem@2.23.2` wallet paths, with lockfile regeneration and compatibility testing. All four vulnerable pins originate there. A compatible parent update that removes these old copies is preferable if available without a large migration.

Do not globally override ws across 7.x and 8.x; do not assume root ws or root Viem updates solve the issue. Inspect the installed result for every nested path. Test Node module loads and any relevant websocket close/receive behavior with small local fixtures, not a memory-exhaustion payload or live blockchain traffic.

### 3. Resolve UUID with explicitly scoped compatibility review

Patched UUID **11.1.1** publishes both Node CommonJS and ESM exports. A narrowly scoped 11.1.1 override for the MetaMask SDK/communication/utils consumers is a candidate smaller than replacing the whole wallet stack, but crosses package majors (8/9 to 11) and must not be applied blindly. Verify all consumer APIs and module-loading forms, especially SDK v4/validate and utilities' UUID usage, before accepting it; test any output-buffer usage against the corrected bounds behavior.

A normal “update MetaMask to latest” is insufficient: registry metadata inspected here shows SDK **0.34.0** still requires UUID `^8.3.2`, and utils **12.0.0** still requires `^9.0.1`. Prefer a parent-supported fixed release when published; if the scoped candidate fails compatibility, stop and propose a coordinated wallet-stack update instead of hiding the alert.

### 4. Resolve decoder through its parent chain, not a blind decoder override

`query-string@7.1.3` is CommonJS and calls `require('decode-uri-component')`. Patched decoder **0.5.0** is **ESM-only**; overriding it directly may cause `ERR_REQUIRE_ESM` or an incompatible namespace/function result depending on Node/bundler. This is a real compatibility boundary.

Registry metadata identifies **query-string 9.5.1** as using decoder `^0.5.0` (Node >=18), and **WalletConnect utils 2.26.0** no longer lists query-string or the old Viem pin. These are parent-chain migration candidates, not proof that changing one nested package is safe. Review the coordinated WalletConnect/Reown/connector constraints, module format and parsing/session behavior in an isolated change. Do not force utils/query-string majors into pinned parents untested. If no compatible focused parent fix exists, the broader wallet-stack migration needs a separately reviewed plan; a blanket Wagmi 3.7.7 update suggested by npm is not automatically authorized.

This staged approach isolates the urgent test-runner risk and small ws change from the riskier wallet parsing/SDK migrations. Track remaining advisory IDs explicitly between steps; do not dismiss or relabel runtime alerts merely because the current build tree-shakes them.

## Newly committed parchment reference

- `design/chog-parchment-reference.png` is tracked by **`3a65935` (October 15, 2026, “describe your changes”)**, after the reviewed Task 4L backup commit. Task 4L/4K statements that it was untracked describe their earlier baseline, not current Git status.
- Size: **249,404 bytes**. It is actually **JPEG/JFIF image data, 1672×941**, despite the `.png` suffix. No file was renamed or converted.
- Visually it is a generic parchment RPG character-sheet reference, with a hooded character and unrelated skill/equipment/stat examples. Those are reference pixels, not Chog Survivor gameplay features or authoritative survivor attributes.
- Project text search finds only design/milestone documentation references. There is no application import, CSS URL or public-asset copy, and it is not emitted by the current build. `frontend/TASK_11_3.md` records it as a user-supplied layout reference; Character uses code-native parchment/ornaments and the existing decorative portrait rather than rendering this image.
- **Release status remains unresolved.** No author/source license or public redistribution permission for this image was found in project records. A Git commit/private backup does not confer permission. Repository visibility is currently private; do not make it public or include this reference in a public submission/video without clearance. Obtain provenance and permission, or separately approve excluding it from a public release. Do not rewrite Git history, delete assets or regenerate art as part of this audit.
- SHA-256: `93089bf31e85a09a1cdfa8d3bc4ebce011b39e3d692328e004cb13be08b69c4d`.

## Verification performed and commands for remediation

Performed: read-only GitHub alert/visibility API calls; full and production-only npm audits; `npm ls --all`; lockfile/consumer/module-format inspection; published patched-version/parent metadata reads; in-memory production bundle analysis; image inspection and Git/import history checks. Both npm audits exit nonzero because vulnerabilities remain; the first sandboxed audit failed DNS, then succeeded with approved network access. No exploit PoC was run. No dependency fix was applied.

Run after each separately approved remediation, from `frontend`:

```sh
npm ls vitest @vitest/mocker tinypool ws uuid decode-uri-component --all
npm audit --json
npm audit --omit=dev --json
npm test
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm test
npm run typecheck
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
node scripts/mini-game-integration-smoke.mjs
git diff --check
```

Also re-query open Dependabot alerts after the reviewed lockfile reaches GitHub (publication/push is a separate action), check the complete final chunk graph, and verify parent-specific CommonJS/ESM imports and UUID/URL parsing compatibility. Preserve assertions, current choice arguments, ownership/UTC guards, fonts and wallet confirmation behavior. Use only mocked wallet/RPC browser checks; do not run `npm run test:e2e` or real Task 4H execution scripts, which can mutate Anvil.

Existing baseline from Task 4L is 373 tests passing in each environment; those suites were **not rerun during this audit**. The in-memory bundle build passed with existing dependency annotation warnings. Future remediation must pass the full applicable baseline before approval; no green-audit or compatibility claim is made in advance.

Raw audit/metadata/module evidence is under `/tmp/chog-4m-*`, not committed or published. Package manifest and lockfile remain unchanged. Do not run `npm audit fix`, `npm audit fix --force`, delete the lockfile or install unrelated latest packages as an audit shortcut. Stop here before dependency modification.

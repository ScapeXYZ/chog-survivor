# Task 4T — Vercel deployment preparation

Date: 2026-10-15. **Technically prepared and locally verified; public release remains blocked by artwork clearance and deployment approval. Nothing was deployed, published, committed or pushed.**

Read Task 4K preparation, deployment guide, Tasks 4P/4Q and Task 4S provenance investigation. Reviewed frontend configuration, environment gates, current production-artifact checks and dependency checks. Local Git origin matches `https://github.com/ScapeXYZ/chog-survivor.git`. No GitHub or Vercel account/project was connected, imported or modified; remote repository visibility and hosted settings are not verified.

## Exact Vercel settings

| Setting | Prepared value |
|---|---|
| Source repository | `ScapeXYZ/chog-survivor`; select the separately approved release revision |
| Proposed project name | `chog-survivor`, subject to destination/account approval and availability |
| Root Directory | **`frontend`** in Vercel project/import settings |
| Include source files outside Root Directory | Not required for this static production build |
| Framework preset | **Vite** |
| Node.js | **22.x**, explicitly select in project settings; local verification used 22.23.2 and npm 10.9.8 |
| Install Command | **`npm ci`**, retaining existing lockfile and dev dependencies required by TypeScript/Vite |
| Build Command | Exact command below, pinned in `frontend/vercel.json` |
| Output Directory | **`dist`**, relative to `frontend`; do not use repository root or `frontend/dist` as the relative setting |
| Hosting path | Origin root `/`; existing Vite default base |
| Functions / backend / Anvil | None required |
| SPA rewrite | None needed for current state-based navigation |
| Judge access | Stable HTTPS production URL accessible without Vercel login, password or other deployment-protection wall |

```sh
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
```

The new configuration file makes the previously verified public build command durable for Vercel deployments. Its inline environment overrides take precedence over inherited settings and Vite `.env.local` values. It contains only framework, install, build and output settings plus the schema URL; no routes, credentials, remote project identifiers or visual changes. Root directory and Node version remain dashboard settings. Merely adding this file locally does not configure a remote project.

Vercel documents these configuration properties and root-directory behavior in [static configuration](https://vercel.com/docs/project-configuration/vercel-json) and [build settings](https://vercel.com/docs/builds/configure-a-build). Select 22.x explicitly because the current default is 24.x; Vercel manages patch releases within the selected major. See [supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Environment and simulation

| Variable | Public Preview and Production |
|---|---|
| `VITE_CHOG_ENV` | `production`; enforced by build command. Set the same value in both dashboard environments for clarity. |
| `VITE_MONAD_RPC_URL` | Omit; build explicitly clears it and retains the existing public default `https://rpc.monad.xyz` for optional NFT reads. |
| `VITE_LOCAL_RPC_URL` | Omit; build explicitly clears it. |
| `VITE_LOCAL_CHOG_SURVIVOR_ADDRESS` | Omit; build explicitly clears it. |
| `VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK` | Omit; build explicitly clears it. |
| Private keys, wallet seed, API credentials, private RPC URL | None needed; never add to public client configuration. |

No additional environment variable is required. `VITE_CHOG_SURVIVOR_ADDRESS` does not activate a production game in current code and must not be used as a release workaround. `VITE_*` values are public browser data. Remove unrelated inherited RPC/secret settings rather than relying solely on overrides; never upload local environment files.

Production leaves the approved game address undefined and uses the existing walletless simulation. Home states LOCAL DEMO/no approved deployment; Adventure labels unsaved simulated values, no wallet signature and no on-chain submission; the on-chain action stays disabled. No official Chog endorsement is claimed by this preparation or added to the app. Optional wallet/NFT/metadata reads remain separate and may require public RPC/network access; simulation works without them.

The existing `.env.local` still selects local Anvil. Its contents/hash and all frontend source files were preserved. Existing tests verify local chain 31338 and exact loopback transport, production chain 143/public transport, and invalid-local fail-closed behavior. No Anvil start/reset, RPC write, wallet transaction or blockchain-state mutation was performed.

Home, Adventure, Character and Settings are React-state screens, not URL paths. Reloading `/` returns to Home. Do not advertise `/adventure` or `/character` as supported screen links. Vercel's [Vite guidance](https://vercel.com/docs/frameworks/frontend/vite) describes fallback rewrites for path-based deep linking; that feature is not needed by this app and no rewrite was added. Strict static-file-server Chromium checks passed without a fallback.

## Verification performed

Checks used the existing installed dependencies; no dependency installation, upgrade, audit fix or lockfile change occurred. Frontend suites and build ran sequentially. Both test invocations use the established deterministic unit baseline; local-specific suites explicitly stub local mode. These results do not claim live Anvil integration.

| Check | Result |
|---|---|
| Existing local `.env.local`: `npm test` | **22 files, 373 tests passed; 0 failed, 0 skipped** |
| Explicit public overrides: `npm test` | **22 files, 373 tests passed; 0 failed, 0 skipped** |
| `npm run typecheck` | **Passed** |
| Explicit production build above | **Passed**, TypeScript and Vite |
| Artifact Chromium, external requests blocked | **49 passed, 0 failed** |
| Artifact Chromium, existing Google Fonts allowed | **49 passed, 0 failed** |
| `node scripts/dependency-security-check.mjs` | **73 offline dependency security/wallet compatibility checks passed** |
| `npm audit --json` | **0 vulnerabilities**: info/low/moderate/high/critical all zero; exit 0 |
| Additional artifact scan | **8 checks passed**; details below |
| Preservation and whitespace/config checks | Protected-file SHA-256 comparison passed; JSON parsed; `git diff --check` and new-file whitespace checks passed |

Commands run from `frontend` except Git and the additional Python checks:

```sh
npm test
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm test
npm run typecheck
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
node scripts/public-demo-preflight.mjs
node scripts/public-demo-preflight.mjs --allow-fonts
node scripts/dependency-security-check.mjs
npm audit --json
```

Chromium covered all four screens at 320, 375, 768 and 1440px, loaded images, no overflow, all three current choices' Skip-to-simulation flow, simulation disclosures, absence of injected wallet/confirmation, bundled display font and preserved font notice. Both runs had no uncaught errors, missing runtime responses or RPC attempts. Online run loaded existing Cinzel and IM Fell English faces; not every declared/lazy face is exercised. Reduced motion was enabled. This smoke does not claim completion coverage of every encounter or actual hosted verification.

Additional scan of all nine artifact files found zero loopback mentions (`localhost`, `127.0.0.1`, `[::1]`), private numeric LAN HTTP(S) URLs, tested credential patterns, standard public Anvil mnemonic, configured local game address, detected secret-valued local environment entries, environment files or source maps. Preservation hashes also matched. Scans are bounded heuristics/known-value comparisons, not proof against every secret format. No sensitive values are included in this report. Only `dist` is static website output.

The existing artwork and font binaries, CSS/typography, frontend source, contracts, tests, scripts, design references, package/lockfile and `.env.local` all match the pre-task preservation hashes. The artifact retains exactly the same three WebPs, existing TTF and OFL notice. Build retains existing vendor PURE-annotation and >500 kB JS-chunk warnings (main JS 559.78 kB / 173.33 kB gzip); no code-splitting or visual change was made.

Execution notes: an initial `npm test` from repository root failed because it has no package.json; no tests ran there. Correct frontend runs above passed. Initial npm audit failed on sandbox DNS; rerun with network approval passed. Initial Chromium attempt failed on sandbox local-server binding; approved reruns passed. No test assertions, timeouts or security checks were weakened.

Clean-checkout `npm ci`, Vercel cloud build, dashboard protection settings, an actual public URL and separate-device/mobile-wallet testing remain unverified. Do not run `npm run test:e2e` or the real Task 4H script for publication preparation: those can mutate local blockchain state.

## Artifact and source identity

Reviewed base HEAD: `b3f96e0ee20f8da143ee8fa72d95b4d212821b6b`, plus existing Task 4Q source/test edits and untracked preflight script/reports. A GitHub import of base HEAD alone does not include that local work or this configuration. No source revision was staged or created.

The nine-file build manifest is saved locally in `/tmp/chog-4t-artifact-scan.json`. SHA-256 of the UTF-8 `json.dumps(manifest, sort_keys=True)` serialization of relative-path → file-hash entries:

`c66552e751d22a84b128337b026c77d21236ff28cf6547e015d50248e1d759e6`

This identifies the locally reviewed output, not an approved or uploaded artifact. Rebuild and review if source or configuration changes. Temporary logs: `/tmp/chog-4t-tests-local.log`, `-tests-production.log`, `-typecheck.log`, `-build.log`, `-chromium-offline.json`, `-chromium-fonts.json`, `-npm-audit.json`, `-artifact-scan.json` (each prefixed `/tmp/chog-4t`). Keep temporary output and preservation records out of publication.

## Files changed by Task 4T

- `frontend/vercel.json`: new static Vercel configuration enforcing the explicit public build and existing output.
- `docs/DEMO_DEPLOYMENT_GUIDE.md`: points to the prepared configuration and current results; clarifies root/Node settings.
- `docs/TASK_4T_VERCEL_PREPARATION.md`: this report.

Previously modified `frontend/src/contracts.ts` / `contracts.test.ts` and untracked Tasks 4O–4S / preflight script were preserved. Generated ignored build/TypeScript output was refreshed by verification. No artwork, font, gameplay, reward, contract, NFT address or local configuration changes were introduced.

## Remaining blockers and exact publication steps

1. **Resolve artwork release rights.** Task 4S recovered generation provenance but did not clear public use. Environment/fog need documented entitlement/reference review and release sign-off; survivor additionally needs appropriate Chog likeness/branding permission. Cover exact hashes and web/video/repository scopes. Do not claim endorsement. Unknown design references remain outside `dist` and require separate treatment for public repository/history publication. Keep all existing art in this preparation.
2. **Review a complete release revision.** Include the existing tested Task 4Q source/test work, preflight script and this Vercel configuration; preserve lockfile/assets/notices. Repository visibility need not become public to deploy a Git-backed frontend. Commit/push require separate authorization and are not performed here.
3. **Approve the concrete hosting account/team, project, revision/artifact and public deployment.** No such destination has been verified here. Connecting/importing Git can trigger deployment immediately, including previews, so perform it only after deployment is authorized.
4. **After authorization**, import `ScapeXYZ/chog-survivor` into the approved Vercel account. Before clicking Deploy, set Root Directory `frontend`, preset Vite, Node 22.x, install `npm ci`, output `dist`, and confirm the build command matches `frontend/vercel.json`. Configure Preview/Production as above, remove local/private values and preserve existing Google Fonts access. Do not add a backend, Anvil tunnel or contract deployment.
5. Deploy the approved revision. Inspect cloud install/build logs and emitted assets/license. Ensure the selected production domain has no authentication/password wall for judges using [Vercel deployment protection settings](https://vercel.com/docs/deployment-protection). A preview URL alone does not establish public production access. Do not assert a specific URL before Vercel assigns it.
6. Verify the actual HTTPS URL from an unauthenticated private window and another network/device: Home → Enter the Wild; all three interactions and Skip; Character/Settings/return Home/reload; simulation labels; disabled writes; no wallet or Anvil requirement; images, typography and `/licenses/LilitaOne-OFL.txt`; mobile/keyboard/reduced motion/audio preferences; no errors, missing assets or loopback/private RPC requests. Optional genuine ownership reads remain distinct.
7. Record the actual stable URL and approved source revision in judge/submission materials. Publish video/repository/evidence only within their separately cleared scope. Keep simulation and recorded local-chain evidence clearly distinguished.

Preparation stops here. No Vercel project creation, deployment, Git publication or blockchain action was performed.

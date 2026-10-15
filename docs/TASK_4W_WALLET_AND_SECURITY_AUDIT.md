# TASK 4W — Wallet access and security audit

Audited 2026-10-15. No commit, push, deployment, contract deployment, real-wallet signature or blockchain transaction was performed.

## Findings and root-cause status

**The reported MetaMask/Blockaid warning remains unresolved; a false positive is plausible but unproven.** No malicious application request was found in the reviewed source or tested flows. No warning screenshot, provider reason, extension version, or Blockaid case/verdict was available. Mocked Chromium providers cannot reproduce a genuine MetaMask reputation decision.

The live homepage returned HTTP 200 without a redirect. Its HTML references same-origin `/assets/index-D82iYTir.js` and `/assets/index-C9o6GoDU.css`, with no external script tag. Retrieved JS SHA-256: `92ce2d2d45e6b5cc2aaf3edcb1b3cd5b95878da7c6370df2e5c415e084c3bf77`. The deployed bundle contains the canonical collection address, public Monad RPC and unavailable-game disclosures, and no loopback address. It does not contain the working-tree clarification that wallet connection is optional. The local candidate is a different bundle, `index-Dz_u8Cfe.js`; it has not been deployed.

Checked MetaMask's public [configuration](https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json): 106,696 blacklist entries, no exact or parent-domain match for `chog-survivor.vercel.app` (including `vercel.app`); no corresponding whitelist or fuzzylist suffix match. Snapshot SHA-256: `227e682be2fe52f07914d614a342c6c66ad7504875ab4e8f3c7ce814a34eee3e`. This is a bounded list-membership check, not the full detector's fuzzy algorithm or a clearance from all security providers. Public web search found no domain-specific phishing report. Blockaid's proprietary classification and other services' authenticated verdicts were not accessible; Google Safe Browsing, VirusTotal, ChainPatrol and SEAL status remain unverified.

MetaMask documents URL scanning and third-party security analysis in its [website-warning guidance](https://support.metamask.io/stay-safe/safety-in-web3/deceptive-site-ahead-when-trying-to-connect-to-a-site/). An independent reputation classification is therefore consistent with a warning even when application code only connects accounts. This is an inference, not an identified trigger. Cached/provider-specific classifications are possibilities to ask the provider about, not findings. The reviewed evidence does not support blaming an approval, signature, network-switch request, dependency advisory, local RPC leakage or redirect.

## Production configuration and wallet behavior

`frontend/vercel.json` selects Vite, `npm ci`, and `dist`. Its build command forces `VITE_CHOG_ENV=production` and blanks `VITE_MONAD_RPC_URL`, `VITE_LOCAL_RPC_URL`, `VITE_LOCAL_CHOG_SURVIVOR_ADDRESS` and `VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK`. These shell assignments override inherited settings for the build. RPC therefore defaults to `https://rpc.monad.xyz`, chain **143** (`0x8f`). Production game address is hard-disabled in `contracts.ts`; `VITE_CHOG_SURVIVOR_ADDRESS` cannot enable it.

**All hosted environment settings could not be inspected.** `vercel env ls production` reports that the checkout is not linked to a project. No account/project linking was attempted because that can initiate hosting activity. A project owner must provide a redacted Production environment/settings export or read-only project access, including root directory, framework/build overrides, deployment revision and inherited/team variables. Do not share secret values. Local `.env.local` contains only the four expected local-mode configuration keys; values were not published or changed. No other consumed Vite environment keys were found beyond those documented in `contracts.ts`.

Two connection buttons exist: persistent header and lobby hero. Both call `connect({connector: connectors[0]})` only on click. Injected MetaMask-compatible integration remains intact; no connection is required for entry. Wagmi may query existing accounts/chain during initialization or session restoration; these passive queries differ from permission prompts. Explicit connection can request `wallet_requestPermissions` and `eth_requestAccounts`. Rejection leaves gameplay available. Disconnect can revoke permissions. No application sign-message, typed-data, approval, automatic chain-add/switch or production transaction path was found.

Canonical Chog Genesis NFT address: `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`. Ownership is established by `ownerOf`, with discovery using read-only collection queries/logs and manual token-ID fallback. Wrong network or failed ownership reads fail closed. Browser holder verification used mocked RPC, so this audit does not independently attest actual collection ownership or deployed bytecode provenance.

**Live Monad game actions, progression reads and journal reads are unavailable without an approved game deployment.** Connecting verifies NFT ownership; it must not promise functional live gameplay. Character shows unavailable state rather than substituting simulated values. NFT-keyed progression, achievements, UTC daily lock, ownership-transfer and authorization implementation remain unchanged. The existing local contract path retains its safeguards and requests `act` only after explicit confirmation on isolated chain **31338**. It was not run against or used to alter Anvil. No production game deployment was enabled as a workaround.

## Walletless demo and frontend review

Visitors and Chogathon judges choose **ENTER THE WILD**, then a choice and its interaction or **Skip interaction**. No wallet is required. LOCAL DEMO, DEMO STATS — NOT SAVED, simulated trail/chronicle and result disclosures identify fixtures and preview deltas. No simulated ownership is presented as verified, no progress is persisted as NFT state, and Act onchain remains disabled. Connected-token preview restrictions remain in place; authorization rules were not weakened to create demo access.

At task start the working tree already contained changes to `App.tsx`, `App.test.tsx`, and an untracked `scripts/wallet-access-smoke.mjs`. These were preserved and validated, not overwritten or claimed as newly authored here. They add optional-ownership-only wallet disclosure/tooltips and tests for explicit connection, walletless navigation, wrong network and rejection. They are safe frontend clarifications suitable for review. No further gameplay change was necessary. This task adds this audit report.

## Security findings

- No private key, recovery phrase, secret RPC credential or unsafe external JavaScript was identified in the reviewed app configuration, production entrypoint and bounded artifact checks. This is not an exhaustive secret-history audit or proof about inaccessible hosted variables. All `VITE_*` values are public browser data.
- Existing Google Fonts CSS/font requests remain; no typography or font was changed. NFT metadata can fetch HTTPS/IPFS gateway JSON; it is parsed as data and cannot establish ownership. External metadata availability/privacy remains a third-party dependency, not evidence of malicious scripting.
- Live HTML includes HSTS. It does not advertise CSP, X-Content-Type-Options or Referrer-Policy. These are defense-in-depth opportunities, not demonstrated causes of the warning. Any future CSP must account for current fonts, Monad RPC and permitted NFT metadata; no untested restrictive policy was introduced.
- Dependency checker: 73 offline dependency/security/compatibility checks pass. Full npm audit reports zero vulnerabilities. No package or lockfile change was needed. Dormant dependency capabilities or bundled wallet method strings alone do not prove requests occur.
- Production artifact preflight passes credential-pattern, loopback-URL, environment-file and source-map exclusions. Local configuration is not shipped by this production build. Source scan found no application redirects or dynamic external script insertion.
- Frozen `src/ChogSurvivor.sol` SHA-256 remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`. Contract, artwork, fonts, CSS, reward mechanics, authorization, daily limits and local Anvil configuration were not modified.

## Validation

Commands run from `frontend` unless stated otherwise. Logs are local `/tmp/chog-4w-*` artifacts, not committed evidence.

| Check | Result |
| --- | --- |
| `npm test` with existing local configuration | 22 files, 375 tests pass |
| Same unit suite with explicit production environment overrides | 22 files, 375 tests pass |
| Production build using exact Vercel environment overrides | Pass; TypeScript and Vite complete; existing >500 kB chunk warning |
| `node scripts/dependency-security-check.mjs` | 73 checks pass |
| `npm audit --json` | Zero vulnerabilities, all severities |
| `node scripts/public-demo-preflight.mjs` | 49 checks pass; 320/375/768/1440 px; four screens; three choice previews; no injected wallet; no RPC dependency; artifact checks |
| `node scripts/wallet-access-smoke.mjs` | 26 checks pass against local production artifact |
| Same wallet smoke with `--live` | 26 checks pass against public deployment |
| `git diff --check` | Pass |

Wallet smoke intercepts RPC and uses a fake injected provider. It covers both buttons, walletless preview before connection, explicit permission intent, verified mock holder, wrong network and rejected connection; no signing, transaction or network-switch methods are allowed. It is not a real MetaMask extension or Blockaid test. Public preflight blocks external requests except local assets; existing fonts were not replaced. Sandbox initially blocked local listening and npm/network DNS; browser/network checks were rerun with approval and succeeded. Older real-Anvil end-to-end harnesses were deliberately not run because they mutate chain state.

## Required follow-up and appeal guidance

1. Review the existing frontend disclosure/test changes and this report. Deploy only in a later explicitly authorized task; the public site still has the previous disclosure text.
2. Owner verifies hosted Production settings and deployed revision. Keep production game disabled until its deployment is separately approved; enabling a game requires separate readiness work, not an environment-only shortcut.
3. Capture the exact warning and timestamp, full domain/path, MetaMask platform/version, whether it appears before connection or during a request, attributed security provider, and any reason/case ID. Do not include keys, recovery phrases or private account data.
4. For website classification, follow [MetaMask's official reporting instructions](https://support.metamask.io/stay-safe/safety-in-web3/deceptive-site-ahead-when-trying-to-connect-to-a-site/) and open a removal/review issue in [eth-phishing-detect](https://github.com/MetaMask/eth-phishing-detect/issues). For a Blockaid-attributed result use [Blockaid's report portal](https://report.blockaid.io/). The [MetaMask x Blockaid portal](https://blockaid-false-positive-portal.metamask.io/) specifically describes misclassified transactions; choose the route matching the actual warning.
5. Attach the public URL/repository, ownership evidence for the domain, warning screenshot/reason, this report's request inventory and bundle hash, and explain that production only reads NFT ownership with no signatures, approvals or game transactions. Ask for the specific detection reason and review; do not assert that independent code review proves a false positive. No appeal was automatically submitted.
6. Leave security warnings enabled. Do not ask judges or holders to bypass warnings. Retest with genuine MetaMask after the provider responds, then record the result. Mock-provider success does not close this blocker.

## Task 4X release review

The release selects only this report, `frontend/src/App.test.tsx` and `frontend/scripts/wallet-access-smoke.mjs`. The optional-wallet disclosure edits in `App.tsx` remain uncommitted. The unit test's assertion for that unpublished copy was removed so the selected tests are independent of the excluded UI change. The earlier Task 4W results above describe the full working-tree candidate at that time; Task 4X validates the selected release against the unchanged tracked app source. Production still supports walletless simulation and optional real NFT ownership verification; production game writes remain unavailable. No contract, font, artwork, authorization, reward, daily-limit or Anvil configuration change is selected.

Task 4X checks against the selected release source: 22 unit files / 375 tests passed with production overrides; TypeScript/Vite production build passed (existing vendor-annotation and chunk-size warnings); 73 dependency checks passed; npm audit reported zero vulnerabilities; Chromium production preflight passed 49 checks and mocked wallet smoke passed 26 checks. Selected-file credential/private-key/redirect pattern checks and diff whitespace checks passed. Tests exercise ownership refresh, transfer, daily lock and journal behavior using fixtures; they do not establish genuine live-chain gameplay or remove the reported warning. Logs: `/tmp/chog-4x-unit.log`, `-build.log`, `-deps.log`, `-audit.json`, `-preflight.json`, `-wallet.json`. Before release, fetched `origin/main` matched local HEAD with no intervening commits. No hosting or contract deployment command is part of this release.

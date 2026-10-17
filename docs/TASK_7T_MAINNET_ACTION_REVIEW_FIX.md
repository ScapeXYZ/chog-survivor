# Task 7T — Mainnet action review fix and release preparation

**Unsigned-review blocker fixed. Three consecutive enabled-production-bundle runs passed on desktop and mobile.** The owner's Task 7S publication/gameplay authorization remains applicable, including the explicit acknowledgement that genuine-holder installed-wallet acceptance is incomplete. No independent audit or wallet-provider clearance is claimed. This report records the release checks; the exact pushed SHA, Vercel result and public-bundle evidence are recorded after publication in the local release handoff.

## Confirmed root cause

`MainnetGameplayPanel.review()` awaited the entire `prepareAction()` RPC preflight before creating the review. Rendering additionally required `quote && ownsVerified`. Two reproduced paths prevented the modal:

1. **Verification race:** owner/runtime background revalidation temporarily changed `controls` to false while preflight was running. The original handler completed successfully, observed `context.current !== origin`, silently discarded the prepared quote and cleared busy. Its page message remained “Preparing current contract preview, simulation and gas limits…”. There was no dialog or actionable cancellation/error. A separate effect also cleared quotes whenever `ownsVerified` changed.
2. **Slow/failed RPC:** any preflight rejection, including the reproduced fee RPC connection timeout, prevented the dialog from mounting. The error was placed in the underlying page rather than an action review; there was no bounded review deadline.

The original Task 7S capture lacked internal state/RPC diagnostics, so it cannot establish which branch occurred historically. Task 7T reproduced the same missing-dialog symptom and traced the successful-preflight/context-mismatch branch directly. Temporary production diagnostics recorded review entry, changing controls and `prepared {origin: …true, current: …false, mounted: true}`. No React exception, intercepted click, wrong ABI or signing request was needed to reproduce it. The original unchanged bundle also passed one desktop run, confirming intermittency rather than an always-broken click handler.

Local evidence: `docs/evidence/task7t/confirmed-refresh-race/failure.json` and `review-failure.json` contain the original trace. The regression overlaps genuine RPC estimate completion with delayed ownership revalidation; it changes timing, not ownership or returned chain data. `fixed-refresh-race-result.json` records the fixed counterpart: visible review in 78 ms, explicit verification-change error and disabled wallet confirmation. Temporary application console instrumentation was removed.

The previous browser relay spawned a fresh curl connection for every RPC; intermittent connection/TLS failures made diagnosis noisier. The test now supports a persistent read-only fetch relay and retains `--rpc-transport curl` for exact transport reproduction. This is test infrastructure only; the deployed application's wallet/RPC configuration is unchanged. Earlier failed attempts remain in local evidence and are not counted as passes.

## Small fix and preserved safeguards

The handler creates an unsigned review intent synchronously after the existing verified-owner/chain/binding/eligibility gate. The modal shows selected NFT, account, exact contract, Monad 143, `act(tokenId, choiceId)`, zero value and all four approved spending limits before any wallet request. Fees remain explicitly unavailable while preflight runs. Confirmation/consent remain disabled until a complete valid quote exists.

An eight-second read-only preparation deadline shows an actionable error. A generation guard prevents a cancelled, invalidated or late response from reopening/repopulating a review. Verification/context changes preserve an explanatory review instead of silently disappearing; they discard the quote and require cancellation and fresh review. The timeout does not sign, broadcast, create a pending journal or automatically retry. Late transport reads may finish but cannot establish consent or submit.

No ownership, runtime, collection-binding, nonce, daily-lock, simulation, cost/reserve or receipt check was skipped. Confirm still repeats current preflight and live wallet checks, uses exclusive browser locking, persists pending intent before requesting the wallet and requires explicit per-action consent. Pending/uncertain requests survive refreshes and block duplicates. Replacement/rejection/revert/finality/event/state verification remains unchanged.

Approved limits remain **400,000 gas**, **125 gwei total maxFeePerGas including priority**, **0.05 MON maximum estimated request cost**, **0.1 MON minimum remaining reserve**, and **0 MON transaction value**. Missing or excessive values fail closed. No NFT approvals or transfers are requested.

## Exact deployment compatibility

- Monad mainnet **143**.
- Game: `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`.
- Genuine collection: `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`.
- Only `act(uint256,uint8)`, choices 1–3. One action per token per UTC day; transfers preserve progression and lock. Projections are not confirmed outcomes; inclusion after UTC midnight can change the encounter.
- Frozen Solidity SHA-256 unchanged: `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.
- Offline artifact/ABI/manifest audit passed. The enabled bundle verified both deployed runtime hashes, collection binding, live ownerOf, actual survivor state and contract preview through real read-only RPC. Public token 1425 was observed; control of its owner's account was **not** proved.

## Validation

| Check | Result |
| --- | --- |
| New review regression against original implementation | 4 failed, 1 passed; captured before fix |
| Full frontend suite after fix and authorized source switch | **465 passed / 30 files** |
| Production TypeScript/Vite build | Passed; existing nonfatal >500 kB chunk warning |
| Production safety / responsive walletless states | **47 passed**, widths 320/375/768/1440 |
| Wallet-modal desktop/mobile checks | **107 passed**, synthetic providers, no installed-wallet claim |
| Isolated gameplay lifecycle/rejection/revert/pending/duplicates | **36 passed**, fake clients, external RPC blocked |
| Exact original verification-race browser regression | Old bundle fails; fixed bundle passes with visible fail-closed error |
| Production bundle live-read-only integration, consecutive runs | **3 × 49 passed**, desktop 1440 and mobile 375 |
| Final exact release-dist quote/policy browser check | **51 passed**; complete quotes 2,901 / 1,874 ms; all displayed spending fields checked |
| Source/runtime/ABI/manifest and frozen-source checks | Passed; no Solidity/address/artwork changes |

The new review tests additionally cover pending preparation, bounded timeout, late success, cancellation, revalidation failure/recovery and fully quoted explicit consent. Their use of fake dependencies is isolated test coverage, not real holder acceptance.

Three consecutive production runs used the actual Vite bundle, verified manifest and live RPC data, not a fixture build. Each cancelled the unsigned review and prohibited every wallet send/sign method. Both opening and **fully verified fee quote** completed in under ten seconds:

| Run | Desktop review / complete quote | Mobile review / complete quote |
| --- | --- | --- |
| 1 (`persistent-run2`) | 62 / 2,379 ms | 1,370 / 4,693 ms |
| 2 (`persistent-run3`) | 64 / 4,939 ms | 1,360 / 6,715 ms |
| 3 (`persistent-run4`) | 139 / 2,457 ms | 1,863 / 5,682 ms |

The source switch stayed false until all three passed. The subsequent release build uses `mainnetGameplayReleaseAuthorized=true`; its JS/CSS assets match the tested candidate. Required negative cases remain fail closed. Raw logs/screenshots are retained locally under `docs/evidence/task7t/` and are excluded from blanket publication.

## Files and release scope

Direct Task 7T fix: `frontend/src/MainnetGameplayPanel.tsx`, new `frontend/src/MainnetGameplayReview.test.tsx`, `frontend/scripts/task7l-authentic-browser.mjs`, and the related error-location assertion in `frontend/scripts/task7n-gameplay-browser.mjs`.

The authorized release also includes retained Task 7N–7S gameplay controller/panel/network-switch components and tests, source gate and configuration tests, scoped Adventure/App/Character/contract-info/risk-notice/style integration, isolated test helpers, production/modal browser mode assertions, and README/judge/deployment/submission documentation. The source gate is enabled only after the failed gate is resolved; it still requires valid verified-mainnet configuration and cannot be enabled via URL, local storage or arbitrary environment address.

Unrelated pre-existing `.gitignore` and `mainnetDeployment.ts` comment changes, older private/local reports, all raw operator evidence, environment files and holder tools remain outside the release commit. No changes are discarded. A scan of tracked text/proposed frontend files found only two unchanged public local-chain test mnemonics in existing test files, no newly introduced credential; test secrets/fixtures are excluded from public bundle output. No wallet secrets were accessed.

## Publication and remaining risks

**GO for the already owner-authorized frontend release. The final exact-dist check passed (51 assertions); publication must still be confirmed after push.** GitHub main must be fast-forward only, without overwriting remote work. Vercel's existing `frontend/vercel.json` production command clears local overrides. Verify remote SHA, successful deployment and public bundle identity after push. These checks never sign or broadcast gameplay transactions.

The owner acknowledges incomplete installed-wallet acceptance with a genuine Chog holder. Observer/mocked results do not complete it. Native wallet field editing, warning presentation and real-holder end-to-end behavior remain unverified. Stop on real wallet security warnings. The contract is unaudited, immutable/non-pausable; collection governance/custody attestations and official provider clearance remain incomplete. RPC outages can block actions; the UI now explains failure and cannot invent a quote or progression.

## Reproduce safely

From `frontend`, build using the production command below, then run the read-only observer against its artifact. It observes a public owner address but has no signer; never substitute a funded signer or enable send/sign methods.

```sh
npm test
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
node scripts/task7l-authentic-browser.mjs --artifact-dir dist --expect-gameplay --evidence-dir /tmp/chog-review-check
node scripts/task7l-authentic-browser.mjs --artifact-dir dist --expect-gameplay --desktop-only --refresh-during-estimate --evidence-dir /tmp/chog-review-race
```

Neither the commands nor the source release switch authorize an agent to send a gameplay transaction. Browser approval/signing remains an explicit user action outside these checks.

## Rollback

Set `mainnetGameplayReleaseAuthorized=false`, rebuild with the same production overrides and publish an authorized read-only frontend, or restore the known pre-gameplay Vercel deployment at commit `40036a07e97ac7301ce5778aaaf36d62ad09f23f`. Preserve pending journals/hashes/nonces; never clear them, blindly retry, reset/rebase or force-push. Verify the public read-only label and absence of wallet confirmation controls. A frontend rollback cannot pause the immutable contract, cancel an already broadcast transaction or reverse a mined action.

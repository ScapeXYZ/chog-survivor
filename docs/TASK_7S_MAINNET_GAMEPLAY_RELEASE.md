# Task 7S — Mainnet gameplay release stopped

Historical stop record. Task 7T subsequently diagnoses and fixes this blocker; see [the resumption report](TASK_7T_MAINNET_ACTION_REVIEW_FIX.md). The statements below describe the Task 7S stop, not a later deployment.

**NOT RELEASED — critical production-bundle review check failed.** The owner explicitly authorized gameplay activation, GitHub main push and Vercel publication, approved the spending policy and acknowledged incomplete real-holder installed-wallet acceptance. That authorization is preserved; the acceptance gap is not being reinstated as an additional gate. Publication stopped because the actual enabled-build unsigned review failed to appear. The source activation flag has been restored to **false**.

No commit, push, Vercel deployment, contract change, signature or gameplay transaction was performed. Local HEAD remains **40036a07e97ac7301ce5778aaaf36d62ad09f23f**; no new deployment commit exists. Existing gameplay work, artwork, fonts and Anvil fixtures are preserved. The last verified public release is the authentic read-only build at that commit.

## Public deployment status and verification limitation

No new commit was created and no push/deployment was attempted. Remote main was confirmed as `40036a07e97ac7301ce5778aaaf36d62ad09f23f` before preparation. A post-stop remote check failed to connect to GitHub:443 after 134806 ms, and a walletless check of the public website failed with `net::ERR_TIMED_OUT`. Consequently the current website was **not freshly verified** after the stop; its last confirmed mode is authentic read-only. Do not describe these timeouts as a successful live check or a new deployment result. Local `docs/evidence/task7s/publication-status.json` and `public-unchanged-browser.err` record this limitation. Network unavailability may have contributed to the unsigned-review failure, but its root cause remains unconfirmed.

## Critical blocker

The browser loaded the actual gameplay-enabled production bundle with the verified deployment manifest/ABI, observed public sample token 1425 through genuine read-only RPC and selected an eligible decision. The page never displayed **Review real Monad action** within **90 seconds**. The failed integration check is recorded in local `docs/evidence/task7s/production-readonly-observer.err`. No send/sign methods were allowed or requested; the observer has no signer and does not prove control of the public owner account.

The exact failure is the missing unsigned review dialog after selection. Its root cause is **unconfirmed**. It could not be explained or waived by successful unit tests, fake-client browser tests or the owner's acknowledged installed-wallet testing limitation. No assertion was skipped to justify deployment. Diagnose the actual preflight/context/RPC path and rerun this production-bundle check successfully before publishing.

## Completed checks

| Check | Result |
| --- | --- |
| Pre-activation full suite | 454 tests passed, 28 files |
| Gameplay-enabled configuration full suite | 458 tests passed, 29 files |
| Enabled production TypeScript/Vite build | Passed; existing nonfatal >500 kB chunk warning |
| Walletless production safety/layout | 47 checks passed, widths 320/375/768/1440 |
| Wallet modal | 107 checks passed, synthetic providers only |
| Isolated gameplay lifecycle/duplicate/recovery | 36 checks passed, fake clients only |
| Deployed compiler/artifact/ABI/manifest audit | Passed, no Solidity or deployed-address changes |
| Genuine RPC simulation/estimation | All three supported choices passed read-only checks |
| Actual enabled-bundle unsigned review | **FAILED — do not deploy** |
| Restored-off configuration full suite | 458 tests passed |
| Restored-off production build | Passed; gameplay writer, journal code and test fixtures excluded |

Logs and captures remain local under `docs/evidence/task7s/`; raw operator evidence is not approved for blanket publication. Automated mock results are not actual installed-wallet or genuine-holder acceptance. The owner-reported successful browser connection is preserved, but full installed-wallet acceptance with a verified Chog holder remains incomplete and owner-acknowledged.

## Contract and approved spending policy

- Monad mainnet chain **143**.
- Game: **`0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`**.
- Chog Genesis: **`0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`**.
- Only nonpayable **`act(uint256 tokenId,uint8 choiceId)`**, choices 1–3, zero MON value and no NFT approval/transfer.
- The contract checks current ownerOf and one action per token per UTC day; transfers preserve progression and daily lock. Runtime and immutable binding matched the frozen approved artifact through read-only RPC.
- Approved request limits remain **400,000 gas**, **125 gwei total maxFeePerGas including priority**, **0.05 MON maximum estimated cost**, **0.1 MON minimum reserve**. Estimates unavailable or over a limit fail closed; no automatic fee escalation or uncertain-transaction retry.

Read-only sample observations during this preparation: estimated gas 214,167–214,314; padded limits 267,709–267,893; maximum fee 122 gwei including 2 gwei priority; maximum estimated cost 0.032682946 MON. These observations fit the caps, but do not replace the failed in-app review check, prove ownership by a connected holder, or authorize any transaction. Fresh estimates are required for every future action.

The reviewed controller retains exact-destination/function/parameter allowlisting, runtime/binding/owner/day/nonce checks, simulation, fee/reserve limits, explicit per-action confirmation, durable pending intent/hash recovery, exclusive browser locking, duplicate prevention, replacement/cancellation/revert handling and finalized canonical receipt/event/state verification. No fake progression or simulated transaction result is included in production; fixtures remain isolated test code. The native wallet can allow user-side field edits, so wallet users must inspect the actual request and never bypass warnings. No independent audit or official provider clearance is claimed.

Frozen Solidity SHA-256 remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

## Prepared configuration and changes retained locally

`frontend/src/mainnetRelease.ts` adds an explicit source release switch, currently **false** because this release stopped. `contracts.ts` requires that switch **and** a valid verified-mainnet configuration. URL/local-storage/environment shortcuts cannot override it. A dedicated release-configuration suite tests the actual source switch; historical read-only suites deliberately mock authorization off. The gameplay-enabled build was validated before the failed integration check, then the switch was restored off and tests/build rerun.

The approved cost policy is unchanged. Existing Task 7N–7R gameplay logic and tests remain, including current verified-owner/network/binding choice gating, pending recovery and duplicate safeguards. The wallet risk notice explicitly discloses incomplete holder-wallet acceptance. Browser safety helpers accept `--expect-gameplay` to check the artifact mode without changing the application, and the genuine-RPC observer can prepare/cancel unsigned reviews while rejecting all send/sign methods.

README, judge walkthrough, deployment guide and historical submission note distinguish this blocked candidate from the current read-only site and historical video. No historical private reports, raw evidence, environment files or holder tools were committed. Nothing was staged. Do not push this working tree until the critical review failure is resolved and all required checks pass.

## Rollback

The public release was never changed, so no Vercel rollback was executed. The local safety rollback is complete: source release switch false, tests passing, read-only artifact rebuilt into `/tmp/chog-task7s-blocked-readonly`.

For a future authorized gameplay release, rollback means setting `mainnetGameplayReleaseAuthorized=false`, rebuilding with the existing production Vercel overrides and deploying an owner-authorized read-only frontend, or restoring the known `40036a07e97ac7301ce5778aaaf36d62ad09f23f` deployment. Preserve pending journals, hashes and nonces. Do not clear storage, automatically resubmit, reset/rebase or force-push. A frontend rollback cannot pause the immutable contract, cancel a wallet-approved/broadcast transaction or reverse a mined action.

## Required next action

Resolve the missing unsigned review in the actual enabled production bundle, using read-only RPC and a signer-free observer first. Preserve the limits, truthful error states and explicit wallet confirmation; do not work around the failure by skipping preflight or using fixture success as proof. Publication remains stopped. The existing owner release authorization and acknowledged holder-wallet limitation remain recorded in local `owner-release-authorization.json`; no agent gameplay transaction is permitted.

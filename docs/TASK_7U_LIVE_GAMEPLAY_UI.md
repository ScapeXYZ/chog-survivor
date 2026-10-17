# Task 7U — Live gameplay discovery and UI release

## Result and cause

The existing public Task 7T gameplay bundle was already enabled: HTTP 200, `/assets/index-D8ItDPoA.js`, SHA-256 `81c148ca18cf9fbbc73e62dfc9bfe1765d6ad0785b0eddc647febce6259ea714`, matching verified release `b95da41`. No new contract activation or Solidity change was necessary.

The missing step was survivor onboarding: discovery was manual-only inside Character, and Adventure opened without a selected token. Old wallet/profile text still described gameplay as disabled. Empty records correctly remained unavailable, but the presentation looked like a disabled application.

## Changes

- Added a shared, styled Choose your Chog panel on Home, Adventure and Character. Connection on the correct chain starts bounded read-only discovery; verified owned token IDs appear as selectable survivor cards. The first verified candidate is selected only when no token has been selected. No signature is requested by discovery or selection.
- Reused the verified collection extension and runtime-hash check rather than introducing an unverified indexer. Chain, finalized snapshot, collection code, tokensOfOwner, balanceOf, individual ownerOf and canonical-block checks remain mandatory. At most 24 candidates are verified, in batches of four. Completeness is checked independently; partial results are labelled.
- Automatic discovery has a 12-second UI deadline. Errors, incomplete inventories and empty holdings are distinguished. A visible manual-entry disclosure remains available; manual selection still requires current ownerOf and game binding before play. A late or superseded discovery cannot select a token for another wallet/context or overwrite a manual selection.
- Account, network and disconnect changes clear the selected survivor. The existing scoped runtime/state reads and pre-submission ownership verification remain in force. Selection loads real XP, Trust, Scars, streak, title, achievements and daily preview; the existing finalized journal is preserved.
- Replaced the technical empty-stage heading with a game landing state; removed the repetitive production notice banner. Risks remain available in a compact disclosure and fully visible in the transaction review/Settings. Genuine network/configuration failures still show actionable messages. Removed obsolete live-mode read-only text and moved manual token entry out of the main profile flow.
- Preserved Task 7T's immediate unsigned action review, eight-second preparation deadline, explicit consent and fail-closed quote behavior. Daily action availability is checked for the selected token; an owned NFT is not automatically assumed unlocked for today.

## Safeguards and limitations

Only deployed `act(uint256,uint8)` on Monad 143 is available. Game `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`; collection `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`. No contract, ABI destination, artwork, font, deployed address or spending-policy change.

Limits remain 400,000 gas, 125 gwei total maximum fee per gas, 0.05 MON maximum estimated cost, 0.1 MON minimum reserve and zero transaction value. Current-owner authorization, simulation, nonce/day checks, runtime binding, explicit wallet confirmation, persistent pending recovery, duplicate prevention and receipt/event/state verification are unchanged. No automatic sign/send/retry or NFT approval/transfer was added.

Collection discovery can be expensive or unavailable at an RPC provider; it is bounded and has manual fallback. Cards identify verified token IDs, not invented profiles or unlicensed NFT portraits. Metadata does not establish ownership. Real-holder installed-wallet acceptance remains incomplete and owner-acknowledged; signer-free browser observation is not account-control proof, an independent audit or provider clearance. The immutable unaudited contract and wallet-warning limitations remain disclosed.

## Validation

- Full frontend suite: **472 tests passed, 31 files**. New cases cover automatic owner-verified selection, transferred-token rejection, preserving manual selection, bounded discovery failure, connection/manual fallback and invalid input.
- TypeScript and production build passed; existing nonfatal chunk-size warning remains.
- Desktop/mobile actual production-bundle test: **53 checks passed**, using genuine read-only collection/game data and a public-address observer with no signer. It verified automatic discovery, selected survivor, actual state, live choices and unsigned review. Complete quotes loaded in 2.348 / 2.376 seconds; reviews opened in 46 / 42 ms in the initial successful final-feature run. Final release artifact checks are retained in local evidence.
- Deliberately unavailable discovery with genuine manual ownerOf/state reads: **28 checks passed**; the unsigned review still prepared, with no signature or transaction.
- Production safety **47**, wallet modal **107**, isolated gameplay **36** checks passed. Isolated lifecycle fixtures are not mainnet transaction or installed-wallet acceptance evidence.
- Frozen Solidity SHA-256 unchanged: `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

Local evidence, browser screenshots and publication results are retained under `docs/evidence/task7u/`; raw evidence and unrelated prior work are excluded from commits. Failed intermediate test selectors are retained separately and do not count as passes. No mainnet transaction was signed or broadcast.

## Files and release

Application: `App.tsx`, `Adventure.tsx`, `Character.tsx`, `WalletChooser.tsx`, `MainnetGameplayPanel.tsx`, `YourSurvivors.tsx`, `discoverSurvivors.ts`; new `SurvivorSelection.tsx` and `survivor-selection.css`. Tests: `YourSurvivors.test.tsx`, new `SurvivorSelection.test.tsx`; production browser observer `task7l-authentic-browser.mjs`. Documentation: README, judge quick start and this report.

**GO for the owner-authorized UI/discovery release.** Final exact-artifact checks passed: 53 live-RPC browser checks, 47 safety checks and 107 wallet-modal checks. Final desktop/mobile reviews opened in 323/212 ms and fully verified quotes loaded in 3.156/2.521 seconds. Push must be fast-forward, preserve previous work and exclude local env/private evidence. Vercel success and exact public bundle bytes must be checked after publication; the resulting commit and live status are recorded in the local release handoff.

## Rollback

Restore Vercel release `b95da41` to revert only this onboarding/UI update. To stop frontend gameplay requests, set `mainnetGameplayReleaseAuthorized=false`, rebuild with existing production overrides and publish an authorized read-only rollback, or restore pre-gameplay commit `40036a07e97ac7301ce5778aaaf36d62ad09f23f`. Preserve pending journals and hashes; never blindly resubmit or clear unresolved records. Frontend rollback cannot pause the immutable contract or reverse a transaction.

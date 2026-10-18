# Task 7X — Final judging improvements

## Product and documentation

README **Play in 60 seconds** now covers walletless Guest Mode, genuine NFT selection/ownership reads, unsigned review/cancellation and expected results. A prominent [judge testing guide](JUDGE_TESTING_GUIDE.md) is linked near the top. **Feedback & What's Next** records the five reviewer observations relayed by the owner: accessibility, demo length/simulation appearance, documentation opening, daily return motivation and gameplay variety. It separates shipped responses from proposed work. These are reviewer suggestions, not collected player testimonials, usage statistics or measured retention gains.

Roadmap: more encounters, additional streak rewards, rare mainnet events, community challenges and possible $CHOG utility. None is promised or asserted as implemented. The verified immutable contract retains its original six encounters. The submission package gains a current judging addendum while preserving historical fields and readiness decisions; no submitted organizer entry is edited.

## Return motivation

Adventure gains a collapsible **The next dawn** guide, preserving access to the existing action buttons. It teases the next UTC-day decision without promising a different encounter. It explains actual frozen-contract rules:

- Consecutive UTC-day actions add prior-streak XP capped at +7; the next action after a missed day starts at streak 1.
- Seven Suns: streak at least 7. Unmarked Week: 7 consecutive actions requesting no additional Scars.
- At 20 prior Scars, reckless actions request 2 additional Scars, cautious actions request 1 fewer; the contract clamps the result.
- Existing badges also cover the first action, repeated bridge repairs, high Trust, 30 Scars, repeated gate encounters and all six types. Badges are not token payouts.

Recorded streak/Scars and the two weekly achievement flags appear only with a complete verified state supplied by the existing read hook. Missing/incomplete state produces no invented milestone. These are recorded values, not a device-time inference of an active streak. Rules were checked against `src/ChogSurvivor.sol`, especially `_preview` and `_earned`; Solidity was not edited.

## Guest fun

**The Moonlit Seed** is an optional 1-in-10 detour offered after completing the six regular guest encounters. It cannot appear before completion or repeat within the same run. No URL/storage unlock is introduced. The three choices trade guest XP, Trust and Scars:

| Choice | Guest effects requested |
| --- | --- |
| Shelter the sprite | +8 XP, +12 Trust, heal up to 2 Scars |
| Study the seed | +16 XP, +3 Trust, no Scars |
| Seize its light | +25 XP, −8 Trust, +6 Scars |

Visible results use actual changes after guest Trust/Scar clamping. A full restart/refresh discards guest progress; the NFT pending journal stays untouched. Guest state has no wallet, RPC, mainnet progression or persistent-storage dependencies. The six mainnet encounters, choices, state transitions and spending limits are unchanged. The rare event is expressly an off-chain preview, not an earned NFT achievement or new on-chain reward.

## Validation and evidence

**GO for this scoped frontend/documentation release.** Full suite: **480 tests / 33 files passed**. Production build passed (existing nonfatal dependency annotation/chunk-size advisories). Guest desktop/mobile: **38 checks passed**; isolated gameplay: **36**; wallet modal: **107**; production safety: **47**; current production-bundle genuine mainnet read-only integration: **53**. No signing or broadcasting occurred.

An initial run of the obsolete Task 7B browser harness stopped on its removed “Enter the Wild” homepage selector. The maintained Task 7L production-bundle harness passed against the same release artifact; this was a harness-selection issue, not a gameplay regression. An early new-guide test run exposed partial fixture states; the guide now rejects incomplete milestone inputs rather than presenting a badge result. The final full suite and all release checks pass.

Production build uses the existing Vercel environment overrides. Local evidence stays in `docs/evidence/task7x/`; screenshots include desktop/mobile rare-event consequences. New tests cover chance boundaries, unavailable/early bonus entry, duplicate choice prevention, rare results, reset, honest milestone display and loss of verified state. Existing suites cover contract parity, ownership/transfer, transaction spending limits, pending recovery, receipt validation and rejected requests.

Commands:

```bash
cd frontend
npm test
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
node scripts/task7x-guest-browser.mjs
node scripts/task7n-gameplay-browser.mjs --evidence-dir ../docs/evidence/task7x/gameplay
node scripts/task7j-wallet-modal-browser.mjs --artifact-dir dist --expect-gameplay --evidence-dir ../docs/evidence/task7x/wallet
node scripts/public-demo-preflight.mjs --artifact-dir dist --expect-gameplay
node scripts/task7l-authentic-browser.mjs --artifact-dir dist --expect-gameplay --evidence-dir ../docs/evidence/task7x/mainnet
```

The guest browser test forces only the off-chain lottery draw for deterministic rare-event coverage. Wallet-modal and isolated gameplay fixtures are synthetic, not installed-holder acceptance. Genuine RPC checks use a public-address observer without a signer and reject every signing/broadcast method. No real transaction is sent. Automated playability checks verify accessible choices, consequences and isolation; human enjoyment and retention outcomes remain unmeasured.

Frozen Solidity SHA-256 remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`. Narrated video SHA-256 remains `52d9fdb9e51741eea2d6d07c8de4834b9f5198e8f7e9a112170eb581d0c0a620`. No game/NFT address, artwork, font, ABI, mainnet write rule, activation setting or spending limit changes. The policy remains 400,000 gas, 125 gwei total gas price, 0.05 MON maximum estimated cost and 0.1 MON reserve.

## Release scope and rollback

Release files: `README.md`, `docs/JUDGE_TESTING_GUIDE.md`, `docs/FINAL_CHOGATHON_SUBMISSION.md`, this report, `frontend/src/GuestChog.tsx`, its test, `frontend/src/DailyTrailGuide.tsx`, its test, the two-line guide import/render in `MainnetGameplayPanel.tsx`, and `frontend/scripts/task7x-guest-browser.mjs`. Unrelated pre-existing edits, local reports/evidence, holder files, environment files and media workspace remain excluded. Secret checks cover the explicit staged release files before commit.

Rollback: revert only this scoped release commit through a reviewed normal follow-up commit/deployment. That removes the guest detour and guide while retaining Task 7W narration and the prior mainnet release. It changes no contract state. Final publication commit, Vercel status, public browser checks and exact results are recorded in the local post-publication handoff.

# Task 7I — final submission video and documentation release

## Review result

Owner-supplied video: **https://youtu.be/qV-c7AP0VAg**. Added to README, final submission package, judge walkthrough and historical submission draft. The public experience remains explicitly a walletless simulation, distinct from the deployed, source-verified Monad contract.

**Documentation push safety: GO**, conditional on committing only the reviewed documentation allowlist and a normal fast-forward push from the verified baseline. **Submission completion remains pending** team/contact/registration and owner rights/banner declarations, plus a normal signed-out playback check. This report is prepared before its own commit; the exact final commit, remote match and post-push deployment observation are reported in the final handoff and retained locally.

## Video accessibility

YouTube public oEmbed returned HTTP 200 without authentication and the expected title, **CHOG SURVIVOR | NFT Survival Game on Monad | Chogathon 2026**. A fresh signed-out Chromium watch/playback attempt received HTTP 429 and Google's bot-check page. No owner account, existing browser profile, CAPTCHA bypass or warning bypass was used. **Public metadata access is confirmed; actual signed-out playback is not independently confirmed in this environment.** This does not establish that the video is private or unavailable. Owner should play the supplied link in a normal incognito browser before submitting.

Sanitized evidence: [youtube-access.json](evidence/task7i/youtube-access.json). Bot-check query tokens and client-address context were removed; no raw browser capture is published. No private film, audio, thumbnail or source footage is committed or uploaded. The owner's request authorizes linking the supplied URL; it does not establish third-party artwork rights.

## Reviewed scope and exclusions

Reviewed outstanding README, deployment guide, judge guide, submission draft, Task 7E handoff, Task 7F controlled-test report, Task 7G readiness report and Task 7H final package/evidence. Retain the historical reports unchanged. Task 7E–7G operator reports/evidence, holder tools, the pre-existing .gitignore edit and the entire ignored demo-video workspace remain local, unstaged and preserved. They are not needed to judge the simulation and contain operational context or references to unpublished tools. No new holder-testing milestone was created.

Publish only:

- README and `docs/{DEMO_DEPLOYMENT_GUIDE,JUDGE_QUICK_START,HACKATHON_SUBMISSION_DRAFT,FINAL_CHOGATHON_SUBMISSION,TASK_7I_SUBMISSION_UPDATE}.md`.
- Five sanitized Task 7H evidence JSON files supporting official requirements, existing video review and public-link/browser/document checks. Their original timestamps and historical missing-video status remain historical evidence.
- Task 7I public-link, sanitized video-access, production-browser, hosted-before and document/security review JSON evidence.

The allowlist is documentation only. No Solidity, frontend source, ABI, manifest, dependency/lockfile, environment file, Vercel configuration, workflow, executable script, private media or tester record is included. No holder identity/contact information was collected. Scan candidates for credential/token/private-key patterns and review exact staged paths/diff before commit. Existing public addresses and transaction/artifact hashes are not wallet secrets.

## Essential checks

- Public website, repository, deployment transaction, NFT collection and game Code-page URLs returned HTTP 200 without authentication. GitHub API confirms public repository and main branch. MonadScan still exposes Source Code Verified / Exact Match and matching contract/compiler markers.
- Fresh explicit production build passed, using the unchanged checked-in Vercel environment overrides. TypeScript passed as part of build. Existing Vite chunk-size advisory is nonfatal.
- **49 production browser checks passed** on the fresh artifact: simulation, disabled production writes, mobile/desktop, no wallet and no external RPC writes.
- **Five hosted read-only browser checks passed** before push: simulation, no public mainnet-play toggle, Production transactions disabled, no injected wallet and no page errors.
- Fresh production main JS SHA-256 **d287158be985f4997246891e792bdb75f7f353a4f7a762d9f0e72a5823c4c6ec**, byte-identical to the Task 7E/7H served simulation artifact. Frontend/source/configuration trees are unchanged.
- Frozen Solidity SHA-256 remains **5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7**.
- README has chain 143, correct game/NFT addresses, live site, verified-source link, demo instructions and video link. Local Markdown links and organizer-field character limits checked. Diff whitespace checked.
- Full unchanged frontend/Foundry/holder suites were not repeated; no chain mutation or Anvil reset.

Evidence: [public links](evidence/task7i/public-links.json), [production browser](evidence/task7i/production-browser.json), [hosted before push](evidence/task7i/hosted-before.json), [document/security review](evidence/task7i/document-review.json).

## Push/deployment gate

Starting branch **main**, origin **https://github.com/ScapeXYZ/chog-survivor.git**. Local HEAD and remote main initially **2db718dfa9f1a929e29fbf83d66b65adfeaf7c1a**; all six reviewed Task 7C/7D commits remain ancestors. Recheck remote before push; do not force-push, reset, rebase or overwrite divergence.

Task 7E established that GitHub main pushes can automatically deploy Vercel. This is expected, not a manual publication request. The unchanged `frontend/vercel.json` command explicitly forces `VITE_CHOG_ENV=production` and clears local overrides. No root GitHub Actions workflow or configuration change is introduced. Only Markdown/JSON outside the frontend is eligible for this commit, so this push cannot introduce a mainnet gameplay activation setting. Fresh artifact checks additionally establish the simulation behavior and identical served code. Any automatic build must retain simulation-only gameplay. Inspect remote commit/deployment status and public simulation after push; do not issue manual Vercel publish commands.

**No permission is given or inferred for mainnet gameplay activation, transactions or redeployment of Solidity.** No independent audit or official wallet-provider clearance is claimed.

## Remaining submission requirements

1. Owner checks actual YouTube playback signed out in a normal browser; metadata alone is not a playback guarantee.
2. Supply registered team/solo details, members and Discord/X handles; enter contact email privately in the organizer form; confirm existing registered account access.
3. Confirm authorship/pre-existing-work dates and artwork/branding/video rights; approve the exact banner asset before upload. No further media is uploaded here.
4. Submit the accurate simulation-plus-deployed-contract package via the organizer account before **23 October 2026, 15:00 UTC (16:00 Lagos)** and save confirmation. No submission is performed or claimed by this task.

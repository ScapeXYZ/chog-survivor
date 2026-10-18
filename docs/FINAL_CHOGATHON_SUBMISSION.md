# CHOG SURVIVOR — final Chogathon submission package

## Current judging update — Task 7X

The owner reports CHOG SURVIVOR has been submitted. This documentation update does not change the organizer entry. For the current release, use the **[judge testing guide](JUDGE_TESTING_GUIDE.md)** and **[README testing steps and feedback/roadmap](../README.md#play-in-60-seconds)**.

- [Play as Guest](https://chog-survivor.vercel.app/#guest): no wallet or NFT; six off-chain encounters plus an optional 1-in-10 guest-only Moonlit Seed detour after completion.
- [Play with your NFT](https://chog-survivor.vercel.app/): genuine owner-verified Monad mainnet gameplay, one action per token per UTC day. Review and cancel without a transaction; submission requires the holder’s explicit wallet approval and real MON gas.
- [Narrated, subtitled 60-second product walkthrough](https://chog-survivor.vercel.app/chog-survivor-narrated-60s.mp4): clearly labelled guest footage, no completed mainnet action depicted. The historical YouTube submission remains unchanged.
- Return cues now explain existing streak XP, Seven Suns, Unmarked Week and scar modifiers. Additional encounters/rewards, community challenges and possible $CHOG utility remain proposals, not implemented mainnet promises.

Feedback statements are reviewer suggestions relayed by the owner, not measured player feedback or retention results. The immutable unaudited contract, six mainnet encounters and spending limits are unchanged. Earlier readiness decisions and simulation-era paste fields below are **historical records, not current submission copy**.

**Historical submission package:** the fields and preparation decision below describe the submitted simulation-era package. They do not describe the current runtime. The Tasks 7S/7T gameplay release is owner-authorized with incomplete holder-wallet acceptance acknowledged. Task 7T resolves the unsigned-review blocker and validates the gameplay release. See the [current release guide](TASK_7T_MAINNET_ACTION_REVIEW_FIX.md). The linked video remains historical footage.

**Decision: NOT READY to submit yet.** Submission text and core public links are prepared and verified. The owner has supplied the demo-video link. Remaining: owner-supplied team/contact information and registration confirmation, authorship/rights attestation, and banner publication approval. No further holder-testing milestone is required by this package. Public mainnet transactions remain disabled.

Prepared 17 October 2026 (Africa/Lagos), updated in Task 7I with the owner-supplied YouTube link. No media upload, organizer submission or mainnet activation performed. Documentation release results are recorded in Task 7I. Existing local work and private media preserved.

## Ready-to-paste submission fields

Use the field blocks below, not this internal readiness decision, as the submission copy. Replace only the explicitly missing owner fields. Contact information belongs in the organizer-only fields, not a public README.

### Project name

CHOG SURVIVOR

### One-line pitch

A daily survival adventure where the Chog NFT is the survivor: its progression and history travel with the token across wallets.

### Tagline

Every choice leaves a mark. The Chog carries the story.

### App link

https://chog-survivor.vercel.app/

### GitHub repository

https://github.com/ScapeXYZ/chog-survivor

### Demo video

https://youtu.be/qV-c7AP0VAg

Owner-supplied video link, added in Task 7I. The retained local export is `demo-video/output/CHOG_SURVIVOR_DEMO.mp4` (2:51); no media was uploaded or changed by this task. See the Task 7I signed-out accessibility result below.

### Banner image

**OWNER APPROVAL REQUIRED.** Existing candidate: `demo-video/output/thumbnail.png` (1920×1080). Do not upload it or another private asset without exact artwork/branding and publication approval. No new image was created.

### Team and organizer-only contact

- Team name / solo status: **OWNER TO PROVIDE**.
- Team member display names, X and Discord handles: **OWNER TO PROVIDE**; confirm they match the registered application.
- Contact email: **OWNER TO ENTER DIRECTLY IN THE ORGANIZER-ONLY FIELD**.
- Registration: **OWNER TO CONFIRM EXISTING REGISTERED ACCOUNT/TEAM ACCESS**. Registration is already closed; no new registration or submission was attempted.

### Description — paste into the main description field

<!-- BEGIN SUBMISSION DESCRIPTION -->
CHOG SURVIVOR turns a Chog Genesis NFT into a persistent game character. The NFT is the survivor; the wallet is its current controller. Each daily choice leaves a record that stays with the token when ownership changes.

The problem: an NFT can identify a holder without giving the token itself a continuing playable identity. We want a Chog to accumulate a story that survives a change of wallet.

Our solution is a daily survival adventure with six encounters and eighteen fixed choices. Choices affect XP, Trust and Scars, build streaks, unlock eight achievements and determine titles. Only the current ownerOf(tokenId) can perform an action, once per token per UTC day. A transfer changes who can act without resetting the survivor or granting a second same-day action. Contract events provide the evidence for its adventure journal.

The frontend makes each choice playable through optional Survivor's Trial, Timing and Story interactions. Completing, skipping or changing interaction difficulty does not change the underlying contract rewards or daily rules.

Try the public website without a wallet, NFT, funds or login. It is explicitly a SIMULATION: the HUD and choice previews demonstrate the experience, and play does not save XP, earn achievements or send transactions. Public mainnet gameplay is disabled.

Separately, the ChogSurvivor contract is deployed on Monad mainnet, chain ID 143, at 0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390. Its source is publicly verified on MonadScan as an Exact Match. It is immutably bound to Chog Genesis at 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763. Source verification is not an independent security audit.

The demo film shows the simulation and clearly labelled historical local-Anvil evidence: fixture NFT #2006 retained its progression, achievement, journal attribution and daily lock after transfer. Those receipts are real local-chain evidence, not genuine Chog Genesis mainnet gameplay. We do not claim a completed live-holder mainnet gameplay test.

The Chog NFT is essential to the persistent contract experience: its token ID anchors state and history, and ownership authorizes the controller. Removing the NFT removes that identity, authorization and transferable progression. The walletless simulation is a judge-accessible illustration of this design, not a substitute for its NFT authorization.

Built with Solidity/Foundry, React, TypeScript, Vite, Wagmi and Viem. The deployed contract is immutable, non-pausable and unaudited. No NFT staking, custody, approval or transfer is required to play. There is no $CHOG token integration or token-reward economy claimed.

Next we would validate the holder experience under explicit consent, gather player feedback and consider a separately approved frontend release. No measured user adoption or retention is claimed.
<!-- END SUBMISSION DESCRIPTION -->

### Problem statement

NFT ownership can serve as a login without giving the token a persistent playable identity. A wallet-based character also loses continuity when a collectible changes hands. CHOG SURVIVOR explores a different model: the Chog itself accumulates choices, scars, achievements and history, while wallets become temporary controllers.

### Solution

Attach survivor state to the Chog token ID and authorize daily actions through the collection's current ownerOf result. Keep progression and historical events under that token ID across transfers. A short, accessible frontend lets people explore the choices, while the deployed contract provides the permanent rules and ownership boundary. The public submission demo remains a walletless simulation.

### Key features

- Six encounters, eighteen fixed choices and meaningful XP/Trust/Scars trade-offs.
- One contract action per NFT per UTC day; transfers preserve the existing lock.
- Token-bound progression, streaks, eight achievements and derived titles.
- Event-backed history with the historical acting wallet distinct from current ownership.
- Optional Survivor's Trial, Timing and Story interactions, Skip and reduced-motion support.
- Walletless judge simulation with explicit non-persistence disclosures.
- Deployed, source-verified Monad contract; public gameplay writes remain disabled.

### Tech stack

Solidity 0.8.28; Foundry; React 18; TypeScript; Vite; Wagmi; Viem; TanStack Query; Vitest; Playwright. Static frontend hosted on Vercel; public source on GitHub. Demo film produced locally with Remotion/Playwright/FFmpeg and stock synthetic narration.

### Technical architecture

A static React frontend separates walletless simulation from contract-backed interaction. The Solidity contract binds the canonical Chog Genesis address immutably, uses ownerOf for action authorization and stores survivor state by token ID. Preview reads expose expected outcomes; act(tokenId, choiceId) enforces ownership and the UTC daily lock, updates state and emits progression/achievement events. The frontend reconstructs verified journal entries from events. Compatible EVM wallet discovery uses EIP-6963. Public production configuration disables gameplay writes; no backend, staking service or NFT custody is required.

### Monad integration

The deployed ChogSurvivor contract runs on Monad mainnet (chain 143) and reads ownership from the genuine Chog Genesis collection on that chain. Deployment/runtime and NFT binding were verified against independent RPC providers in Task 7A; MonadScan publishes Exact Match source. The public frontend demonstrates the UX in simulation, with optional genuine ownership reads, and does not submit gameplay transactions. Historical local fixtures and receipts are labelled separately. We make no throughput, adoption, audit or wallet-provider-clearance claim.

### Why the Chog NFT is essential

The contract's survivor is indexed by token ID, not by wallet. Current ownership controls who may act, while the same token retains progression, events and its daily eligibility after transfer. The original actor remains attributable in historical events. Remove the Chog NFT and the contract loses its identity and authorization source; a generic wallet profile would not provide transferable character continuity. The no-NFT simulation is an onboarding illustration for judges, not the persistent game.

### Judge access instructions — paste into the organizer-only field

<!-- BEGIN JUDGE INSTRUCTIONS -->
Watch the demo at https://youtu.be/qV-c7AP0VAg, then open https://chog-survivor.vercel.app/ in a fresh browser tab. No account, wallet, NFT, extension or MON is needed.

1. Select Enter the Wild and leave NFT selection empty.
2. Choose any card. Try Survivor's Trial, Timing or Story, or use Skip. Follow the category label because card positions vary.
3. Read the simulation-only rulebook preview. No XP, achievements or journal entries are earned or saved, and no signature is requested.
4. Close the preview and try another choice. Character explains the survivor concept; it does not fabricate persistent records. Settings shows Production transactions disabled.
5. Inspect the deployed contract's verified source at https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code and the public repository at https://github.com/ScapeXYZ/chog-survivor.

The website is a working simulation, not enabled public mainnet gameplay. The film's fixture #2006 receipts demonstrate historical local-Anvil execution and transfer continuity, not a new mainnet action. Refreshing returns to Home. Do not connect a wallet or buy an NFT to judge this submission; stop on any genuine browser/wallet warning rather than bypassing it.
<!-- END JUDGE INSTRUCTIONS -->

### Pre-existing work / tools disclosure

Chog Genesis is an existing third-party collection; we did not create it. The project uses the open-source frameworks and tooling listed above, existing font families with retained license notices, AI-assisted development and provisional generated runtime illustrations. The film uses stock Kokoro synthetic narration and original procedural background audio; it does not impersonate a team member. Historical local receipts and UI footage are reused with their original provenance. The contract and gameplay are CHOG SURVIVOR project work; **owner must confirm the original work dates, any pre-hackathon code/assets, team authorship and rights before attesting organizer eligibility**. No unverified originality or IP-clearance assertion is supplied.

### User feedback / usage

No verified external-player feedback, active-user count or retention measurements are available in this package. Automated tests, browser checks and historical local contract evidence demonstrate implementation behavior; they are not user-adoption metrics.

### Optional go-to-market / next steps

Start with existing Chog holders and community playtesting after explicit consent and risk review. Learn whether daily choices and inherited character history encourage repeat visits; use that feedback to refine onboarding and legibility. Any public mainnet activation remains a separate owner decision. No token launch, paid acquisition, audience size or commercial partnership is promised.

### Short spoken pitch

The Chog NFT is the survivor itself. Each daily choice builds XP, Trust, Scars and history that stay with the token across wallets. Try the walletless simulation today, then inspect our source-verified Monad contract. We are exploring how a collectible becomes a character with a past.

## Public links and verification

Checked without authentication on 17 October 2026 local time; UTC timestamps in `evidence/task7h/`.

| Item | Link | Result |
|---|---|---|
| Working public simulation | https://chog-survivor.vercel.app/ | HTTP 200; browser entered simulation; production transactions disabled; no mainnet toggle or wallet used. |
| Repository | https://github.com/ScapeXYZ/chog-survivor | HTTP 200; GitHub API confirms public, main branch. |
| Published main | https://github.com/ScapeXYZ/chog-survivor/commit/2db718dfa9f1a929e29fbf83d66b65adfeaf7c1a | Task 7H baseline; Task 7I documentation-release commit/result recorded separately. |
| Game / source | https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code | HTTP 200; Source Code Verified / Exact Match / ChogSurvivor / 0.8.28 / Cancun markers present. Detailed source/artifact comparison retained in Task 7D. |
| Deployment transaction | https://monadscan.com/tx/0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956 | HTTP 200. No new transaction or repeated RPC deployment test. |
| Genuine Chog Genesis | https://monadscan.com/address/0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763 | HTTP 200; distinct from game CA. |
| Official event / dashboard | https://chogathon.chog.xyz/ · https://chogathon.chog.xyz/dashboard | Requirements read from public organizer page; no sign-in/submission attempted. |
| Demo video | https://youtu.be/qV-c7AP0VAg | Public oEmbed metadata accessible without login; signed-out playback test blocked by HTTP 429. Owner incognito playback check remains required. |

The readonly browser check blocked external/non-GET requests and used no wallet. Web text retrieval initially failed for some links; direct unauthenticated GETs and Chromium succeeded. Evidence contains status/hashes and selected facts, not private captures or organizer account data.

## Official requirement check

Source: [official Chogathon site](https://chogathon.chog.xyz/), fetched directly in Task 7H. Deadline **23 October 2026, 15:00 UTC / 16:00 Lagos**; registration closed **11 October, 13:00 UTC**. Confirm submission access using the already registered team account. One project per team. NFT essentiality is a qualification requirement; $CHOG integration is optional. Judging weights: novelty 30%, fun 20%, retention 20%, clarity 15%, execution 15%.

| Requirement | Package status |
|---|---|
| Name, team, Discord/X | Name ready; owner must supply registered team/handles. |
| Description, novelty, NFT essentiality | Paste-ready above; description below 8000-character limit. Simulation/deployed-contract distinction explicit. |
| Working demo and instructions | Public simulation reachable; concise walletless path above. No organizer ruling on simulation-plus-contract scope is claimed. Owner must submit that scope honestly. |
| Video, at most three minutes | 2:51 export fits duration; owner supplied the YouTube link in Task 7I. Accessibility result below. |
| Repository, stack, pre-existing work | Repository public, stack ready; owner must complete authorship/date/rights attestation. |
| Feedback / what's next | Honest absence of measured feedback, roadmap prepared. |
| Contact email / banner | Contact missing; private banner candidate needs approval. |

The current form exposes description, judge instructions and optional go-to-market text fields with 8000-character limits. GitHub, contact email and judge instructions are labelled organizer-only. Use these fields for private contact data, not this public-facing document. No additional credential or test-wallet access is required for the simulation.

## Existing film and public-link procedure

Private file: `demo-video/output/CHOG_SURVIVOR_DEMO.mp4`.

- FFprobe: **171.000 seconds**, 1920×1080, 30 fps, H.264/AAC, **24832272 bytes**.
- SHA-256: `150db0959a5bd7c7d3a6af34525875713a657182a39268fe9e52c2935d8fb804`.
- Reviewed provenance/credits, full caption transcript and actual frames at 108s/164s. They distinguish Public Demo — Simulation from Verified Local Anvil Test — Not Monad Mainnet; the ending correctly says mainnet gameplay awaits review/approval. No new footage or render was made.
- The video README mentions a QA_REPORT.json that is absent from the current output directory. We do not claim that report passed. Existing speech-review data and the current media metadata were inspected; a complete human playback remains part of publication review.

The owner supplied **https://youtu.be/qV-c7AP0VAg** in Task 7I. The link is now used in the video field, README and judge guide. No new media upload or account permission change was performed. Adding the owner-supplied link does not independently attest artwork/branding rights or alter the original local export. Public YouTube oEmbed returned the correct title without authentication. A fresh signed-out Chromium playback attempt was redirected to Google’s HTTP 429 bot check; actual playback could not be confirmed here. Do not interpret this as private/unavailable video or as verified playback. The owner should check it in a normal incognito browser. See `evidence/task7i/youtube-access.json` for the sanitized result. Banner approval and owner rights/authorship declarations remain separate.

## Essential checks and final publication handoff

New checks only: public URL GETs/GitHub visibility, five-check read-only hosted browser smoke, official requirement inspection, FFprobe/video hash and selected-frame/caption review, local document links/lengths, frozen-source hash and diff whitespace. No full frontend/Foundry suite, contract deployment tests or holder-testing cycles repeated for documentation-only edits. Task 7F's 391 frontend tests and production build remain historical validation, not newly rerun checks.

Changed publication candidates:

- `README.md`: final-package link, accurate completed-private-video status, Task 7E push status and confirmed official deadline.
- `docs/JUDGE_QUICK_START.md`: accurate private-film status and final-package link.
- `docs/DEMO_DEPLOYMENT_GUIDE.md`: updated historical Vercel release/access status.
- `docs/HACKATHON_SUBMISSION_DRAFT.md`: superseded notice and corrected video placeholder.
- `docs/FINAL_CHOGATHON_SUBMISSION.md` and `docs/evidence/task7h/`: final package and essential-check evidence.

These were local and uncommitted at Task 7H. Task 7I reviews a **docs-only** publication selection; its report records the commit/push result. Existing unrelated holder tools, operator reports and private `demo-video/` media are excluded. A later GitHub push may trigger Vercel automatically, so any approved push must preserve the production simulation command. No new website build/publication or mainnet activation is needed for this submission package.

### Exact remaining owner actions

1. Confirm existing Chogathon registration/team access, provide member/Discord/X details and enter contact email privately.
2. Confirm pre-existing-work/authorship dates and exact artwork/branding/video/banner publication permissions. Existing rights records remain incomplete; no permission is inferred from NFT ownership or the contest theme.
3. Confirm the supplied video is the intended final submission and verify its signed-out playback from a normal browser. No new upload, holder transaction or filming is required by this package.
4. Replace missing team/contact fields; use the final text and owner-supplied video in the owner-operated form. See Task 7I for documentation publication status.
5. Submit once through the registered organizer account before **23 October 2026, 15:00 UTC**, accurately describing the simulation and separately deployed contract. Save the submission confirmation. No submission is claimed here.

**NOT READY until the remaining team/contact/registration and rights/banner declarations are resolved.** Contract source verification, public demo availability and submission copy are ready. Mainnet gameplay, governance/custody attestations and official wallet-provider clearance remain separate unresolved risks; source verification and submission do not resolve them. No new holder-testing milestones are proposed.

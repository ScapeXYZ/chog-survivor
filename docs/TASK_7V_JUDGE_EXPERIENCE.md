# Task 7V — Judge experience release

**GO for the owner-authorized guest/README/video release after completed checks.** Publication results and exact deployed commit are recorded in the local release handoff after push.

## Two-minute experience

README now opens exactly:

> # CHOG SURVIVOR — Your Chog NFT isn't just a ticket to the game. It is the survivor itself.

Three-sentence pitch, Play Now, Guest Mode, the new 60-second walkthrough and three highlights precede technical context. Mainnet verification, security limitations and release history remain accurate in labelled sections below the product explanation. The judge guide now offers an immediate playable guest route.

Home's primary action is Play as Guest, alongside Connect Wallet / Play with Your NFT. How It Works explains the difference between guest preview and real daily NFT play, and that NFT progression follows the token ID across ownership transfers.

Guest URL: **https://chog-survivor.vercel.app/#guest**. It opens directly with the existing Chog illustration, Broken Bridge encounter and three meaningful decisions. Six rulebook encounters can be played in an accelerated journey, with visible consequences and guest XP/Trust/Scars. Replay/reset is immediate. Guest rules use base choice effects and clamping; they do not claim exact contract modifier or UTC-day parity.

## Isolation and real-game protections

Guest Mode is always labelled **Guest Mode — off-chain preview**. React memory holds guest state; no NFT IDs, wallet accounts, contract clients, chain writes, mainnet progression, pending journal or local-storage persistence are used by the guest component. The root route renders GuestChog outside WagmiProvider and QueryClientProvider, so guest entry does not initialize wallet reconnect or NFT queries. Returning to NFT play mounts the existing real-game providers; guest values are never passed to App or contract code.

An existing mainnet pending record is untouched. Entering guest mode does not cancel a transaction or wallet prompt that a holder previously requested; they must resolve that in the real wallet and existing recovery flow. No agent signing/broadcasting is performed.

Real NFT mode retains chain 143, verified collection/game addresses, ownerOf authorization, runtime/binding checks, genuine state/eligibility, simulation, nonce validation, explicit confirmation, pending recovery and duplicate prevention. Approved ceilings remain 400,000 gas, 125 gwei total fee per gas, 0.05 MON maximum cost, 0.1 MON reserve and zero value. Guest route/hash cannot enable a contract write or replace these checks. Solidity, deployed addresses, art and fonts are unchanged.

## New video and evidence limits

Separate public output: **https://chog-survivor.vercel.app/chog-survivor-walkthrough-60s.mp4**.

The new caption-led, music-backed **60-second product walkthrough** uses an actual live-site capture, actual release-candidate guest recording and clearly marked guest consequences. It explicitly says **no completed mainnet action is shown**. The 30–42 second section is a clearly marked genuine-holder proof recording slot, not a fabricated wallet confirmation or explorer receipt. Visual export: 1,800 frames, 1920×1080, 30 FPS, H.264/AAC; container duration 60.011 s includes audio padding. Full decode passed and proof-slot/guest frames were visually reviewed. Existing Remotion/Playwright workflow was used with a new composition/output; the previous video and original submitted Chogathon entry were not changed.

See [video sources, labels and genuine-proof recording requirements](TASK_7V_VIDEO_PROVENANCE.md). A consenting real NFT holder's recorded confirmation, successful canonical/finalized receipt, exact event, before/after state and MonadScan link are still needed for a real-transaction proof version. No independent audit, provider clearance or installed-holder wallet acceptance is invented. Do not replace the submitted entry/video without approval.

## Checks

- Complete frontend suite: **475 passed / 32 files**, including guest reducer/UI journey, duplicate choice handling, invalid choices, restart and preserved mainnet pending record.
- Production TypeScript/Vite build: passed; existing nonfatal bundle-size warning remains.
- Guest desktop/mobile browser: **34 checks passed** (initial captured run 32); start under ten seconds, all six encounters, consequences, reset/reload, no overflow, pending journal untouched, zero wallet-provider requests and no RPC/POST/sign/send in guest mode. Return to real NFT mode has no guest stats.
- Real NFT production browser: **53 checks passed** with genuine read-only RPC, discovery, ownerOf, state, daily choices and unsigned review/cancellation. The observer has no signer and does not prove actual holder control.
- Wallet modal: **107 passed**; production safety: **47 passed**. Synthetic wallet checks are not installed-wallet acceptance.
- Video: 5,773,720 bytes; H.264/AAC, 1920×1080, 30 FPS, full decode with no errors. Export SHA-256 and source labels are retained locally in `docs/evidence/task7v/video-provenance.json`.
- Frozen Solidity SHA-256 remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

## Files, publication and rollback

Guest implementation: `GuestChog.tsx`, `guest-chog.css`, `GuestChog.test.tsx`; provider/router isolation: `main.tsx`; Home/How It Works: `App.tsx`; existing navigation tests updated to the real NFT entry label. Browser regression: `scripts/task7v-guest-browser.mjs`. Public video: `public/chog-survivor-walkthrough-60s.mp4`. README, judge guide, this report and video provenance complete the release.

Only reviewed Task 7V files and the new safe export are committed. Raw/private video workspace, old media, raw evidence, local environment files, unrelated `.gitignore` and deployment-comment changes remain local. The original YouTube video and organizer entry are untouched. No contract transaction/deployment or Anvil reset occurs.

Rollback: restore Task 7U Vercel release `4c6890f` to remove the guest/video UI while preserving mainnet gameplay. For an emergency write-disable rollback, restore pre-gameplay `40036a0` or set the existing source release gate false, rebuild and publish under owner authorization. Preserve pending hashes/journals; no automatic retry or chain reversal is possible.

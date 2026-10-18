# Task 7Y — Player feedback, story consequences and performance

Guest Mode now displays a unique two-sentence consequence for all 21 choices across the six original encounters and the Moonlit Seed bonus. The first sentence follows the chosen action; the second reports the actual resolved XP, Trust and Scars changes, including capped Trust and partial healing. Existing numerical effects remain visible. The README includes the exact owner-supplied Lauki Antonson quote and the shipped response. No other testimonial or retention metric was added.

## Loading investigation and change

Previously the entry module imported the NFT app, wagmi, query providers, wallet configuration and full game CSS even at `#guest`. The full stylesheet also imported remote fonts. Guest startup therefore depended on delivery of unrelated wallet/game assets and blocking CSS. The new route keeps Guest Mode in the small initial bundle and lazy-loads the unchanged NFT providers and app when entering NFT mode. A boundary offers reload and Guest Mode if that chunk fails. Fonts load without blocking the initial render. Verification, ownership, transaction review and wallet approval gates remain in the NFT app.

Production build: initial JavaScript 157.46 KB (51.70 KB gzip), initial CSS 3.08 KB (1.17 KB gzip); deferred NFT JavaScript 466.76 KB (140.91 KB gzip) and CSS 70.53 KB (16.77 KB gzip).

Before deployment, three fresh public contexts per viewport measured navigation through the first resolved guest decision: desktop 7,744 / 10,680 / 23,794 ms; mobile viewport 5,447 / 34,098 / 17,477 ms. Prior Task 7X observations were 8,388 / 15,724 ms to visible controls. These are different endpoints and should not be treated as a controlled speedup comparison. Local updated production build first-decision times: desktop 182 / 187 / 183 ms; mobile 167 / 217 / 157 ms. Public post-deployment measurements belong in the release handoff.

Method: Chromium, fresh contexts, 1440x1000 and 375x1000 viewports, no CPU/network throttling; external requests blocked consistently with the prior harness. Mobile viewport simulation is not a physical mobile-device benchmark. Variable network delivery prevents a universal readiness guarantee.

## Verification before release

- 509 frontend tests across 35 files passed. An initial parallel run hit one five-second module-import timeout; the complete rerun with two workers passed without increasing timeouts.
- Exact production-environment build passed. Existing dependency annotation warnings remain nonfatal.
- Guest browser: 245 checks passed across 1440, 375 and 320px, all 21 story choices, Moonlit Seed, zero wallet/provider requests, pending NFT journal preservation, reset and refresh isolation, no overflow and guest-to-NFT navigation. Guest route does not download the NFT app chunk.
- Wallet integration: 107 synthetic-provider checks passed. This is not real installed-wallet acceptance.
- Isolated gameplay: 36 checks passed. Production safety: 47 checks passed across 320, 375, 768 and 1440px.
- Live read-only outage checks: 51 passed across desktop/mobile with deliberately unavailable discovery and delayed estimates. Genuine contract state remained verified; preflight timed out and submission stayed disabled with zero signing/broadcast. Public-address observation does not prove holder account control.
- Normal live read-only desktop retry: 28 checks passed, including verified bounded fee quotation in 3381 ms and cancellation without signing/broadcast.
- Additional live-RPC observations: the normal observer run reached the unsigned review, then failed its fee-quote timing assertion because the existing eight-second preflight timeout disabled submission. A curl retry encountered an RPC TLS timeout during discovery. These network-dependent runs are not reported as passes; no signing or broadcast occurred. Local wallet, quote and safety checks above passed.
- Frozen Solidity SHA-256 remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`. Approved compiled artifact verification passed.
- Narrated video SHA-256 remains `52d9fdb9e51741eea2d6d07c8de4834b9f5198e8f7e9a112170eb581d0c0a620`.

No Solidity, ABI, contract address, mainnet rules, wallet configuration or transaction safeguards changed. Moonlit Seed and daily return features remain. No real mainnet transaction evidence is claimed. Raw local evidence is retained under `docs/evidence/task7y/`; failed sandbox and overlapping-build attempts are retained separately from successful final runs.

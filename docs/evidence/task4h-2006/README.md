# CHOG #2006 — recorded real local transfer continuity

**Network: isolated Anvil chain 31338. Fixture NFT, not authentic Chog Genesis. Not Monad mainnet or a public test network.** Captured October 15, 2026 during approved Task 4H; Task 4K curated these existing records without submitting any transaction or modifying the chain. This evidence package is prepared locally, not published.

The Chog NFT is the survivor itself. Its token ID permanently keys progression and history; the owner controls the next permitted action. A transfer changes that controller, not the survivor's past.

## What happened

| Item | Recorded evidence |
|---|---|
| Game | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`, deployment start block 4 |
| NFT fixture | `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`, token 2006, on chain 31338 only |
| Historical controller B | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| New controller A | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Action | B: `act(2006, 1)`, block 15, successful receipt |
| Action hash | `0xfcd6afa0d8d95283c407631dcd30685725be229e40826ff62f9346c6c44c1a9f` |
| Actual resolution | Ancient Gate → Solve the runes; event 4, choice 1, outcome 10; UTC day 20741; recorded action UTC `2026-10-15T12:20:52.000Z` |
| Transfer | B: `transferFrom(B, A, 2006)`, block 16, successful receipt |
| Transfer hash | `0x8b3a59458ec349146bcf86c45141c14043561b8ee33779d91daacdf537516933` |

| Token-bound field | After action, before transfer | After transfer to A |
|---|---:|---:|
| XP | 18 | 18 |
| Trust | 4 | 4 |
| Scars | 0 | 0 |
| Streak / unmarked streak | 1 / 1 | 1 / 1 |
| Achievement mask / achievement | 1 / First Light | 1 / First Light |
| Last action UTC day | 20741 | 20741 |
| Last outcome / event mask | 10 / 8 | 10 / 8 |
| Has acted | true | true |

The recorded read-only authorization checks returned **AlreadyActed** for A and **NotTokenOwner** for B. No additional Adventure transaction was submitted to establish these outcomes. The journal retained B as historical actor while displaying A separately as current owner. Transfer did not clear the token's same-day lock.

## Files and provenance

- [verification.json](verification.json): allowlisted original receipts/logs, decoded outcome, actual before/after state, the original 22 completed checks and attribution. Integer strings retain their recorded precision. No secret, private key, mnemonic, browser state, execution script, absolute workstation path or full temporary working directory is included.
- [confirmed-reaction.png](confirmed-reaction.png): actual recorded receipt-derived reaction/achievement view. Its background still shows the pre-Task-4I mixed-day UI; use it as reaction evidence, not as proof of the current daily-lock refresh.
- [inherited-journal.png](inherited-journal.png): new owner and persistent event journal.
- [wallet-a-daily-lock.png](wallet-a-daily-lock.png): inherited lock under A.
- [SHA256SUMS.json](SHA256SUMS.json): hashes of the four evidence files for accidental-change detection; not a signature or independent chain attestation.

Original source was the completed Task 4H evidence, not browser fixture RPC. The initial Task 4H run exposed a stale daily-lock UI; completed verification used a fresh session before proceeding. Task 4I then fixed the underlying refresh race and added regression coverage. Do not present this as an uninterrupted flawless initial run or claim these screenshots retest the newer fix.

The receipts are local and cannot be queried on MonadScan. This package is a historical record, not a guarantee that a future local node retains the same state. Anyone reproducing against an existing node must verify chain/address/binding before read-only inspection. Do not rerun transaction scripts, advance time or reset a node to inspect these files.

Screenshots contain the existing provisional artwork and public development addresses; **public release remains subject to the same artwork approval as the app**. They are retained for preparation/review, not automatically authorized for publication. No artwork was generated or replaced.

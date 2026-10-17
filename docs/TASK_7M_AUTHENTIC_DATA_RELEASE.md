# Task 7M — Authentic mainnet data release

The owner approved publishing the Task 7L read-only frontend update to GitHub main and its automatic Vercel deployment. Public mainnet gameplay remains disabled.

## Release scope

Removed the default survivor, seeded encounters, simulated outcomes and fabricated progression. Home, Adventure, Character and Settings retain the existing artwork, fonts, responsive design and wallet modal. Visitors see honest empty states, not sample statistics.

Connected users can select a genuine Chog Genesis token and read ownership, survivor state, titles, achievement masks and bounded finalized event history. Game and NFT runtime hashes and the immutable collection binding are checked before survivor fields are displayed. Loading, RPC errors, wrong networks and missing data do not produce fallback progression. Actual returned zeroes remain valid records. Canonical title ID 0 can legitimately read “Wandering Chog”; it is no longer a default profile.

- Network: Monad mainnet, chain 143.
- Game: `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`.
- Collection: `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`.
- `mainnetTransactionsEnabled` is hardcoded false. Production does not render an enabled submission flow. No query parameter, local storage value or mainnet environment flag authorizes writes.
- No Solidity, approved address, artwork, font or Vercel configuration changes are included.

## Validation

387 frontend tests passed across 25 files. Production TypeScript/Vite build passed, with the existing nonfatal bundle-size warning. Chromium checks passed: 107 wallet-modal checks and 47 offline production safety/layout checks. 39 additional read-only browser checks passed; these compare genuine contract records against the interface at desktop/mobile widths, test missing data, RPC failure and wrong-network invalidation. They use a public-address observer without a signer; they do not establish control of a holder wallet or submit a transaction.

Frozen Solidity SHA-256: `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

Raw browser captures, operator tools, environment files, private media and unrelated local reports are excluded. The exact release commit, deployment status and final hosted checks are recorded in the local Task 7M handoff and owner delivery report.

## Remaining limits

This is an authentic-data, read-only release, not mainnet gameplay activation. History retrieval is bounded and labels partial or failed pages. Metadata availability and artwork permissions remain separate from ownership. The immutable deployed contract has not undergone independent security review; incomplete collection governance/custody attestations and official wallet-provider policy clearance remain unresolved. The submitted demo video is a historical simulation recording.

GO for the owner-approved read-only publication after successful hosted checks. NO-GO for mainnet gameplay activation. No wallet signature or blockchain transaction is authorized or performed by this release.

# Chog Survivor frontend — local-only foundation

This is a React + TypeScript + Vite interface for the frozen Chog Survivor
MVP. It supports read-only canonical-NFT `ownerOf(tokenId)` checks on Monad and
has no transaction, signature, approval, deployment, or private-key path.

## Requirements

- Node.js 20+ (Node 22 was used for this local milestone)
- npm 10+
- An injected EIP-1193 wallet is optional for Home and the local Adventure demo.
  Character accepts manual IDs while disconnected, but canonical ownership
  verification requires a connected wallet on Monad (chain ID 143).

## Commands

```sh
cd frontend
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

`npm run dev` prints the local Vite URL. It does not publish or deploy anything.

## Environment variables

Copy `.env.example` to `.env.local` only if needed. Never place private keys,
seed phrases, or wallet credentials in any frontend environment file.

| Variable | Required | Meaning |
|---|---|---|
| `VITE_MONAD_RPC_URL` | No | Read-only Monad RPC override. Defaults to `https://rpc.monad.xyz`. |
| `VITE_CHOG_SURVIVOR_ADDRESS` | No | An independently reviewed, human-approved Monad deployment address. Leave unset in this milestone. |

## Local Demo mode versus live read-only mode

With no valid `VITE_CHOG_SURVIVOR_ADDRESS`, the global mode is **LOCAL DEMO**.
Adventure retains its explicitly simulated statistics and base-reward previews.
Character is a separate read-only Survivor Profile: progression, title,
achievement status and history are unavailable, with no substituted demo values.
Canonical Chog Genesis `ownerOf(tokenId)` is a real read-only query when the
wallet is connected to Monad and RPC access is available.

Supplying a syntactically valid `VITE_CHOG_SURVIVOR_ADDRESS` switches the UI to
**READ-ONLY LIVE**. Reads remain gated until `CHOG_GENESIS()` matches the
frozen canonical collection. This variable is not a deployment approval and
must not be populated until a separate approved release manifest exists.
Character also requires freshly verified NFT existence before game reads.
It retrieves `characterOf` and `titleOf` through the existing frozen read ABI;
failed, pending or mismatched reads never become fixture statistics.

All action controls are deliberately disabled in both modes. The app does not
include `act`, wallet writes, transaction signing, approvals, or broadcasting.

## Survivor Profile — Milestone 11.2

Use the existing **Character** navigation button. Manual input accepts unsigned
decimal IDs from zero through `2²⁵⁶ − 1`; entered/requested IDs remain distinct
from a verified NFT identity. There is no owned-token enumeration, holdings list,
indexer or claim that a wallet has zero Chogs.

The profile distinguishes disconnected/wrong-network states, loading, verified
current controller, another controller, RPC failures, zero-owner responses and
collection reverts. Only explicit `ERC721NonexistentToken` error evidence is
labeled nonexistent; ambiguous reverts do not establish burn/nonexistence.
The canonical collection's absent-token error format remains unverified.

Ownership queries use account/network-specific cache scope, refresh on mounting
and window focus, and poll every 30 seconds while the profile is open. A visible
refresh control rechecks ownership and enabled game reads. Pending/error reads
hide cached identity and progression. This is point-in-time read verification;
there is no transfer watcher or claim of live transfer testing.

If a separately approved deployment is configured and its binding matches,
the profile renders all CharacterView fields: XP, Trust, Scars, stored streak,
Unmarked run, action presence/day/outcome, encountered event types and permanent
achievement bits. Its title comes from `titleOf`, never a hardcoded fallback.
Achievement criteria explain the frozen rules; private counter progress is not
invented. These conditional game read paths are tested with mocks, not a live
game deployment.

Daily availability stays explicitly unverified. Stored action data alone cannot
establish the current chain UTC day. No chain timestamp, authoritative countdown
or action eligibility is inferred from the browser clock. One decision per NFT
per UTC day and transfer-persistent daily locks are explained in the profile.

Survival History is an intentional unavailable section. It has no fabricated
timeline, speculative log reader or external service. A game getter provides
aggregate/last-action state, not an enumerable action list; future chronological
history would require the approved deployment's token-filtered action logs.

Profile-specific styling preserves Home, Adventure, assets, fonts and wallet
configuration. Mobile navigation styling is scoped to the Character shell.
See `TASK_11_2.md` for validation evidence and screenshot review instructions.

## Parchment character sheet — Milestone 11.3

Character now uses a continuous antique parchment sheet inspired by the supplied
`design/chog-parchment-reference.png`: an ornate arched portrait placeholder,
survivor identity on the left, progression and daily record in the center,
eight achievement marks on the right, and a ruled Survival History journal
below. Tablet and phone layouts reorganize these sections into a scrollable sheet.
Lilita One is reused selectively with the existing Cinzel and IM Fell English
fonts. Texture, borders and ornaments are CSS/SVG presentation; no new bitmap
artwork was generated or external art service added. The reference is not a
runtime background or NFT portrait.

The 11.2 ownership queries, wallet/network gates and unavailable-data safeguards
are preserved. Only returned Trust and Scars values receive 0–100 meters. XP
and stored streak have numeric records with no invented level or milestone
threshold. Unknown achievements remain unavailable, rather than locked. The
portrait remains decorative even after an owner is verified, because no verified
NFT artwork source is available. The journal has no fabricated decisions.

See `TASK_11_3.md` for scoped files, responsive validation and screenshot paths.
Home, Adventure, wallet configuration, ABI, addresses and Solidity remain unchanged.

## Product disclosure

Progress belongs to numeric Chog Genesis token IDs, not wallets. It follows a
token transfer and, if the external collection permits it, a later reissue of
the same numeric ID inherits existing game history. The UI does not prove NFT
immutability, governance safety, source verification, or token-ID non-reuse.
Canonical-NFT governance verification still blocks mainnet deployment.

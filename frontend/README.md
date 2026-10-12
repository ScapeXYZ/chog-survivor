# Chog Survivor frontend — local-only foundation

This is a React + TypeScript + Vite interface for the frozen Chog Survivor
MVP. It supports read-only canonical-NFT `ownerOf(tokenId)` checks on Monad and
has no transaction, signature, approval, deployment, or private-key path.

## Requirements

- Node.js 20+ (Node 22 was used for this local milestone)
- npm 10+
- An injected EIP-1193 wallet is optional; manual token-ID entry works without
  one, but ownership comparison requires a connected wallet.

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

With no valid `VITE_CHOG_SURVIVOR_ADDRESS`, the UI displays **LOCAL DEMO**.
Dashboard values and encounter context are illustrative and explicitly not
onchain state. Canonical Chog Genesis `ownerOf(tokenId)` remains a real
read-only query when RPC access is available.

Supplying a syntactically valid `VITE_CHOG_SURVIVOR_ADDRESS` switches the UI to
**READ-ONLY LIVE**. Reads remain gated until `CHOG_GENESIS()` matches the
frozen canonical collection. This variable is not a deployment approval and
must not be populated until a separate approved release manifest exists.

All action controls are deliberately disabled in both modes. The app does not
include `act`, wallet writes, transaction signing, approvals, or broadcasting.

## Product disclosure

Progress belongs to numeric Chog Genesis token IDs, not wallets. It follows a
token transfer and, if the external collection permits it, a later reissue of
the same numeric ID inherits existing game history. The UI does not prove NFT
immutability, governance safety, source verification, or token-ID non-reuse.
Canonical-NFT governance verification still blocks mainnet deployment.

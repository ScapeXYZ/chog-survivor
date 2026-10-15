# Demo environment and deployment guide

This is a preparation guide. **Nothing has been deployed or published.** Public artifact, destination, environment and release approval are required before even a preview deployment. Contract deployment/mainnet use is outside this plan.

## Public walletless build

Vite replaces `VITE_*` settings at build time; changing hosting environment variables requires rebuilding. `.env.local` is loaded even in a production build, so choose explicit overrides rather than relying on `NODE_ENV` or `--mode production`.

| Setting | Public demo | Existing local contract mode |
|---|---|---|
| `VITE_CHOG_ENV` | `production` | `local` |
| `VITE_MONAD_RPC_URL` | Empty → existing `https://rpc.monad.xyz` default for optional genuine NFT reads; alternatively a public HTTPS/CORS-compatible URL without private credentials | Not needed for local mode |
| `VITE_LOCAL_RPC_URL` | Empty/unset | Exactly `http://127.0.0.1:8545` |
| `VITE_LOCAL_CHOG_SURVIVOR_ADDRESS` | Empty/unset | Previously verified local game address |
| `VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK` | Empty/unset | Verified local deployment block; necessary for journal reads |

Every `VITE_*` value is public browser data. Do not put keys or private RPC/API credentials in these settings. `VITE_CHOG_SURVIVOR_ADDRESS` does **not** activate a production deployment in current code. Canonical address, chain support and authorization remain unchanged.

From `frontend` in a complete clean checkout, install the existing lockfile with `npm ci`, then:

```sh
VITE_CHOG_ENV=production \
VITE_MONAD_RPC_URL= \
VITE_LOCAL_RPC_URL= \
VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= \
VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= \
npm run build
```

Output: `frontend/dist`. It includes the existing local font and the same license text at `/licenses/LilitaOne-OFL.txt`. Home/Character/Settings retain their existing remote font imports; do not replace fonts or introduce a CSP that prevents the established sources from loading.

For a local static preview of this artifact, run `npm exec vite preview -- --host 127.0.0.1` from `frontend`. This serves files locally; it is not a public deployment. No wallet or Anvil is required. Do not upload the whole workspace or `.env.local`; only the approved static output is website content.

## Deployment proposal — execute only after approval

1. Resolve the artwork/release blockers in the [staging plan](TASK_4K_STAGING_PLAN.md), review all required source files, verify evidence/license notices, and approve the exact release revision/artifact. No commit/push is authorized by this guide.
2. Choose **one** provider/destination and approve account access, visibility and environment. Creating a connected Git hosting project can deploy immediately; do not do it as a harmless preliminary step.
3. Vercel proposal: root `frontend`, framework Vite, Node 22 as tested, install `npm ci`, build `npm run build`, output `dist`, public demo settings above for preview and production. No provider dependency is needed. Existing official references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [build settings](https://vercel.com/docs/builds/configure-a-build).
4. Equivalent Netlify proposal: base/package directory `frontend`, build `npm run build`, publish `dist` relative to it; or manually upload only the approved static `dist` directory. No plugin is required for a static artifact. [Vite setup](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/), [project/manual deployment](https://docs.netlify.com/manage/projects/add-new-project/).
5. Obtain explicit **frontend deployment approval** for the concrete artifact/revision and destination. Obtain **separate repository/video/evidence publication approval** where applicable. No public URL is claimed before deployment and independent access verification.
6. After authorized deployment, verify `/` from a private browser on a separate network: no authentication wall; simulation disclosure; all three interactions and Skip; correct static assets/fonts/license; no localhost dependence or gameplay transaction request; keyboard, mobile/desktop, reduced motion and existing audio preferences. Test the exact demo/repository/video links used in the submission.

Deploy at the origin root; current Vite base is `/`. The four screens are state-based, not `/adventure` or `/character` routes. No SPA rewrite is needed for current button navigation. Subdirectory hosting would require a separate base-path review. A domain is optional; a stable public HTTPS provider URL is sufficient.

## Existing local deployment — no setup transactions

For this workspace's already running verified deployment only:

```sh
VITE_CHOG_ENV=local \
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545 \
VITE_LOCAL_CHOG_SURVIVOR_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 \
VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK=4 \
npm run dev -- --host 127.0.0.1
```

Verify chain 31338, bytecode and `CHOG_GENESIS()` binding before relying on a node. These values describe an isolated local deployment, not settings for a public host. The NFT fixture is installed at `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` on this chain only. Genuine Monad ownership reads use that address on chain 143; it does not make local fixtures genuine Chogs.

Do not start/reset Anvil, install fixtures, deploy, mint, transfer, advance time or call `act` to prepare the submission. Existing read-only Character/journal views and [captured evidence](evidence/task4h-2006/README.md) suffice. Do not expose Anvil through a public tunnel: unlocked development accounts, admin RPC and open fixture minting are unsuitable public infrastructure. No approved remote test-network deployment is available.

## Verification without live-chain mutation

From `frontend`:

```sh
npm test
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm test
npm run typecheck
node scripts/mini-game-integration-smoke.mjs
```

The browser smoke uses intercepted wallet/RPC fixtures and temporary local Vite servers. Its “confirmed” actions are mocked, not new Anvil evidence. It requires installed Playwright Chromium and local socket/browser permissions. Unit tests intentionally isolate developer env values while local suites opt in explicitly. `git diff --check` checks tracked diffs; also inspect new untracked documents for whitespace and secrets.

Do **not** substitute `npm run test:e2e` or the real Task 4H script: those can mutate the live local chain. No dependency installation or transaction is part of Task 4K verification.

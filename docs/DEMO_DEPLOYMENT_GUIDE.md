# Demo environment and deployment guide

## Verified Monad mainnet deployment and source

Game CA: **[0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code)**. [Deployment transaction](https://monadscan.com/tx/0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956), block **113947533**, chain **143**; deployer `0x320eDAe253259053d53feD8eEe6D9C0274A91E85`. Two independent RPC providers confirmed finalized creation, exact frozen-artifact runtime and the immutable Chog Genesis binding. **Source verified publicly on MonadScan (Exact Match); deployment remains unaudited.** Collection governance/custody attestations and official wallet-provider clearance remain incomplete.

[Published verified source](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code) · Solidity **0.8.28+commit.7893614a**, optimizer **200**, **Cancun**. Independently confirmed on the public Code page in [Task 7D](TASK_7D_SOURCE_VERIFICATION_RESULT.md); source verification does not imply an audit or frontend release approval.

## Tasks 7S/7T — owner-authorized gameplay release

The owner authorizes genuine mainnet gameplay, GitHub main publication and its Vercel deployment. Actual installed-wallet acceptance with a verified holder remains incomplete and is acknowledged. This does not authorize an agent to sign or broadcast gameplay transactions. The historical submission video remains a simulation/local-evidence recording.

Mainnet uses the verified manifest/ABI and source release flag `mainnetGameplayReleaseAuthorized` in `frontend/src/mainnetRelease.ts`. The source release flag is true in this release. Task 7S was stopped; Task 7T fixes its unsigned-review failure and passes three consecutive production-bundle checks before resuming publication. The review opens before any wallet request; unavailable preflight displays an error and blocks confirmation. A valid manifest and mainnet configuration are still required; every action checks ownership, chain, runtime/binding, nonce, current daily eligibility, simulation, gas and reserve. `VITE_CHOG_ENV=mainnet`, URL parameters, local storage and environment-supplied contract addresses cannot authorize an arbitrary deployment or override the approved destination.

Approved per-request policy: gas limit <=400,000; total maxFeePerGas <=125 gwei including priority; maximum estimated cost <=0.05 MON; remaining reserve >=0.1 MON; transaction value 0 MON. Missing or increased estimates require a fresh review or block submission. Never transfer or approve the NFT to play. Pending/uncertain actions block duplicates and persist across refreshes.

## Production configuration

Vercel project root remains `frontend`, Vite framework, Node 22, `npm ci`, output `dist`. The existing `vercel.json` build command remains:

```sh
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
```

Explicit empty local settings prevent a developer .env.local from selecting Anvil. Every VITE value is public browser data; never put wallet secrets or private RPC credentials there. The deployed address comes from the checked-in verified manifest, not an environment override.

Production is https://chog-survivor.vercel.app/. GitHub main can trigger an automatic Vercel deployment. Task 7S grants publication approval for its verified release; do not treat it as standing authorization for unrelated future releases. Never upload raw evidence, operator tools, local env files or private footage. Only approved static build output is website content.

After deployment, verify the exact remote commit and Vercel success status, compare the public bundle with the tested build, and check desktop/mobile navigation, walletless empty states, owner-only choices, genuine read-only contract data and unsigned review/cancellation. Agent checks must use no real wallet or send/sign methods. Do not claim an actual holder transaction from a public-address observer or mocks.

The four screens use in-app navigation rather than separate URLs. Existing fonts, artwork and bundled Lilita One license remain unchanged. Optional external fonts/RPC/metadata may be unavailable; never replace failed reads with invented progression.

## Rollback

Set `mainnetGameplayReleaseAuthorized=false`, rebuild with the same production overrides and publish an explicitly authorized read-only rollback, or restore the known prior `40036a07e97ac7301ce5778aaaf36d62ad09f23f` Vercel release. Preserve pending journals, hashes and nonces; do not clear storage or automatically resubmit. Frontend rollback cannot pause the immutable contract, cancel a wallet prompt/broadcast or reverse a mined action. See [Task 7T release](TASK_7T_MAINNET_ACTION_REVIEW_FIX.md#rollback).

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

```sh
# From frontend
npm test
npm run typecheck
# From repository root, against the explicitly prepared production artifact
node frontend/scripts/public-demo-preflight.mjs --artifact-dir /tmp/chog-task7s-production --expect-gameplay
node frontend/scripts/task7l-authentic-browser.mjs --artifact-dir /tmp/chog-task7s-production --expect-gameplay --evidence-dir /tmp/chog-readonly-observer
```

The artifact observer has no signer, permits read-only RPC, prepares/cancels review and rejects send/sign methods. It does not establish actual installed-holder wallet acceptance. Isolated controller tests use fake clients and cannot establish genuine progression. Do not run legacy Anvil e2e/reset/install/deploy scripts for release verification.

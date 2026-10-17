# Task 7K — approved wallet UI release

The owner approved publication of the verified Task 7J wallet modal and connected-network display correction. This release changes the wallet interface only; **public mainnet gameplay remains disabled**. No Solidity, deployment address, NFT binding, ABI, dependency, Vercel environment or gameplay rule changes are included.

## Published scope

- `frontend/src/WalletChooser.tsx` and `wallet-chooser.css`: styled native modal, portal/top-layer rendering, responsive provider choices, background scroll lock, keyboard containment, Escape/backdrop/Cancel dismissal and restored focus.
- `frontend/src/App.tsx`: explicit wallet choice even with one provider; displays the connected wallet's chain rather than only Wagmi's configured chain.
- `frontend/src/App.test.tsx` and `Adventure.test.tsx`: related selection, accessibility and network regression tests.
- `frontend/scripts/task7j-wallet-modal-browser.mjs`: reproducible synthetic-wallet checks; supports local `--artifact-dir`, fixed production `--live`, and an explicit local evidence directory.
- This release note.

The former chooser was a normal-flow framed section with unstyled provider buttons. The replacement does not shift the game layout when opened or closed. Existing artwork and font families are preserved.

## Verification before publication

- **394 frontend tests passed (24 files)**.
- **Production TypeScript/Vite build passed**. Existing bundle-size advisory is nonfatal.
- **107 wallet modal browser checks passed**, Home/Adventure/Character/Settings at 1440, 375 and 320px; 12 local screenshots. Checked layout/scroll stability, focus wrapping and restoration, Escape/backdrop close, synthetic rejection, and disabled production transactions.
- **49 production safety checks passed** at mobile/desktop sizes.
- Reviewed public JavaScript: `index-D74w_Dz0.js`, SHA-256 `0388820088fa96b5820f910b4ef91d119208aecd90a2e8657388c6029140156e`.
- Secret scan, explicit commit-file allowlist and whitespace checks passed. Tests use synthetic providers; no genuine holder wallet, private key or recovery phrase was used or collected.

The unchanged `frontend/vercel.json` build command forces `VITE_CHOG_ENV=production` and clears local overrides. The game contract remains `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`, NFT collection `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`, Monad chain 143. The wallet UI cannot turn on public mainnet gameplay. Source verification is not an independent audit or wallet-provider clearance.

Starting main/remote HEAD was `795955424d8fb46367c5942ab6e9d10e5c747bd7`; publication uses a normal fast-forward GitHub main push. Main pushes can automatically deploy Vercel. The release gate requires the resulting deployment to succeed and the production modal and simulation behavior to pass browser checks. The exact final commit/deployment result is recorded in the owner handoff after this note's commit; this note is prepared before that commit.

## Exclusions and retained local evidence

Excluded and preserved: pre-existing .gitignore changes, the unrelated mainnet-manifest comment correction, holder-testing tools, Task 7E–7J operator reports, private/raw evidence, screenshots, temporary build files, media and unrelated documentation. These are not staged through a blanket add. Raw Task 7K logs and screenshots remain local under `docs/evidence/task7k/`; this release note publishes only the necessary verification summary.

Reproduce from frontend:

```sh
npm test
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build -- --outDir /tmp/chog-task7k-production
node scripts/task7j-wallet-modal-browser.mjs --artifact-dir /tmp/chog-task7k-production --evidence-dir ../docs/evidence/task7k/local
node scripts/public-demo-preflight.mjs --artifact-dir /tmp/chog-task7k-production
# After successful authorized deployment; synthetic EIP-6963 providers only:
node scripts/task7j-wallet-modal-browser.mjs --live --evidence-dir ../docs/evidence/task7k/production
```

The browser harness uses fresh contexts, no real extension or signer, and blocks non-GET/external requests. Mobile coverage is Chromium viewport coverage, not an assertion of universal mobile-wallet compatibility. No chain transaction, NFT approval/transfer or contract deployment is involved. Any future mainnet activation needs its own explicit release approval and resolution/acceptance of the existing transaction-safety gates.

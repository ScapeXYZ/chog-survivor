# Chog Survivor

**The NFT is the survivor. The wallet is its current controller.**

Chog Survivor is a daily, NFT-native survival game built around the Chog Genesis collection on Monad. Each token ID carries its own XP, Trust, Scars, streak, achievements, title, daily lock, and chronological decision history. When the NFT changes wallets, the new owner controls the same survivor rather than receiving a fresh character.

The current release is a fully contract-backed local demonstration. It is **not deployed on Monad**, production gameplay writes are disabled, and the local NFT fixture is **not an authentic Chog Genesis NFT**.

## How the game works

Every UTC day, the contract deterministically assigns one of six encounters to a token. Each encounter has three choices, producing 18 fixed outcomes in total. A choice changes progression according to the frozen contract rules and may unlock one or more of eight achievements. Titles are calculated from the survivor's recorded state.

Only `ownerOf(tokenId)` may act. One action is allowed per token per UTC day. Ownership transfer changes the authorized controller while preserving the token's progression, achievements, daily lock, and event history.

The game has no inventory, currency, health system, escrow, staking, marketplace, PvP, AI decision engine, or custody of the NFT. Encounter selection is deterministic and public; this is a non-wager survival game rather than a source of randomness.

## Architecture

- `src/ChogSurvivor.sol` — immutable, non-upgradeable game contract with a fixed Chog Genesis dependency.
- `src/LocalCanonicalTestNFT.sol` — isolated Anvil-only ownership and metadata fixture.
- `frontend/` — React, TypeScript, Wagmi, Viem, and Vite client.
- `script/local-anvil.sh` — guarded localhost fixture installation and deployment workflow.
- `test/` — unit, fuzz, invariant, reference-model, achievement, fork, and transfer-continuity tests.
- `docs/` — game specification, security reviews, governance findings, balance analysis, and release gates.

The Solidity source is frozen at SHA-256:

```text
5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7
```

## Run the complete local demo

Requirements: Foundry (`anvil`, `forge`, and `cast`), Node.js 20 or newer, npm, and Playwright Chromium.

```bash
cd frontend
npm install
npx playwright install chromium
cd ..

# Terminal 1
anvil --host 127.0.0.1 --port 8545 --chain-id 31338

# Terminal 2
./script/local-anvil.sh install
./script/local-anvil.sh deploy
./script/local-anvil.sh verify
```

The deployment command prints the game address and block. Supply those exact values to the frontend:

```bash
cd frontend
VITE_CHOG_ENV=local \
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545 \
VITE_LOCAL_CHOG_SURVIVOR_ADDRESS=<LOCAL_GAME_ADDRESS> \
VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK=<DEPLOYMENT_BLOCK> \
npm run dev
```

Anvil's standard public development accounts own fixture tokens 1001, 1002, and 2001. These accounts and tokens exist only for local testing. Never fund or reuse Anvil credentials.

The automated browser journey performs real localhost transactions, verifies the daily lock, transfers token 1001 between two local wallets, advances isolated EVM time, and confirms that progression and history remain token-bound. Run it with the same variables and `npm run test:e2e`.

## Validation evidence

Milestone 12 recorded 38 passing local Foundry tests, 124 passing frontend tests, two browser-signed game actions, a fixture transfer, token-bound history across both owners, 45 browser assertions, and 32 responsive screenshots. Six Monad-fork tests were skipped because no public RPC was supplied. See [Milestone 12](frontend/TASK_12.md) and its [machine-readable evidence](frontend/reports/task12/evidence.json).

```bash
forge test
cd frontend
npm run typecheck
npm test
npm run build
```

## Production status

Production is deliberately fail-closed. The frontend reads real Chog Genesis ownership on Monad chain 143, but no game deployment address is approved and no production action or history path is enabled. An environment variable cannot authorize production gameplay.

Before deployment, the project needs verified canonical-collection source and governance evidence, an accountable security and gameplay approval, deployment/signing authorization, an approved game address and start block, source verification, reliable RPC and log access, monitoring, incident procedures, and explicit acceptance of the immutable contract's limitations. See [Milestone 13A readiness report](frontend/TASK_13A.md) and [submission draft](docs/HACKATHON_SUBMISSION_DRAFT.md).

Authentic Chog artwork is not included. Public metadata availability does not grant reuse rights; the approved placeholder remains until written permission covers the intended likeness, trademarks, media, channels, duration, and modification rights.

## Important documents

- [Game specification](docs/SPEC.md)
- [Game rules](docs/GAME_RULES.md)
- [Backend freeze](docs/BACKEND_FREEZE.md)
- [Security review](docs/SECURITY_REVIEW.md)
- [Canonical NFT governance review](docs/CANONICAL_NFT_GOVERNANCE_REVIEW.md)
- [Final release-risk review](docs/FINAL_RELEASE_RISK_REVIEW.md)
- [Hackathon submission draft](docs/HACKATHON_SUBMISSION_DRAFT.md)

No Monad deployment or hackathon submission is performed by this repository.

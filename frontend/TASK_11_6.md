# Milestone 11.6 — isolated local canonical-address fixture

## Scope and freeze

`src/ChogSurvivor.sol` remains byte-for-byte unchanged. Its SHA-256 is
`5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`, matching
`docs/BACKEND_FREEZE.md`. Its constructor permanently binds `CHOG_GENESIS` to
`0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`.

The fixture deliberately uses that same address only in fresh local Anvil
state. It is **LOCAL TEST NFT — NOT CHOG GENESIS**. Nothing here changes Monad.

## Reproduce

Install Foundry and Node/npm. Use wallets holding only local Anvil accounts.

```sh
anvil --host 127.0.0.1 --port 8545 --chain-id 31338 --accounts 3
```

From the repository root, in another terminal:

```sh
script/local-anvil.sh install
script/local-anvil.sh verify
script/local-anvil.sh deploy
```

`install` proves its endpoint is exactly `http://127.0.0.1:8545` and its chain
is exactly `31338`, before using Anvil's local-only `anvil_setCode`. It mints
1001 and 1002 to Anvil account A and 2001 to account B. It refuses every other
URL or chain ID. The fixture supports `ownerOf`, `balanceOf`, `tokensOfOwner`,
`mint`, and owner-controlled `transferFrom`.

`deploy` broadcasts the exact frozen game only to the checked local endpoint.
Copy `Deployed to:` into `frontend/.env.local`:

```dotenv
VITE_CHOG_ENV=local
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_LOCAL_CHOG_SURVIVOR_ADDRESS=0xPASTE_THE_DEPLOYED_ADDRESS
```

The validation run deployed it at
`0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`; this address is ephemeral and
exists only in that validation Anvil process.

```sh
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Import only an Anvil development account into the browser wallet, select chain
31338, and check token 1001 on Character. The UI labels this **LOCAL TEST
FIXTURE — NOT CHOG GENESIS**, reads `ownerOf`, `CHOG_GENESIS`, `characterOf`,
and `titleOf`, and retains its disabled transaction path. Discovery is
intentionally disabled in local UI mode, although `tokensOfOwner` is verified
by setup and Foundry tests.

Replace `GAME` to verify a deployed game:

```sh
cast call --rpc-url http://127.0.0.1:8545 "$GAME" 'CHOG_GENESIS()(address)'
cast call --rpc-url http://127.0.0.1:8545 "$GAME" 'characterOf(uint256)' 1001
cast call --rpc-url http://127.0.0.1:8545 "$GAME" 'titleOf(uint256)(uint8)' 1001
```

Stopping Anvil with Ctrl-C and restarting without a state file resets it. Rerun
`install` and `deploy`.

## Safety and production separation

Production remains Monad 143, real canonical ownership reads, and disabled
gameplay writes. Local mode needs all three environment variables above, with
the exact localhost RPC and a valid local game address. An explicit but invalid
local configuration blocks ownership, discovery, and game reads; it never
falls back from Monad to Anvil. Never deploy local environment variables. No private key is committed; Anvil's
printed default credentials are public local-only examples and must never be
funded or reused.

## Validation

`test/LocalCanonicalFixture.t.sol` proves ownership, balances, discovery IDs,
frozen binding, non-owner rejection, transfer, token-bound state, and daily
lock. Existing parity coverage retains all six encounters and 18 choices.
Foundry, TypeScript, all 110 frontend tests, and production build pass. Monad
fork tests skip without `MONAD_RPC_URL`; the fixture uses no external RPC.
Home, Adventure, and Character keep their approved designs. Adventure remains
simulated and cannot submit choices.

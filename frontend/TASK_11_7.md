# Milestone 11.7 — local contract-backed Adventure

The frozen game remains unchanged: SHA-256
`5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.
`act` is reachable only in explicit local mode on Anvil 31338.

## Run locally

```sh
anvil --host 127.0.0.1 --port 8545 --chain-id 31338 --accounts 3
script/local-anvil.sh install
script/local-anvil.sh deploy
```

Put the deployed address in `frontend/.env.local`:

```dotenv
VITE_CHOG_ENV=local
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_LOCAL_CHOG_SURVIVOR_ADDRESS=0xDEPLOYED_LOCAL_GAME
```

Start `npm run dev -- --host 127.0.0.1 --port 5173` in `frontend`. Import only
an Anvil account, select chain 31338, choose token 1001 on Character, then go
to Adventure. A fresh fixture assigns 1001/1002 to account A and 2001 to B.

Adventure takes the UTC day from a local chain block, calls `eventFor`, then
calls `preview` for a selected choice. Confirming requests `act`; after Anvil
confirms, it refreshes ownership, binding, character, title, encounter, and
preview reads. The daily lock remains attached to the token across transfers.

For next-day testing only, use isolated Anvil time methods:

```sh
cast rpc --rpc-url http://127.0.0.1:8545 evm_increaseTime 86400
cast rpc --rpc-url http://127.0.0.1:8545 evm_mine
```

Ctrl-C Anvil and restart without state to reset it.

## Boundaries

The UI identifies **LOCAL CONTRACT TEST — NOT MONAD MAINNET**. The fixture is
not Chog Genesis and does not establish mainnet ownership. Without local mode,
the existing visual demo remains simulated and write-free. Production remains
Monad 143 with real discovery and no gameplay write path. Local mode requires
explicit exact localhost configuration, chain 31338, a valid game address, a
matching `CHOG_GENESIS`, and a current owner; incomplete configuration blocks
reads instead of redirecting production.

No chronological event history is added. Wallet rejection, failed/reverted
transactions, pending confirmation, and refresh state are distinct UI states.

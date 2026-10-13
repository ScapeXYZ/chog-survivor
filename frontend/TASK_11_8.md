# Milestone 11.8 — token-bound local survival history

The frozen source SHA-256 remains
`5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

## Event evidence and reader

The frozen event signatures are:

```solidity
AdventureResolved(uint256 indexed tokenId, address indexed owner, uint64 indexed day,
  uint8 eventId, uint8 choiceId, uint8 outcomeId, int32 xpDelta, int16 trustDelta,
  int16 scarsDelta, uint32 xpAfter, uint8 trustAfter, uint8 scarsAfter,
  uint8 streakAfter, uint8 unmarkedStreakAfter, uint256 achievementMaskAfter)
AchievementEarned(uint256 indexed tokenId, uint8 indexed achievementId, uint64 indexed day)
```

`tokenId` is the first indexed argument of both events, so it is used as an
RPC topic filter. The reader never filters by current wallet. It requests only
the configured game address, begins at the deployment block, reads 500-block
chunks through the latest block, deduplicates transaction-hash/log-index pairs,
orders by block/transaction/log index, and obtains the local block timestamp
for each journal record. It checks the latest block hash before and after the
scan. A failed chunk or changed head reports partial/unavailable history rather
than claiming completeness.

## Local setup

```sh
anvil --host 127.0.0.1 --port 8545 --chain-id 31338 --accounts 3
script/local-anvil.sh install
script/local-anvil.sh deploy
```

The deploy command prints `Deployment block:`. Add both values to
`frontend/.env.local`:

```dotenv
VITE_CHOG_ENV=local
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_LOCAL_CHOG_SURVIVOR_ADDRESS=0xLOCAL_GAME
VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK=4
```

Start the frontend, select local token 1001, perform one confirmed Adventure
action, and open Character. The parchment journal shows the authoritative
event, choice, effective deltas, UTC timestamp, block number, and shortened
transaction hash. Achievement logs from the same token are shown separately.
The Adventure confirmation dispatches a local refresh event; Character also
handles retry, ownership changes, token changes, and chain changes without
carrying records to another token.

For transfer verification, after account A acts, use local Anvil only:

```sh
cast send --unlocked --rpc-url http://127.0.0.1:8545 \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763 \
  'transferFrom(address,address,uint256)' \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 1001
```

Switch to account B: the same token's history and progression remain visible,
the same-day action remains locked, and only isolated test-time advancement may
permit B's next-day action:

```sh
cast rpc --rpc-url http://127.0.0.1:8545 evm_increaseTime 86400
cast rpc --rpc-url http://127.0.0.1:8545 evm_mine
```

Production and demo never use this history reader. Production has no approved
game deployment/start block; demo data is never represented as contract history.
No indexer, database, mainnet write path, or transfer UI was added. Reset Anvil
to clear the local fixture, deployment, and all local history.

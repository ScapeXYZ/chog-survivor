import {defineChain, isAddress, type Address} from 'viem'
import {createConfig, http} from 'wagmi'
import {injected} from 'wagmi/connectors'

export const MONAD_CHAIN_ID = 143
export const LOCAL_CHAIN_ID = 31338
export const CHOG_GENESIS = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763' as const

export const monad = defineChain({
  id: MONAD_CHAIN_ID,
  name: 'Monad',
  nativeCurrency: {name: 'MON', symbol: 'MON', decimals: 18},
  rpcUrls: {
    default: {http: [import.meta.env.VITE_MONAD_RPC_URL || 'https://rpc.monad.xyz']},
  },
  blockExplorers: {
    default: {name: 'MonadScan', url: 'https://monadscan.com'},
  },
})

const localRpcUrl = import.meta.env.VITE_LOCAL_RPC_URL
const localGameAddress = import.meta.env.VITE_LOCAL_CHOG_SURVIVOR_ADDRESS
const requestedLocalMode = import.meta.env.VITE_CHOG_ENV === 'local'
// Local mode is deliberately narrow. Missing or non-local configuration falls
// back to production's read-only configuration; it never redirects production.
export const localConfigurationValid = localRpcUrl === 'http://127.0.0.1:8545' &&
  localGameAddress !== undefined && isAddress(localGameAddress)
export const localMode = requestedLocalMode && localConfigurationValid
export const environmentReady = !requestedLocalMode || localConfigurationValid
export const localAnvil = defineChain({
  id: LOCAL_CHAIN_ID, name: 'Local Anvil — TEST ONLY',
  nativeCurrency: {name: 'Local ETH', symbol: 'ETH', decimals: 18},
  rpcUrls: {default: {http: ['http://127.0.0.1:8545']}},
})
export const activeChain = localMode ? localAnvil : monad
export const activeChainId = activeChain.id
export const activeNetworkName = localMode ? 'Local Anvil (test only)' : 'Monad'

export const wagmiConfig = createConfig({
  chains: localMode ? [localAnvil] : [monad],
  connectors: [injected()],
  transports: {[MONAD_CHAIN_ID]: http(), [LOCAL_CHAIN_ID]: http('http://127.0.0.1:8545')},
})

const configuredAddress = import.meta.env.VITE_CHOG_SURVIVOR_ADDRESS
export const approvedGameAddress: Address | undefined =
  localMode ? localGameAddress as Address : configuredAddress && isAddress(configuredAddress) ? configuredAddress : undefined

export const nftAbi = [
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{name: 'tokenId', type: 'uint256'}],
    outputs: [{name: 'owner', type: 'address'}],
  },
] as const

// Exact frozen read surface from src/ChogSurvivor.sol. No transaction function is exposed here.
export const gameReadAbi = [
  {
    type: 'function',
    name: 'CHOG_GENESIS',
    stateMutability: 'view',
    inputs: [],
    outputs: [{name: '', type: 'address'}],
  },
  {
    type: 'function',
    name: 'characterOf',
    stateMutability: 'view',
    inputs: [{name: 'tokenId', type: 'uint256'}],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          {name: 'xp', type: 'uint32'},
          {name: 'trust', type: 'uint8'},
          {name: 'scars', type: 'uint8'},
          {name: 'streak', type: 'uint8'},
          {name: 'unmarkedStreak', type: 'uint8'},
          {name: 'lastActionDay', type: 'uint64'},
          {name: 'lastOutcomeId', type: 'uint8'},
          {name: 'eventMask', type: 'uint8'},
          {name: 'achievementMask', type: 'uint256'},
          {name: 'hasActed', type: 'bool'},
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'eventFor',
    stateMutability: 'view',
    inputs: [
      {name: 'tokenId', type: 'uint256'},
      {name: 'day', type: 'uint64'},
    ],
    outputs: [{name: '', type: 'uint8'}],
  },
  {
    type: 'function',
    name: 'preview',
    stateMutability: 'view',
    inputs: [
      {name: 'tokenId', type: 'uint256'},
      {name: 'choiceId', type: 'uint8'},
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          {name: 'day', type: 'uint64'},
          {name: 'eventId', type: 'uint8'},
          {name: 'choiceId', type: 'uint8'},
          {name: 'outcomeId', type: 'uint8'},
          {name: 'xpDelta', type: 'int32'},
          {name: 'trustDelta', type: 'int16'},
          {name: 'scarsDelta', type: 'int16'},
          {name: 'xpAfter', type: 'uint32'},
          {name: 'trustAfter', type: 'uint8'},
          {name: 'scarsAfter', type: 'uint8'},
          {name: 'streakAfter', type: 'uint8'},
          {name: 'unmarkedStreakAfter', type: 'uint8'},
          {name: 'newlyEarnedAchievementMask', type: 'uint256'},
          {name: 'achievementMaskAfter', type: 'uint256'},
          {name: 'titleId', type: 'uint8'},
          {name: 'canAct', type: 'bool'},
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'titleOf',
    stateMutability: 'view',
    inputs: [{name: 'tokenId', type: 'uint256'}],
    outputs: [{name: '', type: 'uint8'}],
  },
] as const

// Deliberately separate from the production read ABI. This is referenced only
// by LocalContractAdventure after every local-only safety gate succeeds.
export const gameLocalWriteAbi = [
  {
    type: 'function', name: 'act', stateMutability: 'nonpayable',
    inputs: [{name: 'tokenId', type: 'uint256'}, {name: 'choiceId', type: 'uint8'}],
    outputs: [],
  },
] as const

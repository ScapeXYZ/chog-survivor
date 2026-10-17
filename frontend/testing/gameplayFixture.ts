// Isolated test data only. Never imported by the application or public build.
import {decodeFunctionData, encodeAbiParameters, encodeEventTopics, keccak256, type Address, type Hex} from 'viem'
import {CHOG_GENESIS, gameLocalWriteAbi} from '../src/contracts'
import {GAME, journalKey, type GameplayClient, type GameplayWallet, type Journal} from '../src/mainnetGameplay'
import {adventureResolvedEvent} from '../src/survivalHistory'
export const fixtureCode = '0x6000' as const
export const fixtureHash = keccak256(fixtureCode)
export const account = '0x1111111111111111111111111111111111111111' as Address
export const other = '0x2222222222222222222222222222222222222222' as Address
export const hash = `0x${'a'.repeat(64)}` as Hex
export const replacementHash = `0x${'b'.repeat(64)}` as Hex
export const blockHash = `0x${'c'.repeat(64)}` as Hex
export function fixture() {
  const f = {chain: 143, walletChain: 143, owner: account, walletAccount: account, day: 100n, seconds: 1000n, nonce: 7, latestNonce: 7, gas: 200000n, fee: 100000000000n, priority: 1000000000n, balance: 1000000000000000000n, code: fixtureCode as Hex, binding: CHOG_GENESIS as Address, canAct: true, simulationError: false, gasError: false, reject: false, unknownWalletError: false, sends: 0, mode: 'success', rpcError: false, missingEvent: false, badState: false, final: 11n, active: true, transactions: [] as unknown[]}
  const preview = (choiceId = 1) => ({day: f.day, eventId: 1, choiceId, outcomeId: choiceId, xpDelta: 12, trustDelta: 5, scarsDelta: 0, xpAfter: 12, trustAfter: 5, scarsAfter: 0, streakAfter: 1, unmarkedStreakAfter: 1, newlyEarnedAchievementMask: 1n, achievementMaskAfter: 1n, titleId: 0, canAct: f.canAct})
  const state = () => ({xp: f.badState ? 999 : 12, trust: 5, scars: 0, streak: 1, unmarkedStreak: 1, hasActed: true, lastActionDay: f.day, lastOutcomeId: submittedChoice(), eventMask: 1, achievementMask: 1n})
  const tx = (h = hash) => ({hash: h, from: account, nonce: 7, to: f.mode === 'cancelled' ? account : GAME, input: f.mode === 'cancelled' ? '0x' : data, value: 0n, chainId: 143, blockHash})
  let data: Hex = '0x'
  function submittedChoice() {try {return Number(decodeFunctionData({abi:gameLocalWriteAbi,data}).args[1])}catch{return 1}}
  const rawClient = {
    async getChainId() {if (f.rpcError) throw Error('RPC interrupted');return f.chain},
    async getBlock(options?: {blockTag?: string}) {return {number: options?.blockTag === 'finalized' ? f.final : 10n, hash: blockHash, timestamp: f.day * 86400n + f.seconds}},
    async getCode() {return f.code},
    async readContract(request: {functionName: string; args?: readonly unknown[]}) {
      if (f.rpcError) throw Error('RPC interrupted')
      if (request.functionName === 'CHOG_GENESIS') return f.binding
      if (request.functionName === 'ownerOf') return f.owner
      if (request.functionName === 'preview') return preview(Number(request.args?.[1]))
      if (request.functionName === 'characterOf') return state()
      if (request.functionName === 'titleOf') return 0
      if (request.functionName === 'eventFor') return 1
      throw Error('Unsupported test function')
    },
    async simulateContract() {if (f.simulationError) throw Error('Contract reverted: AlreadyActed');return {request: {}}},
    async estimateContractGas() {if (f.gasError) throw Error('Gas estimation failed');return f.gas},
    async estimateFeesPerGas() {return {maxFeePerGas: f.fee, maxPriorityFeePerGas: f.priority}},
    async getBalance() {return f.balance},
    async getTransactionCount(request: {blockTag: string}) {return request.blockTag === 'pending' ? f.nonce : f.latestNonce},
    async getTransaction({hash: h}: {hash: Hex}) {return tx(h)},
    async waitForTransactionReceipt(options: {onReplaced?: (event: unknown) => void}) {
      if (f.mode === 'timeout' || f.rpcError) throw Error('RPC receipt timeout')
      const h = ['repriced', 'cancelled'].includes(f.mode) ? replacementHash : hash
      if (h !== hash) options.onReplaced?.({reason: f.mode, transaction: tx(h)})
      const p = preview(submittedChoice())
      const topics = encodeEventTopics({abi: [adventureResolvedEvent], eventName: 'AdventureResolved', args: {tokenId: 1425n, owner: account, day: f.day}})
      const eventData = encodeAbiParameters(adventureResolvedEvent.inputs.filter(input => !('indexed' in input && input.indexed)), [p.eventId, p.choiceId, p.outcomeId, p.xpDelta, p.trustDelta, p.scarsDelta, p.xpAfter, p.trustAfter, p.scarsAfter, p.streakAfter, p.unmarkedStreakAfter, p.achievementMaskAfter])
      return {transactionHash: h, from: account, to: f.mode === 'cancelled' ? account : GAME, blockHash, blockNumber: 10n, status: f.mode === 'reverted' ? 'reverted' : 'success', logs: f.missingEvent ? [] : [{address: GAME, data: eventData, topics}]}
    },
  }
  const rawWallet = {
    account: {type: 'json-rpc', address: account},
    async getAddresses() {return [f.walletAccount]}, async getChainId() {return f.walletChain},
    async sendTransaction(request: {data: Hex}) {f.sends++;f.transactions.push(request);if (f.reject) throw Object.assign(Error('User rejected'), {code: 4001});if (f.unknownWalletError) throw Error('Wallet transport disconnected');data = request.data;return hash},
  }
  const entries = new Map<string, string>()
  const store: Journal = {getItem: key => entries.get(key) ?? null, setItem: (key, value) => {entries.set(key, value)}}
  return {f, preview, state, client: rawClient as unknown as GameplayClient, wallet: rawWallet as unknown as GameplayWallet, store, entries, intent: {account, tokenId: 1425n, choiceId: 1}, setData: (value: Hex) => {data = value}, journalKey}
}

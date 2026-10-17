import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'
import {decodeEventLog, encodeAbiParameters, encodeEventTopics, keccak256} from 'viem'
import type {ContractPreview} from './adventureSession'

const mock = vi.hoisted(() => ({
  address: '0x1111111111111111111111111111111111111111' as `0x${string}`,
  owner: '0x1111111111111111111111111111111111111111', chainId: 143, connected: true,
  day: 100n, eventId: 1, ownerFetching: false, previewFetching: false, previewError: false,
  previewOverride: {} as Partial<ContractPreview>, freshOverride: {} as Partial<ContractPreview>,
  freshOwner: undefined as string | undefined, freshChain: 143, freshBinding: undefined as string | undefined,
  acted: false, actedDays: new Map<string, bigint>(), refreshError: false,
  read: vi.fn(), write: vi.fn(), refresh: vi.fn(), block: vi.fn(), receipt: vi.fn(), preflight: vi.fn(),
}))
vi.mock('./contracts', async original => ({...await original<typeof import('./contracts')>(), localMode: false, mainnetMode: true, mainnetTransactionsEnabled: true, contractMode: true, activeChain: {id: 143}, environmentReady: true, approvedGameAddress: '0x3333333333333333333333333333333333333333'}))
vi.mock('./mainnetDeployment', async original => ({...await original<typeof import('./mainnetDeployment')>(), mainnetDeployment: {chainId: 143, address: '0x3333333333333333333333333333333333333333', deploymentBlock: 4n, runtimeCodeHash: keccak256('0x6000')}}))
vi.mock('wagmi', async original => ({
  ...await original<typeof import('wagmi')>(),
  useAccount: () => ({address: mock.address, isConnected: mock.connected, chainId: mock.chainId}),
  usePublicClient: () => client,
  useWriteContract: () => ({writeContractAsync: mock.write}),
  useReadContract: (request: {functionName: string; args?: readonly (bigint | number)[]; scopeKey?: string; query: {enabled: boolean}}) => {
    mock.read(request)
    const data = request.functionName === 'ownerOf' ? mock.owner : request.functionName === 'CHOG_GENESIS' ? CHOG_GENESIS : request.functionName === 'eventFor' ? mock.eventId : request.functionName === 'characterOf' ? {xp: 0, trust: 0, scars: 0, streak: 0, hasActed: mock.acted || mock.actedDays.has(String(request.args?.[0])), lastActionDay: mock.actedDays.get(String(request.args?.[0])) ?? mock.day} : request.functionName === 'preview' ? {...preview(Number(request.args?.[1] ?? 1), BigInt(request.args?.[0] ?? 1001)), ...mock.previewOverride} : 0
    return {data, isLoading: false, isFetching: request.functionName === 'ownerOf' ? mock.ownerFetching : request.functionName === 'preview' && mock.previewFetching,
      isError: request.functionName === 'preview' && mock.previewError,
      refetch: () => { mock.refresh(request); return Promise.resolve({data, isError: mock.refreshError}) }}
  },
}))

import {LocalContractAdventure} from './LocalContractAdventure'
import {CHOG_GENESIS, approvedGameAddress, gameLocalWriteAbi} from './contracts'
import {events} from './game-data'
import {miniGameData, miniGameKindByCategory} from './mini-game-data'
import {achievementEarnedEvent, adventureResolvedEvent} from './survivalHistory'

const hash = `0x${'a'.repeat(64)}` as `0x${string}`
function preview(choiceId = 1, tokenId = 1001n): ContractPreview {
  return {day: mock.day, eventId: mock.eventId, choiceId, outcomeId: (mock.eventId - 1) * 3 + choiceId, xpDelta: 12, trustDelta: 5, scarsDelta: 0, xpAfter: 12, trustAfter: 5, scarsAfter: 0, streakAfter: 1, unmarkedStreakAfter: 1, newlyEarnedAchievementMask: 1n, achievementMaskAfter: 1n, titleId: 0, canAct: !mock.acted && mock.actedDays.get(String(tokenId)) !== mock.day}
}
function receipt(tokenId = 1001n, choiceId = 1, overrides: Partial<ContractPreview> = {}, owner = mock.address, address = approvedGameAddress!) {
  const p = {...preview(choiceId), ...overrides}
  const topics = encodeEventTopics({abi: [adventureResolvedEvent], eventName: 'AdventureResolved', args: {tokenId, owner, day: p.day}})
  const data = encodeAbiParameters(adventureResolvedEvent.inputs.filter(input => !('indexed' in input && input.indexed)), [p.eventId, p.choiceId, p.outcomeId, p.xpDelta, p.trustDelta, p.scarsDelta, p.xpAfter, p.trustAfter, p.scarsAfter, p.streakAfter, p.unmarkedStreakAfter, p.achievementMaskAfter])
  return {status: 'success', blockHash: hash, blockNumber: 10n, logs: [{address, data, topics}]}
}
const client = {
  getCode: vi.fn(async () => '0x6000'),
  simulateContract: vi.fn(async () => ({request: {}})),
  estimateContractGas: vi.fn(async () => 200000n),
  getBlock: mock.block,
  getChainId: async () => mock.freshChain,
  readContract: mock.preflight,
  waitForTransactionReceipt: async (...args: unknown[]) => {
    const confirmed = await mock.receipt(...args)
    if (confirmed.status === 'success') for (const log of confirmed.logs) {
      if (log.address.toLowerCase() !== approvedGameAddress!.toLowerCase()) continue
      try {
        const event = decodeEventLog({abi: [adventureResolvedEvent], topics: log.topics, data: log.data})
        mock.actedDays.set(String(event.args.tokenId), event.args.day)
      } catch { /* No authoritative adventure state from unrelated logs. */ }
    }
    return confirmed
  },
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return {promise, resolve}
}
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
beforeEach(() => {
  vi.clearAllMocks()
  mock.actedDays.clear()
  Object.assign(mock, {address: '0x1111111111111111111111111111111111111111', owner: '0x1111111111111111111111111111111111111111', chainId: 143, connected: true, day: 100n, eventId: 1, ownerFetching: false, previewFetching: false, previewError: false, previewOverride: {}, freshOverride: {}, freshOwner: undefined, freshChain: 143, freshBinding: undefined, acted: false, refreshError: false})
  mock.block.mockImplementation(async () => ({timestamp: mock.day * 86400n, number: 10n, hash}))
  client.getCode.mockResolvedValue('0x6000'); client.simulateContract.mockResolvedValue({request: {}}); client.estimateContractGas.mockResolvedValue(200000n)
  mock.preflight.mockImplementation(async (request: {functionName: string; args?: (bigint | number)[]}) => request.functionName === 'CHOG_GENESIS' ? mock.freshBinding ?? CHOG_GENESIS : request.functionName === 'ownerOf' ? mock.freshOwner ?? mock.owner : request.functionName === 'eventFor' ? mock.eventId : {...preview(Number(request.args?.[1]), BigInt(request.args?.[0] ?? 1001)), ...mock.freshOverride})
  mock.write.mockResolvedValue(hash)
  mock.receipt.mockImplementation(async () => receipt())
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

async function open(choiceIndex = 0, tokenId = 1001n) {
  const view = render(<LocalContractAdventure selectedToken={tokenId} onHome={vi.fn()}/>)
  const choices = await screen.findAllByRole('button', {name: /Preview contract result/})
  await waitFor(() => expect(choices[choiceIndex]).toBeEnabled())
  choices[choiceIndex].focus(); fireEvent.click(choices[choiceIndex])
  return {...view, choices}
}
function skip() { fireEvent.click(screen.getByRole('button', {name: 'Skip interaction'})) }
async function confirm() {
  const button = screen.getByRole('button', {name: 'CONFIRM MONAD MAINNET ACTION · MON GAS'})
  expect(button).toBeEnabled(); fireEvent.click(button)
  await waitFor(() => expect(mock.write).toHaveBeenCalledOnce())
}

describe('prepared Monad mainnet write boundary (mock wallet, no RPC)', () => {
  it('requires the explicit confirm click and submits only act on chain 143 with bounded estimated gas', async () => {
    await open(); skip(); expect(mock.write).not.toHaveBeenCalled()
    expect(screen.getByText('Unaudited, immutable contract.')).toBeVisible()
    expect(screen.getByText(/Stop if your wallet shows a security warning/)).toBeVisible()
    await confirm()
    expect(mock.write).toHaveBeenCalledWith({address: approvedGameAddress, abi: gameLocalWriteAbi, functionName: 'act', args: [1001n, 1], account: mock.address, chainId: 143, gas: 200000n})
    await screen.findByText(/Verified on-chain outcome/)
    expect(client.simulateContract).toHaveBeenCalledOnce()
  })
  it('fails closed on a runtime hash mismatch before any wallet request', async () => {
    client.getCode.mockResolvedValue('0x6001')
    await open(); skip(); fireEvent.click(screen.getByRole('button', {name: 'CONFIRM MONAD MAINNET ACTION · MON GAS'}))
    await screen.findByText(/runtime does not match/)
    expect(mock.write).not.toHaveBeenCalled()
  })
  it('fails closed when preflight simulation reverts', async () => {
    client.simulateContract.mockRejectedValueOnce(new Error('AlreadyActed'))
    await open(); skip(); fireEvent.click(screen.getByRole('button', {name: 'CONFIRM MONAD MAINNET ACTION · MON GAS'}))
    await screen.findByText(/AlreadyActed/); expect(mock.write).not.toHaveBeenCalled()
  })
  it('blocks a transferred NFT immediately before confirmation', async () => {
    await open(); skip(); mock.freshOwner = '0x2222222222222222222222222222222222222222'
    fireEvent.click(screen.getByRole('button', {name: 'CONFIRM MONAD MAINNET ACTION · MON GAS'}))
    await screen.findByText(/Ownership, day or preview changed/); expect(mock.write).not.toHaveBeenCalled()
  })
  it('does not show confirmed rewards for a reverted receipt', async () => {
    mock.receipt.mockResolvedValueOnce({...receipt(), status: 'reverted'})
    await open(); skip(); await confirm(); await screen.findByText(/Transaction failed or reverted/)
    expect(screen.queryByText(/Verified on-chain outcome/)).not.toBeInTheDocument()
  })
  it('retains the submitted hash on confirmation timeout', async () => {
    mock.receipt.mockRejectedValueOnce(new Error('Receipt timeout'))
    await open(); skip(); await confirm(); await screen.findByText(/timeout does not prove failure/)
    expect(screen.getByRole('link', {name: /View submitted transaction/})).toHaveAttribute('href', `https://monadscan.com/tx/${hash}`)
  })
  it('accepts a moving latest tip when ownership, preview and UTC day remain valid', async () => {
    let number = 10n
    mock.block.mockImplementation(async (args?: {blockTag?: string; blockNumber?: bigint}) => ({timestamp: mock.day * 86400n, number: args?.blockNumber ?? number++, hash}))
    await open(); skip(); await confirm(); await screen.findByText(/Verified on-chain outcome/)
  })
})

it('blocks a wrong-chain RPC before the wallet is asked to write', async () => {
  await open(); skip(); mock.freshChain = 1
  fireEvent.click(screen.getByRole('button', {name: 'CONFIRM MONAD MAINNET ACTION · MON GAS'}))
  await screen.findByText(/Ownership, day or preview changed/)
  expect(mock.write).not.toHaveBeenCalled()
})
it('blocks a failed gas estimate before the wallet is asked to write', async () => {
  client.estimateContractGas.mockRejectedValueOnce(new Error('Gas estimation unavailable'))
  await open(); skip()
  fireEvent.click(screen.getByRole('button', {name: 'CONFIRM MONAD MAINNET ACTION · MON GAS'}))
  await screen.findByText(/Gas estimation unavailable/)
  expect(mock.write).not.toHaveBeenCalled()
})
it('retains the submitted hash and withholds rewards before finality', async () => {
  mock.block.mockImplementation(async (args?: {blockTag?: string}) => ({timestamp: mock.day * 86400n, number: args?.blockTag === 'finalized' ? 9n : 10n, hash}))
  await open(); skip(); await confirm()
  await screen.findByText(/not yet verified on the finalized canonical chain/)
  expect(screen.queryByText(/Verified on-chain outcome/)).not.toBeInTheDocument()
  expect(screen.getByRole('link', {name: /View submitted transaction/})).toHaveAttribute('href', `https://monadscan.com/tx/${hash}`)
})

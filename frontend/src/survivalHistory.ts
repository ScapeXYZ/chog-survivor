import {parseAbiItem, type Address, type Hex, type PublicClient} from 'viem'

export const adventureResolvedEvent = parseAbiItem('event AdventureResolved(uint256 indexed tokenId, address indexed owner, uint64 indexed day, uint8 eventId, uint8 choiceId, uint8 outcomeId, int32 xpDelta, int16 trustDelta, int16 scarsDelta, uint32 xpAfter, uint8 trustAfter, uint8 scarsAfter, uint8 streakAfter, uint8 unmarkedStreakAfter, uint256 achievementMaskAfter)')
export const achievementEarnedEvent = parseAbiItem('event AchievementEarned(uint256 indexed tokenId, uint8 indexed achievementId, uint64 indexed day)')
export type HistoryClient = Pick<PublicClient, 'getBlock' | 'getLogs'>
export type AdventureHistory = {kind: 'adventure'; tokenId: bigint; owner: Address; day: bigint; eventId: number; choiceId: number; outcomeId: number; xpDelta: number; trustDelta: number; scarsDelta: number; xpAfter: number; trustAfter: number; scarsAfter: number; streakAfter: number; unmarkedStreakAfter: number; achievementMaskAfter: bigint; blockNumber: bigint; transactionIndex: number; logIndex: number; transactionHash: Hex; timestamp: bigint}
export type AchievementHistory = {kind: 'achievement'; tokenId: bigint; achievementId: number; day: bigint; blockNumber: bigint; transactionIndex: number; logIndex: number; transactionHash: Hex; timestamp: bigint}
export type HistoryRecord = AdventureHistory | AchievementHistory
export type HistoryResult = {records: HistoryRecord[]; complete: boolean; partial: boolean; error?: string; latestBlock: bigint}
const chunkSize = 500n

// Token ID is topic[1] for both frozen events, so each request is token-bound
// at the node instead of relying on a wallet address or client-side filtering.
export async function readSurvivalHistory(client: HistoryClient, address: Address, tokenId: bigint, startBlock: bigint, active: () => boolean): Promise<HistoryResult> {
  const first = await client.getBlock({blockTag: 'latest'})
  const latest = first.number
  if (latest === null || latest < startBlock) return {records: [], complete: true, partial: false, latestBlock: latest ?? 0n}
  const records: HistoryRecord[] = []
  const seen = new Set<string>()
  const timestamps = new Map<bigint, bigint>()
  async function timestamp(blockNumber: bigint) { if (!timestamps.has(blockNumber)) timestamps.set(blockNumber, (await client.getBlock({blockNumber})).timestamp); return timestamps.get(blockNumber)! }
  try {
    for (let fromBlock = startBlock; fromBlock <= latest; fromBlock += chunkSize) {
      if (!active()) throw new Error('History request superseded')
      const toBlock = fromBlock + chunkSize - 1n > latest ? latest : fromBlock + chunkSize - 1n
      const [adventures, achievements] = await Promise.all([
        client.getLogs({address, event: adventureResolvedEvent, args: {tokenId}, fromBlock, toBlock}),
        client.getLogs({address, event: achievementEarnedEvent, args: {tokenId}, fromBlock, toBlock}),
      ])
      for (const log of adventures) {
        if (!active()) throw new Error('History request superseded')
        const key = `${log.transactionHash}:${log.logIndex}`; if (seen.has(key) || log.blockNumber === null || log.transactionIndex === null || log.logIndex === null || !log.transactionHash) continue; seen.add(key)
        const a = log.args; records.push({kind: 'adventure', tokenId: a.tokenId!, owner: a.owner!, day: a.day!, eventId: Number(a.eventId), choiceId: Number(a.choiceId), outcomeId: Number(a.outcomeId), xpDelta: Number(a.xpDelta), trustDelta: Number(a.trustDelta), scarsDelta: Number(a.scarsDelta), xpAfter: Number(a.xpAfter), trustAfter: Number(a.trustAfter), scarsAfter: Number(a.scarsAfter), streakAfter: Number(a.streakAfter), unmarkedStreakAfter: Number(a.unmarkedStreakAfter), achievementMaskAfter: a.achievementMaskAfter!, blockNumber: log.blockNumber, transactionIndex: log.transactionIndex, logIndex: log.logIndex, transactionHash: log.transactionHash, timestamp: await timestamp(log.blockNumber)})
      }
      for (const log of achievements) {
        if (!active()) throw new Error('History request superseded')
        const key = `${log.transactionHash}:${log.logIndex}`; if (seen.has(key) || log.blockNumber === null || log.transactionIndex === null || log.logIndex === null || !log.transactionHash) continue; seen.add(key)
        const a = log.args; records.push({kind: 'achievement', tokenId: a.tokenId!, achievementId: Number(a.achievementId), day: a.day!, blockNumber: log.blockNumber, transactionIndex: log.transactionIndex, logIndex: log.logIndex, transactionHash: log.transactionHash, timestamp: await timestamp(log.blockNumber)})
      }
    }
  } catch (error) {
    return {records: records.sort(order), complete: false, partial: records.length > 0, error: error instanceof Error ? error.message : 'History RPC failure', latestBlock: latest}
  }
  const last = await client.getBlock({blockTag: 'latest'})
  if (last.hash !== first.hash || last.number !== latest) return {records: records.sort(order), complete: false, partial: records.length > 0, error: 'Local chain changed while history was read; refresh.', latestBlock: latest}
  return {records: records.sort(order), complete: true, partial: false, latestBlock: latest}
}

function order(a: HistoryRecord, b: HistoryRecord) { return Number(a.blockNumber - b.blockNumber) || a.transactionIndex - b.transactionIndex || a.logIndex - b.logIndex }

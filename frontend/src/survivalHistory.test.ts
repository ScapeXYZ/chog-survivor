import {describe, expect, it, vi} from 'vitest'
import {readSurvivalHistory} from './survivalHistory'

const game = '0x1111111111111111111111111111111111111111' as const
const token = 1001n
function client(logs: unknown[], changed = false, latest = 8n) {
  let calls = 0
  return {
    getBlock: vi.fn(async (request: {blockTag?: string; blockNumber?: bigint}) => {
      if (request.blockTag) return {number: latest, hash: changed && calls++ > 0 ? '0xbbb' : '0xaaa', timestamp: 1_700_000_000n}
      return {number: request.blockNumber!, hash: '0xblock', timestamp: 1_700_000_000n + request.blockNumber!}
    }),
    getLogs: vi.fn(async () => logs.shift() ?? []),
  }
}
const adventure = {address: game, removed: false, args: {tokenId: token, owner: '0x1234567890123456789012345678901234567890', day: 4n, eventId: 2, choiceId: 1, outcomeId: 4, xpDelta: 10, trustDelta: 10, scarsDelta: 0, xpAfter: 10, trustAfter: 10, scarsAfter: 0, streakAfter: 1, unmarkedStreakAfter: 1, achievementMaskAfter: 1n}, blockNumber: 5n, transactionIndex: 0, logIndex: 0, transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}
const achievement = {address: game, removed: false, args: {tokenId: token, achievementId: 0, day: 4n}, blockNumber: 5n, transactionIndex: 0, logIndex: 1, transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}

describe('token-bound survival history', () => {
  it('uses token-filtered events, orders records, and preserves achievement evidence', async () => {
    const rpc = client([[adventure], [achievement]])
    const result = await readSurvivalHistory(rpc as never, game, token, 4n, () => true)
    expect(result.complete).toBe(true)
    expect(result.records.map(record => record.kind)).toEqual(['adventure', 'achievement'])
    expect(rpc.getLogs).toHaveBeenCalledTimes(2)
  })
  it('rejects removed events, foreign contracts and events for other tokens', async () => {
    const rpc = client([[
      {...adventure, removed: true},
      {...adventure, address: '0x2222222222222222222222222222222222222222'},
      {...adventure, args: {...adventure.args, tokenId: 1002n}},
    ], [{...achievement, removed: true}]])
    const result = await readSurvivalHistory(rpc as never, game, token, 4n, () => true)
    expect(result.records).toEqual([])
    for (const [request] of rpc.getLogs.mock.calls as unknown as [{strict: boolean; address: string; args: {tokenId: bigint}}][]) {
      expect(request).toMatchObject({strict: true, address: game, args: {tokenId: token}})
    }
  })
  it('deduplicates repeated logs and never calls history complete after a partial RPC failure', async () => {
    const rpc = client([[adventure, adventure], [], Promise.reject(new Error('throttled')), []], false, 600n)
    const result = await readSurvivalHistory(rpc as never, game, token, 4n, () => true)
    expect(result.complete).toBe(false); expect(result.partial).toBe(true); expect(result.records).toHaveLength(1)
  })
  it('marks a changed chain head incomplete', async () => {
    const rpc = client([[adventure], [achievement]], true)
    const result = await readSurvivalHistory(rpc as never, game, token, 4n, () => true)
    expect(result.complete).toBe(false); expect(result.error).toMatch(/changed/)
  })
})

import {describe, expect, it, vi} from 'vitest'
import {metadataGateway, readMetadata} from './nftMetadata'

function response(body: string, status = 200, length?: string) { return {ok: status >= 200 && status < 300, status, headers: {get: () => length ?? null}, text: async () => body} as unknown as Response }

describe('safe NFT metadata reader', () => {
  it('reads bounded valid local fixture metadata without artwork', async () => {
    const value = await readMetadata('data:application/json,%7B%22name%22%3A%22LOCAL%20TEST%20NFT%22%7D', true)
    expect(value.name).toBe('LOCAL TEST NFT'); expect(value.image).toBeUndefined()
  })
  it('normalizes IPFS and rejects unsafe URI schemes', () => {
    expect(metadataGateway('ipfs://cid/1.json')).toBe('https://ipfs.io/ipfs/cid/1.json')
    expect(metadataGateway('javascript:alert(1)')).toBeUndefined()
    expect(metadataGateway('data:application/json,{}')).toBeUndefined()
  })
  it.each([
    ['malformed JSON', response('{')],
    ['gateway failure', response('', 429)],
    ['oversized metadata', response('{}', 200, String(131073))],
  ])('fails safely for %s', async (_, result) => {
    await expect(readMetadata('https://example.test/meta.json', false, vi.fn(async () => result) as never)).rejects.toThrow()
  })
  it('does not accept production inline metadata or non-HTTPS image values', async () => {
    await expect(readMetadata('data:application/json,%7B%7D', false)).rejects.toThrow(/Inline/)
    const value = await readMetadata('https://example.test/meta', false, vi.fn(async () => response('{"image":"javascript:alert(1)"}')) as never)
    expect(value.image).toBeUndefined()
  })
})

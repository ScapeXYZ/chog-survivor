import {describe, expect, it} from 'vitest'
import {gameMode, isWrongNetwork, ownershipState, parseTokenId, transactionEnabled} from './utils'

describe('token selection validation', () => {
  it('accepts a whole-number token ID and rejects unsafe UI input', () => {
    expect(parseTokenId('1425')).toBe(1425n)
    expect(parseTokenId(' 42 ')).toBe(42n)
    expect(parseTokenId('2.5')).toBeUndefined()
    expect(parseTokenId('-1')).toBeUndefined()
    expect(parseTokenId('')).toBeUndefined()
  })
})

describe('ownership query states', () => {
  it('reports RPC/nonexistent ownerOf failure as unavailable', () => {
    expect(ownershipState(undefined, undefined, true)).toBe('unavailable')
  })

  it('compares owners case-insensitively', () => {
    const address = '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763' as const
    expect(ownershipState(address, address, false)).toBe('owned')
    expect(ownershipState(address, '0x0000000000000000000000000000000000000001', false)).toBe('not-owner')
  })
})

describe('safety modes', () => {
  it('flags wrong wallet networks', () => {
    expect(isWrongNetwork(1)).toBe(true)
    expect(isWrongNetwork(143)).toBe(false)
  })

  it('labels only a configured valid address as live read-only', () => {
    expect(gameMode(undefined)).toBe('local-demo')
    expect(gameMode('not-an-address')).toBe('local-demo')
    expect(gameMode('0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763')).toBe('live-read-only')
  })

  it('never enables transaction actions in this local-only milestone', () => {
    expect(transactionEnabled()).toBe(false)
  })
})

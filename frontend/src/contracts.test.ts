import {afterEach, describe, expect, it, vi} from 'vitest'

async function configured(environment: string | undefined, rpc: string | undefined, game: string | undefined) {
  vi.resetModules()
  vi.stubEnv('VITE_CHOG_ENV', environment)
  vi.stubEnv('VITE_LOCAL_RPC_URL', rpc)
  vi.stubEnv('VITE_LOCAL_CHOG_SURVIVOR_ADDRESS', game)
  return import('./contracts')
}

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

describe('local contract configuration boundary', () => {
  it('defaults to a deterministic read-only test environment before explicit local opt-in', async () => {
    const contracts = await import('./contracts')
    expect(contracts.localMode).toBe(false)
    expect(contracts.environmentReady).toBe(true)
    expect(contracts.activeChainId).toBe(143)
    expect(contracts.wagmiConfig.chains.map(chain => chain.id)).toEqual([143])
    expect(contracts.wagmiConfig.getClient().transport.url).toBe('https://rpc.monad.xyz')
    expect(contracts.approvedGameAddress).toBeUndefined()
    expect(contracts.localDeploymentStartBlock).toBeUndefined()
  })

  it('enables the fixture only with explicit exact-local configuration', async () => {
    const contracts = await configured('local', 'http://127.0.0.1:8545', '0x1111111111111111111111111111111111111111')
    expect(contracts.localMode).toBe(true)
    expect(contracts.activeChainId).toBe(31338)
    expect(contracts.activeChain.rpcUrls.default.http).toEqual(['http://127.0.0.1:8545'])
    expect(contracts.wagmiConfig.chains.map(chain => chain.id)).toEqual([31338])
    expect(contracts.wagmiConfig.getClient().transport.url).toBe('http://127.0.0.1:8545')
    expect(contracts.approvedGameAddress).toBe('0x1111111111111111111111111111111111111111')
  })

  it.each(['http://localhost:8545', 'https://rpc.monad.xyz', undefined])('fails closed for %s', async (rpc) => {
    const contracts = await configured('local', rpc, '0x1111111111111111111111111111111111111111')
    expect(contracts.localMode).toBe(false)
    expect(contracts.environmentReady).toBe(false)
    expect(contracts.activeChainId).toBe(143)
  })

  it('does not enable a local fixture without explicit local mode', async () => {
    const contracts = await configured(undefined, 'http://127.0.0.1:8545', '0x1111111111111111111111111111111111111111')
    expect(contracts.localMode).toBe(false)
    expect(contracts.approvedGameAddress).toBeUndefined()
  })
})

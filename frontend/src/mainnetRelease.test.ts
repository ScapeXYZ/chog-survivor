import {afterEach, expect, it, vi} from 'vitest'
// Exercise actual release authorization, not the shared read-only test variant.
vi.unmock('./mainnetRelease')
afterEach(()=>{vi.unstubAllEnvs();vi.doUnmock('./mainnetDeployment');vi.resetModules()})
async function config(mode='production') {vi.resetModules();vi.stubEnv('VITE_CHOG_ENV',mode);vi.stubEnv('VITE_LOCAL_RPC_URL','');vi.stubEnv('VITE_LOCAL_CHOG_SURVIVOR_ADDRESS','');return import('./contracts')}
it('enables the owner-authorized release only with the verified mainnet manifest',async()=>{const c=await config();expect((await import('./mainnetRelease')).mainnetGameplayReleaseAuthorized).toBe(true);expect(c.mainnetTransactionsEnabled).toBe(true);expect(c.mainnetReadMode).toBe(true);expect(c.activeChainId).toBe(143);expect(c.approvedGameAddress).toBe('0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390');expect(c.CHOG_GENESIS).toBe('0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763')})
it('fails closed for an absent deployment manifest despite release approval',async()=>{vi.doMock('./mainnetDeployment',async original=>({...await original<typeof import('./mainnetDeployment')>(),mainnetDeployment:null}));expect((await config()).mainnetTransactionsEnabled).toBe(false)})
it('fails closed for unsafe requested local configuration',async()=>{expect((await config('local')).mainnetTransactionsEnabled).toBe(false)})
it('does not redirect production or change policy through environment address overrides',async()=>{vi.stubEnv('VITE_CHOG_SURVIVOR_ADDRESS','0x1111111111111111111111111111111111111111');const c=await config();expect(c.mainnetTransactionsEnabled).toBe(true);expect(c.approvedGameAddress).toBe('0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390')})

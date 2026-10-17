import {cleanup, renderHook, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'
import {keccak256} from 'viem'
const fixture=vi.hoisted(()=>({chain:143,game:'0x6000',nft:'0x6001',binding:'0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763',changed:false,read:vi.fn()}))
vi.mock('./mainnetDeployment',()=>({mainnetDeployment:{runtimeCodeHash:keccak256('0x6000')}}))
vi.mock('./discoverSurvivors',()=>({verifiedCollectionCodeHash:keccak256('0x6001')}))
vi.mock('./contracts',()=>({activeChain:{id:143},approvedGameAddress:'0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',CHOG_GENESIS:'0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763',gameReadAbi:[],localMode:false}))
const client={getChainId:async()=>fixture.chain,getBlock:async(r:{blockTag?:string})=>({number:10n,hash:r.blockTag||!fixture.changed?'0xaaaa':'0xbbbb'}),getCode:async(r:{address:string})=>r.address.startsWith('0x4735')?fixture.game:fixture.nft,readContract:async(r:unknown)=>{fixture.read(r);return fixture.binding}}
vi.mock('wagmi',()=>({usePublicClient:()=>client}))
import {useVerifiedDeployment} from './useVerifiedDeployment'
beforeEach(()=>{Object.assign(fixture,{chain:143,game:'0x6000',nft:'0x6001',binding:'0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763',changed:false});fixture.read.mockClear()});afterEach(cleanup)
it('verifies chain, both runtime hashes and binding at a canonical finalized block',async()=>{const r=renderHook(()=>useVerifiedDeployment(true,'account:token'));await waitFor(()=>expect(r.result.current.verified).toBe(true));expect(r.result.current.blockNumber).toBe(10n);expect(fixture.read).toHaveBeenCalledWith(expect.objectContaining({blockNumber:10n,functionName:'CHOG_GENESIS'}))})
it.each(['chain','game','nft','binding','canonical'])('rejects %s mismatch',async mode=>{if(mode==='chain')fixture.chain=1;if(mode==='game')fixture.game='0x6002';if(mode==='nft')fixture.nft='0x6002';if(mode==='binding')fixture.binding='0x0000000000000000000000000000000000000001';if(mode==='canonical')fixture.changed=true;const r=renderHook(()=>useVerifiedDeployment(true,'account:token'));await waitFor(()=>expect(r.result.current.error).toBeTruthy());expect(r.result.current.verified).toBe(false)})
it('immediately hides old verification when disabled or context changes',async()=>{const r=renderHook(({enabled,key})=>useVerifiedDeployment(enabled,key),{initialProps:{enabled:true,key:'a:1'}});await waitFor(()=>expect(r.result.current.verified).toBe(true));r.rerender({enabled:false,key:'a:1'});expect(r.result.current.verified).toBe(false);r.rerender({enabled:true,key:'b:2'});expect(r.result.current.verified).toBe(false);await waitFor(()=>expect(r.result.current.verified).toBe(true))})

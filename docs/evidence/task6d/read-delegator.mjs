// Read-only code evidence at the governance snapshot. Does not execute delegated wallet code.
import fs from 'node:fs/promises'
import {createRequire} from 'node:module'
const root=new URL('../../../',import.meta.url),require=createRequire(new URL('frontend/package.json',root))
const {createPublicClient,http,keccak256}=require('viem')
const saved=JSON.parse(await fs.readFile(new URL('governance-current.json',import.meta.url)))
const blockNumber=BigInt(saved.block.number),target='0x63c0c19a282a1b52b07dd5a65b58948a07dae32b'
const client=createPublicClient({transport:http('https://rpc.monad.xyz',{timeout:15000,retryCount:1})})
if(await client.getChainId()!==143)throw Error('Wrong chain')
const code=await client.getCode({address:target,blockNumber})
if(!code||code==='0x')throw Error('Delegation target code unavailable')
const observations=Object.entries(saved.knownAccounts).map(([address,e])=>({address,code:e.code,delegationTarget:/^0xef0100[0-9a-f]{40}$/i.test(e.code)?'0x'+e.code.slice(8):null}))
console.log(JSON.stringify({capturedAt:new Date().toISOString(),blockNumber:blockNumber.toString(),target,targetCode:code,targetRuntimeHash:keccak256(code),observations,limitations:['Observed EIP-7702 indicator and target code only; target runtime has not been independently rebuilt here.','An official documented target-address match is not an attestation of active permissions, key custody or complete account security.']},null,2))

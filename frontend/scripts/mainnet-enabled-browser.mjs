// Isolated mainnet bundle: synthetic manifest by default, real pinned manifest with --verified-manifest.
// All RPC and wallet calls are intercepted; this never tests a genuine wallet.
// Never writes the checked-in manifest or production dist. Never uses a real signer.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import {build} from 'vite'
import {chromium} from 'playwright'
import {approvedArtifact} from './release-artifact.mjs'
import {decodeFunctionData, encodeFunctionResult, parseAbi, keccak256} from 'viem'
const artifactIndex=process.argv.indexOf('--artifact-dir')
const root = artifactIndex<0?await fs.mkdtemp('/tmp/chog-7b-enabled-'):path.resolve(process.argv[artifactIndex+1])
const verifiedManifest=process.argv.includes('--verified-manifest'),approved=await approvedArtifact()
const game = verifiedManifest?'0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390':'0x3333333333333333333333333333333333333333', owner = '0x1111111111111111111111111111111111111111', nft = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763'
process.env.VITE_CHOG_ENV = 'mainnet'; process.env.VITE_MONAD_RPC_URL = ''; process.env.VITE_LOCAL_RPC_URL = ''
if(artifactIndex>=0&&!verifiedManifest)throw Error('Existing artifact requires --verified-manifest')
if(artifactIndex<0)await build({plugins: verifiedManifest?[]:[{name: 'synthetic-manifest-for-offline-browser-only', enforce: 'pre', transform(code, id) {
  if (id.endsWith('/src/mainnetDeployment.ts')) return code.replace(/export const mainnetDeployment: MainnetDeployment \| null = (?:null|\{[\s\S]*?\n\})/, `export const mainnetDeployment: MainnetDeployment | null = {chainId: 143, address: '${game}', deploymentBlock: 4n, runtimeCodeHash: '${keccak256('0x6000')}'}`)
}}], build: {outDir: root}})
const checks = [], errors = [], requests = []
const check = (name, value) => { assert.ok(value, name); checks.push(name); console.log('PASS '+name) }
const abi = parseAbi([
    'function ownerOf(uint256 tokenId) view returns (address)', 'function tokenURI(uint256 tokenId) view returns (string)', 'function CHOG_GENESIS() view returns (address)',
    'function characterOf(uint256 tokenId) view returns ((uint32 xp,uint8 trust,uint8 scars,uint8 streak,uint8 unmarkedStreak,uint64 lastActionDay,uint8 lastOutcomeId,uint8 eventMask,uint256 achievementMask,bool hasActed))',
    'function titleOf(uint256 tokenId) view returns (uint8)', 'function eventFor(uint256 tokenId,uint64 day) view returns (uint8)',
    'function preview(uint256 tokenId,uint8 choiceId) view returns ((uint64 day,uint8 eventId,uint8 choiceId,uint8 outcomeId,int32 xpDelta,int16 trustDelta,int16 scarsDelta,uint32 xpAfter,uint8 trustAfter,uint8 scarsAfter,uint8 streakAfter,uint8 unmarkedStreakAfter,uint256 newlyEarnedAchievementMask,uint256 achievementMaskAfter,uint8 titleId,bool canAct))',
    'function act(uint256 tokenId,uint8 choiceId)',
  ])

const blockHash = `0x${'b'.repeat(64)}`
const height=verifiedManifest?113947539n:10n,baseRuntime=verifiedManifest?approved.runtime:'0x6000'
const block = {number:'0x'+height.toString(16), hash:blockHash, parentHash:blockHash, timestamp:'0x83d600', gasLimit:'0x1c9c380', gasUsed:'0x0', baseFeePerGas:'0x174876e800', transactions:[], extraData:'0x', size:'0x1'}
let currentOwner = owner, runtime = baseRuntime, acted = false
const historyRequests=[]
function rpc({method, params = []}) {
  requests.push(method)
  if (method === 'eth_chainId') return '0x8f'
  if (method === 'eth_blockNumber') return block.number
  if (method === 'eth_getBlockByNumber') return block
  if (method === 'eth_getLogs') {historyRequests.push(params[0]);return []}
  if (method === 'eth_getCode') return runtime
  if (method === 'eth_estimateGas') return '0x30d40'
  if (method === 'eth_gasPrice' || method === 'eth_maxPriorityFeePerGas') return '0x17bfac7c00'
  if (method === 'eth_getTransactionCount') return '0x0'
  if (method === 'eth_call') {
    const {functionName, args} = decodeFunctionData({abi, data:params[0].data})
    let result
    if (functionName === 'act') return '0x'
    if (functionName === 'ownerOf') result = currentOwner
    else if (functionName === 'CHOG_GENESIS') result = nft
    else if (functionName === 'tokenURI') throw Error('Metadata unavailable in fixture')
    else if (functionName === 'titleOf') result = 0
    else if (functionName === 'eventFor') result = 1
    else if (functionName === 'characterOf') result = {xp:0,trust:0,scars:0,streak:0,unmarkedStreak:0,lastActionDay:100n,lastOutcomeId:0,eventMask:0,achievementMask:0n,hasActed:acted}
    else if (functionName === 'preview') result = {day:100n,eventId:1,choiceId:Number(args[1]),outcomeId:Number(args[1]),xpDelta:12,trustDelta:5,scarsDelta:0,xpAfter:12,trustAfter:5,scarsAfter:0,streakAfter:1,unmarkedStreakAfter:1,newlyEarnedAchievementMask:1n,achievementMaskAfter:1n,titleId:0,canAct:!acted}
    else throw Error('Unexpected read '+functionName)
    return encodeFunctionResult({abi,functionName,result})
  }
  throw Error('Unexpected RPC '+method)
}
const server = http.createServer(async (req,res) => {
  try {
    const target = path.resolve(root, '.'+(req.url === '/' ? '/index.html' : req.url.split('?')[0]))
    if (!target.startsWith(root+'/')) throw Error('Invalid path')
    res.setHeader('Content-Type', {'.html':'text/html','.js':'application/javascript','.css':'text/css','.ttf':'font/ttf','.webp':'image/webp'}[path.extname(target)] ?? 'application/octet-stream')
    res.end(await fs.readFile(target))
  } catch {res.writeHead(404);res.end()}
})
let browser
try {
  await new Promise(resolve => server.listen(5194,'127.0.0.1',resolve))
  browser = await chromium.launch({headless:true})
  for (const width of [1440,375]) {
    currentOwner = owner; runtime = baseRuntime; acted = false
    const context = await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'})
    const wallet = []; let authorized = false,walletChain='0x8f'
    await context.exposeBinding('__fixtureWallet', async (_, request) => {
      wallet.push(request)
      if (request.method === 'eth_chainId') return walletChain
      if (request.method === 'eth_accounts') return authorized ? [owner] : []
      if (request.method === 'eth_requestAccounts') {authorized = true; return [owner]}
      if (request.method === 'wallet_getPermissions' || request.method === 'wallet_requestPermissions') return []
      if (request.method === 'eth_sendTransaction') {
        const tx = request.params[0], decoded = decodeFunctionData({abi,data:tx.data})
        assert.equal(tx.to.toLowerCase(),game.toLowerCase()); assert.equal(decoded.functionName,'act'); assert.equal(decoded.args[0],1001n)
        // EIP-1193 eth_sendTransaction may omit chainId; Viem checks eth_chainId first.
        if (tx.chainId !== undefined) assert.equal(tx.chainId,'0x8f');
        assert.equal(wallet.at(-2)?.method,'eth_chainId'); assert.equal(BigInt(tx.gas),200000n)
        return {fixtureRejected: true}
      }
      throw Error('Forbidden wallet method '+request.method)
    })
    await context.addInitScript(({selectedWallet}) => {
      const listeners={};window.__walletEvent=(name,value)=>{for(const fn of listeners[name]??[])fn(value)}
      const provider = {on(name,fn){(listeners[name]??=[]).push(fn)},removeListener(name,fn){listeners[name]=(listeners[name]??[]).filter(item=>item!==fn)},request:async request=>{const result=await window.__fixtureWallet(request);if(result?.fixtureRejected)throw Object.assign(new Error('User rejected the request'),{code:4001});return result}}
      // Two EIP-6963 providers, no legacy injection. Exercise MetaMask on desktop and Rabby on mobile.
      const announce = () => {
        for (const [name, rdns, uuid, walletProvider] of [
          ['MetaMask', 'io.metamask', '11111111-1111-4111-8111-111111111111', selectedWallet==='MetaMask'?provider:{...provider, request: () => {throw Error('Unselected wallet was called')}}],
          ['Rabby', 'io.rabby', '22222222-2222-4222-8222-222222222222', selectedWallet==='Rabby'?provider:{...provider,request:()=>{throw Error('Unselected wallet was called')}}],
        ]) window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {detail: {info: {name, rdns, uuid, icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'}, provider: walletProvider}}))
      }
      window.addEventListener('eip6963:requestProvider', announce)
      announce()
    },{selectedWallet:width===1440?'MetaMask':'Rabby'})
    await context.route('**/*', async route => {
      const req=route.request(),url=new URL(req.url())
      if(url.origin==='http://127.0.0.1:5194') return route.continue()
      if(url.origin==='https://rpc.monad.xyz' && req.method()==='POST') {
        const answer=item=>{try{return {jsonrpc:'2.0',id:item.id,result:rpc(item)}}catch(error){return {jsonrpc:'2.0',id:item.id,error:{code:-32000,message:error.message}}}}
        const body=req.postDataJSON(); return route.fulfill({json:Array.isArray(body)?body.map(answer):answer(body)})
      }
      return route.abort()
    })
    const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message))
    await page.goto('http://127.0.0.1:5194')
    await page.getByRole('button',{name:/enter the wild/i}).click()
    check(`${width}: enabled build defaults to simulation`,await page.getByText('DEMO STATS — NOT SAVED').isVisible())
    check(`${width}: simulation never requests writes`,!wallet.some(r=>r.method==='eth_sendTransaction'))
    await page.getByRole('button',{name:/Play Monad mainnet/}).click()
    check(`${width}: real mode clearly labeled`,await page.getByText('MONAD MAINNET · REAL TRANSACTIONS').isVisible())
    await page.getByRole('button',{name:/Browse walletless simulation/}).click()
    await page.getByRole('button',{name:/^settings$/i}).click()
    check(`${width}: verified manifest explorer link`,(await page.getByRole('link',{name:/MonadScan deployment record/}).getAttribute('href')).includes(game))
    check(`${width}: settings fit viewport`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
    check(`${width}: walletless navigation never connects`,!wallet.some(r=>['eth_requestAccounts','wallet_requestPermissions','eth_sendTransaction'].includes(r.method)))
    await page.locator('.game-header .wallet').click()
    await page.getByRole('dialog').waitFor()
    check(`${width}: discovers two EVM wallets without legacy injection`,await page.getByRole('button',{name:'MetaMask',exact:true}).isVisible() && await page.getByRole('button',{name:'Rabby',exact:true}).isVisible())
    await page.getByRole('button',{name:'Cancel',exact:true}).click()
    check(`${width}: cancel never connects`,!wallet.some(r=>['eth_requestAccounts','wallet_requestPermissions','eth_sendTransaction'].includes(r.method)))
    await page.locator('.game-header .wallet').click()
    await page.getByRole('button',{name:width===1440?'MetaMask':'Rabby',exact:true}).click()
    await page.getByRole('button',{name:/^character$/i}).click()
    await page.getByLabel('Token ID').fill('1001');await page.getByRole('button',{name:'Check token'}).click()
    await page.getByRole('heading',{name:'CHOG #1001',exact:true}).waitFor()
    await page.getByRole('heading',{name:'No recorded decisions.',exact:true}).waitFor()
    check(`${width}: empty history is explicit and uses real manifest floor`,historyRequests.length>0&&historyRequests.every(r=>BigInt(r.fromBlock)>=(verifiedManifest?113947533n:4n)&&r.address.toLowerCase()===game.toLowerCase()))
    await page.getByRole('button',{name:/^adventure$/i}).click()
    await page.getByRole('button',{name:/Play Monad mainnet/}).click()
    await page.getByText(/Ready for one Monad mainnet action/).waitFor()
    check(`${width}: immutable and warning risks visible before action`,await page.getByText('Unaudited, immutable contract.',{exact:true}).isVisible())
    walletChain='0x1';await page.evaluate(()=>window.__walletEvent('chainChanged','0x1'))
    await page.getByText('Select Monad mainnet chain 143 in your wallet.',{exact:false}).waitFor()
    check(`${width}: wrong-network event blocks choices without switching or writing`,await page.locator('.adventure-choice:enabled').count()===0&&!wallet.some(r=>r.method==='eth_sendTransaction'||r.method==='wallet_switchEthereumChain'))
    walletChain='0x8f';await page.evaluate(()=>window.__walletEvent('chainChanged','0x8f'))
    await page.getByText(/Ready for one Monad mainnet action/).waitFor()
    await page.locator('.adventure-choice').first().click();await page.getByRole('button',{name:'Skip interaction'}).click()
    check(`${width}: preview does not write`,!wallet.some(r=>r.method==='eth_sendTransaction'))
    await page.getByRole('button',{name:'CONFIRM MONAD MAINNET ACTION · MON GAS'}).click()
    await page.getByText('Wallet rejected the request.').waitFor().catch(async error => {console.log(JSON.stringify({wallet, text: await page.locator('main').innerText()}));throw error})
    check(`${width}: explicit confirmation only, bounded gas and pinned chain`,wallet.filter(r=>r.method==='eth_sendTransaction').length===1)
    check(`${width}: gas estimate requested`,requests.includes('eth_estimateGas'))
    await page.getByRole('button',{name:'RETURN TO ADVENTURE'}).click()
    runtime='0x6001'
    await page.locator('.adventure-choice').first().click();await page.getByRole('button',{name:'Skip interaction'}).click()
    await page.getByRole('button',{name:'CONFIRM MONAD MAINNET ACTION · MON GAS'}).click()
    await page.getByText(/runtime does not match/).waitFor()
    check(`${width}: runtime mismatch blocks wallet`,wallet.filter(r=>r.method==='eth_sendTransaction').length===1)
    await page.getByRole('button',{name:'RETURN TO ADVENTURE'}).click()
    runtime=baseRuntime;currentOwner='0x2222222222222222222222222222222222222222'
    await page.getByRole('button',{name:'Refresh ownership',exact:true}).click()
    await page.getByText('READ ONLY · OWNERSHIP CHANGED',{exact:true}).waitFor()
    check(`${width}: changed NFT ownership blocks action`,!await page.getByRole('button',{name:'CONFIRM MONAD MAINNET ACTION · MON GAS'}).count()&&wallet.filter(r=>r.method==='eth_sendTransaction').length===1)
    await context.close()
  }
  check('no uncaught browser errors',errors.length===0)
  console.log(JSON.stringify({checks:checks.length,names:checks,fixtureOnly:true,verifiedManifest,game,bundle:root},null,2))
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve))}

// Localhost-only, in-memory module replacements. Does not change release configuration.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {fileURLToPath,pathToFileURL} from 'node:url'
import path from 'node:path'
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
import {chromium} from 'playwright'
import {keccak256} from 'viem'
const evidenceArg=process.argv.indexOf('--evidence-dir')
const root=fileURLToPath(new URL('../',import.meta.url)),evidence=evidenceArg<0?new URL('../../docs/evidence/task7n/browser/',import.meta.url):pathToFileURL(path.resolve(process.argv[evidenceArg+1])+'/')
await fs.mkdir(evidence,{recursive:true})
const stub=fileURLToPath(new URL('../testing/gameplay-browser-stubs.ts',import.meta.url)),hash=keccak256('0x6000')
const server=await createServer({configFile:false,root,envPrefix:'CHOG_ISOLATED_UNUSED_',plugins:[{
 name:'isolated-gameplay-fixture',enforce:'pre',
 resolveId(source,importer){
  if(importer?.endsWith('/src/contracts.ts')&&source==='./mainnetRelease')return '\0fixture-release'
  if(importer?.endsWith('/mainnetGameplay.ts')){
   if(source==='./mainnetDeployment')return '\0fixture-manifest'
   if(source==='./discoverSurvivors')return '\0fixture-nft-hash'
  }
  if(importer&&['/MainnetGameplayPanel.tsx','/Adventure.tsx'].some(x=>importer.endsWith(x))&&['wagmi','./useSurvivorProgress','./useAdventureAvailability','./useNftMetadata'].includes(source))return stub
 },
 load(id){if(id==='\0fixture-release')return 'export const mainnetGameplayReleaseAuthorized=true';if(id==='\0fixture-manifest')return `export const mainnetDeployment={chainId:143,address:'0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',runtimeCodeHash:'${hash}'}`;if(id==='\0fixture-nft-hash')return `export const verifiedCollectionCodeHash='${hash}'`},
},react()],server:{host:'127.0.0.1',port:5197,strictPort:true},logLevel:'error'})
await server.listen()
const checks=[],errors=[],requests=[];let browser
const check=(name,value)=>{assert.ok(value,name);checks.push(name)}
try{
 browser=await chromium.launch({headless:true})
 for(const width of [1440,375]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'})
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin==='http://127.0.0.1:5197')return route.continue();requests.push(u.origin);return route.abort()})
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack)})
  async function fresh(scenario){await page.goto('http://127.0.0.1:5197/testing/gameplay-browser.html');await page.evaluate(name=>{localStorage.clear();dispatchEvent(new StorageEvent('storage',{key:null}));window.__gameplayFixture.configure(name)},scenario);if(!['non-owner','wrong-network'].includes(scenario))await page.getByRole('button',{name:/Reinforce.*Review real contract action/}).waitFor();else await page.getByRole('heading',{name:'One Chog. One daily decision.'}).waitFor()}
  async function review(){await page.getByRole('button',{name:/Reinforce.*Review real contract action/}).click();await page.getByRole('dialog',{name:'Review real Monad action'}).waitFor();await page.getByRole('checkbox').check()}
  await fresh('success');await review()
  check(`${width}: review shows exact contract, function, gas and zero value`,await page.getByRole('dialog').filter({hasText:'act(1425, 1)'}).filter({hasText:'0.025 MON'}).filter({hasText:'0 MON'}).filter({hasText:'0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390'}).isVisible())
  check(`${width}: review fits viewport`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await page.getByRole('dialog').evaluate(dialog=>{dialog.scrollTop=0});await page.screenshot({path:new URL(`${width}-review.png`,evidence).pathname});await page.getByRole('button',{name:'Request wallet confirmation'}).scrollIntoViewIfNeeded();await page.screenshot({path:new URL(`${width}-cost-confirmation.png`,evidence).pathname})
  await page.getByRole('button',{name:'Cancel review'}).click();check(`${width}: cancellation never invokes wallet`,await page.evaluate(()=>window.__gameplayFixture.sends())===0)
  await review();await page.getByRole('button',{name:'Request wallet confirmation'}).click();await page.getByRole('heading',{name:'Confirmed on Monad'}).waitFor();check(`${width}: exact controller verifies result`,await page.getByLabel('Verified transaction result').filter({hasText:'12 XP · 5 Trust · 0 Scars'}).isVisible());check(`${width}: only one fake wallet request`,await page.evaluate(()=>window.__gameplayFixture.sends())===1)
  await page.screenshot({path:new URL(`${width}-confirmed.png`,evidence).pathname})
  for(const [scenario,expected]of [['rejected','User rejected'],['reverted','Canonical receipt reverted'],['gas-failure','Gas estimation failed']]){
   await fresh(scenario);await page.getByRole('button',{name:/Reinforce.*Review real contract action/}).click()
   if(scenario!=='gas-failure'){await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Request wallet confirmation'}).click()}
   await page.getByRole(scenario==='gas-failure'?'alert':'status').filter({hasText:expected}).waitFor();check(`${width}: ${scenario} has no success`,await page.getByRole('heading',{name:'Confirmed on Monad'}).count()===0);await page.screenshot({path:new URL(`${width}-${scenario}.png`,evidence).pathname})
  }
  await fresh('timeout');await review();await page.getByRole('button',{name:'Request wallet confirmation'}).click();await page.getByRole('status').filter({hasText:'Status uncertain'}).waitFor();const before=await page.evaluate(()=>window.__gameplayFixture.sends());await page.reload();await page.getByRole('button',{name:'Check original transaction status'}).waitFor();check(`${width}: pending survives reload and prevents repeat`,await page.getByRole('button',{name:/Reinforce.*Review real contract action/}).isDisabled());check(`${width}: refresh sends nothing`,await page.evaluate(()=>window.__gameplayFixture.sends())===0);assert.ok(before>=1)
  await page.screenshot({path:new URL(`${width}-pending-recovered.png`,evidence).pathname})
  await fresh('pending');await review();await page.getByRole('button',{name:'Request wallet confirmation'}).evaluate(button=>{button.click();button.click()});await page.getByLabel('Persistent transaction status').filter({hasText:'pending'}).waitFor();check(`${width}: duplicate click submits once`,await page.evaluate(()=>window.__gameplayFixture.sends())===1)
  await page.screenshot({path:new URL(`${width}-pending-before-refresh.png`,evidence).pathname});await page.reload();await page.getByRole('button',{name:'Check original transaction status'}).click();await page.getByRole('heading',{name:'Confirmed on Monad'}).waitFor();check(`${width}: refreshed pending resolves by reads only`,await page.evaluate(()=>window.__gameplayFixture.sends())===0)
  for(const scenario of ['non-owner','wrong-network']){await fresh(scenario);check(`${width}: ${scenario} hides stale gameplay choices`,await page.getByRole('button',{name:/Review real contract action/}).count()===0);check(`${width}: ${scenario} never requests fake wallet`,await page.evaluate(()=>window.__gameplayFixture.sends())===0);await page.screenshot({path:new URL(`${width}-${scenario}.png`,evidence).pathname})}
  check(`${width}: no page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await context.close()
 }
 check('no page errors',errors.length===0);check('no external RPC attempted; decorative font requests blocked',requests.every(origin=>/^https:\/\/(fonts.googleapis.com|fonts.gstatic.com)$/.test(origin)))
 console.log(JSON.stringify({status:'PASS',checks:checks.length,names:checks,externalRequestsBlocked:[...new Set(requests)],isolatedFixturesOnly:true,realWallet:false,mainnetTransactions:false,screenshots:20},null,2))
}finally{await browser?.close();await server.close()}

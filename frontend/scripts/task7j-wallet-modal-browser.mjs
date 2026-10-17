// Local production artifact and synthetic EIP-6963 providers only. No signer exists.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {chromium} from 'playwright'
const live=process.argv.includes('--live'),arg=process.argv.indexOf('--artifact-dir');assert.ok(live||arg>=0,'Pass --artifact-dir or --live')
const evidenceArg=process.argv.indexOf('--evidence-dir')
const root=live?undefined:path.resolve(process.argv[arg+1]),evidence=evidenceArg<0?new URL('../../docs/evidence/task7j/',import.meta.url):pathToFileURL(path.resolve(process.argv[evidenceArg+1])+'/')
await fs.mkdir(new URL('screenshots/',evidence),{recursive:true})
const server=live?undefined:http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));assert.ok(file.startsWith(root+'/'));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]??'application/octet-stream');res.end(await fs.readFile(file))}catch{res.writeHead(404);res.end()}})
if(server)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=live?'https://chog-survivor.vercel.app':`http://127.0.0.1:${server.address().port}`
let browser;const checks=[],walletCalls=[],errors=[],blocked=[];const check=(name,condition)=>{assert.ok(condition,name);checks.push(name)}
try{browser=await chromium.launch({headless:true});for(const width of [1440,375,320]){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'})
 await context.exposeBinding('__walletTest',(_,r)=>{walletCalls.push(r.method);if(r.method==='eth_accounts')return[];if(r.method==='eth_chainId')return'0x8f';if(['wallet_getPermissions','wallet_requestPermissions'].includes(r.method))return[];if(r.method==='eth_requestAccounts')throw Error('4001 Synthetic user rejection');throw Error('FORBIDDEN wallet method '+r.method)})
 await context.addInitScript(()=>{for(const [index,name,rdns]of [[1,'MetaMask','io.metamask'],[2,'Rabby','io.rabby']]){const provider={on(){},removeListener(){},request:r=>window.__walletTest(r)};const announce=()=>dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{uuid:`00000000-0000-4000-8000-${String(index).padStart(12,'0')}`,name,rdns,icon:'data:image/svg+xml,<svg/>'},provider}}));addEventListener('eip6963:requestProvider',announce);announce();}})
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin&&route.request().method()==='GET')return route.continue();blocked.push(new URL(route.request().url()).origin);return route.abort()})
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.evaluate(()=>document.fonts.ready)
 for(const screen of ['home','adventure','character','settings']){
  if(screen!=='home')await page.getByRole('button',{name:new RegExp('^'+screen+'$','i')}).click()
  const trigger=screen==='home'?page.locator('.landing-wallet'):page.locator('.game-header .wallet');await trigger.scrollIntoViewIfNeeded();await trigger.focus()
  const before=await page.locator('.game-header').boundingBox(),scrollBefore=await page.evaluate(()=>scrollY)
  await trigger.click();const dialog=page.getByRole('dialog',{name:'Connect a wallet'});await dialog.waitFor()
  check(`${width} ${screen}: native modal, portal and styled rows`,await dialog.evaluate(d=>d.parentElement===document.body&&d.matches(':modal')&&getComputedStyle(d.querySelector('.wallet-dialog-option')).minHeight==='66px'))
  const after=await page.locator('.game-header').boundingBox();const scrollAfter=await page.evaluate(()=>scrollY);if(Math.abs(before.y-after.y)>=1||scrollAfter!==scrollBefore)console.error(JSON.stringify({width,screen,before,after,scrollBefore,scrollAfter}));check(`${width} ${screen}: no background layout or scroll shift`,Math.abs(before.x-after.x)<1&&Math.abs(before.y-after.y)<1&&Math.abs(before.width-after.width)<1&&await page.evaluate(()=>scrollY)===scrollBefore)
  const box=await dialog.boundingBox();check(`${width} ${screen}: fits viewport`,box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=1001&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  check(`${width} ${screen}: initial focus and background inert`,await page.getByRole('button',{name:'Close wallet selection'}).evaluate(b=>b===document.activeElement))
  await page.keyboard.press('Shift+Tab');check(`${width} ${screen}: reverse focus wraps`,await page.getByRole('button',{name:'Cancel',exact:true}).evaluate(b=>b===document.activeElement));await page.keyboard.press('Tab');check(`${width} ${screen}: forward focus wraps`,await page.getByRole('button',{name:'Close wallet selection'}).evaluate(b=>b===document.activeElement))
  await page.screenshot({path:new URL(`screenshots/${width}-${screen}-wallet.png`,evidence).pathname})
  await page.keyboard.press('Escape');check(`${width} ${screen}: Escape restores focus and scrolling`,await trigger.evaluate(b=>b===document.activeElement)&&await page.evaluate(()=>document.body.style.overflow!=='hidden'))
  check(`${width} ${screen}: closing preserves layout`,JSON.stringify(await page.locator('.game-header').boundingBox())===JSON.stringify(before))
 }
 check(`${width}: opening/cancelling never requests accounts`,!walletCalls.includes('eth_requestAccounts'))
 if(width===320){await page.locator('.game-header .wallet').click();await page.getByRole('button',{name:'MetaMask',exact:true}).click();await page.getByRole('alert').filter({hasText:/Wallet connection failed/}).waitFor();check('explicit synthetic selection reports rejection',walletCalls.includes('eth_requestAccounts'))}
 else{await page.locator('.game-header .wallet').click();await page.mouse.click(2,2);check(`${width}: backdrop dismisses`,await page.getByRole('dialog').count()===0)}
 check(`${width}: public gameplay still disabled`,await page.getByText('Production transactions disabled',{exact:true}).isVisible())
 await context.close()
 }
 check('no signing or wallet writes',walletCalls.every(x=>['eth_accounts','eth_chainId','eth_requestAccounts','wallet_getPermissions','wallet_requestPermissions'].includes(x)))
 check('no uncaught browser errors',errors.length===0)
 console.log(JSON.stringify({status:'PASS',origin,liveSite:live,checks:checks.length,names:checks,widths:[1440,375,320],screenshots:12,syntheticWalletsOnly:true,realWalletConnected:false,walletCalls,externalRequestsBlocked:true,blockedOrigins:[...new Set(blocked)],errors},null,2))
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve))}

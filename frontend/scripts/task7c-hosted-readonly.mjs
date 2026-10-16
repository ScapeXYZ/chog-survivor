// Read-only check of the existing hosted simulation. No wallet is injected.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {chromium} from 'playwright'
const origin='https://chog-survivor.vercel.app',checks=[],blocked=[],scripts=[],errors=[],pending=[]
const check=(name,value)=>{assert.ok(value,name);checks.push(name)}
const browser=await chromium.launch({headless:true})
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',reducedMotion:'reduce'})
 await context.route('**/*',route=>{const r=route.request();if(r.method()==='GET'&&new URL(r.url()).origin===origin)return route.continue();blocked.push({url:new URL(r.url()).origin,method:r.method()});return route.abort()})
 const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message))
 page.on('response',r=>{if(new URL(r.url()).origin===origin&&new URL(r.url()).pathname.endsWith('.js'))pending.push(r.body().then(bytes=>scripts.push({url:r.url(),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})))})
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000})
 await page.getByRole('button',{name:/enter the wild/i}).click()
 check('hosted Adventure is a simulation',await page.getByText('DEMO STATS — NOT SAVED',{exact:true}).isVisible())
 check('no hosted mainnet action toggle',await page.getByRole('button',{name:/Play Monad mainnet/}).count()===0)
 await page.getByRole('button',{name:/^settings$/i}).click()
 check('hosted Settings disables production writes',await page.getByText('Production transactions disabled',{exact:true}).isVisible())
 check('no wallet injected or connected',await page.evaluate(()=>typeof window.ethereum==='undefined'))
 check('no page errors',errors.length===0)
 await Promise.all(pending)
 console.log(JSON.stringify({status:'PASS',checkedAt:new Date().toISOString(),origin,checks:checks.length,names:checks,scripts,blocked,errors,websiteModified:false,walletUsed:false,allNonGETAndExternalRPCBlocked:true},null,2))
}finally{await browser.close()}

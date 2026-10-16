// Production-artifact checks only. No wallet, RPC fixtures or blockchain transactions.
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
const frontend=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const allowFonts=process.argv.includes('--allow-fonts')
const require=createRequire(path.join(frontend,'package.json'))
const {chromium}=require('playwright')
const artifactArg=process.argv.indexOf('--artifact-dir')
const external=[]; const root=artifactArg<0?path.join(frontend,'dist'):path.resolve(process.argv[artifactArg+1]),checks=[],errors=[],missing=[]
const server=http.createServer(async(req,res)=>{
 try{const target=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!target.startsWith(root+'/'))throw Error('invalid');const data=await fs.readFile(target);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.ttf':'font/ttf','.webp':'image/webp'})[path.extname(target)]||'application/octet-stream');res.end(data)}catch{res.statusCode=404;res.end('Not found')}
})
await new Promise(done=>server.listen(5190,'127.0.0.1',done))
let browser
const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)}
try{
 const artifactFiles=await fs.readdir(root,{recursive:true})
 const artifactText=(await Promise.all(artifactFiles.filter(f=>/\.(js|css|html|txt)$/.test(f)).map(f=>fs.readFile(path.join(root,f),'utf8')))).join('\n')
 check('artifact excludes loopback RPC URLs',!/https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/"'\s]|$)/i.test(artifactText))
 check('artifact excludes private credential patterns',!/(?:-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|test test test test test test test test test test test junk|(?:private[_-]?key|secret[_-]?key)\s*[:=]\s*["']0x[0-9a-f]{64}|https?:\/\/[^/\s"']+:[^/@\s"']+@)/i.test(artifactText))
 check('artifact excludes environment files and source maps',!artifactFiles.some(f=>/(?:^|\/)\.env(?:\.|$)|\.map$/.test(f)))
 browser=await chromium.launch({headless:true});const context=await browser.newContext({reducedMotion:'reduce'})
 await context.route('**/*',route=>{if(route.request().url().startsWith('http://127.0.0.1:5190/'))return route.continue();external.push(route.request().url());return allowFonts&&/^https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//.test(route.request().url())?route.continue():route.abort()})
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url())})
 await page.goto('http://127.0.0.1:5190/');await page.getByRole('heading',{name:/SURVIVE/}).waitFor()
 check('production artifact explicitly labels demo',await page.getByText(/LOCAL DEMO · Mainnet gameplay is not enabled/).isVisible())
 for(const width of [320,375,768,1440]){
  await page.setViewportSize({width,height:900})
  for(const name of ['Adventure','Character','Settings','Home']){
   await page.getByRole('navigation').getByRole('button',{name:new RegExp(`^${name}$`,'i')}).click()
   check(`${width}px ${name}: no page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
   await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))))
   check(`${width}px ${name}: images load`,await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)))
  }
 }
 await page.getByRole('navigation').getByRole('button',{name:/^adventure$/i}).click()
 check('walletless choices available',await page.locator('.adventure-choice').count()===3)
 for(let i=0;i<3;i++){
  await page.locator('.adventure-choice').nth(i).click();await page.getByRole('button',{name:'Skip interaction'}).click()
  check(`choice ${i+1}: simulation disclosure`,await page.getByText(/Simulation only\. These are documented base values/).isVisible())
  check(`choice ${i+1}: no wallet confirmation`,await page.getByRole('button',{name:'CONFIRM LOCAL ACTION'}).count()===0)
  await page.keyboard.press('Escape')
 }
 check('local Adventure font bundled',await page.evaluate(()=>document.fonts.check('16px "Chog Adventure Display"')))
 check('existing font license served unchanged',(await (await fetch('http://127.0.0.1:5190/licenses/LilitaOne-OFL.txt')).text()).trim().split('\n').map(s=>s.trimEnd()).join('\n')===(await fs.readFile(path.join(frontend,'src/assets/fonts/OFL.txt'),'utf8')).trim().split('\n').map(s=>s.trimEnd()).join('\n'))
 check('no RPC dependencies requested',external.every(u=>u.startsWith('https://fonts.googleapis.com/')||u.startsWith('https://fonts.gstatic.com/')));check('no injected wallet',await page.evaluate(()=>typeof window.ethereum==='undefined'));await page.screenshot({path:'/tmp/chog-4p-desktop.png',fullPage:true});await page.setViewportSize({width:375,height:812});await page.screenshot({path:'/tmp/chog-4p-mobile.png',fullPage:true});check('no missing runtime assets',missing.length===0);check('no uncaught errors',errors.length===0)
 console.log(JSON.stringify({passed:checks.length,failed:0,widths:[320,375,768,1440],errors,missing,externalRequestsBlocked:!allowFonts,external,checks},null,2))
}finally{if(browser)await browser.close();await new Promise(done=>server.close(done))}

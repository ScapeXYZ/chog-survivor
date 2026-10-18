// Browser observations, fresh contexts; viewport simulation, no CPU/network throttling.
import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
const live=process.argv.includes('--live'),root=path.resolve('dist')
const server=live?null:http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'})[path.extname(file)]??'application/octet-stream');res.end(await fs.readFile(file))}catch{res.writeHead(404);res.end()}})
if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r))
const origin=live?'https://chog-survivor.vercel.app':`http://127.0.0.1:${server.address().port}`
const browser=await chromium.launch({headless:true}),results=[]
try{for(const width of [1440,375])for(let trial=1;trial<=3;trial++){
const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),blocked=[]
await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():(blocked.push(route.request().url()),route.abort()))
const page=await context.newPage(),start=Date.now()
await page.goto(origin+'/#guest',{waitUntil:'domcontentloaded',timeout:120000})
await page.locator('.guest-choices button').first().click({timeout:120000})
await page.getByRole('status').waitFor()
results.push({width,trial,decisionReadyMs:Date.now()-start,resources:await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({url:r.name,durationMs:Math.round(r.duration),bytes:r.transferSize}))),blocked})
await context.close()
}console.log(JSON.stringify({live,method:'Fresh Chromium context; unthrottled desktop/mobile viewport; navigation through first resolved decision; external requests blocked identically to 7X harness.',results},null,2))}finally{await browser.close();if(server)await new Promise(r=>server.close(r))}

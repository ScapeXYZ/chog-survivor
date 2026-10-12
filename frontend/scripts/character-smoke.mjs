import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'

// Local browser QA only. No simulated NFT owners, game responses or history.
const previewUrl = process.env.CHOG_PREVIEW_URL ?? 'http://127.0.0.1:5173/'
const browserUrl = process.env.CHOG_BROWSER_URL ?? 'http://127.0.0.1:9222'
const output = process.env.CHOG_PROFILE_OUTPUT ?? '/tmp/chog-task112'
const baseline = process.env.CHOG_COMPARE_BASELINE
mkdirSync(output, {recursive: true})
const tabs = await (await fetch(`${browserUrl}/json`)).json()
const ws = new WebSocket(tabs[0].webSocketDebuggerUrl)
await new Promise((resolve) => ws.addEventListener('open', resolve, {once: true}))
let id = 0
const pending = new Map()
ws.addEventListener('message', ({data}) => {
  const message = JSON.parse(data)
  if (pending.has(message.id)) {
    const {resolve, reject} = pending.get(message.id)
    pending.delete(message.id)
    message.error ? reject(message.error) : resolve(message.result)
  }
})
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const current = ++id
    pending.set(current, {resolve, reject})
    ws.send(JSON.stringify({id: current, method, params}))
  })
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true})
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
async function waitFor(expression) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) return
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Timed out: ${expression}`)
}
async function settle() {
  await evaluate('document.fonts.ready')
  await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
}
async function snapshot(name, fullPage = false) {
  // Explicit width includes the viewport's scrollbar gutter in full-sheet review images.
  const clip = fullPage ? await evaluate('({x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1})') : undefined
  const result = await call('Page.captureScreenshot', {format: 'png', captureBeyondViewport: fullPage, clip})
  const bytes = Buffer.from(result.data, 'base64')
  writeFileSync(`${output}/${name}.png`, bytes)
  return bytes
}

try {
  await call('Page.enable')
  await call('Page.addScriptToEvaluateOnNewDocument', {source: `const RealDate=Date;window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[1791806400000]))}static now(){return 1791806400000}};window.walletRequests=[];window.ethereum={isMetaMask:true,on(){},removeListener(){},request:async({method})=>{window.walletRequests.push(method);if(method==='eth_chainId')return '0x8f';if(method==='eth_accounts')return [];throw new Error('Unexpected wallet request: '+method)}}`})
  await call('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]})
  await call('Page.navigate', {url: previewUrl})
  await waitFor("!!document.querySelector('.landing-primary')")
  const reports = []
  for (const [width, height] of [[1440,900], [1920,1080], [1024,768], [390,844], [360,800], [320,740]]) {
    await call('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false})
    await call('Page.navigate', {url: previewUrl})
    await waitFor("!!document.querySelector('.landing-primary')")
    await evaluate('scrollTo(0,0)')
    await settle()
    await waitFor("[...document.querySelectorAll('.cinematic-landing img')].every(i=>i.complete && i.naturalWidth > 0)")
    const homeBefore = await snapshot(`home-${width}`)
    if (baseline) assert.ok(homeBefore.equals(readFileSync(`${baseline}/home-${width}.png`)), `Milestone 11.2 Home changed at ${width}`)
    // Optional comparison against the approved Task 10.2 review artifacts.
    if (process.env.CHOG_COMPARE_APPROVED === '1') assert.ok(homeBefore.equals(readFileSync(`/tmp/chog-task102/after-home-${width}.png`)), `Approved Home changed at ${width}`)
    await evaluate("[...document.querySelectorAll('nav button')].find(b=>b.textContent==='character').click()")
    await waitFor("!!document.querySelector('.survivor-profile')")
    await settle()
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `Profile overflow at ${width}`)
    assert.equal(await evaluate("document.querySelector('.survivor-control').textContent.includes('Wallet disconnected')"), true)
    assert.equal(await evaluate("document.querySelector('.survivor-progress').textContent.includes('no approved game deployment')"), true)
    assert.equal(await evaluate("document.querySelector('.survivor-history').querySelector('ol,ul,time') === null"), true)
    assert.equal(await evaluate("document.querySelector('.survivor-stats').textContent.includes('184')"), false)
    assert.equal(await evaluate("document.querySelector('.survivor-portrait img') === null"), true)
    assert.equal(await evaluate("document.querySelectorAll('.survivor-achievements li').length"), 8)
    assert.equal(await evaluate("document.querySelector('.survivor-profile meter') === null"), true)
    const clipped = await evaluate("[...document.querySelectorAll('nav button,.survivor-entry input,.survivor-entry button,.survivor-retry')].filter(e=>{const r=e.getBoundingClientRect();return r.x < 0 || r.right > innerWidth || (!e.matches('input') && e.scrollWidth > e.clientWidth)}).map(e=>({text:e.textContent,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}))")
    assert.deepEqual(clipped, [], `Clipped profile controls at ${width}: ${JSON.stringify(clipped)}`)
    // Review screenshots show the ordinary unavailable profile, before the boundary-input check.
    await snapshot(`character-${width}`)
    await snapshot(`character-full-${width}`, true)
    await evaluate("document.querySelector('#token-id').focus();document.querySelector('#token-id').select()")
    assert.equal(await evaluate("document.activeElement.id === 'token-id'"), true)
    await call('Input.insertText', {text: ((1n << 256n) - 1n).toString()})
    assert.equal(await evaluate("document.querySelector('.survivor-entry button').disabled"), false)
    await evaluate("document.querySelector('.survivor-entry button').click()")
    await waitFor("document.querySelector('.survivor-requested')?.textContent.includes('115792089')")
    await settle()
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `Long token overflow at ${width}`)
    await snapshot(`character-max-${width}`)
    await evaluate("[...document.querySelectorAll('nav button')].find(b=>b.textContent==='Home').click()")
    await waitFor("!!document.querySelector('.landing-primary')")
    await settle()
    assert.ok((await snapshot(`home-return-${width}`)).equals(homeBefore), `Home changed after Profile at ${width}`)
    await evaluate("document.querySelector('.landing-primary').click()")
    await waitFor("!!document.querySelector('.adventure-game')")
    await settle()
    assert.equal(await evaluate("document.querySelector('.adventure-chain-action').disabled"), true)
    assert.equal(await evaluate("document.querySelector('.adventure-stat-disclosure').textContent"), 'DEMO STATS — NOT SAVED')
    const adventureShot = await snapshot(`adventure-${width}`)
    if (baseline) assert.ok(adventureShot.equals(readFileSync(`${baseline}/adventure-${width}.png`)), `Milestone 11.2 Adventure changed at ${width}`)
    await evaluate("document.querySelector('.adventure-home').click()")
    await waitFor("!!document.querySelector('.landing-primary')")
    reports.push({width, height, overflow: false, clippedControls: false, historyFabricated: false, homePreserved: true})
  }
  const walletRequests = await evaluate('window.walletRequests')
  assert.equal(walletRequests.some((method) => /sign|sendTransaction|sendRawTransaction/i.test(method)), false)
  console.log(JSON.stringify({reports, walletRequests, output}, null, 2))
} finally {
  ws.close()
}

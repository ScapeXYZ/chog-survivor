import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const phase = process.env.CHOG_REVIEW_PHASE ?? 'smoke'
assert.ok(['before', 'after', 'smoke'].includes(phase))
const output = '/tmp/chog-task102'
mkdirSync(output, {recursive: true})
const tabs = await (await fetch('http://127.0.0.1:9222/json')).json()
const ws = new WebSocket(tabs[0].webSocketDebuggerUrl)
await new Promise(resolve => ws.addEventListener('open', resolve, {once: true}))
let id = 0
const pending = new Map()
ws.addEventListener('message', ({data}) => {
  const message = JSON.parse(data)
  if (pending.has(message.id)) { const {resolve, reject} = pending.get(message.id); pending.delete(message.id); message.error ? reject(message.error) : resolve(message.result) }
})
function call(method, params = {}) { return new Promise((resolve, reject) => { const current = ++id; pending.set(current, {resolve, reject}); ws.send(JSON.stringify({id: current, method, params})) }) }
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true})
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
async function waitFor(expression) { for (let attempt = 0; attempt < 100; attempt++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 100)) } throw new Error(`Timed out: ${expression}`) }
await call('Page.enable')
await call('Page.bringToFront')
// Freeze the existing Home UTC clock and disable motion only in this test browser.
await call('Page.addScriptToEvaluateOnNewDocument', {source: `const RealDate=Date;window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[1791806400000]))}static now(){return 1791806400000}}`})
await call('Page.addScriptToEvaluateOnNewDocument', {source: `window.walletRequests=[];window.ethereum={isMetaMask:true,on(){},removeListener(){},request:async({method})=>{window.walletRequests.push(method);if(method==='eth_chainId')return '0x8f';if(method==='eth_accounts')return [];throw new Error('Unexpected wallet request: '+method)}}`})
await call('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]})
await call('Page.navigate', {url: 'http://127.0.0.1:5173/'})
await waitFor("!!document.querySelector('.landing-primary')")
await evaluate('document.fonts.ready')
const reports = []
for (const [width, height] of [[1440,900],[1920,1080],[1024,768],[390,844],[360,800],[320,740]]) {
  await call('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false})
  await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  await evaluate('scrollTo(0,0)')
  await waitFor("[...document.querySelectorAll('.cinematic-landing img')].every(i=>i.complete && i.naturalWidth > 0)")
  const homeShot = await call('Page.captureScreenshot', {format: 'png'})
  const homeBytes = Buffer.from(homeShot.data, 'base64')
  writeFileSync(`${output}/${phase}-home-${width}.png`, homeBytes)
  if (phase === 'after') assert.ok(homeBytes.equals(readFileSync(`${output}/before-home-${width}.png`)), `Home screenshot differs from Task 10.1 at ${width}`)
  const homeBefore = await evaluate(`JSON.stringify([...document.querySelectorAll('.cinematic-landing, .landing-copy, .landing-brand, .landing-kicker, .landing-copy h1, .landing-tagline, .landing-actions, .landing-primary, .landing-wallet, .landing-disclosure')].map(e=>({tag:e.tagName,cls:e.className,css:getComputedStyle(e).cssText,rect:[e.getBoundingClientRect().x,e.getBoundingClientRect().y,e.getBoundingClientRect().width,e.getBoundingClientRect().height],font:getComputedStyle(e).fontFamily,color:getComputedStyle(e).color})))`)
  await evaluate("document.querySelector('.landing-primary').click()")
  await waitFor("!!document.querySelector('.adventure-choice')")
  await evaluate('document.fonts.ready')
  // A screenshot forces a settled paint before measuring navigation and controls.
  const stage = await call('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true})
  writeFileSync(`${output}/${phase}-adventure-${width}.png`, Buffer.from(stage.data, 'base64'))
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `Adventure overflow at ${width}`)
  assert.equal(await evaluate("document.querySelectorAll('.adventure-choice').length"), 3)
  assert.equal(await evaluate("[...document.querySelectorAll('.adventure-choice')].every(e=>e.getBoundingClientRect().height >= 44)"), true)
  if (phase !== 'before') {
    assert.equal(await evaluate("[...document.querySelectorAll('.game-header nav button, .adventure-choice')].every(e=>{const r=e.getBoundingClientRect();return r.x >= 0 && r.right <= innerWidth && e.scrollWidth <= e.clientWidth})"), true, `Clipped controls at ${width}`)
    assert.equal(await evaluate("document.querySelector('.adventure-stat-disclosure').textContent"), 'DEMO STATS — NOT SAVED')
  }
  assert.equal(await evaluate("document.fonts.check('20px \"Chog Adventure Display\"')"), true)
  await evaluate("document.querySelector('.adventure-choice').focus()")
  await call('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13})
  await call('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13})
  await waitFor("!!document.querySelector('dialog[open]')")
  assert.equal(await evaluate(phase === 'before' ? "document.activeElement.matches('.adventure-return-choice')" : "document.activeElement.matches('.mini-game-panel button')"), true)
  await call('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9})
  await call('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9})
  assert.equal(await evaluate("document.activeElement === document.body || !!document.activeElement.closest('dialog')"), true)
  const bounds = await evaluate("(()=>{const r=document.querySelector('dialog').getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}})()")
  assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.right <= width && bounds.bottom <= height, `Dialog viewport fit ${width}`)
  const modal = await call('Page.captureScreenshot', {format: 'png'})
  writeFileSync(`${output}/${phase}-result-${width}.png`, Buffer.from(modal.data, 'base64'))
  await evaluate("document.querySelector('.adventure-home').focus()")
  assert.equal(await evaluate("document.activeElement.matches('.adventure-home')"), false, 'Background must be inert')
  await call('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27})
  await call('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27})
  await waitFor("!document.querySelector('dialog')")
  assert.equal(await evaluate("document.activeElement.matches('.adventure-choice')"), true)
  if (phase !== 'before') {
    for (let index = 0; index < 3; index++) {
      const choice = await evaluate(`(()=>{const e=document.querySelectorAll('.adventure-choice')[${index}];e.focus();return {label:e.querySelector('strong').textContent,category:e.querySelector('.adventure-choice-category').textContent}})()`)
      await call('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13})
      await call('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13})
      await waitFor("!!document.querySelector('dialog[open]')")
      assert.equal(await evaluate("document.querySelector('dialog h2').textContent"), choice.label)
      assert.equal(await evaluate(`document.querySelector('dialog').classList.contains('adventure-result-${choice.category}')`), true)
      assert.equal(await evaluate("document.activeElement.matches('.mini-game-panel button')"), true)
      await evaluate("[...document.querySelectorAll('.mini-game-panel button')].find(button => button.textContent === 'Skip interaction').click()")
      await waitFor("!document.querySelector('.mini-game-panel')")
      assert.equal(await evaluate("document.activeElement.matches('.adventure-return-choice')"), true)
      const popup = await evaluate("(()=>{const e=document.querySelector('dialog');const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:e.scrollWidth > e.clientWidth}})()")
      assert.ok(popup.x >= 0 && popup.y >= 0 && popup.right <= width && popup.bottom <= height && !popup.overflow, `Result ${choice.category} must fit at ${width}`)
      const variation = await call('Page.captureScreenshot', {format: 'png'})
      writeFileSync(`${output}/${phase}-result-${width}-${choice.category}.png`, Buffer.from(variation.data, 'base64'))
      await evaluate("document.querySelector('.adventure-return-choice').click()")
      await waitFor("!document.querySelector('dialog')")
      assert.equal(await evaluate(`document.activeElement === document.querySelectorAll('.adventure-choice')[${index}]`), true)
    }
  }
  await evaluate("document.querySelector('.adventure-home').click()")
  await waitFor("!!document.querySelector('.landing-primary') && getComputedStyle(document.querySelector('main')).padding === '0px'")
  await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  await call('Page.captureScreenshot', {format: 'png'})
  const homeAfter = await evaluate(`JSON.stringify([...document.querySelectorAll('.cinematic-landing, .landing-copy, .landing-brand, .landing-kicker, .landing-copy h1, .landing-tagline, .landing-actions, .landing-primary, .landing-wallet, .landing-disclosure')].map(e=>({tag:e.tagName,cls:e.className,css:getComputedStyle(e).cssText,rect:[e.getBoundingClientRect().x,e.getBoundingClientRect().y,e.getBoundingClientRect().width,e.getBoundingClientRect().height],font:getComputedStyle(e).fontFamily,color:getComputedStyle(e).color})))`)
  assert.equal(homeAfter, homeBefore, 'Home must retain layout, colors, and fonts')
  reports.push({width,height,overflow:false,modalFits:true,focusRestored:true,homePreserved:true, ...(phase !== 'before' ? {resultThemes: 3} : {}), ...(phase === 'after' ? {homeScreenshotIdentical: true} : {})})
}
assert.equal(await evaluate("window.walletRequests.some(m=>/sign|sendTransaction|sendRawTransaction/i.test(m))"), false)
console.log(JSON.stringify({reports,walletRequests:await evaluate('window.walletRequests')},null,2))
ws.close()

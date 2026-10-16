// Read-only production/live demo checks. Blocks RPC, wallet prompts and transactions.
import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium} from 'playwright'
const live = process.argv.includes('--live')
const record = process.argv.includes('--record')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const origin = live ? 'https://chog-survivor.vercel.app' : 'http://127.0.0.1:5193'
const output = process.env.CHOG_CAPTURE_DIR || '/tmp/chog-5a-capture'
const checks = [], errors = [], blocked = [], assets = []
const check = (name, value) => { assert.ok(value, name); checks.push(name) }
let server, browser
try {
  await fs.mkdir(output, {recursive: true})
  if (!live) {
    server = http.createServer(async (req, res) => {
      try {
        const target = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])))
        if (!target.startsWith(root + '/')) throw Error('Invalid path')
        res.setHeader('Content-Type', {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.ttf': 'font/ttf'}[path.extname(target)] || 'application/octet-stream')
        res.end(await fs.readFile(target))
      } catch { res.writeHead(404); res.end('Not found') }
    })
    await new Promise(resolve => server.listen(5193, '127.0.0.1', resolve))
  }
  browser = await chromium.launch({headless: true})
  for (const scenario of [{width: 1440, height: 1000, motion: 'no-preference'}, {width: 375, height: 812, motion: 'reduce'}]) {
    const context = await browser.newContext({viewport: {width: scenario.width, height: scenario.height}, reducedMotion: scenario.motion, serviceWorkers: 'block', ...(record ? {recordVideo: {dir: output, size: {width: scenario.width, height: scenario.height}}} : {})})
    await context.addInitScript(() => {
      window.__unexpectedWalletRequests = []
      window.ethereum = {isMetaMask: true, on() {}, removeListener() {}, async request({method}) {
        if (method === 'eth_accounts') return []
        if (method === 'eth_chainId') return '0x8f'
        if (method === 'wallet_getPermissions') return []
        window.__unexpectedWalletRequests.push(method)
        throw Error('Wallet access blocked in recording audit')
      }}
    })
    await context.route('**/*', route => {
      const req = route.request(), url = new URL(req.url())
      if (req.method() === 'GET' && (url.origin === origin || ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(url.origin))) return route.continue()
      blocked.push({url: url.origin + url.pathname, method: req.method()})
      return route.abort()
    })
    const page = await context.newPage()
    page.on('pageerror', e => errors.push(e.message))
    page.on('response', r => { if (r.request().resourceType() === 'script') assets.push(r.url()); if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`) })
    await page.goto(origin)
    await page.getByRole('heading', {name: /SURVIVE/}).waitFor()
    await page.evaluate(() => document.fonts.load('600 16px Cinzel'))
    check(`${scenario.width}: existing remote home font loads`, await page.evaluate(() => document.fonts.check('600 16px Cinzel')))
    check(`${scenario.width}: no wallet connected`, await page.getByRole('button', {name: /disconnect/i}).count() === 0)
    check(`${scenario.width}: home demo disclosure`, await page.locator('.landing-disclosure').innerText().then(t => /LOCAL DEMO/.test(t)))
    await page.screenshot({path: path.join(output, `${live ? 'live' : 'local'}-home-${scenario.width}.png`)})
    if (record) await page.waitForTimeout(4000)
    check(`${scenario.width}: fog animation respects motion preference`, await page.locator('.fog-front').evaluate((el, motion) => motion === 'reduce' ? getComputedStyle(el).animationName === 'none' || parseFloat(getComputedStyle(el).animationDuration) <= .01 : getComputedStyle(el).animationName !== 'none', scenario.motion))
    for (const name of ['Adventure', 'Character', 'Settings', 'Home']) {
      await page.getByRole('navigation').getByRole('button', {name: new RegExp(`^${name}$`, 'i')}).click()
      check(`${scenario.width}: ${name} fits`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      check(`${scenario.width}: ${name} artwork loads`, await page.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)))
    }
    await page.getByRole('button', {name: /ENTER THE WILD/}).click()
    await page.evaluate(() => document.fonts.ready)
    check(`${scenario.width}: bundled display font loads`, await page.evaluate(() => document.fonts.check('16px "Chog Adventure Display"')))
    const types = []
    for (let index = 0; index < 3; index++) {
      await page.locator('.adventure-choice').nth(index).click()
      const panel = page.locator('.mini-game-panel')
      const title = await panel.locator('h3').innerText(); types.push(title)
      if (record) await page.waitForTimeout(2000)
      if (title.includes('Trial')) {
        await page.getByLabel('Difficulty').selectOption('easy')
        for (const row of [2, 3, 4]) await page.getByRole('button', {name: new RegExp(`^Row ${row}, path 2,`)}).click()
      } else if (title === 'Timing') {
        if (scenario.motion === 'reduce') await page.getByRole('button', {name: 'I am ready', exact: true}).click()
        else {
          await page.getByRole('button', {name: 'Start', exact: true}).click()
          await page.waitForFunction(() => Number(document.querySelector('[aria-label="Readiness indicator"]')?.getAttribute('aria-valuenow')) >= 40)
          await page.getByRole('button', {name: 'Stop', exact: true}).click()
        }
      } else await page.getByRole('group', {name: 'Choose a response'}).getByRole('button').first().click()
      await page.getByRole('button', {name: 'Continue', exact: true}).click()
      check(`${scenario.width}: ${title} ends in simulation`, await page.getByText(/Simulation only\. These are documented base values/).isVisible())
      await page.screenshot({path: path.join(output, `${live ? 'live' : 'local'}-preview-${scenario.width}-${index}.png`)})
      if (record) await page.waitForTimeout(2000)
      await page.keyboard.press('Escape')
    }
    check(`${scenario.width}: all three interaction types`, types.length === 3 && new Set(types).size === 3)
    check(`${scenario.width}: no automatic wallet permissions or signing`, await page.evaluate(() => window.__unexpectedWalletRequests.length === 0))
    await context.close()
  }
  check('no unexpected external/RPC requests', blocked.length === 0)
  check('no browser errors or missing responses', errors.length === 0)
  console.log(JSON.stringify({origin, passed: checks.length, checks, errors, blocked, assets: [...new Set(assets)], recording: record, output, note: 'Walletless simulations only. No real wallet, transaction or Anvil access.'}, null, 2))
} finally {
  await browser?.close()
  if (server) await new Promise(resolve => server.close(resolve))
}

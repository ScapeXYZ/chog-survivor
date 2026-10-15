// Mock providers and intercepted RPC only; never signs or submits a transaction.
import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium} from 'playwright'
import {encodeAbiParameters, parseAbiParameters} from 'viem'

const live = process.argv.includes('--live')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const origin = live ? 'https://chog-survivor.vercel.app' : 'http://127.0.0.1:5191'
const account = '0x1111111111111111111111111111111111111111'
const nft = '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763'
const checks = [], errors = [], rpc = []
const check = (name, value) => { assert.ok(value, name); checks.push(name) }
let server, browser
try {
  if (!live) {
    server = http.createServer(async (req, res) => {
      try {
        const target = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])))
        if (!target.startsWith(root + '/')) throw Error('Invalid path')
        const data = await fs.readFile(target)
        res.setHeader('Content-Type', {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.ttf': 'font/ttf'}[path.extname(target)] || 'application/octet-stream')
        res.end(data)
      } catch { res.writeHead(404); res.end('Not found') }
    })
    await new Promise(resolve => server.listen(5191, '127.0.0.1', resolve))
  }
  browser = await chromium.launch({headless: true})
  for (const scenario of [{name: 'header', button: 0, chain: 143}, {name: 'hero', button: 1, chain: 143}, {name: 'wrong-chain', button: 0, chain: 1}, {name: 'rejected', button: 1, chain: 143, reject: true}]) {
    const context = await browser.newContext({reducedMotion: 'reduce', serviceWorkers: 'block'})
    await context.addInitScript(({account, chain, reject}) => {
      window.__walletAudit = {intent: false, requests: [], authorized: false}
      const state = window.__walletAudit
      window.ethereum = {isMetaMask: true, on() {}, removeListener() {},
        async request({method, params}) {
          state.requests.push({method, params, intent: state.intent})
          if (method === 'eth_chainId') return '0x' + chain.toString(16)
          if (method === 'eth_accounts') return state.authorized ? [account] : []
          if (method === 'wallet_getPermissions') return []
          if (method === 'wallet_requestPermissions' || method === 'eth_requestAccounts') {
            if (!state.intent || reject) throw Object.assign(new Error('User rejected request'), {code: 4001})
            state.authorized = true
            return method === 'eth_requestAccounts' ? [account] : [{parentCapability: 'eth_accounts', caveats: [{type: 'restrictReturnedAccounts', value: [account]}]}]
          }
          if (method === 'wallet_revokePermissions') { state.authorized = false; return null }
          throw Error('Unexpected provider request: ' + method)
        },
      }
    }, {account, chain: scenario.chain, reject: scenario.reject})
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url())
      if (url.origin === origin) return route.continue()
      if (url.origin === 'https://rpc.monad.xyz' && request.method() === 'POST') {
        const payload = request.postDataJSON()
        const answer = item => {
          rpc.push({method: item.method, to: item.params?.[0]?.to, selector: item.params?.[0]?.data?.slice(0, 10)})
          let result
          if (item.method === 'eth_chainId') result = '0x8f'
          if (item.method === 'eth_blockNumber') result = '0x100'
          if (item.method === 'eth_getLogs') result = []
          if (item.method === 'eth_call' && item.params?.[0]?.to?.toLowerCase() === nft) {
            const selector = item.params[0].data.slice(0, 10)
            if (selector === '0x6352211e') result = encodeAbiParameters(parseAbiParameters('address'), [account])
            if (selector === '0x70a08231') result = encodeAbiParameters(parseAbiParameters('uint256'), [0n])
            if (selector === '0x01ffc9a7') result = encodeAbiParameters(parseAbiParameters('bool'), [false])
          }
          return result === undefined ? {jsonrpc: '2.0', id: item.id, error: {code: -32000, message: 'Unavailable audit fixture'}} : {jsonrpc: '2.0', id: item.id, result}
        }
        return route.fulfill({contentType: 'application/json', body: JSON.stringify(Array.isArray(payload) ? payload.map(answer) : answer(payload))})
      }
      return route.abort()
    })
    const page = await context.newPage()
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(origin + '/')
    await page.getByRole('heading', {name: /SURVIVE/}).waitFor()
    await page.getByRole('button', {name: /ENTER THE WILD/}).click()
    check(`${scenario.name}: walletless choices enabled with injected wallet`, await page.locator('.adventure-choice:enabled').count() === 3)
    await page.locator('.adventure-choice').first().click()
    await page.getByRole('button', {name: 'Skip interaction'}).click()
    check(`${scenario.name}: preview is explicitly simulated`, await page.getByText(/Simulation only\. These are documented base values/).isVisible())
    await page.keyboard.press('Escape')
    await page.getByRole('navigation').getByRole('button', {name: /^Character$/i}).click()
    await page.getByRole('navigation').getByRole('button', {name: /^Settings$/i}).click()
    const before = await page.evaluate(() => window.__walletAudit.requests)
    check(`${scenario.name}: no unsolicited account permission or signing request`, before.every(r => ['eth_accounts', 'eth_chainId', 'wallet_getPermissions'].includes(r.method)))
    await page.getByRole('navigation').getByRole('button', {name: /^Home$/i}).click()
    await page.evaluate(() => { window.__walletAudit.intent = true })
    await page.getByRole('button', {name: /CONNECT WALLET/i}).nth(scenario.button).click()
    if (scenario.reject) {
      await page.waitForFunction(() => window.__walletAudit.requests.some(r => r.method === 'wallet_requestPermissions' || r.method === 'eth_requestAccounts'))
      check('rejection: no wallet connected', await page.getByRole('button', {name: /DISCONNECT/i}).count() === 0)
    } else {
      await page.getByRole('button', {name: /DISCONNECT/i}).first().waitFor()
      await page.getByRole('navigation').getByRole('button', {name: /^Character$/i}).click()
      if (scenario.chain === 143) {
        await page.getByLabel('Token ID', {exact: true}).fill('1001')
        await page.getByRole('button', {name: 'Check token', exact: true}).click()
        await page.getByText(/You control this survivor/).waitFor()
        check(`${scenario.name}: mocked holder identity verified without enabling game`, await page.getByText(/Progression unavailable — no approved game deployment/).isVisible())
      } else check('wrong network: ownership remains unavailable', await page.getByText(/Wrong network\. Select Monad/).isVisible())
    }
    const requests = await page.evaluate(() => window.__walletAudit.requests)
    check(`${scenario.name}: permissions occur only after explicit click`, requests.filter(r => ['wallet_requestPermissions', 'eth_requestAccounts'].includes(r.method)).every(r => r.intent))
    check(`${scenario.name}: no signing, transaction or network-switch methods`, requests.every(r => ['eth_accounts', 'eth_chainId', 'wallet_getPermissions', 'wallet_requestPermissions', 'eth_requestAccounts', 'wallet_revokePermissions'].includes(r.method)))
    await context.close()
  }
  check('RPC contains reads only', rpc.every(r => ['eth_chainId', 'eth_blockNumber', 'eth_getLogs', 'eth_call'].includes(r.method)))
  check('no uncaught browser errors', errors.length === 0)
  console.log(JSON.stringify({origin, passed: checks.length, failed: 0, checks, errors, rpc, note: 'Injected provider and NFT replies are audit mocks, not genuine ownership or MetaMask verdicts.'}, null, 2))
} finally {
  if (browser) await browser.close()
  if (server) await new Promise(resolve => server.close(resolve))
}

import {mkdir, writeFile} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {chromium} from 'playwright'
import {createPublicClient, createWalletClient, defineChain, http, parseAbi} from 'viem'
import {mnemonicToAccount} from 'viem/accounts'

const RPC = 'http://127.0.0.1:8545', APP = 'http://127.0.0.1:4173', CHAIN_ID = 31338
const FIXTURE = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763'
const GAME = process.env.VITE_LOCAL_CHOG_SURVIVOR_ADDRESS, START_BLOCK = process.env.VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK
const out = new URL('../reports/task12/', import.meta.url)
if (!GAME || !START_BLOCK) throw new Error('Set the verified local game address and deployment block before E2E testing.')
const chain = defineChain({id: CHAIN_ID, name: 'Local Anvil — TEST ONLY', nativeCurrency: {name: 'Local ETH', symbol: 'ETH', decimals: 18}, rpcUrls: {default: {http: [RPC]}}})
const publicClient = createPublicClient({chain, transport: http(RPC)})
const mnemonic = 'test test test test test test test test test test test junk'
const accounts = [mnemonicToAccount(mnemonic, {addressIndex: 0}), mnemonicToAccount(mnemonic, {addressIndex: 1})]
const wallets = new Map(accounts.map(account => [account.address.toLowerCase(), createWalletClient({account, chain, transport: http(RPC)})]))
const nftAbi = parseAbi(['function transferFrom(address from,address to,uint256 tokenId)', 'function ownerOf(uint256 tokenId) view returns (address)'])
const gameAbi = parseAbi(['function characterOf(uint256 tokenId) view returns (uint32 xp,uint8 trust,uint8 scars,uint8 streak,uint8 unmarkedStreak,uint64 lastActionDay,uint8 lastOutcomeId,uint8 eventMask,uint256 achievementMask,bool hasActed)'])
const evidence = {startedAt: new Date().toISOString(), chainId: undefined, game: GAME, deploymentBlock: START_BLOCK, fixture: FIXTURE, transactions: [], checks: [], screenshots: []}
const check = (name, value, detail = '') => { if (!value) throw new Error(`${name}: ${detail || 'failed'}`); evidence.checks.push({name, detail}) }
async function waitForApp() { for (let i = 0; i < 60; i++) { try { if ((await fetch(APP)).ok) return } catch {} await new Promise(resolve => setTimeout(resolve, 250)) } throw new Error('Vite did not start.') }

const vite = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {stdio: 'ignore', detached: true, env: {...process.env, VITE_CHOG_ENV: 'local', VITE_LOCAL_RPC_URL: RPC}})
let browser
try {
  evidence.chainId = await publicClient.getChainId()
  check('isolated chain', evidence.chainId === CHAIN_ID, `received ${evidence.chainId}`)
  check('fixture code installed', (await publicClient.getBytecode({address: FIXTURE})) !== undefined)
  check('frozen game code deployed', (await publicClient.getBytecode({address: GAME})) !== undefined)
  await waitForApp(); browser = await chromium.launch({headless: true})
  const context = await browser.newContext({viewport: {width: 1280, height: 900}})
  let rejectNext = false
  await context.exposeBinding('__walletRequest', async (_, request) => {
    const {method, params = [], account} = request
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') return account ? [account] : []
    if (method === 'eth_chainId') return `0x${CHAIN_ID.toString(16)}`
    if (method === 'wallet_switchEthereumChain') return null
    if (method === 'eth_sendTransaction') {
      if (rejectNext) { rejectNext = false; const error = new Error('User rejected the request'); error.code = 4001; throw error }
      const tx = params[0], wallet = wallets.get(account.toLowerCase())
      if (!wallet || ![GAME.toLowerCase(), FIXTURE.toLowerCase()].includes(tx.to.toLowerCase())) throw new Error('Harness refused a non-local transaction target')
      const hash = await wallet.sendTransaction({to: tx.to, data: tx.data, value: tx.value ? BigInt(tx.value) : undefined})
      evidence.transactions.push({hash, from: account, to: tx.to}); return hash
    }
    return await publicClient.request({method, params})
  })
  await context.addInitScript(({initial}) => {
    const listeners = new Map(); let account = initial
    const emit = (event, value) => [...(listeners.get(event) || [])].forEach(fn => fn(value))
    window.ethereum = {isMetaMask: true, request: ({method, params}) => window.__walletRequest({method, params, account}), on: (event, fn) => { const set = listeners.get(event) || new Set(); set.add(fn); listeners.set(event, set) }, removeListener: (event, fn) => listeners.get(event)?.delete(fn)}
    window.__chogE2E = {setAccount(next) { account = next; emit('accountsChanged', [next]) }, disconnect() { account = undefined; emit('accountsChanged', []) }, wrongChain() { emit('chainChanged', '0x8f') }, correctChain() { emit('chainChanged', '0x7a6a') }}
  }, {initial: accounts[0].address})
  const page = await context.newPage(), consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  await page.goto(APP); await page.getByRole('heading', {name: /survive the wild/i}).waitFor(); await page.locator('.game-header .wallet').click()
  await page.getByRole('button', {name: 'Character'}).click(); await page.getByRole('button', {name: /find my chogs/i}).click(); await page.getByRole('button', {name: 'CHOG #1001'}).click(); await page.getByText(/verified nft identity/i).waitFor()
  check('browser verified token 1001 owner', await page.getByText(accounts[0].address, {exact: true}).isVisible())
  await page.getByRole('button', {name: 'Adventure'}).click(); await page.getByText(/ready for one local contract-backed action/i).waitFor()
  const before = await publicClient.readContract({address: GAME, abi: gameAbi, functionName: 'characterOf', args: [1001n]})
  await page.locator('.adventure-choice').first().click(); await page.getByText(/authoritative contract preview/i).waitFor(); await page.getByRole('button', {name: /confirm local action/i}).click(); await page.getByText(/confirmed on local anvil/i).waitFor({timeout: 20_000})
  const after = await publicClient.readContract({address: GAME, abi: gameAbi, functionName: 'characterOf', args: [1001n]})
  check('browser transaction changed token-bound progression', after[0] !== before[0] || after[1] !== before[1] || after[2] !== before[2]); check('browser sent a real local transaction', evidence.transactions.length === 1)
  await page.getByRole('button', {name: /return to adventure/i}).click(); await page.getByText(/already acted for the current local-chain utc day/i).waitFor(); check('daily lock visible after confirmation', true)
  await page.getByRole('button', {name: 'Character'}).click(); await page.locator('.survivor-history-list li').first().waitFor(); check('confirmed journal entry visible', true)
  const transferHash = await wallets.get(accounts[0].address.toLowerCase()).writeContract({address: FIXTURE, abi: nftAbi, functionName: 'transferFrom', args: [accounts[0].address, accounts[1].address, 1001n]})
  await publicClient.waitForTransactionReceipt({hash: transferHash}); evidence.transactions.push({hash: transferHash, from: accounts[0].address, to: FIXTURE, kind: 'fixture transfer'})
  await page.evaluate(account => window.__chogE2E.setAccount(account), accounts[1].address); await page.getByRole('button', {name: /refresh ownership/i}).click(); await page.getByText(accounts[1].address, {exact: true}).waitFor(); await page.locator('.survivor-history-list li').first().waitFor()
  const transferred = await publicClient.readContract({address: GAME, abi: gameAbi, functionName: 'characterOf', args: [1001n]})
  check('transfer retained progression', transferred[0] === after[0] && transferred[1] === after[1] && transferred[2] === after[2]); check('history remained visible after transfer', await page.locator('.survivor-history-list li').count() >= 1)
  await publicClient.request({method: 'evm_increaseTime', params: [86400]}); await publicClient.request({method: 'evm_mine', params: []})
  await page.getByRole('button', {name: 'Adventure'}).click(); await page.getByText(/ready for one local contract-backed action/i).waitFor({timeout: 20_000}); await page.locator('.adventure-choice').nth(1).click(); await page.getByRole('button', {name: /confirm local action/i}).click(); await page.getByText(/confirmed on local anvil/i).waitFor({timeout: 20_000})
  check('new owner acted on next local UTC day', evidence.transactions.filter(tx => tx.to.toLowerCase() === GAME.toLowerCase()).length === 2)
  await page.getByRole('button', {name: /return to adventure/i}).click(); await page.getByRole('button', {name: 'Character'}).click(); await page.locator('.survivor-history-list li').nth(1).waitFor(); check('journal contains both owner eras', await page.locator('.survivor-history-list li').count() >= 2)
  const screens = ['Home', 'Adventure', 'Character', 'Settings'], widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920]
  await mkdir(new URL('./screenshots/', out), {recursive: true})
  for (const screen of screens) for (const width of widths) { await page.setViewportSize({width, height: width < 700 ? 844 : 1000}); await page.locator('.game-header nav button', {hasText: new RegExp(`^${screen}$`, 'i')}).click(); await page.waitForTimeout(150); const name = `${screen.toLowerCase()}-${width}.png`; await page.screenshot({path: fileURLToPath(new URL(`./screenshots/${name}`, out)), fullPage: true}); evidence.screenshots.push(name); check(`${screen} ${width}px has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)) }
  evidence.consoleErrors = consoleErrors.filter(message => !message.includes('favicon')); check('no browser console errors', evidence.consoleErrors.length === 0, evidence.consoleErrors.join('; '))
  evidence.completedAt = new Date().toISOString(); evidence.status = 'passed'; await context.close()
} catch (error) { evidence.status = 'failed'; evidence.error = error instanceof Error ? error.stack : String(error); throw error }
finally { await mkdir(out, {recursive: true}); await writeFile(new URL('./evidence.json', out), JSON.stringify(evidence, null, 2)); if (browser) await browser.close(); try { process.kill(-vite.pid, 'SIGTERM') } catch {} }

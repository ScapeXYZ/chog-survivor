import assert from 'node:assert/strict'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {createPublicClient, decodeEventLog, decodeFunctionData, http} from 'viem'

// Default is read-only. The execution flag must only be used after the user
// approves the two transactions documented in the preparation report.
const execute = process.argv.includes('--execute-approved-2006')
assert.ok(process.argv.slice(2).every(arg => arg === '--execute-approved-2006'), 'Unknown option')
const root = new URL('../../', import.meta.url)
const config = Object.fromEntries((await readFile(new URL('frontend/.env.local', root), 'utf8')).trim().split('\n').map(line => line.split('=')))
const RPC = 'http://127.0.0.1:8545', GAME = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
const NFT = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763', TOKEN = 2006n, CHOICE = 1
const A = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', B = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
assert.equal(config.VITE_CHOG_ENV, 'local'); assert.equal(config.VITE_LOCAL_RPC_URL, RPC)
assert.equal(config.VITE_LOCAL_CHOG_SURVIVOR_ADDRESS.toLowerCase(), GAME.toLowerCase())
const gameArtifact = JSON.parse(await readFile(new URL('out/ChogSurvivor.sol/ChogSurvivor.json', root), 'utf8'))
const nftArtifact = JSON.parse(await readFile(new URL('out/LocalCanonicalTestNFT.sol/LocalCanonicalTestNFT.json', root), 'utf8'))
const client = createPublicClient({transport: http(RPC)})
const read = (functionName, args = [TOKEN]) => client.readContract({address: GAME, abi: gameArtifact.abi, functionName, args})
const owner = () => client.readContract({address: NFT, abi: nftArtifact.abi, functionName: 'ownerOf', args: [TOKEN]})
assert.equal(await client.getChainId(), 31338)
assert.equal((await owner()).toLowerCase(), B.toLowerCase())
assert.equal((await read('CHOG_GENESIS', [])).toLowerCase(), NFT.toLowerCase())
assert.equal((await client.getCode({address: NFT})).toLowerCase(), nftArtifact.deployedBytecode.object.toLowerCase())
let runtime = gameArtifact.deployedBytecode.object.slice(2)
for (const refs of Object.values(gameArtifact.deployedBytecode.immutableReferences ?? {})) for (const {start, length} of refs) runtime = runtime.slice(0, start * 2) + NFT.slice(2).toLowerCase().padStart(length * 2, '0') + runtime.slice((start + length) * 2)
assert.equal((await client.getCode({address: GAME})).toLowerCase(), `0x${runtime}`.toLowerCase())
const accounts = await client.request({method: 'eth_accounts'})
for (const account of [A, B]) assert.ok(accounts.some(value => value.toLowerCase() === account.toLowerCase()))
const before = await read('characterOf'), preview = await read('preview', [TOKEN, CHOICE])
assert.equal(before.hasActed, false, '#2006 has already acted: stop and review')
assert.equal(preview.canAct, true)
const out = '/tmp/chog-task4h'
await mkdir(out, {recursive: true})
const evidence = {mode: execute ? 'approved execution' : 'read-only preparation', rpc: RPC, chainId: 31338, game: GAME, nft: NFT, tokenId: TOKEN, walletA: A, walletB: B, before, preview, checks: [], transactions: []}
const save = () => writeFile(`${out}/evidence.json`, JSON.stringify(evidence, (_, value) => typeof value === 'bigint' ? String(value) : value, 2))
const check = (name, value) => { assert.ok(value, name); evidence.checks.push(name) }
const callErrorName = error => { for (let item = error; item; item = item.cause) if (item.data?.errorName) return item.data.errorName }
async function expectRevert(account, expected) {
  let reason
  try { await client.simulateContract({address: GAME, abi: gameArtifact.abi, functionName: 'act', args: [TOKEN, CHOICE], account}) } catch (error) { reason = callErrorName(error) }
  check(`${account}: eth_call rejects with ${expected}`, reason === expected)
}
let broadcasts = 0, selected = B
async function guardedSend(transaction) {
  assert.ok(execute, 'STOP: execution requires explicit user approval and --execute-approved-2006')
  assert.equal(await client.getChainId(), 31338)
  assert.equal(selected.toLowerCase(), B.toLowerCase())
  assert.equal(transaction.from.toLowerCase(), B.toLowerCase())
  assert.ok(!transaction.value || BigInt(transaction.value) === 0n)
  assert.equal((await owner()).toLowerCase(), B.toLowerCase())
  const isAction = broadcasts === 0
  assert.ok(broadcasts < 2, 'Only the approved action and transfer may be sent')
  const target = isAction ? GAME : NFT
  assert.equal(transaction.to.toLowerCase(), target.toLowerCase())
  const decoded = decodeFunctionData({abi: isAction ? gameArtifact.abi : nftArtifact.abi, data: transaction.data})
  assert.equal(decoded.functionName, isAction ? 'act' : 'transferFrom')
  assert.deepEqual(decoded.args.map(value => typeof value === 'string' ? value.toLowerCase() : value), isAction ? [TOKEN, CHOICE] : [B.toLowerCase(), A.toLowerCase(), TOKEN])
  if (isAction) assert.equal((await read('preview', [TOKEN, CHOICE])).canAct, true)
  else {
    const block = await client.getBlock()
    assert.equal(block.timestamp / 86400n, evidence.resolved.day, 'UTC day changed: stop before transfer')
    const pending = await client.getBlock({blockTag: 'pending'})
    assert.equal(pending.timestamp / 86400n, evidence.resolved.day, 'Pending block is a different UTC day: stop before transfer')
    assert.ok(pending.timestamp % 86400n < 86340n, 'Chain UTC rollover is near: stop before transfer')
  }
  broadcasts++ // Cap retries even if transport outcome becomes ambiguous.
  evidence.broadcastAttempts = broadcasts
  await save()
  const hash = await client.request({method: 'eth_sendTransaction', params: [{...transaction, chainId: '0x7a6a'}]})
  evidence.transactions.push({hash, signer: B, target, method: decoded.functionName, tokenId: TOKEN})
  await save()
  return hash
}
const port = 4196, app = `http://127.0.0.1:${port}`
const vite = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {cwd: new URL('frontend/', root), stdio: 'ignore', detached: true, env: {...process.env, ...config, VITE_CHOG_ENV: 'local'}})
let browser
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(app)).ok) break } catch {}
    if (attempt >= 60) throw new Error('Vite did not start')
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  browser = await chromium.launch({headless: true})
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'})
  await context.exposeBinding('__anvilWallet', async (_, {method, params = []}) => {
    if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [selected]
    if (method === 'wallet_switchEthereumChain') { assert.equal(params[0].chainId.toLowerCase(), '0x7a6a'); return null }
    if (method === 'eth_sendTransaction') return guardedSend(params[0])
    assert.ok(['eth_chainId', 'eth_blockNumber', 'eth_getBlockByNumber', 'eth_getTransactionReceipt', 'eth_getTransactionByHash', 'eth_getTransactionCount', 'eth_call', 'eth_estimateGas', 'eth_gasPrice', 'eth_maxPriorityFeePerGas', 'eth_feeHistory', 'eth_getCode', 'eth_getBalance', 'eth_getLogs', 'web3_clientVersion'].includes(method), `Unexpected wallet RPC: ${method}`)
    return client.request({method, params}) // Every chain response comes from real Anvil.
  })
  await context.addInitScript(() => {
    const listeners = new Map()
    window.ethereum = {isMetaMask: true, request: request => window.__anvilWallet(request), on(event, callback) { if (!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event).add(callback) }, removeListener(event, callback) { listeners.get(event)?.delete(callback) }}
    window.__selectAnvilAccount = account => { for (const callback of listeners.get('accountsChanged') ?? []) callback([account]) }
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(app, {waitUntil: 'domcontentloaded'})
  await page.locator('.game-header .wallet').click()
  await page.getByRole('button', {name: /^character$/i}).click()
  await page.getByLabel('Token ID').fill(String(TOKEN)); await page.getByRole('button', {name: 'Check token', exact: true}).click()
  await page.getByRole('heading', {name: 'CHOG #2006', exact: true}).waitFor()
  await page.getByRole('button', {name: /^adventure$/i}).click()
  const choice = page.locator('.adventure-choice').nth(CHOICE - 1)
  await choice.waitFor(); await choice.click()
  evidence.selectedLabel = await page.locator('dialog h2').textContent()
  await page.getByRole('button', {name: 'Skip interaction', exact: true}).click()
  const confirm = page.getByRole('button', {name: 'CONFIRM LOCAL ACTION', exact: true})
  await confirm.waitFor(); await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(button => button.textContent === 'CONFIRM LOCAL ACTION')?.disabled)
  check('real Wallet B preview ready; no action yet submitted', broadcasts === 0)
  await page.screenshot({path: `${out}/prepared-preview.png`})
  if (!execute) {
    check('preparation is read-only', evidence.transactions.length === 0 && (await owner()).toLowerCase() === B.toLowerCase())
    assert.deepEqual(await read('characterOf'), before)
    console.log('PREPARED: real Anvil browser preview for CHOG #2006; zero transactions submitted.')
  } else {
    await confirm.click()
    await page.getByRole('status', {name: 'Confirmed Chog reaction'}).waitFor({timeout: 30000})
    assert.equal(evidence.transactions.length, 1)
    const receipt = await client.waitForTransactionReceipt({hash: evidence.transactions[0].hash})
    assert.equal(receipt.status, 'success')
    evidence.actionReceipt = receipt
    const logs = receipt.logs.filter(log => log.address.toLowerCase() === GAME.toLowerCase()).map(log => decodeEventLog({abi: gameArtifact.abi, topics: log.topics, data: log.data}))
    const resolved = logs.find(log => log.eventName === 'AdventureResolved' && log.args.tokenId === TOKEN)?.args
    assert.ok(resolved); assert.equal(resolved.owner.toLowerCase(), B.toLowerCase()); assert.equal(resolved.choiceId, CHOICE)
    evidence.resolved = resolved
    const after = await read('characterOf'); evidence.after = after
    for (const key of ['xp', 'trust', 'scars', 'streak', 'unmarkedStreak']) assert.equal(after[key], resolved[`${key}After`])
    assert.equal(after.achievementMask, resolved.achievementMaskAfter); assert.equal(after.lastActionDay, resolved.day)
    const expectedReflection = await page.evaluate(async outcome => (await import('/src/survivorReflection.ts')).survivorReflection(outcome), {eventId: resolved.eventId, choiceId: resolved.choiceId, outcomeId: resolved.outcomeId, xpDelta: resolved.xpDelta, trustDelta: resolved.trustDelta, scarsDelta: resolved.scarsDelta})
    check('reaction follows real receipt outcome', (await page.locator('.confirmed-reflection').textContent()).includes(expectedReflection))
    check('first achievement is backed by a receipt event', logs.some(log => log.eventName === 'AchievementEarned' && log.args.tokenId === TOKEN && log.args.achievementId === 0))
    await page.locator('.confirmed-survivor-reaction').scrollIntoViewIfNeeded(); await page.screenshot({path: `${out}/confirmed-reaction.png`})
    await page.getByRole('button', {name: 'RETURN TO ADVENTURE'}).click()
    check('confirmed daily lock visible for Wallet B', await page.locator('.adventure-choice').evaluateAll(buttons => buttons.every(button => button.disabled)))
    await page.getByRole('button', {name: /^character$/i}).click()
    await page.locator('.journal-reflection').waitFor()
    check('journal uses the real action transaction hash', (await page.locator('.journal-evidence').textContent()).includes(receipt.transactionHash))
    const block = await client.getBlock({blockNumber: receipt.blockNumber})
    check('journal UTC timestamp matches the receipt block', await page.locator('.survivor-history-list time').first().getAttribute('datetime') === new Date(Number(block.timestamp) * 1000).toISOString())
    const {encodeFunctionData} = await import('viem')
    const hash = await guardedSend({from: B, to: NFT, data: encodeFunctionData({abi: nftArtifact.abi, functionName: 'transferFrom', args: [B, A, TOKEN]})})
    const transferReceipt = await client.waitForTransactionReceipt({hash}); assert.equal(transferReceipt.status, 'success')
    evidence.transferReceipt = transferReceipt
    const transferBlock = await client.getBlock({blockNumber: transferReceipt.blockNumber})
    check('transfer executed in the same UTC day as the adventure', transferBlock.timestamp / 86400n === resolved.day)
    check('real Transfer event confirms B to A', transferReceipt.logs.some(log => { if (log.address.toLowerCase() !== NFT.toLowerCase()) return false; const event = decodeEventLog({abi: nftArtifact.abi, topics: log.topics, data: log.data}); return event.eventName === 'Transfer' && event.args.tokenId === TOKEN && event.args.from.toLowerCase() === B.toLowerCase() && event.args.to.toLowerCase() === A.toLowerCase() }))
    assert.equal((await owner()).toLowerCase(), A.toLowerCase()); assert.deepEqual(await read('characterOf'), after)
    check('all progression and achievement fields survive transfer', true)
    selected = A; await page.evaluate(account => window.__selectAnvilAccount(account), A)
    await page.getByRole('button', {name: 'Refresh ownership & profile'}).click()
    await page.locator('.journal-current-owner').getByText(A, {exact: true}).waitFor()
    check('journal retains Wallet B attribution after transfer', (await page.locator('.journal-controller').textContent()).includes(B))
    check('journal retains original action hash after transfer', (await page.locator('.journal-evidence').textContent()).includes(receipt.transactionHash))
    await page.locator('.survivor-history').scrollIntoViewIfNeeded(); await page.screenshot({path: `${out}/inherited-journal.png`})
    check('Wallet A inherits the daily lock', !(await read('preview', [TOKEN, CHOICE])).canAct)
    await expectRevert(A, 'AlreadyActed'); await expectRevert(B, 'NotTokenOwner')
    await page.getByRole('button', {name: /^adventure$/i}).click()
    check('Wallet A sees disabled daily choices', await page.locator('.adventure-choice').evaluateAll(buttons => buttons.every(button => button.disabled)))
    selected = B; await page.evaluate(account => window.__selectAnvilAccount(account), B)
    await page.getByText('CHOG #2006 HAS A NEW OWNER', {exact: true}).waitFor()
    check('Wallet B loses adventure controls', await page.locator('.adventure-choice').evaluateAll(buttons => buttons.every(button => button.disabled)))
    assert.equal(evidence.transactions.length, 2)
    console.log('PASS: real Anvil action, reaction, journal, transfer, retained state, daily lock and revoked old-owner authorization.')
  }
  check('no uncaught browser errors', errors.length === 0)
} catch (error) {
  evidence.failure = error.stack ?? String(error)
  throw error
} finally {
  await save()
  if (browser) await browser.close()
  try { process.kill(-vite.pid, 'SIGTERM') } catch {}
}

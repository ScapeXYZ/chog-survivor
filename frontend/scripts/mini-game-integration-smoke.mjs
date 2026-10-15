import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {writeFile} from 'node:fs/promises'
import {chromium} from 'playwright'
import {decodeFunctionData, encodeAbiParameters, encodeEventTopics, encodeFunctionResult, parseAbi, parseAbiItem} from 'viem'

// Browser fixtures only: intercept every local RPC and wallet request. No node,
// deployment, real wallet or chain state is touched by this smoke check.
const ports = [5187, 5188]
const servers = ports.map((port, index) => spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {stdio: 'ignore', detached: true, env: {...process.env, VITE_CHOG_ENV: index ? 'local' : 'production', VITE_LOCAL_RPC_URL: 'http://127.0.0.1:8545', VITE_LOCAL_CHOG_SURVIVOR_ADDRESS: '0x3333333333333333333333333333333333333333', VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK: '4'}}))
const checks = [], errors = []
function check(name, value) { assert.ok(value, name); checks.push(name) }
async function waitForApp(port) {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) return } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`Vite unavailable on ${port}`)
}
function captureTypography(page, selector) {
  return page.locator(selector).evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element)
    return [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing]
  }))
}
async function assertPanel(page, name) {
  const typography = await page.evaluate(() => {
    const panel = document.querySelector('.mini-game-panel'), dialog = panel.closest('dialog')
    const family = element => getComputedStyle(element).fontFamily
    return {body: family(dialog), text: [...panel.querySelectorAll('p,button,label,select')].every(element => family(element) === family(dialog)), heading: family(panel.querySelector('h3')) === family(dialog.querySelector('h2')), headingWeight: getComputedStyle(panel.querySelector('h3')).fontWeight === getComputedStyle(dialog.querySelector('h2')).fontWeight, loaded: document.fonts.check('16px "Chog Adventure Display"'), fonts: family(panel.querySelector('h3'))}
  })
  check(`${name}: inherited body/button font`, typography.text)
  check(`${name}: existing display heading font and weight`, typography.heading && typography.headingWeight && typography.loaded && typography.fonts.includes('Chog Adventure Display'))
  const bounds = await page.locator('dialog').evaluate(element => {
    const rect = element.getBoundingClientRect()
    return rect.left >= 0 && rect.right <= innerWidth + 1 && rect.top >= 0 && rect.bottom <= innerHeight + 1 && element.scrollWidth <= element.clientWidth
  })
  check(`${name}: dialog fits viewport`, bounds)
  check(`${name}: focus remains in dialog`, await page.evaluate(() => !!document.activeElement.closest('dialog')))
  check(`${name}: minimum touch targets`, await page.locator('.mini-game-panel button').evaluateAll(elements => elements.every(element => element.getBoundingClientRect().height >= 44)))
}
async function completePanel(page, config, keyboard = false) {
  if (config.kind === 'puzzle') {
    const cell = (row, path) => page.getByRole('button', {name: new RegExp(`^Row ${row}, path ${path},`)})
    await page.getByLabel('Difficulty').selectOption('medium')
    await cell(2, 3).click()
    await page.getByRole('status').filter({hasText: 'Hazard!'}).waitFor()
    await page.getByLabel('Difficulty').selectOption('easy')
    for (const row of [2, 3, 4]) {
      const answer = cell(row, 2)
      if (keyboard) { await answer.focus(); await page.keyboard.press(row % 2 ? 'Space' : 'Enter') } else await answer.click()
    }
  } else if (config.kind === 'timing') {
    await page.getByRole('button', {name: 'I am ready'}).click()
  } else await page.getByRole('button', {name: config.responses[1], exact: true}).click()
  const next = page.getByRole('button', {name: 'Continue', exact: true})
  await next.waitFor()
  if (keyboard) { await next.focus(); await page.keyboard.press('Space') } else await next.click()
}
let browser
try {
  await Promise.all(ports.map(waitForApp))
  browser = await chromium.launch({headless: true})
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'})
  // Keep the browser check offline and deterministic. Existing remote font CSS
  // is omitted equally for before/after comparisons; the Adventure TTF is local.
  const offlineFonts = context => context.route('https://fonts.googleapis.com/**', route => route.fulfill({contentType: 'text/css', body: ''}))
  await offlineFonts(context)
  await context.addInitScript(() => {
    window.__realNow = Date.now.bind(Date)
    Date.now = () => 20000 * 86400000
    localStorage.setItem('chog-survivor.audio-preferences', JSON.stringify({musicEnabled: false, effectsEnabled: false, muted: true, masterVolume: .4, musicVolume: .3, effectsVolume: .2}))
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${ports[0]}`, {waitUntil: 'domcontentloaded'})
  await page.getByRole('button', {name: /enter the wild/i}).waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => [...document.querySelectorAll('.cinematic-landing img')].every(image => image.complete && image.naturalWidth > 0))
  const homeFonts = await captureTypography(page, '.landing-copy h1,.landing-brand,.landing-tagline,.landing-primary')
  const homeShot = await page.screenshot()
  await page.getByRole('button', {name: /^character$/i}).click()
  const characterFonts = await captureTypography(page, '.survivor-heading,.survivor-motto,#survivor-profile-title,#history-title')
  await page.getByRole('button', {name: /^settings$/i}).click()
  const settingsFonts = await captureTypography(page, '#settings-title,.settings h3,.settings button')
  await page.getByRole('button', {name: /^adventure$/i}).click()
  const data = await page.evaluate(async () => {
    const {events, demoEventIndex} = await import('/src/game-data.ts')
    const {miniGameData} = await import('/src/mini-game-data.ts')
    return events.map((event, index) => {
      let day = 20000
      while (demoEventIndex(0n, BigInt(day)) !== index) day++
      return {event, day, configs: miniGameData[event.name].choices}
    })
  })
  const hud = await page.getByLabel('Simulated character statistics').textContent()
  for (const {event, day, configs} of data) {
    await page.evaluate(day => { Date.now = () => day * 86400000 }, day)
    await page.getByRole('heading', {level: 1, name: event.name, exact: true}).waitFor()
    for (let index = 0; index < 3; index++) {
      const card = page.locator('.adventure-choice').nth(index)
      await card.focus(); await page.keyboard.press('Enter')
      await page.getByRole('button', {name: 'Skip interaction'}).waitFor()
      await assertPanel(page, `${event.name}/${index + 1}`)
      await completePanel(page, configs[index].interaction, true)
      check(`${event.name}/${index + 1}: unchanged preview choice`, await page.getByRole('dialog', {name: event.choices[index], exact: true}).isVisible())
      await page.getByText('Rulebook base deltas · preview only').waitFor()
      check(`${event.name}/${index + 1}: unchanged demo stats`, await page.getByLabel('Simulated character statistics').textContent() === hud)
      await page.keyboard.press('Escape')
      check(`${event.name}/${index + 1}: Escape restores card focus`, await card.evaluate(element => element === document.activeElement))
    }
  }
  await page.locator('.adventure-choice').first().click()
  await page.getByRole('button', {name: 'Skip interaction'}).focus(); await page.keyboard.press('Space')
  await page.getByText('Rulebook base deltas · preview only').waitFor(); await page.keyboard.press('Escape')
  check('keyboard skip reaches original preview', true)
  await page.locator('.adventure-choice').first().focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Tab')
  check('Tab remains inside modal', await page.evaluate(() => !!document.activeElement.closest('dialog')))
  await page.keyboard.press('Escape')
  await page.emulateMedia({reducedMotion: 'no-preference'})
  const timingIndex = data.at(-1).event.tags.indexOf('reckless')
  await page.locator('.adventure-choice').nth(timingIndex).click()
  await page.evaluate(() => { Date.now = window.__realNow })
  await page.getByRole('button', {name: 'Start', exact: true}).click()
  await page.waitForTimeout(data.at(-1).configs[timingIndex].interaction.durationMs / 2)
  await page.getByRole('button', {name: 'Stop', exact: true}).click()
  await page.getByRole('status').filter({hasText: 'Ready!'}).waitFor()
  await page.emulateMedia({reducedMotion: 'reduce'}); await page.keyboard.press('Escape')
  await page.evaluate(day => { Date.now = () => day * 86400000 }, data.at(-1).day)
  await page.getByRole('heading', {level: 1, name: 'Shadow Beast', exact: true}).waitFor()
  check('moving Timing indicator accepts a center stop', true)
  for (const width of [320, 375, 390, 768, 1440]) {
    await page.setViewportSize({width, height: width < 700 ? 844 : 1000})
    for (let index = 0; index < 3; index++) {
      await page.locator('.adventure-choice').nth(index).click()
      await assertPanel(page, `demo ${width}px/card ${index + 1}`)
      if (index === 0) {
        const cell = (row, path) => page.getByRole('button', {name: new RegExp(`^Row ${row}, path ${path},`)})
        for (const difficulty of ['easy', 'medium', 'hard']) {
          await page.getByLabel('Difficulty').selectOption(difficulty)
          await assertPanel(page, `${difficulty} ${width}px`)
          check(`${difficulty} ${width}px: prominent survivor on map`, await page.locator('.trial-current .trial-chog').evaluate(image => image.getBoundingClientRect().height >= 60 && image.closest('button').getAttribute('aria-label').includes('your Chog')))
          if (width === 1440) check(`${difficulty}: wider trial dialog`, await page.locator('dialog').evaluate(element => element.clientWidth > 560))
          if (['easy', 'hard'].includes(difficulty) && [375, 1440].includes(width)) {
            await page.locator('dialog').evaluate(element => { element.scrollTop = 0 })
            await page.screenshot({path: `/tmp/chog-task4g-initial-${difficulty}-${width}.png`})
          }
          check(`${difficulty} ${width}px: Skip visible`, await page.getByRole('button', {name: 'Skip interaction'}).evaluate(element => { const bounds = element.getBoundingClientRect(); return bounds.top >= 0 && bounds.bottom <= innerHeight }))
          check(`${difficulty} ${width}px: static reduced motion`, await page.locator('.trial-cell, .trial-chog').evaluateAll(cells => cells.every(cell => getComputedStyle(cell).animationName === 'none' && getComputedStyle(cell).transitionDuration === '0s')))
          check(`${difficulty} ${width}px: one map Tab stop`, await page.getByRole('grid').locator('button').evaluateAll(buttons => buttons.filter(button => button.tabIndex === 0).length === 1))
          check(`${difficulty} ${width}px: map has no overflow`, await page.locator('.trial-map').evaluate(element => element.scrollWidth <= element.clientWidth))
          await cell(1, 2).focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Space')
          check(`${difficulty} ${width}px: arrow/Space movement`, await cell(2, 2).getAttribute('aria-current') === 'location')
          if (['easy', 'hard'].includes(difficulty) && [375, 1440].includes(width)) {
            await page.locator('.trial-map').evaluate(element => element.scrollIntoView({block: 'center', behavior: 'instant'}))
            await page.screenshot({path: `/tmp/chog-task4g-playing-${difficulty}-${width}.png`})
          }
          await page.getByRole('button', {name: 'Retry', exact: true}).click()
          if (difficulty !== 'easy') {
            await cell(2, 3).click()
            check(`${difficulty} ${width}px: hazard detected`, (await page.locator('.mini-game-panel').getByRole('status').textContent()).includes('Hazard!'))
          }
          if (difficulty === 'hard') {
            check(`Hard ${width}px: supplies charged`, (await page.getByLabel('Trial progress').textContent()).includes('5/7'))
            for (let hit = 0; hit < 3; hit++) await cell(2, 3).click()
            check(`Hard ${width}px: supplies exhausted`, (await page.locator('.mini-game-panel').getByRole('status').textContent()).includes('Supplies exhausted'))
            check(`Hard ${width}px: no premature Continue`, await page.getByRole('button', {name: 'Continue', exact: true}).count() === 0)
            await page.getByRole('button', {name: 'Retry', exact: true}).click()
          }
          const paths = difficulty === 'easy' ? [2, 2, 2] : [2, 2, 1, 1, 2]
          for (const [stage, path] of paths.entries()) await cell(stage + 2, path).click()
          await page.getByRole('button', {name: 'Continue', exact: true}).waitFor()
          check(`${difficulty} ${width}px: destination reached`, true)
          if (['easy', 'hard'].includes(difficulty) && [375, 1440].includes(width)) {
            await page.locator('.trial-map').evaluate(element => element.scrollIntoView({block: 'center', behavior: 'instant'}))
            await page.screenshot({path: `/tmp/chog-task4g-complete-${difficulty}-${width}.png`})
          }
          await page.getByRole('button', {name: 'Reset', exact: true}).click()
          check(`${difficulty} ${width}px: reset invalidates Continue`, await page.getByRole('button', {name: 'Continue', exact: true}).count() === 0)
          await page.locator('.trial-map').evaluate(element => element.scrollIntoView({block: 'center', behavior: 'instant'}))
          if ([320, 375, 768, 1440].includes(width)) {
            await page.screenshot({path: `/tmp/chog-task4g-${difficulty}-${width}.png`})
            await page.locator('.trial-map').screenshot({path: `/tmp/chog-task4g-map-${difficulty}-${width}.png`})
          }
        }
        await page.getByRole('button', {name: 'Skip interaction'}).click()
        await page.getByText('Rulebook base deltas · preview only').waitFor()
      }
      await page.keyboard.press('Escape')
    }
    check(`Adventure ${width}px: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1))
  }
  await page.setViewportSize({width: 1440, height: 1000})
  await page.emulateMedia({reducedMotion: 'no-preference'})
  await page.locator('.adventure-choice').first().click()
  await page.getByRole('button', {name: /^Row 2, path 2,/}).click()
  check('crossing animation uses the existing Chog avatar', await page.locator('.trial-chog').evaluate(element => getComputedStyle(element).animationName === 'trial-step' && element.src.includes('survivor-creature-refined-provisional.webp')))
  check('walked route follows actual progress', await page.locator('.trial-walked-path').getAttribute('points') === '150,32 150,96')
  await page.emulateMedia({reducedMotion: 'reduce'})
  check('reduced motion immediately disables Chog animation', await page.locator('.trial-chog').evaluate(element => getComputedStyle(element).animationName === 'none'))
  await page.keyboard.press('Escape')
  const touch = await browser.newContext({viewport: {width: 375, height: 844}, hasTouch: true, isMobile: true, reducedMotion: 'reduce'})
  await offlineFonts(touch)
  await touch.addInitScript(day => { Date.now = () => day * 86400000 }, data.at(-1).day)
  const touchPage = await touch.newPage()
  await touchPage.goto(`http://127.0.0.1:${ports[0]}`, {waitUntil: 'domcontentloaded'})
  await touchPage.getByRole('button', {name: /enter the wild/i}).tap(); await touchPage.locator('.adventure-choice').first().tap()
  const touchCell = touchPage.getByRole('button', {name: /^Row 2, path 2,/})
  await touchCell.tap()
  check('touch moves the survivor', await touchCell.getAttribute('aria-current') === 'location')
  for (const row of [3, 4]) await touchPage.getByRole('button', {name: new RegExp(`^Row ${row}, path 2,`)}).tap()
  check('touch reaches safety', await touchPage.getByRole('button', {name: 'Continue', exact: true}).isVisible())
  await touchPage.getByRole('button', {name: 'Retry', exact: true}).tap()
  await touchPage.getByRole('button', {name: 'Skip interaction'}).tap()
  await touchPage.getByText('Rulebook base deltas · preview only').waitFor()
  check('touch card and skip reach preview', true); await touch.close()
  await page.setViewportSize({width: 1440, height: 1000})
  await page.getByRole('button', {name: /^home$/i}).click()
  await page.locator('main.game-shell-lobby').waitFor()
  await page.getByText('24:00:00', {exact: true}).waitFor()
  await page.evaluate(() => { window.scrollTo(0, 0) })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  assert.deepEqual(await captureTypography(page, '.landing-copy h1,.landing-brand,.landing-tagline,.landing-primary'), homeFonts)
  const homeAfter = await page.screenshot()
  await writeFile('/tmp/chog-task4g-home-before.png', homeShot)
  await writeFile('/tmp/chog-task4g-home-after.png', homeAfter)
  if (!homeAfter.equals(homeShot)) console.log(await page.locator('main').evaluate(element => ({className: element.className, padding: getComputedStyle(element).padding, styles: [...document.querySelectorAll('style[data-vite-dev-id]')].map(style => style.getAttribute('data-vite-dev-id'))})))
  check('Home screenshot and typography unchanged', homeAfter.equals(homeShot))
  await page.getByRole('button', {name: /^character$/i}).click()
  assert.deepEqual(await captureTypography(page, '.survivor-heading,.survivor-motto,#survivor-profile-title,#history-title'), characterFonts)
  check('Character typography unchanged', true)
  await page.getByRole('button', {name: /^settings$/i}).click()
  assert.deepEqual(await captureTypography(page, '#settings-title,.settings h3,.settings button'), settingsFonts)
  check('Settings typography unchanged', true)
  check('audio preferences preserved', await page.getByRole('switch', {name: 'Mute All'}).getAttribute('aria-checked') === 'true' && await page.getByRole('slider', {name: 'Master volume'}).inputValue() === '0.4')
  await context.close()

  // Exercise the actual Wagmi local-contract screen using RPC/wallet fixtures.
  const owner = '0x1111111111111111111111111111111111111111', nft = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763', game = '0x3333333333333333333333333333333333333333'
  const abi = parseAbi([
    'function ownerOf(uint256 tokenId) view returns (address)', 'function tokenURI(uint256 tokenId) view returns (string)', 'function CHOG_GENESIS() view returns (address)',
    'function characterOf(uint256 tokenId) view returns ((uint32 xp,uint8 trust,uint8 scars,uint8 streak,uint8 unmarkedStreak,uint64 lastActionDay,uint8 lastOutcomeId,uint8 eventMask,uint256 achievementMask,bool hasActed))',
    'function titleOf(uint256 tokenId) view returns (uint8)', 'function eventFor(uint256 tokenId,uint64 day) view returns (uint8)',
    'function preview(uint256 tokenId,uint8 choiceId) view returns ((uint64 day,uint8 eventId,uint8 choiceId,uint8 outcomeId,int32 xpDelta,int16 trustDelta,int16 scarsDelta,uint32 xpAfter,uint8 trustAfter,uint8 scarsAfter,uint8 streakAfter,uint8 unmarkedStreakAfter,uint256 newlyEarnedAchievementMask,uint256 achievementMaskAfter,uint8 titleId,bool canAct))',
    'function act(uint256 tokenId,uint8 choiceId)',
  ])
  const resolved = parseAbiItem('event AdventureResolved(uint256 indexed tokenId,address indexed owner,uint64 indexed day,uint8 eventId,uint8 choiceId,uint8 outcomeId,int32 xpDelta,int16 trustDelta,int16 scarsDelta,uint32 xpAfter,uint8 trustAfter,uint8 scarsAfter,uint8 streakAfter,uint8 unmarkedStreakAfter,uint256 achievementMaskAfter)')
  const earnedEvent = parseAbiItem('event AchievementEarned(uint256 indexed tokenId,uint8 indexed achievementId,uint64 indexed day)')
  let acted = false, rejectNext = true, sentChoice = 1, currentOwner = owner
  const writes = []
  const blockHash = `0x${'b'.repeat(64)}`, txHash = `0x${'a'.repeat(64)}`
  const block = {number: '0xa', hash: blockHash, parentHash: `0x${'0'.repeat(64)}`, nonce: '0x0000000000000000', sha3Uncles: blockHash, logsBloom: `0x${'0'.repeat(512)}`, transactionsRoot: blockHash, stateRoot: blockHash, receiptsRoot: blockHash, miner: owner, difficulty: '0x0', totalDifficulty: '0x0', extraData: '0x', size: '0x1', gasLimit: '0x1c9c380', gasUsed: '0x0', timestamp: `0x${(100n * 86400n).toString(16)}`, baseFeePerGas: '0x1', transactions: [], uncles: []}
  function verifiedFixtureLogs() {
    const topics = encodeEventTopics({abi: [resolved], eventName: 'AdventureResolved', args: {tokenId: 1001n, owner, day: 101n}})
    const data = encodeAbiParameters(resolved.inputs.filter(input => !input.indexed), [2, sentChoice, 3 + sentChoice, 99, 5, 0, 99, 5, 0, 1, 1, 1n])
    const common = {address: game, blockNumber: '0xb', transactionHash: txHash, transactionIndex: '0x0', blockHash, removed: false}
    return [{...common, topics, data, logIndex: '0x0'}, {...common, topics: encodeEventTopics({abi: [earnedEvent], eventName: 'AchievementEarned', args: {tokenId: 1001n, achievementId: 0, day: 101n}}), data: '0x', logIndex: '0x1'}]
  }
  async function rpc({method, params = []}) {
    if (method === 'eth_chainId') return '0x7a6a'
    if (method === 'eth_blockNumber') return acted ? '0xb' : '0xa'
    if (method === 'eth_getBlockByNumber') return params[0] === '0xa' || (!acted && params[0] !== '0xb') ? block : {...block, number: '0xb', timestamp: `0x${(101n * 86400n).toString(16)}`}
    if (method === 'eth_getLogs') {
      const filter = params[0]
      if (!acted || filter.address?.toLowerCase() !== game.toLowerCase()) return []
      return verifiedFixtureLogs().filter(log => log.topics[0] === filter.topics?.[0] && (!filter.topics?.[1] || filter.topics[1] === log.topics[1]))
    }
    if (method === 'eth_getCode') return '0x6000'
    if (method === 'eth_gasPrice' || method === 'eth_maxPriorityFeePerGas') return '0x1'
    if (method === 'eth_estimateGas') return '0x186a0'
    if (method === 'eth_getTransactionCount') return '0x0'
    if (method === 'eth_call') {
      const {functionName, args} = decodeFunctionData({abi, data: params[0].data})
      let result
      if (functionName === 'ownerOf') result = currentOwner
      else if (functionName === 'tokenURI') result = 'data:application/json,%7B%22name%22%3A%22Browser%20fixture%22%7D'
      else if (functionName === 'CHOG_GENESIS') result = nft
      else if (functionName === 'titleOf') result = 0
      else if (functionName === 'eventFor') result = Number(args[1]) === 101 ? 2 : 1
      else if (functionName === 'characterOf') result = {xp: acted ? 99 : 0, trust: acted ? 5 : 0, scars: 0, streak: acted ? 1 : 0, unmarkedStreak: acted ? 1 : 0, lastActionDay: 101n, lastOutcomeId: 3 + sentChoice, eventMask: acted ? 2 : 0, achievementMask: acted ? 1n : 0n, hasActed: acted}
      else if (functionName === 'preview') result = {day: acted && params[1] !== '0xa' ? 101n : 100n, eventId: acted && params[1] !== '0xa' ? 2 : 1, choiceId: Number(args[1]), outcomeId: (acted && params[1] !== '0xa' ? 3 : 0) + Number(args[1]), xpDelta: 12, trustDelta: 5, scarsDelta: 0, xpAfter: 12, trustAfter: 5, scarsAfter: 0, streakAfter: 1, unmarkedStreakAfter: 1, newlyEarnedAchievementMask: 1n, achievementMaskAfter: 1n, titleId: 0, canAct: !acted}
      else throw new Error(`Unexpected read ${functionName}`)
      return encodeFunctionResult({abi, functionName, result})
    }
    if (method === 'eth_getTransactionReceipt') {
      acted = true
      const topics = encodeEventTopics({abi: [resolved], eventName: 'AdventureResolved', args: {tokenId: 1001n, owner, day: 101n}})
      const data = encodeAbiParameters(resolved.inputs.filter(input => !input.indexed), [2, sentChoice, 3 + sentChoice, 99, 5, 0, 99, 5, 0, 1, 1, 1n])
      return {transactionHash: txHash, transactionIndex: '0x0', blockHash, blockNumber: '0xb', from: owner, to: game, cumulativeGasUsed: '0x186a0', gasUsed: '0x186a0', contractAddress: null, logsBloom: block.logsBloom, status: '0x1', type: '0x2', effectiveGasPrice: '0x1', logs: verifiedFixtureLogs()}
    }
    throw new Error(`Unexpected fixture RPC ${method}`)
  }
  const localContext = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'})
  await offlineFonts(localContext)
  await localContext.route('http://127.0.0.1:8545/**', async route => {
    if (route.request().method() === 'OPTIONS') { await route.fulfill({status: 204, headers: {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS'}}); return }
    const body = route.request().postDataJSON()
    const answer = async item => { try { return {jsonrpc: '2.0', id: item.id, result: await rpc(item)} } catch (error) { errors.push(error.message); return {jsonrpc: '2.0', id: item.id, error: {code: -32000, message: error.message}} } }
    await route.fulfill({headers: {'Access-Control-Allow-Origin': '*'}, json: Array.isArray(body) ? await Promise.all(body.map(answer)) : await answer(body)})
  })
  await localContext.exposeBinding('__fixtureWallet', async (_, request) => {
    if (request.method === 'eth_accounts' || request.method === 'eth_requestAccounts') return [owner]
    if (request.method === 'wallet_switchEthereumChain') return null
    if (request.method === 'eth_sendTransaction') {
      if (rejectNext) { rejectNext = false; throw new Error('User rejected the request') }
      const tx = request.params[0], decoded = decodeFunctionData({abi, data: tx.data})
      assert.equal(tx.to.toLowerCase(), game.toLowerCase()); assert.equal(decoded.functionName, 'act'); assert.equal(decoded.args[0], 1001n)
      sentChoice = Number(decoded.args[1]); writes.push({tokenId: '1001', choiceId: sentChoice}); return txHash
    }
    return rpc(request)
  })
  await localContext.addInitScript(() => {
    window.ethereum = {isMetaMask: true, on() {}, removeListener() {}, request: request => window.__fixtureWallet(request)}
  })
  const local = await localContext.newPage()
  local.on('pageerror', error => errors.push(error.message))
  await local.goto(`http://127.0.0.1:${ports[1]}`, {waitUntil: 'domcontentloaded'})
  await local.locator('.game-header .wallet').click()
  await local.getByRole('button', {name: /^character$/i}).click()
  await local.getByLabel('Token ID').fill('1001'); await local.getByRole('button', {name: 'Check token'}).click()
  await local.getByRole('heading', {name: 'CHOG #1001', exact: true}).waitFor()
  await local.getByRole('button', {name: /^adventure$/i}).click()
  await local.getByText('Ready for one local contract-backed action.').waitFor()
  for (let index = 0; index < 3; index++) {
    await local.locator('.adventure-choice').nth(index).click()
    await local.getByRole('button', {name: 'Skip interaction'}).waitFor()
    await assertPanel(local, `local 390px/card ${index + 1}`)
    if (index === 0) check('local trial displays verified survivor ID', await local.locator('.trial-survivor').getByText('CHOG #1001', {exact: true}).isVisible())
    await local.getByRole('button', {name: 'Skip interaction'}).click()
    await local.getByRole('button', {name: 'CONFIRM LOCAL ACTION'}).waitFor()
    check(`local card ${index + 1}: no automatic wallet submission`, writes.length === 0)
    await local.keyboard.press('Escape')
    check(`local card ${index + 1}: Escape restores focus`, await local.locator('.adventure-choice').nth(index).evaluate(element => element === document.activeElement))
  }
  await local.locator('.adventure-choice').first().click(); await local.getByRole('button', {name: 'Skip interaction'}).click()
  await local.getByRole('button', {name: 'CONFIRM LOCAL ACTION'}).click()
  await local.getByText('Wallet rejected the request.').waitFor()
  check('local wallet rejection produces no verified reward', await local.getByText(/Verified on-chain outcome/).count() === 0)
  await local.getByRole('button', {name: 'RETURN TO ADVENTURE'}).click()
  await local.locator('.adventure-choice').first().click(); await local.getByRole('button', {name: 'Skip interaction'}).click()
  await local.getByRole('button', {name: 'CONFIRM LOCAL ACTION'}).click()
  await local.getByText(/Recorded state: 99 XP/).waitFor()
  check('local result uses receipt values rather than 12 XP projection', true)
  check('confirmed reaction follows verified choice', (await local.getByRole('status', {name: 'Confirmed Chog reaction'}).textContent()).includes('I shared my rations'))
  check('only emitted achievements are announced as new', await local.getByText('New achievements: First Light', {exact: true}).isVisible())
  await local.getByRole('status', {name: 'Confirmed Chog reaction'}).scrollIntoViewIfNeeded()
  await local.screenshot({path: '/tmp/chog-task4g-reaction-mobile.png'})
  check('one unchanged local contract action', writes.length === 1 && writes[0].choiceId === 1)
  await local.getByRole('button', {name: 'RETURN TO ADVENTURE'}).click()
  check('confirmed daily lock disables all cards', await local.locator('.adventure-choice').evaluateAll(elements => elements.every(element => element.disabled)))
  check('execution-day rollover immediately refreshes authoritative day', (await local.locator('.adventure-survivor').textContent()).includes('UTC day 101'))
  check('execution-day rollover immediately shows daily lock', (await local.locator('.adventure-survivor').textContent()).includes('already acted'))
  await local.getByRole('button', {name: /^character$/i}).click()
  await local.locator('.survivor-history-list').getByText('Hungry Stranger · Share rations', {exact: true}).waitFor()
  check('journal follows event XP rather than preview XP', (await local.locator('.survivor-history-list').textContent()).includes('XP +99'))
  check('journal groups emitted achievement with the action', await local.locator('.survivor-history-list > li').count() === 1 && await local.getByText('Achievements earned: First Light', {exact: true}).isVisible())
  currentOwner = '0x2222222222222222222222222222222222222222'
  await local.getByRole('button', {name: 'Refresh ownership & profile'}).click()
  await local.locator('.journal-current-owner').getByText(currentOwner, {exact: true}).waitFor()
  check('transfer preserves historical acting owner', (await local.locator('.journal-controller').textContent()).includes(owner))
  check('transfer preserves token progression and diary', (await local.locator('.survivor-history-list').textContent()).includes('99 XP'))
  for (const width of [320, 375, 768, 1440]) {
    await local.setViewportSize({width, height: width < 700 ? 844 : 1000})
    const evidence = local.locator('.journal-evidence summary')
    await evidence.focus(); await local.keyboard.press('Enter')
    check(`journal ${width}px: existing body font retained`, await local.locator('.journal-reflection').evaluate(element => getComputedStyle(element).fontFamily === getComputedStyle(element.closest('.survivor-profile')).fontFamily))
    check(`journal ${width}px: full evidence keyboard accessible`, await local.locator('.journal-evidence').getAttribute('open') !== null)
    check(`journal ${width}px: full transaction hash retained`, (await local.locator('.journal-evidence').textContent()).includes(txHash))
    check(`journal ${width}px: verified UTC time`, await local.locator('.survivor-history-list time').getAttribute('datetime') === new Date(Number(101n * 86400n) * 1000).toISOString())
    check(`journal ${width}px: no horizontal overflow`, await local.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1))
    await local.keyboard.press('Enter')
    await local.locator('.survivor-history').scrollIntoViewIfNeeded()
    await local.screenshot({path: `/tmp/chog-task4g-journal-${width}.png`})
  }
  await localContext.close()
  check('no uncaught browser errors', errors.length === 0)
  console.log(`PASS: ${checks.length} Chromium checks; all 18 demo interactions, local RPC/wallet fixtures, fonts, keyboard, touch, reduced motion, mobile, rejection and confirmation.`)
} finally {
  await writeFile('/tmp/chog-task4g-browser.json', JSON.stringify({checks, errors, localBrowserUsesMockRpc: true}, null, 2))
  if (browser) await browser.close()
  for (const server of servers) { try { process.kill(-server.pid, 'SIGTERM') } catch {} }
}

import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {mkdir, writeFile} from 'node:fs/promises'

const app = 'http://127.0.0.1:4174'
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], {stdio: 'ignore', detached: true})
let browser
const evidence = {checks: [], errors: []}
function check(name, passed) { if (!passed) throw new Error(name); evidence.checks.push(name) }
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(app)).ok) break } catch {} await new Promise(resolve => setTimeout(resolve, 250)) }
  browser = await chromium.launch({headless: true})
  const page = await browser.newPage()
  page.on('pageerror', error => evidence.errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') evidence.errors.push(message.text()) })
  await page.addInitScript(() => {
    const Native = window.AudioContext
    window.audioEvidence = {contexts: [], sounds: []}
    window.addEventListener('chog-game-sound', event => window.audioEvidence.sounds.push(event.detail))
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args)
        const analyser = this.createAnalyser()
        const destination = this.destination
        const originalConnect = AudioNode.prototype.connect
        AudioNode.prototype.connect = function (target, ...rest) {
          if (target === destination) { originalConnect.call(this, analyser); return originalConnect.call(analyser, destination) }
          return originalConnect.call(this, target, ...rest)
        }
        window.audioEvidence.contexts.push({context: this, analyser})
      }
    }
    window.sampleAudio = async () => {
      const record = window.audioEvidence.contexts[0]
      if (!record) return 0
      const values = new Float32Array(record.analyser.fftSize)
      let peak = 0
      for (let i = 0; i < 12; i++) { record.analyser.getFloatTimeDomainData(values); peak = Math.max(peak, ...values.map(Math.abs)); await new Promise(resolve => setTimeout(resolve, 50)) }
      return peak
    }
  })
  await page.goto(app)
  check('no context before user interaction', await page.evaluate(() => window.audioEvidence.contexts.length === 0))
  await page.getByRole('button', {name: /^settings$/i}).click()
  check('real synthesized samples after interaction', await page.evaluate(() => window.sampleAudio()) > .0001)
  await page.getByRole('button', {name: /test sound/i}).click()
  for (const route of ['Home', 'Adventure', 'Character', 'Settings']) await page.getByRole('button', {name: new RegExp(`^${route}$`, 'i')}).click()
  check('one context across routes', await page.evaluate(() => window.audioEvidence.contexts.length === 1))
  await page.getByRole('switch').nth(2).click()
  await page.waitForTimeout(250)
  check('mute produces silent samples', await page.evaluate(() => window.sampleAudio()) < .00001)
  await page.reload(); await page.getByRole('button', {name: /^settings$/i}).click()
  check('mute persists after browser reload', await page.getByRole('switch').nth(2).getAttribute('aria-checked') === 'true')
  await page.getByRole('switch').nth(2).click()
  check('unmute restores audible samples', await page.evaluate(() => window.sampleAudio()) > .0001)
  await page.getByRole('switch').nth(0).click(); await page.getByRole('switch').nth(1).click(); await page.waitForTimeout(2200)
  check('both channels disabled produce silence', await page.evaluate(() => window.sampleAudio()) < .00001)
  for (const width of [360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({width, height: 900})
    check(`Settings ${width}px no overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    await mkdir('reports/audio/screenshots', {recursive: true})
    await page.screenshot({path: `reports/audio/screenshots/settings-${width}.png`, fullPage: true})
  }
  check('no browser errors', evidence.errors.length === 0)
  evidence.status = 'passed'
} catch (error) { evidence.status = 'failed'; evidence.error = String(error); process.exitCode = 1 }
finally {
  await mkdir('reports/audio', {recursive: true}); await writeFile('reports/audio/evidence.json', JSON.stringify(evidence, null, 2))
  await browser?.close(); try { process.kill(-server.pid, 'SIGTERM') } catch {}
  console.log(JSON.stringify(evidence, null, 2))
}

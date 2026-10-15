// Offline checks only: no provider connection, RPC request or transaction.
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
let checks = 0
function check(condition, message) { assert.ok(condition, message); checks++ }
const versions = name => Object.entries(lock.packages).filter(([path]) => path.endsWith(`node_modules/${name}`)).map(([, entry]) => entry.version)
const atLeast = (version, minimum) => {
  const actual = version.split('.').map(Number), expected = minimum.split('.').map(Number)
  for (let index = 0; index < 3; index++) { if (actual[index] !== expected[index]) return actual[index] > expected[index] }
  return true
}

check(versions('vitest').length > 0 && versions('vitest').every(version => atLeast(version, '4.1.11')), 'Vitest must include the mock-redirection fix')
check(versions('@vitest/mocker').length > 0 && versions('@vitest/mocker').every(version => atLeast(version, '4.1.11')), 'Every mocker copy must be patched')
check(versions('tinypool').length === 0, 'The vulnerable legacy worker pool must remain removed')
check(versions('decode-uri-component').length === 0, 'The incompatible legacy URI decoder chain must remain removed')
check(versions('uuid').length > 0 && versions('uuid').every(version => atLeast(version, '11.1.1')), 'Every UUID copy must include bounds checks')
for (const version of versions('ws')) {
  const minimum = version.startsWith('7.') ? '7.5.11' : '8.21.0'
  check(atLeast(version, minimum), `Unpatched websocket receiver: ${version}`)
}

const utils = require('@walletconnect/utils')
const symKey = 'a'.repeat(64), topic = 'b'.repeat(64)
for (const expiryTimestamp of [undefined, 1999999999]) {
  const uri = utils.formatUri({protocol: 'wc', topic, version: 2, symKey, relay: {protocol: 'irn'}, expiryTimestamp})
  const parsed = utils.parseUri(uri)
  assert.equal(parsed.topic, topic); assert.equal(parsed.version, 2)
  assert.equal(parsed.symKey, symKey); assert.equal(parsed.relay.protocol, 'irn')
  assert.equal(parsed.expiryTimestamp, expiryTimestamp)
  checks += 5
}

for (const [location, entry] of Object.entries(lock.packages)) {
  if (!entry.dependencies?.uuid) continue
  const parent = location, consumer = createRequire(new URL(`../${location}/package.json`, import.meta.url)), uuid = consumer('uuid')
  check(atLeast(consumer('uuid/package.json').version, '11.1.1'), `${parent} must resolve patched UUID`)
  check(uuid.validate(uuid.v4()), `${parent} retains the v4/validate API`)
  assert.throws(() => uuid.v3('chog', uuid.v3.DNS, new Uint8Array(8)), RangeError)
  assert.throws(() => uuid.v5('chog', uuid.v5.DNS, new Uint8Array(8)), RangeError)
  assert.throws(() => uuid.v6({}, new Uint8Array(8)), RangeError)
  checks += 3
}
for (const parent of ['@metamask/sdk', '@metamask/sdk-communication-layer', '@metamask/utils']) {
  const esm = await import(require.resolve(parent))
  check(Object.keys(esm).length > 0, `${parent} retains ESM module loading`)
}
const connectors = await import('wagmi/connectors')
check(typeof connectors.injected === 'function', 'The existing injected-wallet connector remains available')
console.log(`PASS: ${checks} offline dependency security and wallet compatibility checks`)

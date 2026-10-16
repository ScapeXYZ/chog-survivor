// Public read-only review material. Does not send an appeal.
import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
const url = 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json'
const response = await fetch(url)
if (!response.ok) throw Error(`Config HTTP ${response.status}`)
const text = await response.text(), config = JSON.parse(text)
const domain = 'chog-survivor.vercel.app'
const matches = (config.blacklist ?? []).filter(item => domain === item || domain.endsWith('.'+item))
const e = {capturedAt: new Date().toISOString(), url, sha256: createHash('sha256').update(text).digest('hex'), domain, blacklistEntries: config.blacklist?.length, exactOrParentBlacklistMatches: matches, limitation: 'Not a full fuzzy-detector evaluation, proprietary Blockaid verdict, or official clearance.'}
await fs.writeFile('../docs/evidence/task6a/warning-public-list.json', JSON.stringify(e,null,2)+'\n')
console.log(JSON.stringify(e,null,2))

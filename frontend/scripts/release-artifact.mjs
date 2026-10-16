import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {keccak256} from 'viem'
export const collection = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763'
export const sourceHash = '5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7'
export const creationHash = '0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29'
export async function approvedArtifact() {
  const root = new URL('../../', import.meta.url)
  const source = await fs.readFile(new URL('src/ChogSurvivor.sol', root))
  if (createHash('sha256').update(source).digest('hex') !== sourceHash) throw Error('Frozen source mismatch')
  const artifact = JSON.parse(await fs.readFile(new URL('out/ChogSurvivor.sol/ChogSurvivor.json', root), 'utf8'))
  const metadata = typeof artifact.metadata === 'string' ? JSON.parse(artifact.metadata) : artifact.metadata
  if (metadata.compiler.version !== '0.8.28+commit.7893614a' || metadata.settings.evmVersion !== 'cancun' || !metadata.settings.optimizer.enabled || metadata.settings.optimizer.runs !== 200 || keccak256(artifact.bytecode.object) !== creationHash) throw Error('Approved build mismatch')
  let runtime = artifact.deployedBytecode.object.slice(2)
  const refs = Object.values(artifact.deployedBytecode.immutableReferences ?? {}).flat()
  if (!refs.length || refs.some(ref => ref.length !== 32)) throw Error('Unexpected immutable layout')
  for (const ref of refs) runtime = runtime.slice(0, ref.start * 2) + collection.slice(2).toLowerCase().padStart(64, '0') + runtime.slice((ref.start + ref.length) * 2)
  return {artifact, runtime: `0x${runtime}`, runtimeCodeHash: keccak256(`0x${runtime}`), sourceHash, creationHash, compiler: metadata.compiler.version, settings: metadata.settings}
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const {artifact, runtime, ...report} = await approvedArtifact()
  console.log(JSON.stringify({...report, creationBytes: (artifact.bytecode.object.length - 2) / 2, runtimeBytes: (runtime.length - 2) / 2}, null, 2))
}

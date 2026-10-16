import {describe, expect, it} from 'vitest'
import {mainnetDeployment, mainnetDeploymentReceipt, validMainnetDeployment, type MainnetDeployment} from './mainnetDeployment'
const valid: MainnetDeployment = {chainId: 143, address: '0x3333333333333333333333333333333333333333', deploymentBlock: 4n, runtimeCodeHash: `0x${'a'.repeat(64)}`}
describe('mainnet manifest gate', () => {
  it('requires a complete, distinct game deployment', () => {
    expect(validMainnetDeployment(valid)).toBe(true)
    expect(validMainnetDeployment(null)).toBe(false)
    for (const changes of [{address: '0x0000000000000000000000000000000000000000'}, {address: '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763'}, {deploymentBlock: 0n}, {runtimeCodeHash: '0x'}, {runtimeCodeHash: `0x${'0'.repeat(64)}`}, {chainId: 1}]) {
      expect(validMainnetDeployment({...valid, ...changes} as MainnetDeployment)).toBe(false)
    }
  })
})

it('pins the real finalized deployment and receipt without substituting the NFT address', () => {
 expect(validMainnetDeployment(mainnetDeployment)).toBe(true)
 expect(mainnetDeployment).toEqual({chainId:143,address:'0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',deploymentBlock:113947533n,runtimeCodeHash:'0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475'})
 expect(mainnetDeploymentReceipt?.transactionHash).toBe('0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956')
 expect(mainnetDeploymentReceipt?.monadScanUrl).toBe(`https://monadscan.com/tx/${mainnetDeploymentReceipt?.transactionHash}`)
})

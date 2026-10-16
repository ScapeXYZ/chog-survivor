import {isAddress, zeroAddress, type Address, type Hex} from 'viem'

export type MainnetDeployment = {
  chainId: 143; address: Address; deploymentBlock: bigint; runtimeCodeHash: Hex
}
export function validMainnetDeployment(value: MainnetDeployment | null): value is MainnetDeployment {
  return value !== null && value.chainId === 143 && isAddress(value.address) &&
    value.address.toLowerCase() !== zeroAddress &&
    value.address.toLowerCase() !== '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763' &&
    typeof value.deploymentBlock === 'bigint' && value.deploymentBlock > 0n &&
    /^0x[0-9a-fA-F]{64}$/.test(value.runtimeCodeHash) && !/^0x0{64}$/.test(value.runtimeCodeHash)
}
// Verified against two RPC providers in Task 7A. This does not authorize frontend publication.
// Explorer source submission remains pending approval; runtime verification is independent.
export const mainnetDeploymentReceipt: {transactionHash: Hex; monadScanUrl: string} | null = {
  transactionHash: '0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956',
  monadScanUrl: 'https://monadscan.com/tx/0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956',
}
// Explicit VITE_CHOG_ENV=mainnet is additionally required; hosted production stays simulation.
// Environment variables cannot supply or override this verified manifest.
export const mainnetDeployment: MainnetDeployment | null = {
  chainId: 143,
  address: '0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',
  deploymentBlock: 113947533n,
  runtimeCodeHash: '0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475',
}

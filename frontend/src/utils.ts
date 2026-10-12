import {isAddress, type Address} from 'viem'
import {MONAD_CHAIN_ID} from './contracts'

export type GameMode = 'local-demo' | 'live-read-only'
export type OwnershipState = 'idle' | 'owned' | 'not-owner' | 'unavailable'

export function parseTokenId(value: string): bigint | undefined {
  if (!/^\d+$/.test(value.trim())) return undefined
  try {
    const token = BigInt(value)
    return token <= (1n << 256n) - 1n ? token : undefined
  } catch {
    return undefined
  }
}

export function ownershipState(
  owner: Address | undefined,
  account: Address | undefined,
  hasError: boolean,
): OwnershipState {
  if (hasError) return 'unavailable'
  if (!owner || !account) return 'idle'
  return owner.toLowerCase() === account.toLowerCase() ? 'owned' : 'not-owner'
}

export function isWrongNetwork(chainId: number | undefined): boolean {
  return chainId !== undefined && chainId !== MONAD_CHAIN_ID
}

export function gameMode(address: string | undefined): GameMode {
  return address && isAddress(address) ? 'live-read-only' : 'local-demo'
}

export function transactionEnabled(): false {
  return false
}

export function shortAddress(address: string | undefined): string {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Not connected'
}

export function signed(value: number | bigint): string {
  const numberValue = Number(value)
  return `${numberValue > 0 ? '+' : ''}${numberValue}`
}

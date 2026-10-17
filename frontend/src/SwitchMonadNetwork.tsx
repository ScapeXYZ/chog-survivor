import {useState} from 'react'
import {useAccount} from 'wagmi'

export function SwitchMonadNetwork() {
  const {connector} = useAccount()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  async function switchNetwork() {
    if (!connector || pending) return
    setPending(true);setMessage('')
    try {
      const provider = await connector.getProvider() as {request: (request: {method: string; params: unknown[]}) => Promise<unknown>}
      await provider.request({method: 'wallet_switchEthereumChain', params: [{chainId: '0x8f'}]})
    } catch {setMessage('Network switch rejected or unsupported. Select Monad mainnet (143) manually in your wallet; reads remain blocked until the wallet reports it.')}
    finally {setPending(false)}
  }
  return <span><button type="button" disabled={!connector || pending} onClick={() => void switchNetwork()}>{pending ? 'Switching network…' : 'Switch wallet to Monad'}</button>{message && <span role="status">{message}</span>}</span>
}

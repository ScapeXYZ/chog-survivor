import {WagmiProvider} from 'wagmi'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {App} from './App'
import {wagmiConfig} from './contracts'
import './styles.css'

const queryClient = new QueryClient()

// Loaded only outside Guest Mode. Same wallet config, verification and release gates.
export default function NftApp() {
  return <WagmiProvider config={wagmiConfig}><QueryClientProvider client={queryClient}><App/></QueryClientProvider></WagmiProvider>
}

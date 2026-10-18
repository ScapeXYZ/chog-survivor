import React from 'react'
import ReactDOM from 'react-dom/client'
import {WagmiProvider} from 'wagmi'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {App} from './App'
import {GuestChog} from './GuestChog'
import {wagmiConfig} from './contracts'
import './styles.css'

const queryClient = new QueryClient()

function Routes() {
  const [guest,setGuest]=React.useState(window.location.hash==='#guest')
  React.useEffect(()=>{const changed=()=>setGuest(window.location.hash==='#guest');window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed)},[])
  if(guest)return <GuestChog onNft={()=>{window.location.hash=''}}/>
  return <WagmiProvider config={wagmiConfig}><QueryClientProvider client={queryClient}><App/></QueryClientProvider></WagmiProvider>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Routes/></React.StrictMode>)

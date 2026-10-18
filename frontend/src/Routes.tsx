import {Component, lazy, Suspense, useEffect, useState, type ReactNode} from 'react'
import {GuestChog} from './GuestChog'

const NftApp = lazy(() => import('./NftApp'))

class WalletAppBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false}
  static getDerivedStateFromError() {return {failed: true}}
  render() {
    return this.state.failed ? <main className="guest-game"><h1>The NFT game could not load.</h1><p>Check your connection and reload to try again. No transaction is submitted by opening this page.</p><button onClick={()=>window.location.reload()}>Reload NFT game</button><a href="#guest">Play as Guest Chog</a></main> : this.props.children
  }
}

export function Routes() {
  const [guest, setGuest] = useState(window.location.hash === '#guest')
  useEffect(() => {
    const changed = () => setGuest(window.location.hash === '#guest')
    window.addEventListener('hashchange', changed)
    return () => window.removeEventListener('hashchange', changed)
  }, [])
  if (guest) return <GuestChog onNft={()=>{window.location.hash=''}}/>
  return <WalletAppBoundary><Suspense fallback={<main className="guest-game" aria-busy="true"><h1>Opening the NFT trail…</h1><p>Loading wallet tools. No signature is requested.</p><a href="#guest">Play as Guest Chog</a></main>}><NftApp/></Suspense></WalletAppBoundary>
}

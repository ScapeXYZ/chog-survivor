import {useEffect, useRef, useState} from 'react'
import {useAccount, useChainId, useConnect, useDisconnect} from 'wagmi'
import {activeChain, activeNetworkName, CHOG_GENESIS, approvedGameAddress, environmentReady, localMode} from './contracts'
import {Character} from './Character'
import {Adventure} from './Adventure'
import {loadAudioPreferences, saveAudioPreferences, type AudioPreferences} from './audio'
import {gameMode, isWrongNetwork, shortAddress} from './utils'
import './landing.css'
import wildEnvironment from './assets/ruined-wild-environment-provisional.webp'
import survivorCreature from './assets/survivor-creature-refined-provisional.webp'
import fogOverlay from './assets/moonlit-fog-overlay-provisional.webp'

type Screen = 'lobby' | 'adventure' | 'character' | 'settings'
const soundtrackSource: string | undefined = undefined // Add only an approved, licensed local asset.

function Clock({now}: {now: number}) {
  const seconds = Math.max(0, Math.floor(((Math.floor(now / 86400000) + 1) * 86400000 - now) / 1000))
  return <>{[Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map((x) => String(x).padStart(2, '0')).join(':')}</>
}

export function App() {
  const {address, isConnected} = useAccount(); const chainId = useChainId(); const {connect, connectors, isPending} = useConnect(); const {disconnect} = useDisconnect()
  const [screen, setScreen] = useState<Screen>('lobby'); const [selectedToken, setSelectedToken] = useState<bigint>(); const [now, setNow] = useState(Date.now())
  const [audio, setAudio] = useState<AudioPreferences>(() => loadAudioPreferences()); const [audioMessage, setAudioMessage] = useState('Soundtrack awaits an approved licensed local audio file.'); const audioRef = useRef<HTMLAudioElement>(null)
  const mode = gameMode(approvedGameAddress); const wrongNetwork = isWrongNetwork(chainId)
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id) }, [])
  useEffect(() => { saveAudioPreferences(audio); if (audioRef.current) { audioRef.current.muted = audio.muted || !audio.enabled; audioRef.current.volume = audio.volume } }, [audio])
  const updateAudio = (change: Partial<AudioPreferences>) => setAudio((old) => ({...old, ...change}))
  async function startAudio() { if (!soundtrackSource) { setAudioMessage('Soundtrack awaits an approved licensed local audio file. Your settings were saved.'); return } try { await audioRef.current?.play(); setAudioMessage('Ambient soundtrack playing.') } catch { setAudioMessage('Playback was blocked by the browser. Interact and try again.') } }
  function enter() { setScreen('adventure'); void startAudio() }
  function connectWallet() { if (connectors[0]) connect({connector: connectors[0]}) }

  return <main className={screen === 'lobby' ? 'game-shell game-shell-lobby' : screen === 'adventure' ? 'game-shell game-shell-adventure' : screen === 'character' ? 'game-shell game-shell-character' : 'game-shell'}>
    {soundtrackSource && <audio ref={audioRef} src={soundtrackSource} loop preload="none" onError={() => setAudioMessage('Soundtrack could not be loaded.')} />}
    <div className="grain" aria-hidden="true"/><div className="mountains far" aria-hidden="true"/><div className="mountains near" aria-hidden="true"/>
    <header className="game-header"><button className="crest" onClick={() => setScreen('lobby')} aria-label="Chog Survivor home">CS</button><nav aria-label="Game navigation">{(['lobby', 'adventure', 'character', 'settings'] as Screen[]).map((item) => <button className={screen === item ? 'active' : ''} key={item} onClick={() => setScreen(item)}>{item === 'lobby' ? 'Home' : item}</button>)}</nav><div className="header-tools"><span className={`mode ${mode}`}>{!environmentReady ? 'CONFIGURATION BLOCKED' : localMode ? 'LOCAL CONTRACT TEST' : mode === 'local-demo' ? 'LOCAL DEMO' : 'READ ONLY'}</span>{isConnected ? <button className="wallet" onClick={() => disconnect()}>{shortAddress(address)} · Disconnect</button> : <button className="wallet" disabled={!connectors[0] || isPending} onClick={connectWallet}>{isPending ? 'Connecting…' : 'Connect wallet'}</button>}</div></header>
    {screen !== 'lobby' && !environmentReady && <p className="notice warning"><strong>Configuration blocked.</strong> Local mode requires exact localhost Anvil settings; ownership and game reads are disabled.</p>}{screen !== 'lobby' && localMode && <p className="notice warning"><strong>LOCAL CONTRACT TEST — NOT MONAD MAINNET.</strong> The NFT fixture is not Chog Genesis. Confirmed Adventure actions write only to isolated Anvil chain 31338.</p>}{screen !== 'lobby' && wrongNetwork && <p className="notice warning"><strong>Wrong network.</strong> Switch to {activeNetworkName} (chain ID {activeChain.id}) before ownership-sensitive play.</p>}{screen !== 'lobby' && mode === 'local-demo' && <p className="notice">{screen === 'character' ? <><strong>Read-only profile.</strong> No approved game deployment is configured. Progression and history are unavailable.</> : <><strong>Local Demo.</strong> No approved game address is configured; demo values and scenes are not live onchain progress.</>}</p>}
    {screen === 'lobby' && <section className="cinematic-landing" aria-labelledby="landing-title"><div className="landing-scene" aria-hidden="true"><img className="landing-environment" src={wildEnvironment} alt=""/><img className="landing-fog fog-back" src={fogOverlay} alt=""/><img className="landing-survivor" src={survivorCreature} alt=""/><img className="landing-fog fog-front" src={fogOverlay} alt=""/><i className="landing-vignette"/></div><div className="landing-copy"><p className="landing-brand">CHOG SURVIVOR</p><p className="landing-kicker">A MONAD SURVIVAL TALE</p><h1 id="landing-title">SURVIVE<br/>THE WILD.</h1><p className="landing-tagline">Every choice leaves a mark.</p><div className="landing-actions"><button className="landing-primary" onClick={enter}>ENTER THE WILD <span>→</span></button>{isConnected ? <button className="landing-wallet" onClick={() => disconnect()}>{shortAddress(address)} · DISCONNECT</button> : <button className="landing-wallet" disabled={!connectors[0] || isPending} onClick={connectWallet}>{isPending ? 'CONNECTING…' : 'CONNECT WALLET'}</button>}</div><p className="landing-disclosure">{localMode ? 'LOCAL CONTRACT TEST · Anvil chain 31338 only. Fixture NFTs are not Chog Genesis.' : mode === 'local-demo' ? 'LOCAL DEMO · No approved game deployment is configured. No progress or actions are live.' : 'READ-ONLY · Gameplay transactions remain disabled.'}</p></div><div className="landing-reset"><span>THE WILD SHIFTS IN</span><strong><Clock now={now}/></strong><small>UTC reset</small></div></section>}
    {screen === 'adventure' && <Adventure now={now} selectedToken={selectedToken} onHome={() => setScreen('lobby')} onCharacter={() => setScreen('character')}/>}
    {screen === 'character' && <Character selectedToken={selectedToken} onSelectToken={setSelectedToken}/>}
    {screen === 'settings' && <section className="settings framed"><p className="kicker">CAMP SETTINGS</p><h2>Make the trail yours</h2><div className="setting"><div><h3>Ambient soundtrack</h3><p>Enabled by default. Playback begins only after browser-permitted interaction.</p></div><button className="toggle" role="switch" aria-checked={audio.enabled} onClick={() => updateAudio({enabled: !audio.enabled})}>{audio.enabled ? 'On' : 'Off'}</button></div><div className="setting"><div><h3>Mute</h3><p>Silence playback while retaining your saved preference.</p></div><button className="toggle" role="switch" aria-checked={audio.muted} onClick={() => updateAudio({muted: !audio.muted})}>{audio.muted ? 'Muted' : 'Audible'}</button></div><label className="volume">Volume <input aria-label="Soundtrack volume" type="range" min="0" max="1" step="0.05" value={audio.volume} onChange={(event) => updateAudio({volume: Number(event.target.value)})}/><output>{Math.round(audio.volume * 100)}%</output></label><p role="status">{audioMessage}</p><button className="link-button" onClick={() => void startAudio()}>Test sound control</button></section>}
    {screen !== 'lobby' && <footer><span>{localMode ? 'Isolated Anvil fixture · contract-backed local play' : 'Local frontend foundation · wallet and canonical NFT reads only'}</span><span>Chog Genesis: {CHOG_GENESIS.slice(0, 8)}…{CHOG_GENESIS.slice(-6)}</span></footer>}
  </main>
}

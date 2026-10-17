import React from 'react'
import {createRoot} from 'react-dom/client'
import {Adventure} from '../src/Adventure'
import '../src/styles.css'
import '../src/landing.css'
import '../src/character.css'
import './gameplay-browser-stubs'
createRoot(document.getElementById('fixture-root')!).render(<main className="game-shell"><p role="note">ISOLATED TEST FIXTURE — NO RPC, NO WALLET, NO MON. Test values below are not genuine mainnet records.</p><Adventure selectedToken={1425n} onHome={()=>{}} onCharacter={()=>{}}/></main>)

import {useLayoutEffect, useRef, type KeyboardEvent} from 'react'
import {createPortal} from 'react-dom'
import type {Connector} from 'wagmi'
import './wallet-chooser.css'

type Props = {connectors: readonly Connector[]; pending: boolean; onSelect: (connector: Connector) => void; onClose: () => void}

export function WalletChooser({connectors, pending, onSelect, onClose}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => {
    const element = dialog.current!
    const trigger = document.activeElement as HTMLElement | null
    const {overflow, paddingRight} = document.body.style
    const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight || '0') + scrollbar}px`
    document.body.style.overflow = 'hidden'
    // Native modal dialog makes the background inert and enters the top layer.
    if (typeof element.showModal === 'function') element.showModal()
    else element.setAttribute('open', '') // DOM-only test environments.
    closeButton.current?.focus({preventScroll: true})
    return () => {
      if (typeof element.close === 'function' && element.open) element.close()
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      if (trigger?.isConnected) trigger.focus({preventScroll: true})
    }
  }, [])
  function keyboard(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key !== 'Tab') return
    const buttons = [...dialog.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
    const first = buttons[0], last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  return createPortal(<dialog ref={dialog} className="wallet-dialog" aria-labelledby="wallet-chooser-title" aria-describedby="wallet-chooser-description" aria-modal="true"
    onCancel={(event) => { event.preventDefault(); onClose() }} onKeyDown={keyboard}
    onClick={(event) => { if (event.target !== event.currentTarget) return; const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose() }}>
    <header className="wallet-dialog-header"><div><p className="wallet-dialog-kicker">CHOOSE YOUR COMPANION</p><h2 id="wallet-chooser-title">Connect a wallet</h2></div><button ref={closeButton} type="button" className="wallet-dialog-close" aria-label="Close wallet selection" onClick={onClose}>×</button></header>
    <p id="wallet-chooser-description">Choose a discovered EVM wallet. Use Monad mainnet (chain 143) for genuine Chog ownership. Simulation needs no wallet.</p>
    <div className="wallet-dialog-list">{connectors.map(connector => <button type="button" className="wallet-dialog-option" aria-label={connector.name || connector.id} key={connector.uid || connector.id} disabled={pending} onClick={() => onSelect(connector)}><span className="wallet-dialog-seal" aria-hidden="true">{(connector.name || connector.id).slice(0, 1).toUpperCase()}</span><span className="wallet-dialog-name">{connector.name || connector.id}</span><span className="wallet-dialog-arrow" aria-hidden="true">→</span></button>)}</div>
    {!connectors.length && <p className="wallet-dialog-note">No compatible wallet discovered. You can keep exploring the simulation.</p>}
    <p className="wallet-dialog-note">Connection shares your public address. It does not request a transaction, NFT approval, private key or recovery phrase. Only use a wallet extension you trust.</p>
    <button type="button" className="wallet-dialog-cancel" onClick={onClose}>Cancel</button>
  </dialog>, document.body)
}

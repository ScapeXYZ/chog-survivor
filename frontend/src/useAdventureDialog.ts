import {useEffect, useRef} from 'react'
import {emitGameSound} from './audio'

// One native dialog spans interaction, preview and transaction feedback.
export function useAdventureDialog(stage: string) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement as HTMLElement | null
    const fallbackFocus = dialog?.closest('.adventure-game')?.querySelector<HTMLButtonElement>('.adventure-home')
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    emitGameSound('dialog-open')
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected && !(previousFocus as HTMLButtonElement).disabled) previousFocus.focus()
      else if (fallbackFocus?.isConnected) fallbackFocus.focus()
    }
  }, [])
  useEffect(() => {
    // Disabled confirmation still needs a keyboard-accessible cancellation path.
    const dialog = dialogRef.current
    const target = dialog?.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? dialog
    target?.focus()
  }, [stage])
  return dialogRef
}

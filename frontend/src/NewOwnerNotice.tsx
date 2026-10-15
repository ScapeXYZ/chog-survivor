export type AdventureNavigation = {
  onCharacter?: () => void
  onFindChogs?: () => void
  onHistory?: () => void
}

export function NewOwnerNotice({tokenId, onFindChogs, onHistory}: {tokenId: bigint} & AdventureNavigation) {
  return <div>
    <div role="status" aria-live="polite">
      <span className="adventure-survivor-label">READ ONLY · OWNERSHIP CHANGED</span>
      <strong>{`CHOG #${tokenId} HAS A NEW OWNER`}</strong>
      <p>Your connected wallet does not own this Chog. Its progression, achievements and survival history remain with the NFT. Only its current owner can continue the adventure.</p>
      <p>Public survivor history is read-only and shows only verified on-chain events. Unavailable history is never replaced with simulated results.</p>
    </div>
    <div className="adventure-survivor-actions">
      {onFindChogs && <button type="button" onClick={onFindChogs}>Find My Chogs <span aria-hidden="true">→</span></button>}
      {onHistory && <button type="button" onClick={onHistory}>View Survivor History <span aria-hidden="true">→</span></button>}
    </div>
  </div>
}

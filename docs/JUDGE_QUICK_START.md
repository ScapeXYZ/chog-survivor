# Judge quick-start

## Verified Monad mainnet deployment and source

Game CA: **[0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code)**. [Deployment transaction](https://monadscan.com/tx/0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956), block **113947533**, chain **143**; deployer `0x320eDAe253259053d53feD8eEe6D9C0274A91E85`. Two independent RPC providers confirmed finalized creation, exact frozen-artifact runtime and the immutable Chog Genesis binding. **Source verified publicly on MonadScan (Exact Match); deployment remains unaudited.** Collection governance/custody attestations and official wallet-provider clearance remain incomplete.

[Published verified source](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code) · Solidity **0.8.28+commit.7893614a**, optimizer **200**, **Cancun**. Independently confirmed on the public Code page in [Task 7D](TASK_7D_SOURCE_VERIFICATION_RESULT.md); source verification does not imply an audit or frontend release approval.

Tasks 7S/7T authorize this release of genuine daily actions for verified Chog Genesis holders. Task 7T fixes the unsigned-review blocker and passes three consecutive production-bundle checks. Walletless visitors can browse without fabricated progression. Installed-wallet acceptance with a genuine holder remains incomplete and is explicitly acknowledged. The deployed contract is immutable and unaudited. [Release limits and rollback](TASK_7T_MAINNET_ACTION_REVIEW_FIX.md).

Website: **https://chog-survivor.vercel.app/** · [GitHub](https://github.com/ScapeXYZ/chog-survivor) · [historical 2:51 demo video](https://youtu.be/qV-c7AP0VAg).

## Without an NFT — play immediately

1. Open **[Guest Mode](https://chog-survivor.vercel.app/#guest)** or click Play as Guest on Home. No wallet, NFT or MON is needed.
2. Meet the Guest Chog, choose Reinforce, Leap the gap or Guide others around, and see the guest consequence and XP/Trust/Scars change.
3. Continue the short six-encounter journey. Everything remains labelled **Guest Mode — off-chain preview**; none of its progress is an NFT record or transaction.
4. Watch the **[60-second narrated product walkthrough](https://chog-survivor.vercel.app/chog-survivor-narrated-60s.mp4)** with English narration and burned-in subtitles. It contains real public-site footage and off-chain guest gameplay, but no completed mainnet action. The older YouTube submission video remains historical. [Provenance and original version](TASK_7W_NARRATED_VIDEO.md).
5. Click Play with Your NFT to see the separate real Monad game. Ownership and MON gas are required for actual actions; NFT progression follows the token when it changes owners.

## Holder flow — owner-authorized mainnet gameplay

1. Explicitly select a compatible installed EVM wallet through the discovery modal and choose Monad chain 143. Do not share secrets or bypass wallet warnings.
2. Your Chogs are discovered automatically after connection on Monad. Choose a verified survivor card, or open Enter a Chog Genesis token ID if discovery is unavailable. OwnerOf must match the selected wallet before gameplay; ownership is never inferred from connection or metadata. Character shows real progression, titles, achievement bits and bounded finalized journal.
3. In Adventure, only the verified current owner sees the contract-derived choices. The contract permits one action per token per UTC day; a transfer preserves progression and the daily lock.
4. An eligible owner can review `act(tokenId, choiceId)`, the exact game address, zero MON value, projected effects and gas/cost limits. Review can be cancelled. No NFT transfer or approval is requested.
5. Explicit confirmation requests the owner's wallet approval. The request is bounded to 400,000 gas, 125 gwei total maxFeePerGas, 0.05 MON maximum estimated cost and at least 0.1 MON reserve. Each request is freshly simulated and ownership/network/nonce rechecked.
6. Only a finalized canonical receipt, matching event and matching contract state establish success. Pending/uncertain requests persist across refreshes; never retry them blindly. Predictions are not results. Inclusion after a UTC reset can resolve the new day's encounter.

The owner authorized publication, not an agent-initiated gameplay transaction. No real-holder acceptance or independent audit is claimed. Stop if the wallet shows a security warning.

## Token-bound history and evidence

The Chog NFT is the survivor; the wallet is its current controller. The immutable mapping remains keyed by token ID across owners, including possible future token-ID reuse by the collection. Collection governance/custody attestations and official wallet-provider clearance remain incomplete.

[Historical CHOG #2006 lifecycle evidence](evidence/task4h-2006/README.md) is a real isolated Anvil fixture, not genuine Monad ownership or a public mainnet transaction. Existing artwork and font licenses remain preserved. Metadata availability does not grant artwork permissions.

[Deployment guide](DEMO_DEPLOYMENT_GUIDE.md) · [historical submitted package](FINAL_CHOGATHON_SUBMISSION.md) · [current release](TASK_7T_MAINNET_ACTION_REVIEW_FIX.md).

# Task 6B — deployment approval record

2026-10-16. **NOT APPROVED / NO-GO.** This is a review packet, not authorization or a signing instruction. The current task explicitly prohibits signing, broadcasting, deployment, GitHub push and Vercel publication.

## Candidate for future review

| Field | Candidate / status |
| --- | --- |
| Network | Monad mainnet, chain 143 |
| Public sender | `0x320eDAe253259053d53feD8eEe6D9C0274A91E85` |
| Contract | Frozen `src/ChogSurvivor.sol:ChogSurvivor`; no constructor arguments; zero transaction value |
| Compiler | 0.8.28+commit.7893614a; optimizer enabled, 200 runs; Cancun |
| Source SHA-256 | `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| Creation Keccak-256 | `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Expected bound runtime Keccak-256 | `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` |
| NFT binding | `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Historical nonce / predicted address | 0 / `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`; must refresh |
| Historical balance / fee estimate | 0.4 MON / 0.154097622 MON; neither is a spending authorization |
| Approved gas limit / max fee per gas / total MON ceiling | **Unset — blocking** |
| Signer custody and signing process | **Unconfirmed — blocking** |
| Immutable release revision and reviewed diff/artifact digest | **Unset — dirty working tree; blocking** |
| Deployment transaction / finalized game address | **None recorded** |

The evidence filename and `estimateSenderApproved` boolean indicate a prepared sender estimate; they do not establish deployment approval. No private key or recovery phrase is required in this record.

## Gate A — future contract deployment only

Owner and independent reviewer must close every deployment blocker in the [release checklist](TASK_6B_MAINNET_RELEASE_CHECKLIST.md), reproduce Monad-mode checks and fresh independent RPC observations, review the exact artifact/revision, and explicitly approve sender, chain, nonce, zero value and all spending ceilings. Collection provenance/restrictions, source verification limitations, security acceptance and wallet warning disposition remain unresolved.

Approval status: **WITHHELD**. Approver, timestamp, exact release/artifact, nonce and caps: **not supplied**. Do not sign or broadcast based on this document. Changing any approved field would require renewed review.

## Gate B — future frontend release

Separate approval is required after finalized deployment/runtime/binding and source verification, real manifest/receipt review, genuine wallet tests, history operations, asset permissions and host settings review. Push, Vercel publication and any mainnet activation remain **NOT APPROVED**. Source verification publication also requires authorization under the Task 6A runbook.

The immutable game has no administrative pause or rollback. A frontend rollback can stop its own write UI, but cannot undo transactions or disable direct contract calls. Current simulation remains available with no approved mainnet game manifest.

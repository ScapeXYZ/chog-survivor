# Task 6A — Monad mainnet launch readiness

Reviewed 2026-10-16 (Africa/Lagos). **Final decision: NO-GO for mainnet deployment or public mainnet gameplay.** Safe local preparation is complete; this is a review candidate, not a deployed integration. The completed demo video does not close the gates below. No signing, broadcasting, Anvil reset, GitHub push, provider appeal or Vercel deployment was performed. Pre-existing Task 5A/video changes were preserved.

## Fresh network and collection verification

[Read-only evidence](evidence/task6a/monad-readonly.json), captured 2026-10-16 00:55:32 UTC using `https://rpc.monad.xyz`:

| Read | Result |
| --- | --- |
| Chain | 143 / `0x8f` |
| Finalized snapshot | 113760895, hash `0x86d5ef82881d2f6c8a74d41c4dce70bf6925ecdffa8d483030d5dd23c3ad6384` |
| Collection | `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Runtime | 17,264 bytes; Keccak-256 `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46` |
| Identity/interface | Chog Genesis / CHOG; ERC-721 interface supported |
| Supply | 1,969; not an eligible ID range or maximum supply |
| `ownerOf(1425)` | `0x601634F3d0746b550e68439286c1ad022a5f2B88` |
| `ownerOf(uint256.max)` | Reverts, selector `0x7e273289` |
| EIP-1967 implementation/admin/beacon slots | Zero at the captured block |

The [official network reference](https://docs.monad.xyz/developer-essentials/network-information) identifies Monad mainnet. RPC connectivity and finalized-tag support were demonstrated with one provider, not independent provider consensus. Name/symbol and code matching prior evidence do not authenticate the creator. MonadScan source access again returned HTTP 403; Sourcify access through the research browser failed. No newly reproduced source or governance attestation was obtained.

The frozen game checks the collection's `ownerOf` on every `act` and requires the caller to equal that owner. Existing fork tests freshly passed for real token #1425: binding, preview/action parity, non-owner rejection, same-day lock, nonexistent-token rejection, and simulated transfer with inherited progression and changed controller. Transfers occurred only inside ephemeral Foundry memory, never on mainnet or existing Anvil. These tests are not pinned to the evidence snapshot.

No NFT approvals, deposits, transfers or custody are required by gameplay. An approved operator or previous owner cannot act. An NFT held by a smart wallet must act through that wallet; escrow/staking beneficial ownership alone is insufficient. Burn/remint can inherit token-ID state, and collection seizure or changed ownership changes game control. A successful sampled transfer does not establish collection-wide or future transfer freedom.

## Prepared integration

- `mainnetDeployment.ts` is an empty, source-reviewed manifest gate. Mainnet needs an exact verified game address, deployment block and runtime hash **plus** `VITE_CHOG_ENV=mainnet`. Environment addresses cannot enable it. No mainnet game address exists in this candidate.
- `Adventure` keeps walletless simulation as the initial production experience. A separately enabled mainnet release offers an explicit real-game selector; local fixture mode remains chain 31338. Simulation never renders the transaction component or calls its write hook.
- The existing contract interaction preserves art, fonts, reward mechanics, ownership and UTC-day rules. Mainnet confirmation checks the approved runtime, fresh owner/binding/day/preview, simulates and estimates `act`, and requests a nonpayable transaction pinned to chain 143 and the originating wallet/token. No automatic network switching or approval request was added.
- Three-confirmation receipt handling additionally checks the finalized block floor and canonical inclusion hash. Only matching game-address/token/owner/choice events establish rewards. Hashes remain visible on timeout with a MonadScan link and instructions to check before retrying. Wallet rejection, revert, RPC failure and refresh failure are distinct from confirmed progression.
- History uses a finalized snapshot rather than requiring a stationary tip. Reads remain token-topic-filtered in 500-block chunks. Mainnet is bounded to 100 chunks and explicitly reports incomplete history if the budget or provider fails. This is not an archival indexer: a scalable paginated/indexer strategy is still needed before the 50,000-block budget is exceeded. No missing history is fabricated.
- Vercel remains forced to simulation production mode and clears local/RPC overrides. Basic nosniff/referrer/permissions headers are prepared locally. Future activation is a separately approved build-command/manifest release. Hosted settings have not been inspected or changed.

The mainnet branch has seven fixture-based transaction tests; it has not been tested with a real signing wallet or deployed game. Runtime hash approval and a full enabled-release browser rehearsal remain required after a real deployment. Do not describe this candidate as live mainnet gameplay.

## Tooling and fees

The [current Monad deployment guidance](https://docs.monad.xyz/developer-essentials/summary) recommends Foundry 1.8+ with Monad execution enabled and Viem >=2.40. Installed Foundry is **1.7.1**, Viem **2.57.4**, Node **22.23.2**. The frozen compiler remains **0.8.28**, optimizer **200**, EVM **Cancun**. Newer opcode support does not require changing this contract's target. No installed toolchain or Anvil configuration was replaced.

Fresh read-only creation estimate: **1,510,761 gas** at **102,000,000,000 wei/gas**, giving **0.154097622 MON**. Sender was the sampled owner for estimation only, not an approved deployer. Creation bytecode Keccak-256: `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29`. Local Ethereum gas report: deployment **1,498,315**, game `act` maximum **166,517** in the suite. Illustrative action cost at that sampled price is **0.016984734 MON**; it is not a Monad worst-case bound. Monad charges submitted gas limit, so blind Ethereum padding can waste MON. Repeat Monad-aware estimates for the approved sender and representative first/repeat/achievement/smart-wallet actions; approve explicit gas and fee ceilings separately.

## Task 5A blocker disposition

| Prior blocker | Classification | Closure evidence / remaining requirement |
| --- | --- | --- |
| Chain/RPC, sampled holder compatibility | Resolved for sampled evidence | Fresh capture and six fork passes; repeat before deployment |
| Collection provenance, source, governance and restrictions | Unresolved | Creator attestation, creation/factory transaction, reproducible source/compiler/ABI, role/upgrade/pause/freeze/operator/burn/remint/seizure map; see CANONICAL_NFT_GOVERNANCE_REVIEW.md |
| Production frontend write/history implementation | Prepared; unresolved launch validation | Guarded code and mocked tests complete; real verified manifest, enabled-build browser rehearsal and archival strategy required |
| Monad-aware Foundry/gas readiness | Unresolved | Isolated reviewed 1.8+ installation, artifact comparison and full Monad-mode suite/estimates |
| Exact deployer, nonce, fee limits and deployment authorization | Requires explicit approval | No sender or spending cap approved; use deployment runbook |
| Independent security review | Unresolved | This is an implementation review, not an independent audit |
| MetaMask/Blockaid warning | Unresolved | Exact warning evidence and official disposition absent; no clearance claimed |
| Hosted production root/settings/revision | Unresolved | Redacted owner settings export/read-only verification required |
| Fonts/artwork/branding permission | Requires explicit approval | Existing assets preserved; written clearance still required |
| Organizer acceptance, team/contact and public submission | Unresolved / requires explicit approval | Outside technical launch proof; video marked completed by owner, not independently reviewed here |
| Final frontend publication / GitHub / Vercel release | Requires explicit approval | No push or deployment performed |
| Optional wallet/disclosures and public links | Resolved locally | Existing Task 5A candidate preserved; not deployed |
| Missing defense-in-depth headers | Prepared locally | New headers need separate host release; CSP still requires metadata/font/RPC compatibility review |
| >500 kB bundle / vendor annotation warnings | Unresolved, nonblocking alone | Build succeeds; performance optimization deferred |

## Verification

Commands and retained output are indexed in [evidence/task6a](evidence/task6a). Results were obtained without using a real wallet or contacting existing Anvil.

| Check | Result |
| --- | --- |
| `forge test --offline --gas-report` | 39 passed, 0 failed, 6 opt-in fork skips; 7 suites |
| `MONAD_RPC_URL=https://rpc.monad.xyz forge test --offline --match-contract MonadForkIntegrationTest` | 6 passed, 0 failed, 0 skipped |
| `forge build --offline` including deployment helper | Pass, Solidity 0.8.28 |
| Frontend production-environment unit suite | 23 files / 383 passed, 0 failed |
| Production TypeScript/Vite build | Pass; existing vendor annotation and >500 kB warnings |
| Dependency compatibility/security checker | 73 checks pass |
| `npm audit --json` | 0 vulnerabilities at every severity; 623 dependency entries |
| Deployment wrapper | Shell syntax passes; source hash passes; deliberately refuses installed Foundry 1.7.1 before RPC/deployment |
| Browser smoke | See final recorded results in security review and evidence index |

Initial sandbox DNS/listening failures were rerun with permission; the unpermitted failures are not successful verification. An initial unit regression from new mock configuration and changed local copy was fixed; the final full suite above passes. A browser asset-load race was corrected by waiting for image decode, without changing product assets.

Frozen source SHA-256: **`5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`**, unchanged. **NO-GO remains in force until every deployment gate in the runbook is satisfied and explicitly approved.**

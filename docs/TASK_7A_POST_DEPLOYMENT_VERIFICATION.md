# Task 7A — post-deployment verification

2026-10-16. **On-chain verification: GO / PASS. Frontend publication and public mainnet activation: NO-GO pending separate approval.** The owner-deployed contract is finalized and exactly matches the frozen build and prepared unsigned candidate. No new mainnet transaction, signature, wallet connection, source upload, Git push or Vercel publication was performed in this task.

## Verified deployment identity

| Field | Verified value |
| --- | --- |
| Chain | Monad mainnet **143** |
| Game | [`0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code) |
| Transaction | [`0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956`](https://monadscan.com/tx/0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956) |
| Sender | `0x320eDAe253259053d53feD8eEe6D9C0274A91E85` |
| Creation block | **113947533**, hash `0xf5aa81d55ddfc3f368ba694b44a07d46725f2882f69c9a3f6975c30b51d467ef` |
| Receipt / destination / nonce | **Success / contract creation (`to: null`) / 0** |
| Constructor | **No arguments**, immutable Chog Genesis binding |
| Source | `src/ChogSurvivor.sol`, SHA-256 `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7` |
| Artifact | `out/ChogSurvivor.sol/ChogSurvivor.json`, SHA-256 `adf4c5c23213818fdcafb7ea55ca3e50a277156bccf7abe4a90a83cc8d0545f0` |
| Compiler | **0.8.28+commit.7893614a**, optimizer **200**, **Cancun**, no viaIR |
| Exact creation | **6,772 bytes**, Keccak-256 `0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29` |
| Exact bound runtime | **6,688 bytes**, Keccak-256 `0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475` |
| Actual unsigned payload digest | `0xd1a256ad5ca962d06e9cb55243436faec4b58e77fd61b21309b6fc88012389e9` — exact match to Task 6E |

The authoritative deployment block hash is recorded directly in [verification.json](evidence/task7a/verification.json) and the manifest; all bytes are checked against that evidence. Both providers supplied the successful transaction/receipt and exact full game code at **deployment block and finalized snapshot**. CREATE address derivation from the verified sender and nonce matches. The public signature reconstructs the actual transaction hash and recovers that sender offline; no signing operation is used.

## Two-provider evidence and contract reads

[Collector](../frontend/scripts/task7a-verify-deployment.mjs) uses an explicit read-only RPC method allowlist and fixed providers **https://rpc.monad.xyz** and **https://rpc3.monad.xyz**. [Complete successful transcript](evidence/task7a/rpc-transcript.json); [verification result](evidence/task7a/verification.json); [offline transaction check](evidence/task7a/offline-capture-check.json).

Capture completed **2026-10-16 16:45:00.242 UTC**. Shared snapshot **113948513**, hash `0x41db76b946a6dcb78c0b2e4affe668a25430691980b6650e10e24145df961f5f`. Each provider's finalized head was at least the deployment block; the providers also agreed on the canonical shared finalized block and all compared transaction/receipt/state/read values. Finalized head numbers may advance independently during capture and need not be identical. This proves inclusion under the RPC providers' finalized view, not a light-client consensus proof.

| Read | Both-provider result at capture |
| --- | --- |
| NFT binding, deployment + snapshot | `CHOG_GENESIS() = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763` |
| Collection runtime | `0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46` |
| Collection identity / interface | **Chog Genesis / CHOG / ERC-721 true** |
| `ownerOf(1425)` | `0x601634F3d0746b550e68439286c1ad022a5f2B88` |
| `characterOf(1425)` | All initial counters/flags zero; `hasActed=false` |
| `titleOf(1425)` | **0** |
| `preview(1425,1)` | Day **20742**, event **3**, outcome **7**, XP **+13**, Trust **+3**, Scars **0**, `canAct=true`; prospective First Light mask **1** |
| Deployer balance | **0.2368 MON** (`236800000000000000` wei), shared finalized snapshot |
| Current latest / pending nonce | **1 / 1**, both providers |

The genuine collection binding is supported by the unchanged full runtime and prior Task 6C/6D explorer creation/source reproduction, in addition to the live getter and ERC-721 reads. Name/symbol alone are not identity evidence. Collection governance/custody/complete role and delegated-permission attestations remain unresolved as previously documented. Preview is a read-only prospective result; no action, XP, achievement or journal entry was created by this task. One sampled initial character is not a claim that no other token has acted.

## Actual spending and historical deployment candidate

The deployed type-2 transaction has **gas limit 1,600,000**, **max fee 125 gwei**, **priority cap 2 gwei**, **value zero**, empty access list, nonce zero and exact frozen creation data. Reconstructing its unsigned serialization matches the existing Task 6E candidate **exactly**.

The receipt reports gas used **1,600,000**, effective price **102 gwei**, cost **0.1632 MON**. Maximum submitted exposure was **0.2 MON**. The observed remaining **0.2368 MON** exceeds the **0.1 MON** reserve. These figures describe the completed deployment, not an allowance for another transaction. The old nonce-zero signing candidate/tool is historical: **do not reuse it or retry deployment**. Its nonce/address-code gates should reject the now-deployed state. No retry, replacement, cancellation or gameplay transaction is authorized here.

## Explorer source verification — prepared, not submitted

[Standard JSON input](evidence/task7a/source-verification-input.json), [compiler output](evidence/task7a/source-verification-output.json), [parity check](evidence/task7a/source-preparation-check.json), [owner submission preparation](evidence/task7a/SOURCE_VERIFICATION_PREPARATION.md).

The existing pinned Solidity 0.8.28 compiler reproduced exact creation bytes and runtime template offline using optimizer 200, Cancun, metadata IPFS hash, no viaIR, no libraries, original source path/remapping and no constructor arguments. Nothing was uploaded or published. **Runtime verified on-chain does not mean explorer source verified.** The UI now uses “MonadScan deployment record” and explicitly discloses pending explorer source verification and unaudited deployment, avoiding an implied verified-source badge.

After separate source-publication approval, use Solidity Standard JSON and compiler **v0.8.28+commit.7893614a**, contract **src/ChogSurvivor.sol:ChogSurvivor**, with the prepared file. [Official MonadScan guidance](https://info.monadscan.com/how-to-verify-contracts/) describes this method; automated page opening returned 403, with the official indexed guidance available. No repeated Sourcify requests, provider appeal or wallet address-ownership signing flow was attempted.

## Manifest, frontend and documentation changes

- [Source manifest and receipt](../frontend/src/mainnetDeployment.ts) now contain the verified real game address, block, runtime hash and transaction URL. [Machine-readable evidence manifest](evidence/task7a/deployment-manifest.json) separately records sender, block hash and publication/source status.
- README, judge quick start, deployment guide and hackathon submission now link the actual game CA and transaction. Historical isolated-chain evidence remains explicitly separate. No hosted revision, new video publication or hackathon submission is claimed.
- Mainnet activation still requires explicit **VITE_CHOG_ENV=mainnet** plus the verified source manifest. Environment-supplied addresses cannot override it. **Vercel still forces production simulation**, with cleared local/RPC overrides; its configuration was not changed. The hosted frontend was not republished or activated.
- Local mainnet build: **/tmp/chog-task7a-mainnet**. Final clean production simulation build: **/tmp/chog-task7a-production-reviewed**. They are temporary local artifacts, not hosted releases. Asset hash inventories pin the exact outputs; rebuilding changes the publication candidate and requires checking that new output.
- Simulation remains walletless even in the mainnet build. Real mode is explicitly selected; compatible injected EVM wallets are discovered and chosen, with no Phantom support assumption. Desktop synthetic MetaMask and mobile synthetic Rabby were exercised; labels do not authenticate a genuine extension or certify vendor support.
- Current-owner authorization, fresh chain-day/preview, exact runtime/NFT binding, preflight simulation and explicit gas estimate precede a pinned `act(token,choice)` wallet request. No NFT approvals, deposits or transfers are requested. Rejection and invalid runtime/ownership block progression. Gameplay fee approval remains in the wallet; the deployment's 0.2 MON ceiling is **not** a gameplay budget/application fee cap.
- History reads start at the actual deployment block, use finalized bounded pages and retain unavailable/partial-history states. Existing tests cover successful receipt/event validation, wrong chain/binding/owner, daily rollover, receipt canonicality/finality, history pagination and token transfer continuity. No synthetic confirmation is described as new mainnet evidence.

## Validation and retained limitations

| Check | Result / exact evidence |
| --- | --- |
| Two-provider live receipt/code/binding/reads | **PASS**, [result](evidence/task7a/verification.json), raw receipt/creation/code in [transcript](evidence/task7a/rpc-transcript.json) |
| Offline signed transaction hash/sender/candidate | **PASS**, [check](evidence/task7a/offline-capture-check.json) |
| Explorer input local compiler parity | **PASS**, exact full creation and runtime template; **not submitted** |
| Frontend suite | **24 files / 391 passed**, [log](evidence/task7a/frontend-tests.log) |
| TypeScript + mainnet production build | **PASS**, [log](evidence/task7a/mainnet-build.log) |
| TypeScript + explicit production simulation build | **PASS**, [log](evidence/task7a/production-build.log) |
| Real-manifest mainnet browser, desktop/mobile | **29 checks passed**, [log](evidence/task7a/mainnet-browser.log); all RPC/wallet traffic synthetic/intercepted, no real signer |
| Final production artifact browser | **49 checks passed**, [result](evidence/task7a/production-browser.json); widths 320/375/768/1440, external requests blocked, no page errors or missing assets |
| Preservation/security | [Comparison and artifact inventories](evidence/task7a/preservation-and-artifacts.json); frozen source/artifact, fonts, artwork, mechanics and prior evidence preserved |
| Syntax / whitespace | New Node scripts parse; `git diff --check` passes |

Compiler/Vite retain existing vendor PURE-annotation/chunk-size warnings; neither build has errors. No dependency/lockfile installation or modification was needed. Genuine extension/hardware/mobile wallet UX, actual holder signing/receipts and hosted CORS/provider availability were not tested with a live wallet. These remain operator/release acceptance work; no additional mainnet transaction is needed to claim the read-only verification already completed.

Retained unsuccessful preparation attempts: initial sandbox DNS failure; an invalid choice-zero preview in the collector (correctly reverted `InvalidChoice(0)`, corrected to choice one); an inherited-local-environment production build caught by the loopback-URL artifact gate; and stale assets retained by Vite in a reused external output directory. Final production output was built in a fresh directory with all explicit production overrides and passed the same strict gate. No deployment mismatch was observed; failed output is not the release candidate. Avoid reusing nonempty external output directories. Unchanged Solidity/Forge suites were not repeated.

## Separate frontend publication decision

**NO-GO for publication/activation now.** Technical preparation and on-chain verification pass, but the current instruction explicitly withholds frontend publication/activation approval.

Before any later mainnet frontend release:

1. Obtain explicit owner approval identifying the exact source/build hash inventory, destination, hosting settings and mainnet activation. Do not infer publication approval from contract deployment.
2. Obtain separate source-publication approval and verify the resulting explorer match under the release policy; until then keep the pending-source disclosure.
3. Record the frontend's unaudited-risk disposition, governance/custody/delegated-permission uncertainty, genuine protected-wallet retest and warning policy. The prior owner observation that warnings disappeared is not official MetaMask/Blockaid clearance; stop on any current warning. No independent audit occurred, and one is not falsely reinstated or claimed under the owner-selected unaudited contract path.
4. Confirm artwork/branding/affiliation rights, preserve font licenses, and accept the genuine compatible-wallet/mobile and public RPC/CORS/history availability limitations for the exact hosted candidate. Hosting/source/link checks after a separately approved release must use that actual revision.

No push, commit, source submission, frontend deployment or public mainnet activation is authorized by this report. **Stop at the frontend/source-publication authorization gates.**

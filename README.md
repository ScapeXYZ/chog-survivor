# Chog Survivor

**Owner-authorized mainnet gameplay release:** this version connects genuine Chog Genesis owners to the deployed game's daily `act(tokenId, choiceId)` action. The Task 7S unsigned-review blocker is fixed and the production-bundle gate passed three consecutive desktop/mobile runs. See the [fix, validation and rollback](docs/TASK_7T_MAINNET_ACTION_REVIEW_FIX.md). Real-holder installed-wallet acceptance remains incomplete and owner-acknowledged; no independent audit or official wallet-provider clearance is claimed. The submitted video is historical simulation footage.

## Verified Monad mainnet deployment and source

Game CA: **[0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code)**. [Deployment transaction](https://monadscan.com/tx/0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956), block **113947533**, chain **143**; deployer `0x320eDAe253259053d53feD8eEe6D9C0274A91E85`. Two independent RPC providers confirmed finalized creation, exact frozen-artifact runtime and the immutable Chog Genesis binding. **Source verified publicly on MonadScan (Exact Match); deployment remains unaudited.** Collection governance/custody attestations and official wallet-provider clearance remain incomplete.

[Published verified source](https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code) · Solidity **0.8.28+commit.7893614a**, optimizer **200**, **Cancun**. Independently confirmed on the public Code page in [Task 7D](docs/TASK_7D_SOURCE_VERIFICATION_RESULT.md); source verification does not imply an audit or frontend release approval.

Genuine mainnet NFT collection: **[Chog Genesis · 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763](https://monadscan.com/address/0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763)** on Monad **143**. This collection is distinct from the game contract above and from local Anvil fixtures.

The checked-in manifest records the real deployment. This checkout enables genuine production reads independently of write permission: verified runtime/collection binding, NFT ownership, survivor state, titles, achievements and bounded finalized history. Missing or failed reads display Unavailable. The owner-authorized source-controlled `mainnetGameplayReleaseAuthorized` flag is true in this release; valid mainnet configuration and the verified manifest are additionally required. Every action repeats ownership, simulation, nonce and spending checks. No query or local-storage flag overrides release authorization.


**“The Chog NFT is not a key that unlocks Chog Survivor. The Chog NFT is the survivor itself.”**

Each token ID carries its XP, Trust, Scars, streak, achievements, title, daily lock and verified adventure journal. The wallet is only its current controller. Transfer the NFT and the next owner inherits the same survivor, including its history and daily eligibility.

## Browse records and play with a verified Chog

Website: https://chog-survivor.vercel.app/ · [public repository](https://github.com/ScapeXYZ/chog-survivor) · [historical demo video](https://youtu.be/qV-c7AP0VAg).

This release provides authentic mainnet records and owner-verified daily gameplay. The linked video shows the historical simulation and does not demonstrate live mainnet gameplay:

1. Open the app and choose **Enter the Wild**. No wallet is needed to browse Home, Adventure, Character or Settings. No sample survivor or statistics are generated for visitors.
2. To read a specific Chog, explicitly select a compatible EVM wallet and select Monad mainnet, **chain 143**. Browsing and ownership reads need no signature. Gameplay requires a separate explicit wallet confirmation, never a private key, recovery phrase or NFT approval.
3. Open **Character**, enter a genuine Chog Genesis token ID and choose **Check token**. **Find my Chogs** is optional, bounded read-only discovery; ownership is rechecked for every candidate. No NFT is assumed owned from an entry or metadata name alone.
4. Runtime hashes and collection binding are verified at a finalized block before game fields are shown. Actual XP, Trust, Scars, stored streak, achievements and title are displayed from that contract snapshot. Real returned zeroes are valid data; missing/error/loading/network states remain **Unavailable**.
5. Adventure shows that token's actual records. A daily encounter is shown only after a current contract read; no device-time or token-zero encounter is generated. The gameplay interface restricts playable choices to the verified current owner. If eligible, select a choice, inspect the contract projection and gas/cost review, then explicitly request wallet confirmation. Cancel the review to stop before any wallet request. A daily-locked token cannot act again, including after transfer.

`Wandering Chog` is the frozen rulebook's title ID 0. It is no longer a default demo character: it can appear only when the real `titleOf(tokenId)` call returns 0 for a verified NFT/game snapshot. Other title/achievement names are canonical display mappings, never evidence that a title or achievement was earned.

The journal reads finalized contract events in bounded pages. A partial/error result is labelled; missing RPC blocks do not become a fabricated empty history. Wallet/account/token changes invalidate scoped records. Metadata and decorative artwork do not establish ownership or character progression. Local storage stores audio preferences and a public pending-action journal for refresh/uncertainty recovery; it never establishes ownership, progression or successful receipts. Pending/uncertain actions block duplicates; check their hash instead of resubmitting.

<a id="run-the-walletless-demo"></a>

## Run locally — real mainnet gameplay

From frontend with the existing lockfile and Node.js 22:

```sh
npm ci
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run dev -- --host 127.0.0.1
```

These explicit settings prevent a developer `.env.local` from choosing Anvil. This release is gameplay-enabled: the source gate authorizes real mainnet requests, but connecting or selecting a decision never sends a transaction. The unsigned review opens before any wallet request, and failed or timed-out preflight leaves confirmation disabled. Build with the same overrides and `npm run build`. Never use a funded wallet in synthetic fixture tests. Requests fail closed above 400,000 gas, 125 gwei total maxFeePerGas, 0.05 MON maximum estimated cost, or below 0.1 MON remaining reserve. The app never automatically submits, retries uncertain transactions, requests NFT approval or bypasses wallet warnings. Success requires a finalized receipt, exact event and matching state. [Rollback](docs/TASK_7T_MAINNET_ACTION_REVIEW_FIX.md#rollback) disables the source release flag and restores a read-only frontend; it cannot reverse a transaction.

The [recorded CHOG #2006 local evidence](docs/evidence/task4h-2006/README.md) and [submitted package](docs/FINAL_CHOGATHON_SUBMISSION.md) are retained with their original provenance. They are not proof of a new holder action or new mainnet progress. The existing local contract mode below remains an explicitly labelled isolated test fixture, with no Anvil reset or new transaction performed by Task 7L.

## Existing local Anvil deployment — inspect safely

The existing workspace uses `http://127.0.0.1:8545`, chain **31338**, game **`0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`**, deployment block **4**. These are this local deployment's public identifiers, not portable public-network settings. The fixture occupies the canonical numeric address **`0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`** only on the isolated local chain; it is not authentic Chog Genesis.

Do not restart/reset an existing node, rerun fixture installation, advance time or run transaction scripts to view evidence. The [recorded verification](docs/evidence/task4h-2006/verification.json) and screenshots require no running node. For an already verified existing node, the [deployment guide](docs/DEMO_DEPLOYMENT_GUIDE.md) explains local frontend settings. Foundry and an injected local wallet are needed for live local inspection; no action is necessary to read the existing survivor and journal.

`script/local-anvil.sh install/deploy` creates or changes local state. `npm run test:e2e` and `scripts/task4h-real-anvil-e2e.mjs` can submit real local transactions; the older journey also advances isolated time. **They are not safe preparation/verification commands for the current node and were not run for Task 4K.** A new fixture setup or transaction requires its own authorization. Standard public Anvil credentials must never be funded or reused on public chains.

## Architecture and verification

- `src/ChogSurvivor.sol`: frozen non-upgradeable game, six encounters, 18 fixed choices, eight achievements and token-bound state.
- `frontend/`: React 18, TypeScript, Vite, Wagmi, Viem and TanStack Query; static build with no backend.
- `frontend/src/LocalContractAdventure.tsx`: ownership/network gates, block-pinned eligibility, guarded confirmation and verified receipt reactions.
- `frontend/src/survivalHistory.ts` and `SurvivorJournal.tsx`: verified local event history, UTC evidence and historical controller attribution.
- `test/`: isolated Foundry unit, fuzz, invariant, reference-model and opt-in fork tests.

Task 5A verified **375 frontend tests in each environment**, **39 isolated Foundry tests** plus **six mainnet-fork tests**, production/local builds, **515 interaction-browser checks** and separate public-site checks. The fork uses read-only RPC and simulates writes in Foundry memory; it does not broadcast or alter Anvil. See the [release report](docs/TASK_5A_RELEASE_READINESS.md) for exact coverage and limitations. Tests use a deterministic configuration baseline plus explicitly local fixtures; a green test does not mean a public game contract is deployed.

The frozen contract SHA-256 remains:

```text
5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7
```

## Release status

The owner-deployed Monad game and its published source are verified above. Task 7M removed simulated gameplay; Tasks 7S/7T authorize this gameplay release under the approved transaction limits and acknowledge incomplete holder-wallet acceptance. Task 7T resolved the failed unsigned-review gate. Collection governance/custody and wallet-policy gates remain separate from source verification. The game has no NFT custody, staking, inventory, currency, wagering or marketplace.

Current runtime illustrations are marked provisional in the [asset inventory](frontend/ASSET_INVENTORY.md). Public demo/repository/video release requires explicit review of those exact assets and intended uses. No artwork was replaced or generated. Existing fonts and typography are preserved; the bundled Lilita One license is also included with unchanged license terms at `frontend/public/licenses/LilitaOne-OFL.txt` for distribution. Genuine collection metadata or ownership does not grant artwork permission.

Task 7E pushed the verified release through `2db718d`; GitHub main still matches that commit in Task 7H. Its automatic Vercel deployment retained production simulation. Task 7I prepares a documentation-only update with the owner-supplied video; holder tools and operator evidence remain local. See [Task 7C](docs/TASK_7C_SOURCE_VERIFICATION_AND_GIT.md) for commit scope/exclusions, [Task 7D](docs/TASK_7D_SOURCE_VERIFICATION_RESULT.md) for source verification, and the [final submission package](docs/FINAL_CHOGATHON_SUBMISSION.md) for current links and outstanding submission fields.

## Submission materials

- [Judge quick-start and demo limitations](docs/JUDGE_QUICK_START.md)
- [Environment and deployment approval guide](docs/DEMO_DEPLOYMENT_GUIDE.md)
- [Real local transfer evidence](docs/evidence/task4h-2006/README.md)
- [Three-minute video outline](docs/DEMO_VIDEO_OUTLINE.md)
- [Final submission fields, links and readiness decision](docs/FINAL_CHOGATHON_SUBMISSION.md)
- [Historical submission draft](docs/HACKATHON_SUBMISSION_DRAFT.md)
- [Judge-access audit](docs/TASK_4J_JUDGE_ACCESS_AUDIT.md)
- [Game rules](docs/GAME_RULES.md), [backend freeze](docs/BACKEND_FREEZE.md), [security review](docs/SECURITY_REVIEW.md)

Submission deadline: **October 23, 2026, 15:00 UTC** (16:00 Lagos), confirmed from the [official Chogathon page](https://chogathon.chog.xyz/) in Task 7H. The organizer requires an essential NFT role, working demo, a video of up to three minutes and testing instructions. The submitted demo video shows the historical simulation; the current frontend reads genuine records from the source-verified deployed contract. Organizer acceptance of that demonstrated scope is not claimed. The repository and static demo are already public; video upload, submission and any new release require approval. Mainnet contract deployment is complete; the Task 7S owner authorization covers this frontend gameplay release; it does not authorize the agent to transact for a user.

# Milestone 13A — Production readiness and submission package

Verification date: 2026-10-13. Baseline: `8a239fd5d3f3d0d2bd705f6bca77aa17285b0d04`. This is a repository release-readiness review, not an independent security audit, deployment authorization, legal opinion, artwork license, or claim that Chog Survivor is live on Monad.

## Repository integrity

- The only baseline worktree item was the pre-existing untracked `design/chog-parchment-reference.png`; it was preserved and remains uncommitted.
- `src/ChogSurvivor.sol` remains unchanged at SHA-256 `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.
- There is no production deployment script. `script/local-anvil.sh` refuses any RPC other than `http://127.0.0.1:8545` and any chain other than 31338.
- `approvedGameAddress` is undefined outside validated local mode. Production cannot enable gameplay or history by setting an address variable.
- Milestone 12 evidence records a passing local browser journey, two game transactions, one transfer, 45 browser checks, and 32 responsive screenshots.

## Release-readiness findings

| Area | Verified behavior | Assumption or residual risk | Status |
|---|---|---|---|
| Ownership authorization | `act` compares `msg.sender` with canonical `ownerOf(tokenId)`; local, unit, transfer, and point-in-time fork tests cover owner and non-owner behavior. Approvals/operators are intentionally insufficient. | Production security inherits all canonical collection ownership and availability semantics. | Game behavior verified; production dependency blocked. |
| Token-bound progression | Character storage and events are keyed by token ID. Local E2E and Foundry transfer tests retain state across owners. | Burn/remint or token-ID reuse would expose retained state to a later holder. | Verified and accepted locally; production disclosure/governance approval required. |
| Daily restriction | Contract uses `block.timestamp / 86_400`; lock is token-bound and survives transfer. | A validator may choose a valid timestamp near UTC midnight. Browser time must never authorize action. | Verified; low timing risk requires disclosure. |
| Encounter determinism | `keccak256(CHOG_GENESIS, tokenId, day) % 6 + 1`; all six encounters and 18 outcomes are parity-tested. | The schedule is predictable. Players may skip days for favorable encounters and break streaks. | Verified, intentional, non-wager design. |
| History | Both events index token ID. Reader scans from the deployment block in 500-block chunks, filters at the RPC, deduplicates, orders by block/transaction/log index, and marks partial errors. | RPC archival/log limits and reorgs affect completeness. A stale deployment block after a local reset can appear empty when latest is below start. Production needs redundant logs and config monitoring. | Verified locally; production unavailable. |
| Transfer continuity | Old owner loses control; new owner gains it; progression, lock, and history remain. | Collection forced-transfer, freeze, burn, or remint powers remain unknown. | Verified locally and point-in-time on a fork; governance blocker remains. |
| Transaction UX | Local path rechecks chain, binding, and owner before signing; blocks duplicates; distinguishes rejection, submission, receipt failure, confirmation, and refresh failure; retains actual hash. | A state change between preflight and mining can still revert safely. Wallet/provider error strings are not standardized. | Verified locally; production path absent. |
| RPC/network failure | Chain ID, localhost URL, binding, ownership, and freshness gates fail closed. History discloses partial/unavailable results. | Public RPC reliability, finality, throttling, log range, and incident response are unproven. | Local safeguards verified; production operations blocked. |
| Wallet safety | User action and modal confirmation are required. The harness signs only for local accounts and targets. | Production wallet compatibility and chain-switch UX need a separate candidate matrix. | Local verified; production untested by design. |
| Metadata/images | Metadata is read-only, bounded to 128 KiB and 10 seconds, rejects production inline JSON and unsafe URI schemes, sanitizes text/URLs, and does not render authentic artwork. | `response.text()` may allocate content when a server omits or lies about `Content-Length`; gateway redirects and availability need policy. Metadata never authorizes gameplay. | Safe placeholder release; authentic artwork blocked. |
| Contract model | No custody, payable path, admin, proxy, pause, withdrawal, or upgrade path. Local tool/static reviews found no confirmed Critical/High/Medium issue. | These reviews are not an independent audit. Immutability prevents emergency pause or patching; replacement needs a new deployment and client migration. | Production security approval required. |
| Fixture isolation | Local script hard-codes localhost and chain 31338; UI labels the fixture and local transactions. | Standard Anvil credentials are public and unsafe outside local testing. | Verified. |
| Production configuration | Monad chain 143 and canonical collection remain configured for read-only ownership; game address and writes are absent. | Activation requires code changes and review, not a generic flag. | Correctly fail-closed. |

## Production activation checklist

Every item below is mandatory. An unchecked item means **NO-GO**.

### Canonical NFT dependency

- [ ] Obtain the canonical deployment transaction, block/hash, deployer/factory, creation input, verified source, compiler settings, constructor inputs, ABI, and reproducible runtime bytecode.
- [ ] Recheck chain 143, address, runtime code/hash, ERC-721 compatibility, representative and absent-token `ownerOf`, transfers, and metadata at a recorded block immediately before deployment.
- [ ] Map and approve every owner/admin/role, proxy/delegatecall/beacon/diamond path, multisig/timelock, pause/freeze/blacklist, mint/burn/remint, forced-transfer, approval override, operator restriction, and metadata authority.
- [ ] Obtain written accountable Chog governance approval for the immutable `ownerOf` dependency and incident posture.

### Contract and product approval

- [ ] Commission an independent security review of the exact frozen source, compiler configuration, bytecode, external-call assumptions, event schema, and deployment artifact; resolve or accept findings explicitly.
- [ ] Approve deterministic predictability, UTC-boundary behavior, transfer persistence, burn/remint/token-ID reuse, balance, titles, achievements, and no-pause/no-upgrade limitations.
- [ ] Record artifact hashes, ABI hash, bytecode/immutable expectations, source license, and reproducible build transcript.
- [ ] Define the replacement strategy: a defect requires a new contract; the frozen contract cannot migrate or alter old state.

### Deployment authorization

- [ ] Identify accountable deployment owners and approvers; define multisig/hardware-wallet custody, quorum, simulation, nonce/gas policy, and separation of duties.
- [ ] Approve the exact chain ID, deployer, creation bytecode, gas parameters, expected address if deterministic, and transaction before broadcast.
- [ ] Conduct a reviewed dry run and final go/no-go meeting.
- [ ] Broadcast only after explicit authorization; record receipt, address, block/hash, runtime code, immutable `CHOG_GENESIS`, and constructor result.
- [ ] Verify source/ABI/compiler settings on approved explorers and independently compare runtime bytecode.

### Frontend and operations

- [ ] Approve the production game address and deployment start block as reviewed source-controlled configuration.
- [ ] Add a separately reviewed production write path pinned to chain 143, exact game address/code hash, canonical binding, current owner, supported wallet, and explicit confirmation. Never reuse the local authorization mechanism as a production switch.
- [ ] Establish redundant authenticated RPC providers without bundling secrets; test reads, writes, receipts, finality, log pagination, rate limits, archival access, and failover without redirecting to local RPC.
- [ ] Validate history completeness from the verified start block and define confirmation-depth/reorg policy.
- [ ] Monitor RPC health, game bytecode, collection bytecode/authorities, ownership-read failures, reverts, event gaps, and frontend configuration integrity.
- [ ] Prepare runbooks for RPC outage, collection pause/upgrade/burn, reorg, bad frontend release, incomplete history, compromised credentials, and contract defects.
- [ ] Define frontend/config rollback, user communication, evidence retention, and recovery ownership. The immutable contract cannot be paused or rolled back.
- [ ] Complete production-candidate wallet/browser/responsive/accessibility tests and obtain release, legal, artwork, and governance sign-offs.

## Official Chogathon requirements

Primary source checked on 2026-10-13: [Chogathon 2026 official site](https://chogathon.chog.xyz/). The page identifies itself as Chogathon 2026 and was served over HTTPS. Findings below distinguish explicit requirements from missing or conflicting information.

| Item | Finding | Confidence |
|---|---|---|
| Submission deadline | October 23, 2026 at 15:00 UTC, repeated in submission instructions and countdown copy. | VERIFIED. |
| Build period | Two weeks / 14 days, followed by seven days of judging. | VERIFIED. |
| Eligibility | Solo or team; any category; vibecoding allowed. Dashboard copy indicates teams up to five including the lead. Age, geography, sanctions, employee/conflict, and legal eligibility are not published on the accessible page. | Partly VERIFIED; legal eligibility UNVERIFIED. |
| Registration cutoff | The page conflicts with itself: visible copy says October 11 at 13:00 UTC, another card says October 9 at 15:00 UTC, and application code derives October 9 at 15:00 UTC. At verification time the UI reports registration closed. | CONFLICTING; confirm with organizer. |
| Platform | `https://chogathon.chog.xyz/`; sign-in supports X, Discord, GitHub, or Google. | VERIFIED. |
| Mandatory content | Project/team and Discord/X handles; description and novelty; why Chog is essential; working demo; testing instructions; demo video; repository, stack, pre-existing work; feedback/usage and next steps. The form also requires contact email. | VERIFIED. |
| Video | YouTube or Google Drive; up to three minutes; required for an initial project submission. | VERIFIED. |
| Repository | Deliverables request a repository and pre-existing-work disclosure. The page does not say it must be public; the form accepts GitHub URL and judge-access notes. | Required; public visibility UNVERIFIED. |
| Judging | NFT essentiality is a pass/fail gate. Novelty 30%, Fun 20%, Retention 20%, Clarity 15%, Execution 15%; meaningful `$CHOG` is optional bonus. Judging UI lists novelty then retention as tie-breakers. | VERIFIED. |
| Required network | The page says “powered by Chog NFTs” but names no required chain, mainnet, or testnet. | UNVERIFIED. |
| Local demo accepted | No explicit acceptance or rejection of local-only demos appears. A working demo and testing instructions are required. | UNVERIFIED; written confirmation needed. |
| Live Monad deployment mandatory | No such requirement appears. Absence is not affirmative approval to omit it. | NOT STATED; confirm. |
| NFT/artwork | NFT essentiality is mandatory. The site publishes no entrant artwork license, trademark permission, or metadata-reuse terms. | NFT gate VERIFIED; rights UNVERIFIED. |
| Prize context | Planned $15,000 pool and 50 qualifying winners; fine print permits reduction to $10,000 if quality threshold is unmet. | VERIFIED, informational. |

Immediate risk: if the owner was not registered before the now-closed/conflicting cutoff, the portal may reject a new project despite the October 23 submission deadline. Confirm account status with the organizer now. No registration or submission was attempted here.

## Artwork and branding approval

Before using an authentic Chog Genesis image, Chog badge/logo, likeness, or protected mark, obtain written permission that identifies: the exact assets and marks; reproduction, display, crop, resize, composite, animation, screenshot and video rights; use in the application, repository, README, hackathon portal, judging, presentations and promotion; commercial/promotional status, territory, duration and platform sublicensing; attribution/brand rules; metadata-image display rights; revocation/takedown procedure; and confirmation that the grantor controls the relevant rights.

Until then, use the code-native seal/parchment placeholder and factual text identity. Metadata availability and NFT ownership are not copyright or trademark licenses.

## Demo, submission, and go/no-go

Use the clean-chain workflow in the README and `frontend/TASK_12.md`. Record the address and block emitted by each deployment. The standard fixture assigns 1001/1002 to wallet A and 2001 to wallet B. The automated harness proves A's action, lock, transfer, retained state/history, isolated time advance, and B's action; the normal UI never transfers NFTs or advances time.

The complete draft, narration, and recording checklist are in `docs/HACKATHON_SUBMISSION_DRAFT.md`.

| Target | Decision | Reason |
|---|---|---|
| Local contract-backed demonstration | **GO**, conditional on organizer acceptance and an existing valid registration. | Functionality and isolation are evidenced. |
| Placeholder-based submission package | **GO WITH CONDITIONS**. | Replace identity/URL placeholders, record real video, verify links, and confirm registration/local-demo acceptance. |
| Monad production gameplay | **NO-GO**. | Governance/source, independent review, deployment authorization, address/start block, operations, rights, and frontend approval remain incomplete. |

## Deliverables and remaining approvals

- Updated `README.md` covering product, architecture, local setup, evidence, limitations, and production status.
- `docs/HACKATHON_SUBMISSION_DRAFT.md` with submission copy, narration, recording checklist, placeholders, and compliant artwork option.
- This release review and exact production activation checklist.
- Still required: organizer answers and registration; team/contact/URLs; recorded video; repository/judge access choice; artwork permission or placeholder approval; governance evidence; independent security review; product/balance acceptance; deployment authorization; and operations plan.

## Final QA results

Executed on 2026-10-13 after the documentation changes:

- `forge test`: **38 passed, 0 failed, 6 skipped**. The skipped cases are the six Monad-fork tests because `MONAD_RPC_URL` was intentionally unset; no public network was used.
- `npm test -- --reporter=dot`: **124 passed across 11 files**.
- `npm run typecheck`: passed.
- Production `npm run build`: passed; dependency annotation warnings from Rollup were non-fatal.
- Local-mode `npm run build` with exact localhost/31338 configuration: passed with the same non-fatal dependency warnings.
- Fresh `npm run test:e2e`: passed with exit code 0 against clean Anvil chain 31338. It repeated ownership discovery, two browser-signed game actions, transfer continuity, next-day action, token history, 45 checks, 32 screenshots, no horizontal overflow, and no console errors.
- `git diff --check`: passed.
- Frozen source hash: passed and unchanged.

No Monad RPC, production wallet, registration endpoint, or submission action was used.

## Files changed

- `README.md` — submission-ready product overview, architecture, local demo, evidence, limitations, and production status.
- `docs/HACKATHON_SUBMISSION_DRAFT.md` — portal copy, demo narration, recording checklist, placeholders, limitations, and artwork-safe option.
- `frontend/TASK_13A.md` — readiness findings, official-source research, activation checklist, QA, approvals, and go/no-go assessment.
- `frontend/reports/task12/evidence.json` — refreshed by the clean regression run with the same deterministic local addresses and transaction journey plus a new execution timestamp.

Milestone 13B was not started. No Monad transaction, deployment, registration, or submission occurred.

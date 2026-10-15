# Chog Survivor frontend

React 18 + TypeScript + Vite, Wagmi/Viem and TanStack Query. The current default/public build is a clearly labeled **walletless simulation**. Real contract-backed play is supported only on an existing isolated Anvil deployment (chain 31338). No production game deployment or write path is approved.

Start with the [root README](../README.md), [judge quick-start](../docs/JUDGE_QUICK_START.md), [environment/deployment guide](../docs/DEMO_DEPLOYMENT_GUIDE.md) and [prepared real local evidence](../docs/evidence/task4h-2006/README.md). No demo/repository/video publication is implied.

## Requirements and safe demo commands

Node 22 and npm 10 were verified. Use `npm ci` in a clean checkout with the existing lockfile. A wallet is optional for simulation; genuine ownership reads require an injected wallet on Monad 143 and working RPC.

From `frontend`:

```sh
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run dev -- --host 127.0.0.1
```

Use the same overrides with `npm run build` for static `dist` output. `npm run typecheck` and `npm test` do not submit transactions. The explicit environment overrides are needed because Vite loads developer `.env.local` even during a production build. See `.env.example`; no frontend variable may contain a private credential.

`VITE_CHOG_SURVIVOR_ADDRESS` is unused by current code and cannot enable a public game. Valid local mode requires `VITE_CHOG_ENV=local`, exact localhost RPC, verified local game address and deployment block for history. Never put local settings on public hosting. `contracts.ts` is the authority.

## Simulation versus contract-backed state

Walletless Adventure offers Survivor's Trial, Timing and Story, completion/retry/Skip and repeatable base-value previews. Demo stats and achievement marks are fixtures: no saved progression, signature, confirmed reaction or new journal entry. Selecting an NFT activates ownership restrictions; an unselected demo is the simplest judge path.

Local Anvil play retains current-owner authorization, one action per NFT per UTC day, block-pinned previews, verified receipt reactions/achievements and token-filtered event history. Transfer changes the controller while keeping the survivor's progression, journal and lock. Current owner and historical acting owner remain distinct.

Do not run `npm run test:e2e`, real Task 4H execution scripts, fixture installation/deployment or time-changing tools during submission preparation. They can mutate the existing local chain. The mock browser regression `node scripts/mini-game-integration-smoke.mjs` uses intercepted RPC/wallet fixtures instead.

## Historical milestone notes

The sections below retain historical implementation notes, not current release approval or test counts. Consult the current guides above where older descriptions differ. Runtime artwork remains provisional per [ASSET_INVENTORY.md](ASSET_INVENTORY.md); fonts and typography remain unchanged.

## Survivor Profile — Milestone 11.2

Use the existing **Character** navigation button. Manual input accepts unsigned
decimal IDs from zero through `2²⁵⁶ − 1`; entered/requested IDs remain distinct
from a verified NFT identity. There is no owned-token enumeration, holdings list,
indexer or claim that a wallet has zero Chogs.

The profile distinguishes disconnected/wrong-network states, loading, verified
current controller, another controller, RPC failures, zero-owner responses and
collection reverts. Only explicit `ERC721NonexistentToken` error evidence is
labeled nonexistent; ambiguous reverts do not establish burn/nonexistence.
The canonical collection's absent-token error format remains unverified.

Ownership queries use account/network-specific cache scope, refresh on mounting
and window focus, and poll every 30 seconds while the profile is open. A visible
refresh control rechecks ownership and enabled game reads. Pending/error reads
hide cached identity and progression. This is point-in-time read verification;
there is no transfer watcher or claim of live transfer testing.

If a separately approved deployment is configured and its binding matches,
the profile renders all CharacterView fields: XP, Trust, Scars, stored streak,
Unmarked run, action presence/day/outcome, encountered event types and permanent
achievement bits. Its title comes from `titleOf`, never a hardcoded fallback.
Achievement criteria explain the frozen rules; private counter progress is not
invented. These conditional game read paths are tested with mocks, not a live
game deployment.

Daily availability stays explicitly unverified. Stored action data alone cannot
establish the current chain UTC day. No chain timestamp, authoritative countdown
or action eligibility is inferred from the browser clock. One decision per NFT
per UTC day and transfer-persistent daily locks are explained in the profile.

Survival History is an intentional unavailable section. It has no fabricated
timeline, speculative log reader or external service. A game getter provides
aggregate/last-action state, not an enumerable action list; future chronological
history would require the approved deployment's token-filtered action logs.

Profile-specific styling preserves Home, Adventure, assets, fonts and wallet
configuration. Mobile navigation styling is scoped to the Character shell.
See `TASK_11_2.md` for validation evidence and screenshot review instructions.

## Parchment character sheet — Milestone 11.3

Character now uses a continuous antique parchment sheet inspired by the supplied
`design/chog-parchment-reference.png`: an ornate arched portrait placeholder,
survivor identity on the left, progression and daily record in the center,
eight achievement marks on the right, and a ruled Survival History journal
below. Tablet and phone layouts reorganize these sections into a scrollable sheet.
Lilita One is reused selectively with the existing Cinzel and IM Fell English
fonts. Texture, borders and ornaments are CSS/SVG presentation; no new bitmap
artwork was generated or external art service added. The reference is not a
runtime background or NFT portrait.

The 11.2 ownership queries, wallet/network gates and unavailable-data safeguards
are preserved. Only returned Trust and Scars values receive 0–100 meters. XP
and stored streak have numeric records with no invented level or milestone
threshold. Unknown achievements remain unavailable, rather than locked. The
portrait remains decorative even after an owner is verified, because no verified
NFT artwork source is available. The journal has no fabricated decisions.

See `TASK_11_3.md` for scoped files, responsive validation and screenshot paths.
Home, Adventure, wallet configuration, ABI, addresses and Solidity remain unchanged.

## Character ↔ Adventure journey — Milestone 11.4

The selected token ID stays in App state across both screens. Use **Adventure**
in the existing navigation from Character, then **View survivor profile** in
Adventure to return to the same token. No wallet or Chog holding is required
to explore the local demo.

Both screens now use `useSurvivorIdentity` and the same canonical `ownerOf`
query key, scoped by wallet account/chain and token arguments. Ownership is
rechecked on screen mount, window focus and 30-second polling. Cached identity
is hidden during loading, refetch or errors. Disconnected/unknown/wrong network,
unverified requests, current owner, another controller and collection/RPC
failures remain distinct. A typed but unsubmitted ID does not select an NFT.

Adventure's compact identity strip shows a verified NFT separately from the
**LOCAL DEMO** encounter and simulated HUD. Requested IDs are explicitly
unverified; another owner never becomes your controller. A visible ownership
refresh and profile return require no signing. The same numeric ID can seed
a device-UTC local simulation; it is not proof of the token's current chain
encounter or eligibility. Choices do not alter NFT progression or history.

Adventure still uses the existing fixture stats, base-delta previews and
unchanged popup. It performs no `eventFor`, `preview`, write, signature or
broadcast. Character's parchment JSX/CSS and conditional game state reads are
preserved. Source-backed parity tests compare every event/choice/outcome and
base effect with the frozen Solidity and rulebook. See `TASK_11_4.md` for
test evidence, screenshots and remaining limits.

## Your Survivors — Milestone 11.5

In Character, connect on Monad (143) and choose **Find my Chogs**. The collection's
independently observed `tokensOfOwner(address)` extension supplies candidates;
canonical `ownerOf` verifies every displayed token. Distinct verified counts must
match `balanceOf` at a pinned finalized block before results are called complete.
This is not ERC-721 Enumerable and uses no indexer, key or token/history scan.

Discovery is explicit and read only. Its expensive getter has a 50M-gas budget,
candidate verification caps at 24, and read deadlines are 20 seconds. Failed,
duplicate, mismatched or capped results never become a definitive empty inventory.
Partial results remain labeled; retry and manual token-ID entry stay available.
Results clear on account/chain/token changes, window focus and after 30 seconds.
Selecting a survivor rechecks current ownership through the existing shared
Character/Adventure identity flow; only the NFT token ID persists between screens.

Public/custom RPC gas limits, throttling or collection bytecode changes can disable
discovery. No verified pagination or artwork is assumed. Larger inventories are
partial. Game deployment, progression and history limitations remain unchanged.
See [the feasibility report](../docs/CHOG_DISCOVERY_FEASIBILITY.md) and
[TASK_11_5.md](TASK_11_5.md) for evidence and validation.

## Product disclosure

Progress belongs to numeric Chog Genesis token IDs, not wallets. It follows a
token transfer and, if the external collection permits it, a later reissue of
the same numeric ID inherits existing game history. The UI does not prove NFT
immutability, governance safety, source verification, or token-ID non-reuse.
Canonical-NFT governance verification still blocks mainnet deployment.

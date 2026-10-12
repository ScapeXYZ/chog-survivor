# Chog Survivor — Foundry backend

This repository contains the implemented, immutable Chog Survivor Solidity backend and its
Foundry unit, fuzz, invariant, reference-model, achievement, security, and balance-analysis
tests. It is a noncustodial NFT-native daily adventure for the fixed Chog Genesis collection
address `0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763`.

The repository contains no deployment script, broadcast artifact, wallet credential, private key,
or live-chain transaction workflow. Local tests install an ERC-721 mock with `vm.etch` at the
canonical address; that does not verify the target-chain collection.

## Scope

One immutable game contract will read ownership from Chog Genesis. It will never custody, transfer, approve, stake, escrow, mint, burn, price, or otherwise move NFTs or funds. Character history belongs to `tokenId`, not a wallet, and follows the NFT after transfer.

There are no tokens, cash rewards, escrow, AI, PvP, off-chain decision engine, or real-time physics. A current NFT owner can take at most one action for that token in each UTC day.

## Layout

- `docs/SPEC.md` — canonical contract/interface and state specification
- `docs/GAME_RULES.md` — events, rewards, modifiers, badges, and titles
- `docs/SECURITY.md` — threat model and invariants
- `docs/TEST_PLAN.md` — implementation test plan
- `docs/BALANCE_REPORT.md` — independent test-only balance analysis
- `docs/SECURITY_REVIEW.md` — local security review and release blockers
- `docs/ABI_BYTECODE_REVIEW.md` — artifact and deployment-readiness review
- `docs/COVERAGE_REVIEW.md` — production coverage and traceability review
- `src/ChogSurvivor.sol` — immutable game contract
- `test/` — Foundry validation suites

## Local commands

```sh
forge build
forge test
forge fmt --check
```

These compile and validate the local backend; they do not deploy or transact. The full local
suite currently includes unit, fuzz, reference-model, balance-analysis, achievement, and
128,000-call invariant coverage. Copy `.env.example` to a local `.env` only for a future
read-only workflow. Never commit `.env`.

## MVP decisions and approval gate

The MVP is intentionally immutable: its Chog Genesis binding and rules have no admin or upgrade route. Waiting for a deterministic event is allowed, but missing a day breaks the streak. Burned/nonexistent NFTs cannot preview or act; their token-keyed historical state remains. The numerical table is provisional pending simulations—these documents do not claim playtesting.

The MVP is not deployed by this repository. Before any deployment, complete the documented
target-chain collection verification, chain-selection, bytecode/immutable comparison, source
verification, and human balance review gates. A correction requires a separately deployed
contract because the rules and collection binding are immutable.

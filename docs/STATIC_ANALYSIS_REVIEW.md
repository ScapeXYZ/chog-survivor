# Static Analysis Review — Stage 2D Task 8E.3

Date: 2026-10-12. Scope: `src/ChogSurvivor.sol` only. No production Solidity,
gameplay rules, Foundry/deployment configuration, dependency, signing, broadcast,
or live-chain action was changed.

## Assessment: CONDITIONAL — human review required

The requested pinned scans completed against the project's actual Foundry settings
and cached Solidity 0.8.28 compiler. Neither scan reported a confirmed Critical,
High, or Medium vulnerability. Their reported items are triaged below; the low
timestamp/availability design risks remain release-review items. This result is
not a claim that the contract is secure: static analysis does not validate the
canonical collection's deployed code, gameplay intent, all economic outcomes, or
runtime behavior on the target chain. Stop here for human security/release review.

## Tooling and compiler verification

| Component | Verified result |
|---|---|
| Slither | `0.11.3` at `.venv-security/bin/slither` |
| Solhint | `5.0.5` at `.security-tools/solhint/node_modules/.bin/solhint` |
| Foundry | `forge 1.7.1`, commit `4072e48705af9d93e3c0f6e29e93b5e9a40caed8` |
| Solidity compiler | `solc 0.8.28+commit.7893614a.Linux.g++` at `/home/temitope/.local/share/svm/0.8.28/solc-0.8.28` |

The environment has no standalone `solc` on `PATH`. The venv's `solc-select`
wrapper stalled (`timeout 15s .venv-security/bin/solc --version` exited `124`).
The local Foundry/SVM cache contained the verified 0.8.28 binary above, so it was
passed explicitly to Slither. `forge config --json` confirms the production
compilation policy: Solidity `0.8.28`, EVM `cancun`, optimizer enabled, and
`optimizer_runs = 200`. `forge build --offline` succeeded using that cache.

## Reproducible commands and raw results

Commands were run from the repository root. Raw stdout and stderr, including the
commands and exit statuses, are in the generated ignored reports:

```sh
.venv-security/bin/slither . --compile-force-framework foundry \
  --solc /home/temitope/.local/share/svm/0.8.28/solc-0.8.28
# exit 255: Slither completed and returned its normal findings-present status

.security-tools/solhint/node_modules/.bin/solhint \
  --config /tmp/chog-solhint-0.8.28.json src/ChogSurvivor.sol
# exit 0
```

Slither invoked `forge clean`, `forge config --json`, and
`forge build --build-info --skip ./test/** ./script/** --force`, then analyzed
the production contract and its interface with 100 detectors. It reported 17
results; no findings were suppressed. The full output is
`reports/static-analysis/slither.txt`.

Solhint used this temporary, non-production configuration (not committed and not
used by Foundry/deployment):

```json
{
  "extends": "solhint:recommended",
  "rules": {
    "compiler-version": ["error", "0.8.28"]
  }
}
```

It produced one warning and zero errors. Its complete output is
`reports/static-analysis/solhint.txt`. Its update check printed a DNS error for
`registry.npmjs.org`; the installed local linter still completed with exit `0`.

## Finding triage

| Tool / report | Severity | Classification and relevant code path |
|---|---|---|
| Slither `weak-prng`: `eventFor` ([88](../src/ChogSurvivor.sol#L88)) | Low | Intentional deterministic schedule, not entropy or a wager/lottery source. `CHOG_GENESIS`, token ID, and UTC day make the next event predictable by design. This is a detector-context false positive, but predictable day selection and near-boundary timestamp influence remain documented gameplay risks; do not reuse this construction for randomness. |
| Slither `dangerous-strict-equalities`: `_earned` ([212](../src/ChogSurvivor.sol#L212), [217](../src/ChogSurvivor.sol#L217)); `_gateCount` ([226](../src/ChogSurvivor.sol#L226)); `_resolve` ([156](../src/ChogSurvivor.sol#L156), [167-168](../src/ChogSurvivor.sol#L167), [184](../src/ChogSurvivor.sol#L184)); `act` ([108](../src/ChogSurvivor.sol#L108)) | Informational | Seven reports are all intentional finite-state comparisons: exact achievement thresholds/mask completion, event ID, same-day replay protection, consecutive UTC days, and repeated outcomes. Input domains are bounded (`choiceId` 1–3; computed event/outcome ranges); no value-precision or external-oracle equality is involved. False positives. |
| Slither `unused-return`: `preview` `ownerOf` ([97](../src/ChogSurvivor.sol#L97)) | Informational | The call deliberately validates ERC-721 existence/revert behavior before resolving a preview. The owner address is irrelevant because preview is public. False positive; `act` separately consumes `ownerOf` for owner authorization at [103-104](../src/ChogSurvivor.sol#L103). |
| Slither `block-timestamp`: day derivation in `preview` ([98](../src/ChogSurvivor.sol#L98)) and `act` ([106-108](../src/ChogSurvivor.sol#L106)), propagated comparisons in `_resolve`, `_earned`, `_gateCount`, `_nextCount`, and `_titleValues` | Low | `block.timestamp / DAY` is intentionally the sole UTC-day input. A validator can select a timestamp within consensus tolerance; near midnight that can select an adjacent day, changing one-action-per-day, event, streak, and downstream achievement/title comparisons. The many propagated comparison locations are taint-derived reports, not separate timestamp reads. This is not a false positive as a design risk; acceptable only with the documented non-wagering/UTC-boundary assumption. |
| Slither `cyclomatic-complexity`: `_resolve` ([143-202](../src/ChogSurvivor.sol#L143)) complexity 16 | Informational | Maintainability/auditability warning, not a demonstrated exploitable condition. The resolver is a bounded calculation over fixed tables and clamped values, exercised by unit, fuzz, reference-model, and invariant tests. Human review should retain focused coverage when modifying it. |
| Slither naming: immutable `CHOG_GENESIS` ([10](../src/ChogSurvivor.sol#L10)) | Informational | Solidity-style preference only. The all-caps immutable clearly denotes the canonical collection binding and has no runtime effect. False positive for security severity. |
| Solhint `func-visibility`: constructor ([79](../src/ChogSurvivor.sol#L79)) | Informational | Solidity 0.7+ constructors do not take a visibility modifier. The rule itself advises ignoring constructors on modern Solidity. False positive; no source change is appropriate. |

## Manual review context and limitations

The scan results do not change the manual findings in
[SECURITY_REVIEW.md](SECURITY_REVIEW.md):

- `ownerOf` is an external fixed-collection dependency. A reverted, paused,
  nonstandard, or governance-upgraded collection can block `preview`/`act`; this
  is a Low availability risk, not an authorization escalation in this contract.
- `act` compares `msg.sender` with canonical `ownerOf`, intentionally excluding
  approvals/operators. It commits state before logging; only `ownerOf` is external,
  and a view call is made through `STATICCALL`.
- Saturating counters and guarded/clamped arithmetic prevent demonstrated
  overflows; static tools do not replace boundary and invariant testing.
- Neither analyzer proves deployed collection identity/code, target-chain behavior,
  economic balance/fairness, player UX around UTC boundaries, or absence of all
  vulnerabilities. Slither's findings-present exit is not a build failure, and
  Solhint's clean error count is not a security guarantee.

## Required verification commands

| Command | Exact result |
|---|---|
| `forge fmt --check` | Exit `0`; no output (format check passed). |
| `forge build --offline` | Exit `0`; compiled 24 files with Solc 0.8.28. Compiler and Foundry emitted non-fatal warnings: a test-only mutability suggestion, test-only casts/timestamp usage, and production `unsafe-typecast` advisories at the UTC-day and guarded clamp casts. |
| `forge test -vv` | Exit `0`; 33 passed, 0 failed, 0 skipped across four suites: BalanceAnalysis 1, ChogSurvivorAchievements 12, ChogSurvivor 10, and ReferenceModel 10. |

## Test-count reconciliation (Task 8E.4)

`forge test --list` discovers **34** functions in the current tree: the 33
`test*` functions reported by the ordinary `forge test -vv` execution, plus
`ChogSurvivorInvariantTest.invariant_allStoredBoundsAndMasksHold` in
`test/ChogSurvivorInvariant.t.sol`. The latter is the sole numerical difference.
It was discovered but was not emitted as a suite by the recorded `forge test -vv`
run; its 33-pass total is therefore not evidence that a test was deleted, renamed,
skipped by `foundry.toml`, or filtered by an environment variable.

The project documentation independently specifies the invariant campaign as a
separate command (`forge test --match-contract ChogSurvivorInvariantTest -vv`) in
`docs/COVERAGE_REVIEW.md`. Thus the earlier **34-pass** baseline is reconcilable
only as a count that included this separately scoped invariant; the latest **33**
is the exact ordinary-run total. There is no `.git` worktree metadata in the
provided workspace (`git status` and `git diff` both return “not a git repository”),
so historical deletion/rename claims cannot be independently proved here. Current
source/discovery evidence shows five test files, no configured match/no-match/skip
filter, and no missing current test.

Required human release review remains: independently verify the canonical
collection on the target chain (including code and governance/upgrade posture),
approve the UTC-boundary/predictable-event gameplay model, and review this
triage before deployment.

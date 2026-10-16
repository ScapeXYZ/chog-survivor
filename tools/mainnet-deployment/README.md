# Local MetaMask deployment review tool

**Preparation only; stop before any real wallet request.** This standalone operator tool is not part of the public game frontend. Read [Task 6F guide](../../docs/TASK_6F_METAMASK_SIGNING_GUIDE.md) and the existing 6D/6E approval gates first.

From repository root:

```bash
node tools/mainnet-deployment/server.mjs
```

Open `http://127.0.0.1:9546` yourself. No browser/wallet/preflight opens automatically. Keep it on loopback; no tunnel, public hosting, dependency installation or signing key is needed. The reviewed existing frontend dependency installation supplies esbuild and Viem.

- Candidate/source/artifact and unsigned-payload hashes are pinned; fixed sender/chain/nonce/data/gas/fee/value values cannot be entered in a form.
- `authorization.json` remains `NOT_AUTHORIZED`. Do not fill approval reference strings merely to unlock a button. The independent path requires genuine external approvals; the unaudited path instead requires explicit owner risk and exact-transaction acceptance.
- Explicit MetaMask connection is optional for inspection. Preflight is read-only, same-origin and internally restricted to two public RPC providers. MetaMask is never switched automatically.
- A separate confirmation step for the explicitly selected independent or unaudited owner path precedes any future owner-requested wallet action. The standard MetaMask final confirmation signs **and broadcasts**, not just an offline signature. No real wallet was used during development/validation.
- Final checks re-read the selected authorization/owner decision, refresh state and recheck wallet account/network/context. An attempt marker is stored before the sole wallet write. No automatic retry, reset or broadcast endpoint exists. Use one tab/profile; the marker is not a global nonce lease.
- JSON downloads contain local review evidence, not wallet secrets, and are never automatically uploaded.

New-code checks only:

```bash
node tools/mainnet-deployment/model.test.mjs
node tools/mainnet-deployment/browser-test.mjs
```

The browser harness injects a synthetic provider that rejects the final request, intercepts all nonlocal browser traffic and supplies fake read-only preflight results. Its future-authorization fixture is passed in memory; it never edits the checked-in authorization record. It does not validate genuine MetaMask UI, final signed bytes or provider reputation. The current locked record is also tested against forced DOM clicks.

The exported `createReviewServer` configuration/preflight arguments exist for deterministic tests; the CLI accepts no override and always uses the pinned candidate/local authorization file. There is no HTTP configuration/authorization mutation endpoint. The server never signs or sends raw transactions.

## Explicit unaudited owner path

The owner has chosen to prepare without independent security review. Read [the owner-risk decision and exact stop point](../../docs/UNAUDITED_MAINNET_DEPLOYMENT_RISK_ACCEPTANCE.md). This adds a separate path; the default independent-review path and its real-approval requirements remain unchanged. `owner-risk-acceptance.json` records preparation intent, not an audit or final transaction consent. Do not copy its fields into `authorization.json` or invent reviewer references.

The owner path prominently discloses the missing audit, governance/custody attestations, provider clearance and immutable/non-pausable contract. It requires individual risk/exact-field/cap acknowledgements, the exact digest and acceptance phrase, explicit arming, and a separate final action. **Stop before the final wallet request in the current task.** Any real MetaMask confirmation signs and broadcasts.

Both providers now simulate creation and must return the exact linked runtime; every preflight revalidates source/artifact, binding and spending/reserve. New collector tests run with `node tools/mainnet-deployment/preflight.test.mjs`. All tests use synthetic wallets/readers; a read-only live preflight requires network access but never a signer. No genuine wallet or provider clearance is claimed.

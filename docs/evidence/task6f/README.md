# Task 6F evidence

See [signing guide](../../TASK_6F_METAMASK_SIGNING_GUIDE.md). **No real wallet/signature/submission.** Current authorization remains NOT_AUTHORIZED.

- `policy-tests-final.log`: 10 new fail-closed policy tests passed. Earlier logs preserve initial runs; Node's parent `--test` invocation reported a file-level result, so the final direct invocation records every individual case.
- `browser-tests-verified.log`: 43 checks passed with synthetic providers, blocked external browser requests and isolated loopback servers. The current locked gate, explicit stages, wrong-chain rejection, exact final request, persistent retry marker, Host/origin checks and missing broadcast route were exercised. A fake provider rejects any permitted test request; there is no signer.
- Earlier browser logs retain the sandbox Chromium launch failure and a harness Host-header probe that used fetch, which did not preserve the override. Final verification uses raw HTTP. These failed attempts are not successful results.
- `live-readonly-preflight.json`: new server preflight exercised against two actual public providers, with exact creation data/caps and bounded eth_call. Only read-only RPC; no wallet. Captured state is point-in-time, not authorization or a future quote.
- `source-preservation.json`: original 145 Task 6D source/artifact/config inputs preserved, along with the exact 6E candidate; prior evidence directories unchanged.
- `owner-metamask-observation.json`: owner attests control through MetaMask; no signature challenge or wallet-secret access.
- `packet-files.sha256`: exact tool/guide/evidence hashes, excluding checksum file itself. Verify from repository root. Review these alongside, rather than substituting for, the existing 6D manifest.

No unchanged game/contract/frontend suite or build was repeated. New tool policy/browser tests were rerun when new guard code or the harness changed. The live preflight checks only the new read-only path. Startup bundle compilation uses existing dependencies and never modifies frontend dist, source or Vercel settings.

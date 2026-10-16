# Task 7A evidence

- `verification.json`: authoritative two-provider receipt, creation, finality, full runtime/NFT binding and state comparison; `rpc-transcript.json` retains public raw requests/replies.
- `deployment-manifest.json`: verified deployment plus explicit pending source/publication status.
- `offline-capture-check.json`: actual signed transaction hash reconstruction, sender recovery and prepared-candidate parity; uses only public chain signature data.
- `source-verification-input.json`, compiler output and parity result: exact local source-publication candidate, not submitted. See `SOURCE_VERIFICATION_PREPARATION.md`.
- Frontend suite/build/browser logs: 391 unit tests, 29 real-manifest/synthetic-wallet browser checks, 49 production artifact checks. No genuine wallet or transaction exercised.
- `preservation-and-artifacts.json`: prior evidence, intentional source changes, unchanged contract/artwork/fonts/hosting config, scoped secret-pattern review and exact temporary build file inventories.
- Failed sandbox/invalid-choice transcripts and inherited/stale-output build logs retain preparation failures. The final production candidate is `/tmp/chog-task7a-production-reviewed`; earlier `/tmp/chog-task7a-production` includes stale local-mode assets and is not a release candidate.

Reproduce offline checks from the repository root with `node frontend/scripts/task7a-verify-captured.mjs`. Run frontend tests/builds from `frontend`; browser scripts require loopback/Chromium permission. `node scripts/mainnet-enabled-browser.mjs --verified-manifest` uses intercepted RPC and fake MetaMask/Rabby providers with no signer. `node scripts/public-demo-preflight.mjs --artifact-dir /tmp/chog-task7a-production-reviewed` checks the pinned local simulation artifact.

The live collector is read-only, fixed-target and writes evidence exclusively (`wx`), so do not rerun into this completed directory or overwrite its captures. Review/choose a new evidence directory in a deliberate follow-up if a fresh capture is needed. No prior source/evidence directory is removed or reset.

`packet-files.sha256` pins this packet, changed/new source/docs and the current source manifest. The build inventories separately pin temporary output files; previous task packets remain historical evidence. No signing/broadcast/source-submission/push/publication command is included.

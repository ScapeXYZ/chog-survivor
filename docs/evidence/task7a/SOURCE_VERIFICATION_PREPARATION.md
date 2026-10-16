# Explorer source-verification preparation — not submitted

Target: Monad mainnet 143, `0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390`.

Prepared local input: `docs/evidence/task7a/source-verification-input.json`.
Compiler **v0.8.28+commit.7893614a**, Solidity Standard JSON, contract **src/ChogSurvivor.sol:ChogSurvivor**, optimizer **enabled / 200**, EVM **Cancun**, viaIR **false (omitted/default)**, metadata bytecodeHash **ipfs**, no linked libraries, constructor arguments **empty**. Exact metadata remapping is retained; do not flatten or change source paths/settings. SPDX is MIT.

The prepared input was compiled offline with the existing pinned 0.8.28 compiler. Full creation bytes and runtime template exactly match the frozen artifact, including metadata. `source-preparation-check.json` records the result; `source-verification-output.json` retains compiler output. Constructor immutables are independently checked against both deployed runtimes and `CHOG_GENESIS()` reads.

After a separate explicit source-publication approval only, the owner may open [MonadScan Verify & Publish](https://monadscan.com/verifyContract?a=0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390), select Solidity Standard JSON Input and the exact compiler above, and review the local file/contract/settings before submission. This is **source publication**, even though it is not a blockchain transaction. No submission, API credential, wallet ownership signature or upload was performed. Do not use a wallet ownership-verification/sign-message flow in place of source matching.

[MonadScan's verification guidance](https://info.monadscan.com/how-to-verify-contracts/) describes source/compiler matching and Standard JSON for compiler settings. Its guidance page returned HTTP 403 to automated opening here; the indexed official result was available. No verified-source badge/status is claimed for the deployed contract. No Sourcify request was made.

After any later authorized submission, independently inspect the explorer's exact-match result, compiler/settings, source and contract address before marking explorer source verified. Runtime verification in Task 7A is already established independently of an explorer badge.

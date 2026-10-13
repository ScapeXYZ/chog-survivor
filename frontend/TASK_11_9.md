# Milestone 11.9 — verified metadata, safe portrait identity

## Canonical evidence

On 2026-10-13 an unsigned read of Monad chain `143` returned this canonical
`tokenURI(1425)` value:

```text
ipfs://bafybeid4ybujnscdipkno7ps5utqelp5ry5ryreqhay3zhgk3a6x4jruqu/917.json
```

This verifies that `tokenURI(uint256)` is available for that observed token. It
does not prove collection source, metadata permanence, schema, or artwork
rights. A bounded fetch through `ipfs.io` returned HTTP 429, so gateway
reliability is not assumed. The art brief, checklist, and governance review
require written permission. No such permission was found; authentic artwork is
not integrated or approved.

## Implementation

`nftMetadata.ts` treats all metadata as untrusted. It accepts HTTPS and IPFS
metadata only with a 128 KiB limit and 10-second abort timeout. Unsafe schemes,
credential URLs, malformed JSON, oversized responses, and unsafe image schemes
are rejected. Inline JSON is accepted only for the local fixture. No image,
SVG, HTML, or remote content is rendered. Image URLs remain parsed metadata
only, because artwork rights are unresolved.

The portrait caption can show local fixture metadata, followed by an explicit
artwork-withheld notice. Token ID and `ownerOf` remain authoritative identity.
Metadata failures cannot change authorization, gameplay, progression, or
history. The fixture returns local-only JSON named **LOCAL TEST NFT — NOT CHOG
GENESIS**, with no artwork or traits.

## Reproduction

```sh
cast chain-id --rpc-url https://rpc.monad.xyz
cast call 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763 \
  'tokenURI(uint256)(string)' 1425 --rpc-url https://rpc.monad.xyz
```

Run `forge test` at root and `npm run typecheck`, `npm test`, and `npm run
build` in `frontend`. No Monad transaction, signature, indexer, remote script,
or artwork reuse occurs. Production artwork remains blocked pending an
authenticated rights grant and reviewed metadata policy. Chromium/CDP is absent
here; start Chromium with `--remote-debugging-port=9222` to reproduce smoke
screenshots locally.

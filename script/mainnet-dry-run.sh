#!/usr/bin/env bash
# Deliberately accepts no flags and cannot broadcast or load a signing key.
set -euo pipefail
[[ $# == 0 ]] || { echo 'Arguments are forbidden; this entrypoint is dry-run only.' >&2; exit 1; }
cd "$(dirname "$0")/.."
sha256sum --check <<'HASH'
5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7  src/ChogSurvivor.sol
HASH
FORGE_BIN="${CHOG_FORGE_BIN:-forge}"
"$FORGE_BIN" --version | head -1
"$FORGE_BIN" script --help | rg -- '--network' >/dev/null || { echo 'Install/review Monad-capable Foundry 1.8+ in a separate toolchain first.' >&2; exit 1; }
: "${MONAD_DEPLOYER:?Set the approved public deployer address (no key)}"
"$FORGE_BIN" script script/PrepareMonadMainnet.s.sol:PrepareMonadMainnet --rpc-url https://rpc.monad.xyz --chain 143 --network monad --offline --gas-estimate-multiplier 100 --sender "$MONAD_DEPLOYER"

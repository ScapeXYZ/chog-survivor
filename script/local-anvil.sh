#!/usr/bin/env bash
set -euo pipefail

# This script is intentionally hard-wired to an isolated local endpoint.
RPC_URL="${CHOG_LOCAL_RPC_URL:-http://127.0.0.1:8545}"
EXPECTED_CHAIN_ID=31338
CANONICAL=0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763
ACCOUNT_A="${CHOG_LOCAL_ACCOUNT_A:-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266}"
ACCOUNT_B="${CHOG_LOCAL_ACCOUNT_B:-0x70997970C51812dc3A010C7d01b50e0d17dc79C8}"

if [[ "$RPC_URL" != "http://127.0.0.1:8545" ]]; then
  echo "Refusing non-local RPC URL: $RPC_URL" >&2; exit 1
fi
if [[ "$(cast chain-id --rpc-url "$RPC_URL")" != "$EXPECTED_CHAIN_ID" ]]; then
  echo "Refusing RPC: expected isolated chain $EXPECTED_CHAIN_ID" >&2; exit 1
fi

case "${1:-}" in
  install)
    forge build --offline >/dev/null
    CODE="$(forge inspect src/LocalCanonicalTestNFT.sol:LocalCanonicalTestNFT deployedBytecode)"
    cast rpc --rpc-url "$RPC_URL" anvil_setCode "$CANONICAL" "$CODE" >/dev/null
    cast send --unlocked --rpc-url "$RPC_URL" --from "$ACCOUNT_A" "$CANONICAL" 'mint(address,uint256)' "$ACCOUNT_A" 1001 >/dev/null
    cast send --unlocked --rpc-url "$RPC_URL" --from "$ACCOUNT_A" "$CANONICAL" 'mint(address,uint256)' "$ACCOUNT_B" 2001 >/dev/null
    cast send --unlocked --rpc-url "$RPC_URL" --from "$ACCOUNT_A" "$CANONICAL" 'mint(address,uint256)' "$ACCOUNT_A" 1002 >/dev/null
    echo "Fixture installed at $CANONICAL on local chain $EXPECTED_CHAIN_ID"
    ;;
  deploy)
    forge build --offline >/dev/null
    forge create --broadcast --rpc-url "$RPC_URL" --unlocked --from "$ACCOUNT_A" src/ChogSurvivor.sol:ChogSurvivor
    ;;
  verify)
    cast call --rpc-url "$RPC_URL" "$CANONICAL" 'ownerOf(uint256)(address)' 1001
    cast call --rpc-url "$RPC_URL" "$CANONICAL" 'balanceOf(address)(uint256)' "$ACCOUNT_A"
    cast call --rpc-url "$RPC_URL" "$CANONICAL" 'tokensOfOwner(address)(uint256[])' "$ACCOUNT_A"
    ;;
  *) echo "Usage: $0 {install|deploy|verify}" >&2; exit 64;;
esac

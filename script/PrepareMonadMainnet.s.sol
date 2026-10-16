// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {Script} from "forge-std/Script.sol";
import {ChogSurvivor} from "../src/ChogSurvivor.sol";

/// @notice Reproducible deployment candidate. No keys are read by this script.
/// @dev Without --broadcast, Foundry executes only in its isolated simulation.
contract PrepareMonadMainnet is Script {
    function run() external returns (ChogSurvivor game) {
        require(block.chainid == 143, "Monad mainnet only");
        require(address(0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763).code.length > 0, "NFT absent");
        vm.startBroadcast();
        game = new ChogSurvivor();
        vm.stopBroadcast();
        require(game.CHOG_GENESIS() == 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763, "binding mismatch");
    }
}

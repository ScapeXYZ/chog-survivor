// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {Test} from "forge-std/Test.sol";
import {ChogSurvivor} from "../src/ChogSurvivor.sol";
contract Task6CSmartWallet {
    function execute(ChogSurvivor game, uint256 token, uint8 choice) external { game.act(token, choice); }
}
/// @notice Gas samples only in ephemeral Forge state, using exact canonical runtime on a live fork.
contract Task6CGasTest is Test {
    address constant NFT = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763;
    ChogSurvivor game;
    address owner;
    function setUp() public {
        string memory rpc = vm.envOr("MONAD_RPC_URL", string(""));
        if (bytes(rpc).length == 0) { vm.skip(true, "Opt-in Monad gas fork: MONAD_RPC_URL unset"); return; }
        vm.createSelectFork(rpc);
        (bool ok, bytes memory data) = NFT.staticcall(abi.encodeWithSignature("ownerOf(uint256)",1425));
        require(ok); owner=abi.decode(data,(address)); game=new ChogSurvivor();
    }
    function testGasFirstAction() public { vm.prank(owner); game.act(1425,1); }
    function testGasRepeatAction() public {
        vm.prank(owner);game.act(1425,1);
        vm.warp((block.timestamp/86400+1)*86400+1);vm.prank(owner);game.act(1425,1);
    }
    function testGasThirtyDaysAchievements() public {
        uint256 earned;
        for(uint256 i;i<30;i++) {
            vm.warp((block.timestamp/86400+1)*86400+1);
            vm.prank(owner);ChogSurvivor.Preview memory p=game.act(1425,uint8(i%3+1));
            earned|=p.newlyEarnedAchievementMask;
        }
        assertGt(earned,0);
        emit log_named_uint("achievement mask across sequence",earned);
    }
    function testGasSmartWalletWrapper() public {
        Task6CSmartWallet wallet=new Task6CSmartWallet();
        vm.prank(owner);(bool ok,)=NFT.call(abi.encodeWithSignature("transferFrom(address,address,uint256)",owner,address(wallet),1425));
        require(ok);wallet.execute(game,1425,1);
    }
}

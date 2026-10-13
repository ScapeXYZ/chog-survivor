// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ChogSurvivor} from "../src/ChogSurvivor.sol";
import {LocalCanonicalTestNFT} from "../src/LocalCanonicalTestNFT.sol";

interface ILocalFixture {
    function mint(address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
    function tokensOfOwner(address owner) external view returns (uint256[] memory);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

/// @notice Isolated parity for the exact Anvil fixture arrangement. vm.etch is
/// Foundry-local only; it never contacts Monad or an external RPC.
contract LocalCanonicalFixtureTest is Test {
    address internal constant CANONICAL = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763;
    address internal constant alice = address(0xA11CE);
    address internal constant bob = address(0xB0B);
    ILocalFixture internal nft = ILocalFixture(CANONICAL);
    ChogSurvivor internal game;

    function setUp() public {
        LocalCanonicalTestNFT implementation = new LocalCanonicalTestNFT();
        vm.etch(CANONICAL, address(implementation).code);
        nft.mint(alice, 1001);
        nft.mint(bob, 2001);
        nft.mint(alice, 1002);
        game = new ChogSurvivor();
    }

    function testFixtureOwnershipBalanceAndDiscovery() public view {
        assertEq(nft.ownerOf(1001), alice);
        assertEq(nft.balanceOf(alice), 2);
        uint256[] memory ids = nft.tokensOfOwner(alice);
        assertEq(ids.length, 2);
        assertEq(ids[0], 1001);
        assertEq(ids[1], 1002);
        assertEq(
            nft.tokenURI(1001),
            "data:application/json,%7B%22name%22%3A%22LOCAL%20TEST%20NFT%20%E2%80%94%20NOT%20CHOG%20GENESIS%22%2C%22description%22%3A%22Local-only%20fixture%20metadata.%22%7D"
        );
    }

    function testFrozenGameBindsFixtureAndRejectsNonOwner() public {
        assertEq(game.CHOG_GENESIS(), CANONICAL);
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.NotTokenOwner.selector, 1001, bob));
        vm.prank(bob);
        game.act(1001, 1);
    }

    function testTransferChangesControllerButKeepsTokenStateAndDailyLock() public {
        vm.warp(86_400 + 1);
        vm.prank(alice);
        game.act(1001, 1);
        ChogSurvivor.CharacterView memory beforeTransfer = game.characterOf(1001);
        vm.prank(alice);
        nft.transferFrom(alice, bob, 1001);
        assertEq(nft.ownerOf(1001), bob);
        assertEq(game.characterOf(1001).xp, beforeTransfer.xp);
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.NotTokenOwner.selector, 1001, alice));
        vm.prank(alice);
        game.act(1001, 2);
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.AlreadyActed.selector, 1001, 1));
        vm.prank(bob);
        game.act(1001, 2);
        vm.warp(2 * 86_400 + 1);
        vm.prank(bob);
        game.act(1001, 2);
        assertEq(game.characterOf(1001).lastActionDay, 2);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ChogSurvivor} from "../src/ChogSurvivor.sol";

contract InvariantOwnerMock {
    mapping(uint256 => address) internal owners;

    function ownerOf(uint256 id) external view returns (address) {
        address owner = owners[id];
        require(owner != address(0), "NOT_MINTED");
        return owner;
    }
}

contract ActionHandler is Test {
    ChogSurvivor internal immutable game;
    address internal constant ALICE = address(0xA11CE);
    uint256[4] internal lastMask;

    constructor(ChogSurvivor game_) {
        game = game_;
    }

    function act(uint8 rawToken, uint8 rawChoice, uint8 rawGap) external {
        uint256 tokenId = bound(rawToken, 1, 4);
        uint8 choice = uint8(bound(rawChoice, 1, 3));
        uint64 nextDay = uint64(block.timestamp / 86_400) + uint64(bound(rawGap, 1, 3));
        vm.warp(uint256(nextDay) * 86_400 + 1);
        vm.prank(ALICE);
        game.act(tokenId, choice);
        uint256 current = game.characterOf(tokenId).achievementMask;
        assertEq(current & lastMask[tokenId - 1], lastMask[tokenId - 1], "achievement bit cleared");
        lastMask[tokenId - 1] = current;
    }
}

contract ChogSurvivorInvariantTest is Test {
    address internal constant CANONICAL = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763;
    address internal constant ALICE = address(0xA11CE);
    ChogSurvivor internal game;

    function setUp() public {
        InvariantOwnerMock mock = new InvariantOwnerMock();
        vm.etch(CANONICAL, address(mock).code);
        for (uint256 id = 1; id <= 4; ++id) {
            vm.store(
                CANONICAL, keccak256(abi.encode(id, uint256(0))), bytes32(uint256(uint160(ALICE)))
            );
        }
        game = new ChogSurvivor();
        targetContract(address(new ActionHandler(game)));
    }

    function invariant_allStoredBoundsAndMasksHold() public view {
        for (uint256 id = 1; id <= 4; ++id) {
            ChogSurvivor.CharacterView memory c = game.characterOf(id);
            assertLe(c.xp, 1_000_000_000);
            assertLe(c.trust, 100);
            assertLe(c.scars, 100);
            assertLe(c.unmarkedStreak, 7);
            assertLe(c.eventMask, 0x3f);
            assertEq(c.achievementMask & ~uint256(0xff), 0);
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ChogSurvivor} from "../src/ChogSurvivor.sol";

contract ERC721OwnerMock {
    mapping(uint256 => address) internal owners;

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = owners[tokenId];
        require(owner != address(0), "NOT_MINTED");
        return owner;
    }
}

contract SmartWallet {
    function act(ChogSurvivor game, uint256 tokenId, uint8 choice)
        external
        returns (ChogSurvivor.Preview memory)
    {
        return game.act(tokenId, choice);
    }
}

contract ChogSurvivorTest is Test {
    ChogSurvivor internal game;
    ERC721OwnerMock internal implementation;
    address internal constant CANONICAL = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        implementation = new ERC721OwnerMock();
        vm.etch(CANONICAL, address(implementation).code);
        game = new ChogSurvivor();
    }

    function _mint(uint256 tokenId, address owner) internal {
        vm.store(
            CANONICAL, keccak256(abi.encode(tokenId, uint256(0))), bytes32(uint256(uint160(owner)))
        );
    }

    function _dayFor(uint256 tokenId, uint8 eventId) internal view returns (uint64 day) {
        while (game.eventFor(tokenId, day) != eventId) ++day;
    }

    function _at(uint64 day) internal {
        vm.warp(uint256(day) * 86_400 + 1);
    }

    function testCanonicalAddressAndDayZeroFirstAction() public {
        assertEq(game.CHOG_GENESIS(), CANONICAL);
        _mint(1, alice);
        vm.warp(0);
        vm.prank(alice);
        ChogSurvivor.Preview memory p = game.act(1, 1);
        assertEq(p.day, 0);
        assertEq(p.streakAfter, 1);
        assertEq(p.xpDelta, 12);
        assertTrue(p.canAct);
    }

    function testAllBaseOutcomesAndPreviewMatchesAction() public {
        int32[18] memory xp =
            [int32(12), 22, 9, 10, 15, 19, 13, 17, 24, 18, 12, 26, 11, 16, 23, 17, 14, 27];
        int16[18] memory trust =
            [int16(5), -2, 9, 10, 2, -6, 3, 8, -3, 4, 11, -4, 12, 5, -1, 3, 9, -5];
        int16[18] memory scars = [int16(0), 5, 1, 0, 1, 3, 0, 3, 6, 0, 1, 5, 1, 0, 4, 0, 2, 7];
        for (uint8 eventId = 1; eventId <= 6; ++eventId) {
            uint256 tokenId = 100 + eventId;
            _mint(tokenId, alice);
            _at(_dayFor(tokenId, eventId));
            for (uint8 choice = 1; choice <= 3; ++choice) {
                // A new token is needed for each choice because each resolves once per day.
                uint256 id = tokenId * 10 + choice;
                _mint(id, alice);
                _at(_dayFor(id, eventId));
                ChogSurvivor.Preview memory before = game.preview(id, choice);
                vm.prank(alice);
                ChogSurvivor.Preview memory after_ = game.act(id, choice);
                uint8 outcome = (eventId - 1) * 3 + choice;
                assertEq(before.outcomeId, outcome);
                int32 expectedXp = xp[outcome - 1];
                if (
                    outcome == 2 || outcome == 6 || outcome == 9 || outcome == 12 || outcome == 15
                        || outcome == 18
                ) expectedXp += 2;
                if (
                    outcome == 3 || outcome == 4 || outcome == 8 || outcome == 11 || outcome == 13
                        || outcome == 17
                ) expectedXp -= 2;
                assertEq(after_.xpDelta, expectedXp);
                assertEq(after_.trustDelta, trust[outcome - 1] < 0 ? int16(0) : trust[outcome - 1]);
                assertEq(after_.scarsDelta, scars[outcome - 1]);
                assertEq(keccak256(abi.encode(before)), keccak256(abi.encode(after_)));
            }
        }
    }

    function testAuthorizationTransferAndSameDayStatus() public {
        _mint(2, alice);
        vm.warp(1);
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.NotTokenOwner.selector, 2, bob));
        vm.prank(bob);
        game.act(2, 1);
        vm.prank(alice);
        game.act(2, 1);
        _mint(2, bob);
        ChogSurvivor.Preview memory p = game.preview(2, 2);
        assertFalse(p.canAct);
        assertEq(p.xpDelta, 0);
        assertEq(p.newlyEarnedAchievementMask, 0);
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.AlreadyActed.selector, 2, 0));
        vm.prank(bob);
        game.act(2, 2);
        vm.warp(86_400);
        vm.prank(bob);
        game.act(2, 2);
    }

    function testInvalidAndNonexistentFailWithoutState() public {
        _mint(3, alice);
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.InvalidChoice.selector, 0));
        game.preview(3, 0);
        vm.expectRevert(bytes("NOT_MINTED"));
        game.preview(999, 1);
        vm.expectRevert(bytes("NOT_MINTED"));
        vm.prank(alice);
        game.act(999, 1);
        assertFalse(game.characterOf(3).hasActed);
    }

    function testTransferBeforeActionBurnAndSmartWalletOwnership() public {
        _mint(50, alice);
        _mint(50, bob); // transfer before action
        vm.prank(bob);
        game.act(50, 1);
        ChogSurvivor.CharacterView memory history = game.characterOf(50);
        _mint(50, address(0)); // burn: storage must remain but owner-gated paths fail
        assertTrue(game.characterOf(50).hasActed);
        assertEq(game.characterOf(50).xp, history.xp);
        vm.expectRevert(bytes("NOT_MINTED"));
        game.preview(50, 1);
        vm.expectRevert(bytes("NOT_MINTED"));
        vm.prank(bob);
        game.act(50, 1);

        SmartWallet wallet = new SmartWallet();
        _mint(51, address(wallet));
        wallet.act(game, 51, 1);
        assertTrue(game.characterOf(51).hasActed);
    }

    function testExactResolutionLogAndFailedCallDoesNotMutate() public {
        _mint(52, alice);
        _at(0);
        uint8 eventId = game.eventFor(52, 0);
        uint8 outcomeId = (eventId - 1) * 3 + 1;
        ChogSurvivor.Preview memory p = game.preview(52, 1);
        vm.expectEmit(true, true, true, true, address(game));
        emit ChogSurvivor.AdventureResolved(
            52,
            alice,
            0,
            eventId,
            1,
            outcomeId,
            p.xpDelta,
            p.trustDelta,
            p.scarsDelta,
            p.xpAfter,
            p.trustAfter,
            p.scarsAfter,
            p.streakAfter,
            p.unmarkedStreakAfter,
            p.achievementMaskAfter
        );
        vm.prank(alice);
        game.act(52, 1);
        bytes32 beforeState = keccak256(abi.encode(game.characterOf(52)));
        vm.recordLogs();
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.AlreadyActed.selector, 52, 0));
        vm.prank(alice);
        game.act(52, 1);
        assertEq(keccak256(abi.encode(game.characterOf(52))), beforeState);
        assertEq(vm.getRecordedLogs().length, 0);
    }

    function testEventFormulaAndBoundary() public {
        _mint(4, alice);
        uint64 day = 77;
        assertEq(
            game.eventFor(4, day),
            uint8(uint256(keccak256(abi.encodePacked(CANONICAL, uint256(4), day))) % 6 + 1)
        );
        _at(day);
        vm.prank(alice);
        game.act(4, 1);
        vm.warp((uint256(day) + 1) * 86_400 - 1);
        assertFalse(game.preview(4, 1).canAct);
        vm.warp((uint256(day) + 1) * 86_400);
        assertTrue(game.preview(4, 1).canAct);
    }

    function testFuzzPreviewEqualsAction(uint256 tokenId, uint8 choice, uint64 day) public {
        tokenId = bound(tokenId, 1, type(uint128).max);
        choice = uint8(bound(choice, 1, 3));
        day = uint64(bound(day, 0, 100_000));
        _mint(tokenId, alice);
        _at(day);
        ChogSurvivor.Preview memory p = game.preview(tokenId, choice);
        vm.prank(alice);
        assertEq(keccak256(abi.encode(p)), keccak256(abi.encode(game.act(tokenId, choice))));
    }

    function testFuzzBoundsAndOneActionPerDay(uint256 tokenId, uint8 choice, uint64 day) public {
        tokenId = bound(tokenId, 1, type(uint128).max);
        choice = uint8(bound(choice, 1, 3));
        day = uint64(bound(day, 0, 100_000));
        _mint(tokenId, alice);
        _at(day);
        vm.prank(alice);
        game.act(tokenId, choice);
        ChogSurvivor.CharacterView memory c = game.characterOf(tokenId);
        assertLe(c.xp, 1_000_000_000);
        assertLe(c.trust, 100);
        assertLe(c.scars, 100);
        assertEq(c.streak, 1);
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.AlreadyActed.selector, tokenId, day));
        vm.prank(alice);
        game.act(tokenId, choice);
    }

    /// @dev Fixed 365-day policies make balance changes visible and reproducible in CI output.
    function testDeterministicBalanceSimulation() public {
        _mint(7001, alice); // always cautious
        _mint(7002, alice); // always reckless
        _mint(7003, alice); // always compassionate
        uint8[6] memory cautious = [uint8(1), 2, 1, 1, 2, 1];
        uint8[6] memory reckless = [uint8(2), 3, 3, 3, 3, 3];
        uint8[6] memory compassionate = [uint8(3), 1, 2, 2, 1, 2];
        for (uint64 day; day < 365; ++day) {
            _at(day);
            uint8 safeChoice = cautious[game.eventFor(7001, day) - 1];
            uint8 riskChoice = reckless[game.eventFor(7002, day) - 1];
            uint8 kindChoice = compassionate[game.eventFor(7003, day) - 1];
            vm.prank(alice);
            game.act(7001, safeChoice);
            vm.prank(alice);
            game.act(7002, riskChoice);
            vm.prank(alice);
            game.act(7003, kindChoice);
        }
        ChogSurvivor.CharacterView memory safe = game.characterOf(7001);
        ChogSurvivor.CharacterView memory risk = game.characterOf(7002);
        ChogSurvivor.CharacterView memory kind = game.characterOf(7003);
        emit log_named_uint("cautious XP", safe.xp);
        emit log_named_uint("cautious Trust", safe.trust);
        emit log_named_uint("cautious Scars", safe.scars);
        emit log_named_uint("cautious Title", game.titleOf(7001));
        emit log_named_uint("reckless XP", risk.xp);
        emit log_named_uint("reckless Trust", risk.trust);
        emit log_named_uint("reckless Scars", risk.scars);
        emit log_named_uint("reckless Title", game.titleOf(7002));
        emit log_named_uint("compassionate XP", kind.xp);
        emit log_named_uint("compassionate Trust", kind.trust);
        emit log_named_uint("compassionate Scars", kind.scars);
        emit log_named_uint("compassionate Title", game.titleOf(7003));
        assertEq(safe.xp, 7809);
        assertEq(safe.trust, 100);
        assertEq(safe.scars, 19);
        assertEq(game.titleOf(7001), 3);
        assertEq(risk.xp, 11607);
        assertEq(risk.trust, 0);
        assertEq(risk.scars, 100);
        assertEq(game.titleOf(7002), 1);
        assertEq(kind.xp, 7586);
        assertEq(kind.trust, 100);
        assertEq(kind.scars, 100);
        assertEq(game.titleOf(7003), 1);
        assertEq(safe.streak, 255);
        assertEq(risk.streak, 255);
        assertEq(kind.streak, 255);
        assertLe(safe.scars, 100);
        assertLe(risk.scars, 100);
        assertLe(kind.scars, 100);
    }
}

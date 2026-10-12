// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {ChogSurvivor} from "../src/ChogSurvivor.sol";

contract AchievementOwnerMock {
    mapping(uint256 => address) internal owners;
    mapping(uint256 => address) internal approvals;
    mapping(address => mapping(address => bool)) internal operators;

    function ownerOf(uint256 id) external view returns (address) {
        require(owners[id] != address(0), "NOT_MINTED");
        return owners[id];
    }

    function approve(address spender, uint256 id) external {
        require(msg.sender == owners[id], "NOT_OWNER");
        approvals[id] = spender;
    }

    function getApproved(uint256 id) external view returns (address) {
        return approvals[id];
    }

    function setApprovalForAll(address operator, bool approved) external {
        operators[msg.sender][operator] = approved;
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return operators[owner][operator];
    }
}

contract AchievementWallet {
    function act(ChogSurvivor game, uint256 id, uint8 choice)
        external
        returns (ChogSurvivor.Preview memory)
    {
        return game.act(id, choice);
    }
}

/// @dev Reusable achievement harness. Layout is verified by forge inspect in the test setup notes:
/// characters mapping slot 0; CharacterView fields at base slots 0..2; counters at base+3/+4.
contract ChogSurvivorAchievementsTest is Test {
    address constant COLLECTION = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763;
    address constant ALICE = address(0xA11CE);
    address constant BOB = address(0xB0B);
    address constant SPENDER = address(0x5EED);
    address constant OPERATOR = address(0x0F3A70);
    ChogSurvivor game;
    bytes32 constant RESOLVED = keccak256(
        "AdventureResolved(uint256,address,uint64,uint8,uint8,uint8,int32,int16,int16,uint32,uint8,uint8,uint8,uint8,uint256)"
    );
    bytes32 constant EARNED = keccak256("AchievementEarned(uint256,uint8,uint64)");

    function setUp() public {
        AchievementOwnerMock mock = new AchievementOwnerMock();
        vm.etch(COLLECTION, address(mock).code);
        game = new ChogSurvivor();
    }

    function _mint(uint256 id, address owner) internal {
        vm.store(
            COLLECTION, keccak256(abi.encode(id, uint256(0))), bytes32(uint256(uint160(owner)))
        );
    }

    function _transfer(uint256 id, address owner) internal {
        _mint(id, owner);
    }

    function _dayFor(uint256 id, uint8 eventId, uint64 from) internal view returns (uint64 d) {
        d = from;
        while (game.eventFor(id, d) != eventId) ++d;
    }

    function _base(uint256 id) internal pure returns (bytes32) {
        return keccak256(abi.encode(id, uint256(0)));
    }

    function _counterSlot(uint256 id, uint8 key, uint256 member) internal pure returns (bytes32) {
        return keccak256(abi.encode(uint256(key), uint256(_base(id)) + member));
    }

    /// @dev Seeds only the documented prerequisites needed by achievement tests.
    /// Remaining packed fields, achievement mask, and all counters are deliberately zeroed.
    function _seedView(uint256 id, uint32 xp, uint8 trust, uint8 scars, bool acted) internal {
        uint256 packed = uint256(xp) | (uint256(trust) << 32) | (uint256(scars) << 40);
        vm.store(address(game), _base(id), bytes32(packed));
        vm.store(address(game), bytes32(uint256(_base(id)) + 1), bytes32(0));
        vm.store(address(game), bytes32(uint256(_base(id)) + 2), bytes32(uint256(acted ? 1 : 0)));
    }

    function _actRecord(uint256 id, uint8 choice, address owner)
        internal
        returns (Vm.Log[] memory logs)
    {
        vm.recordLogs();
        vm.prank(owner);
        game.act(id, choice);
        return vm.getRecordedLogs();
    }

    function _assertEarned(Vm.Log memory log, uint256 id, uint8 achievement, uint64 day)
        internal
        pure
    {
        assert(log.topics[0] == EARNED);
        assert(log.topics[1] == bytes32(id));
        assert(log.topics[2] == bytes32(uint256(achievement)));
        assert(log.topics[3] == bytes32(uint256(day)));
    }

    function testHarnessFirstLightAndNoDuplicate() public {
        uint256 id = 1001;
        _mint(id, ALICE);
        uint64 day = _dayFor(id, 1, 0);
        vm.warp(uint256(day) * 86400 + 1);
        assertEq(game.characterOf(id).achievementMask, 0);
        Vm.Log[] memory logs = _actRecord(id, 1, ALICE);
        assertEq(logs.length, 2);
        assertEq(logs[0].topics[0], RESOLVED);
        _assertEarned(logs[1], id, 0, day);
        assertEq(game.characterOf(id).achievementMask, 1);
        _transfer(id, address(0xB0B));
        uint64 next = day + 1;
        vm.warp(uint256(next) * 86400 + 1);
        logs = _actRecord(id, 1, address(0xB0B));
        assertEq(logs.length, 1);
        assertEq(logs[0].topics[0], RESOLVED);
        assertEq(game.characterOf(id).achievementMask, 1);
    }

    function _assertSingleTarget(Vm.Log[] memory logs, uint256 id, uint8 bit, uint64 day)
        internal
        pure
    {
        assertEq(logs.length, 2);
        assertEq(logs[0].topics[0], RESOLVED);
        _assertEarned(logs[1], id, bit, day);
    }

    function _earnedCount(Vm.Log[] memory logs, uint256 id, uint8 bit, uint64 day)
        internal
        pure
        returns (uint256 count)
    {
        for (uint256 i = 1; i < logs.length; ++i) {
            if (logs[i].topics[0] == EARNED && logs[i].topics[2] == bytes32(uint256(bit))) {
                _assertEarned(logs[i], id, bit, day);
                ++count;
            }
        }
    }

    function _scarFreeChoice(uint8 eventId) internal pure returns (uint8) {
        // The selected documented rows are cautious or zero-scar compassionate outcomes.
        return eventId == 5 ? 2 : 1;
    }

    function _seedStreak(uint256 id, uint8 streak, uint8 unmarked, uint64 lastDay) internal {
        uint256 packed =
            (uint256(streak) << 48) | (uint256(unmarked) << 56) | (uint256(lastDay) << 64);
        vm.store(address(game), _base(id), bytes32(packed));
        vm.store(address(game), bytes32(uint256(_base(id)) + 1), bytes32(0));
        vm.store(address(game), bytes32(uint256(_base(id)) + 2), bytes32(uint256(1)));
    }

    function _seedUnmarked(uint256 id, uint8 scars, uint8 streak, uint8 unmarked, uint64 lastDay)
        internal
    {
        uint256 packed = (uint256(scars) << 40) | (uint256(streak) << 48)
            | (uint256(unmarked) << 56) | (uint256(lastDay) << 64);
        vm.store(address(game), _base(id), bytes32(packed));
        vm.store(address(game), bytes32(uint256(_base(id)) + 1), bytes32(0));
        vm.store(address(game), bytes32(uint256(_base(id)) + 2), bytes32(uint256(1)));
    }

    function _expectResolved(uint256 id, address owner, ChogSurvivor.Preview memory p) internal {
        vm.expectEmit(true, true, true, true, address(game));
        emit ChogSurvivor.AdventureResolved(
            id,
            owner,
            p.day,
            p.eventId,
            p.choiceId,
            p.outcomeId,
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
    }

    function testBridgeBuilderThresholdAndNoDuplicate() public {
        uint256 id = 1101;
        _mint(id, ALICE);
        uint64 day = _dayFor(id, 1, 10);
        _seedView(id, 0, 50, 0, true);
        bytes32 count = _counterSlot(id, 1, 3);
        vm.store(address(game), count, bytes32(uint256(1)));
        vm.warp(uint256(day) * 86400 + 1);
        Vm.Log[] memory logs = _actRecord(id, 1, ALICE);
        assertEq(logs.length, 1);
        assertEq(game.characterOf(id).achievementMask & 2, 0);
        vm.store(address(game), count, bytes32(uint256(2)));
        day = _dayFor(id, 1, day + 1);
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, 1, ALICE);
        _assertSingleTarget(logs, id, 1, day);
        assertEq(game.characterOf(id).achievementMask & 2, 2);
        day = _dayFor(id, 1, day + 1);
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, 1, ALICE);
        assertEq(logs.length, 1);
    }

    function testKindredSpiritThresholdTransferAndNoDuplicate() public {
        uint256 id = 1102;
        _mint(id, ALICE);
        uint64 day = _dayFor(id, 1, 10);
        _seedView(id, 0, 74, 0, true);
        vm.warp(uint256(day) * 86400 + 1);
        Vm.Log[] memory logs = _actRecord(id, 1, ALICE);
        assertEq(logs.length, 1);
        assertEq(game.characterOf(id).achievementMask & 4, 0);
        _seedView(id, 0, 79, 0, true);
        day = _dayFor(id, 1, day + 1);
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, 1, ALICE);
        _assertSingleTarget(logs, id, 2, day);
        _transfer(id, address(0xB0B));
        day = _dayFor(id, 1, day + 1);
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, 1, address(0xB0B));
        // This is the third resolved outcome 1, so Bridge Builder legitimately accompanies
        // the duplicate-Kindred check. The indexed log proves the new award is bit 1, not 2.
        _assertSingleTarget(logs, id, 1, day);
        assertEq(game.characterOf(id).achievementMask & 4, 4);
    }

    function testStormforgedThresholdAndNoDuplicate() public {
        uint256 id = 1103;
        _mint(id, ALICE);
        uint64 day = _dayFor(id, 1, 10);
        _seedView(id, 0, 50, 22, true);
        vm.warp(uint256(day) * 86400 + 1);
        Vm.Log[] memory logs = _actRecord(id, 2, ALICE);
        assertEq(logs.length, 1);
        assertEq(game.characterOf(id).achievementMask & 8, 0);
        _seedView(id, 0, 50, 23, true);
        day = _dayFor(id, 1, day + 1);
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, 2, ALICE);
        _assertSingleTarget(logs, id, 3, day);
        day = _dayFor(id, 1, day + 1);
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, 2, ALICE);
        assertEq(logs.length, 1);
    }

    function testGatekeeperMixedThresholdAndNoDuplicate() public {
        uint256 id = 1104;
        _mint(id, ALICE);
        uint64 day = _dayFor(id, 4, 10);
        _seedView(id, 0, 50, 0, true);
        vm.store(address(game), _counterSlot(id, 10, 3), bytes32(uint256(1)));
        vm.store(address(game), _counterSlot(id, 11, 3), bytes32(uint256(1)));
        vm.warp(uint256(day) * 86400 + 1);
        Vm.Log[] memory logs = _actRecord(id, 3, ALICE);
        _assertSingleTarget(logs, id, 4, day);
        day = _dayFor(id, 4, day + 1);
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, 1, ALICE);
        assertEq(logs.length, 1);
        assertEq(game.characterOf(id).achievementMask & 16, 16);
    }

    function testPathfinderAllSixEventsTransferAndNoDuplicate() public {
        uint256 id = 1105;
        _mint(id, ALICE);
        uint64 day = 10;
        Vm.Log[] memory logs;
        for (uint8 eventId = 1; eventId <= 6; ++eventId) {
            day = _dayFor(id, eventId, day);
            vm.warp(uint256(day) * 86400 + 1);
            logs = _actRecord(id, _scarFreeChoice(eventId), ALICE);
            if (eventId < 6) {
                assertEq(game.characterOf(id).achievementMask & (uint256(1) << 5), 0);
                assertEq(_earnedCount(logs, id, 5, day), 0);
            } else {
                _assertSingleTarget(logs, id, 5, day);
            }
            ++day;
        }
        _transfer(id, address(0xB0B));
        day = _dayFor(id, 1, day);
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, 2, address(0xB0B));
        assertEq(_earnedCount(logs, id, 5, day), 0);
        assertEq(game.characterOf(id).achievementMask & (uint256(1) << 5), uint256(1) << 5);
    }

    function testSevenSunsThresholdSkipAndNoDuplicate() public {
        uint256 id = 1106;
        _mint(id, ALICE);
        uint64 day = 100;
        _seedStreak(id, 5, 0, day - 1);
        vm.warp(uint256(day) * 86400 + 1);
        Vm.Log[] memory logs = _actRecord(id, _scarFreeChoice(game.eventFor(id, day)), ALICE);
        assertEq(game.characterOf(id).streak, 6);
        assertEq(_earnedCount(logs, id, 6, day), 0);
        ++day;
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, _scarFreeChoice(game.eventFor(id, day)), ALICE);
        _assertSingleTarget(logs, id, 6, day);
        ++day;
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, _scarFreeChoice(game.eventFor(id, day)), ALICE);
        assertEq(_earnedCount(logs, id, 6, day), 0);

        uint256 skippedId = 1107;
        _mint(skippedId, ALICE);
        _seedStreak(skippedId, 5, 0, 200);
        day = 202;
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(skippedId, _scarFreeChoice(game.eventFor(skippedId, day)), ALICE);
        assertEq(game.characterOf(skippedId).streak, 1);
        assertEq(_earnedCount(logs, skippedId, 6, day), 0);
    }

    function testUnmarkedWeekSevenRiskFreeActionsAndNoDuplicate() public {
        uint256 id = 1108;
        _mint(id, ALICE);
        uint64 day = 1000;
        Vm.Log[] memory logs;
        for (uint8 action; action < 7; ++action) {
            uint8 eventId = game.eventFor(id, day);
            vm.warp(uint256(day) * 86400 + 1);
            logs = _actRecord(id, _scarFreeChoice(eventId), ALICE);
            assertLe(game.characterOf(id).scars, 0);
            if (action < 6) {
                assertEq(game.characterOf(id).unmarkedStreak, action + 1);
                assertEq(_earnedCount(logs, id, 7, day), 0);
            } else {
                assertEq(game.characterOf(id).unmarkedStreak, 7);
                assertEq(_earnedCount(logs, id, 7, day), 1);
            }
            ++day;
        }
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, _scarFreeChoice(game.eventFor(id, day)), ALICE);
        assertEq(game.characterOf(id).unmarkedStreak, 7);
        assertEq(_earnedCount(logs, id, 7, day), 0);
    }

    function testMultipleAchievementsEmitAscendingThenCannotReplayAfterTransfer() public {
        uint256 id = 1109;
        _mint(id, ALICE);
        uint64 day = _dayFor(id, 6, 300);
        // Prior state represents five distinct events plus six qualifying consecutive days.
        uint256 packed = (uint256(6) << 48) | (uint256(6) << 56) | (uint256(day - 1) << 64)
            | (uint256(0x1f) << 136);
        vm.store(address(game), _base(id), bytes32(packed));
        vm.store(address(game), bytes32(uint256(_base(id)) + 1), bytes32(uint256(1)));
        vm.store(address(game), bytes32(uint256(_base(id)) + 2), bytes32(uint256(1)));
        vm.warp(uint256(day) * 86400 + 1);
        Vm.Log[] memory logs = _actRecord(id, 1, ALICE);
        assertEq(logs.length, 4);
        assertEq(logs[0].topics[0], RESOLVED);
        _assertEarned(logs[1], id, 5, day);
        _assertEarned(logs[2], id, 6, day);
        _assertEarned(logs[3], id, 7, day);

        _transfer(id, address(0xB0B));
        ++day;
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, _scarFreeChoice(game.eventFor(id, day)), address(0xB0B));
        assertEq(logs.length, 1);
        assertEq(_earnedCount(logs, id, 5, day), 0);
        assertEq(_earnedCount(logs, id, 6, day), 0);
        assertEq(_earnedCount(logs, id, 7, day), 0);
    }

    function testApprovalsOperatorsTransfersAndContractWalletAuthorization() public {
        uint256 id = 1201;
        _mint(id, ALICE);
        AchievementOwnerMock collection = AchievementOwnerMock(COLLECTION);
        vm.prank(ALICE);
        collection.approve(SPENDER, id);
        vm.prank(ALICE);
        collection.setApprovalForAll(OPERATOR, true);
        assertEq(collection.getApproved(id), SPENDER);
        assertTrue(collection.isApprovedForAll(ALICE, OPERATOR));

        uint64 day = 400;
        vm.warp(uint256(day) * 86400 + 1);
        bytes32 beforeState = keccak256(abi.encode(game.characterOf(id)));
        vm.recordLogs();
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.NotTokenOwner.selector, id, SPENDER));
        vm.prank(SPENDER);
        game.act(id, 1);
        assertEq(keccak256(abi.encode(game.characterOf(id))), beforeState);
        assertEq(vm.getRecordedLogs().length, 0);
        vm.recordLogs();
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.NotTokenOwner.selector, id, OPERATOR));
        vm.prank(OPERATOR);
        game.act(id, 1);
        assertEq(keccak256(abi.encode(game.characterOf(id))), beforeState);
        assertEq(vm.getRecordedLogs().length, 0);

        ChogSurvivor.Preview memory p = game.preview(id, 1);
        _expectResolved(id, ALICE, p);
        Vm.Log[] memory logs = _actRecord(id, 1, ALICE);
        assertEq(logs[0].topics[0], RESOLVED);
        ChogSurvivor.CharacterView memory history = game.characterOf(id);
        _transfer(id, BOB);
        vm.recordLogs();
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.AlreadyActed.selector, id, day));
        vm.prank(BOB);
        game.act(id, 1);
        assertEq(keccak256(abi.encode(game.characterOf(id))), keccak256(abi.encode(history)));
        assertEq(vm.getRecordedLogs().length, 0);
        ++day;
        vm.warp(uint256(day) * 86400 + 1);
        p = game.preview(id, 1);
        _expectResolved(id, BOB, p);
        logs = _actRecord(id, 1, BOB);
        assertEq(logs[0].topics[1], bytes32(id));
        assertEq(logs[0].topics[2], bytes32(uint256(uint160(BOB))));
        assertEq(game.characterOf(id).streak, 2);
        assertGt(game.characterOf(id).xp, history.xp);

        AchievementWallet wallet = new AchievementWallet();
        uint256 walletId = 1202;
        _mint(walletId, address(wallet));
        vm.warp(uint256(++day) * 86400 + 1);
        p = game.preview(walletId, 1);
        _expectResolved(walletId, address(wallet), p);
        wallet.act(game, walletId, 1);
        assertTrue(game.characterOf(walletId).hasActed);
    }

    function testPositiveScarRequestBelowCapResetsUnmarkedWeekAndSkippedDayRestartsIt() public {
        uint256 id = 1203;
        _mint(id, ALICE);
        uint64 day = _dayFor(id, 1, 500);
        _seedUnmarked(id, 0, 3, 3, day - 1);
        vm.warp(uint256(day) * 86400 + 1);
        ChogSurvivor.Preview memory p = game.preview(id, 2);
        assertEq(p.scarsDelta, 5);
        assertEq(p.unmarkedStreakAfter, 0);
        _expectResolved(id, ALICE, p);
        Vm.Log[] memory logs = _actRecord(id, 2, ALICE);
        assertEq(logs.length, 1);
        assertEq(logs[0].topics[0], RESOLVED);
        assertEq(game.characterOf(id).scars, 5);
        assertEq(game.characterOf(id).unmarkedStreak, 0);
        assertEq(_earnedCount(logs, id, 7, day), 0);

        ++day;
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, _scarFreeChoice(game.eventFor(id, day)), ALICE);
        assertEq(game.characterOf(id).unmarkedStreak, 1);
        assertEq(_earnedCount(logs, id, 7, day), 0);
        day += 2;
        vm.warp(uint256(day) * 86400 + 1);
        logs = _actRecord(id, _scarFreeChoice(game.eventFor(id, day)), ALICE);
        assertEq(game.characterOf(id).unmarkedStreak, 1);
        assertEq(_earnedCount(logs, id, 7, day), 0);
    }

    function testPositiveScarRequestAtCapResetsUnmarkedWeek() public {
        uint256 id = 1204;
        _mint(id, ALICE);
        uint64 day = _dayFor(id, 1, 600);
        _seedUnmarked(id, 100, 6, 6, day - 1);
        // Stormforged is already permanent; a positive requested Scar change must not qualify.
        vm.store(address(game), bytes32(uint256(_base(id)) + 1), bytes32(uint256(1) << 3));
        vm.warp(uint256(day) * 86400 + 1);
        ChogSurvivor.Preview memory p = game.preview(id, 2);
        // Outcome 2 requests +5 scars (+2 at scars >= 20), but final clamping makes it zero.
        assertEq(p.scarsDelta, 0);
        assertEq(p.scarsAfter, 100);
        assertEq(p.unmarkedStreakAfter, 0);
        _expectResolved(id, ALICE, p);
        Vm.Log[] memory logs = _actRecord(id, 2, ALICE);
        // The same consecutive action reaches Seven Suns only; Unmarked Week does not unlock.
        assertEq(logs.length, 2);
        assertEq(logs[0].topics[0], RESOLVED);
        _assertEarned(logs[1], id, 6, day);
        assertEq(game.characterOf(id).scars, 100);
        assertEq(game.characterOf(id).unmarkedStreak, 0);
        assertEq(game.characterOf(id).achievementMask & (uint256(1) << 7), 0);
    }

    function testZeroAndNegativeScarRequestsQualifyAtCap() public {
        uint256 zeroId = 1205;
        _mint(zeroId, ALICE);
        uint64 zeroDay = _dayFor(zeroId, 2, 700);
        _seedUnmarked(zeroId, 100, 6, 6, zeroDay - 1);
        vm.warp(uint256(zeroDay) * 86400 + 1);
        // Event 2, choice 1 requests exactly zero Scars.
        ChogSurvivor.Preview memory zero = game.preview(zeroId, 1);
        assertEq(zero.scarsDelta, 0);
        assertEq(zero.unmarkedStreakAfter, 7);
        _actRecord(zeroId, 1, ALICE);

        uint256 negativeId = 1206;
        _mint(negativeId, ALICE);
        uint64 negativeDay = _dayFor(negativeId, 1, zeroDay + 1);
        _seedUnmarked(negativeId, 100, 6, 6, negativeDay - 1);
        vm.warp(uint256(negativeDay) * 86400 + 1);
        // Event 1, cautious choice 1 requests -1 Scars at the high-Scar modifier.
        ChogSurvivor.Preview memory negative = game.preview(negativeId, 1);
        assertEq(negative.scarsDelta, -1);
        assertEq(negative.unmarkedStreakAfter, 7);
        _actRecord(negativeId, 1, ALICE);
    }

    function testUnmarkedWeekPersistsAfterLaterRiskyAction() public {
        uint256 id = 1207;
        _mint(id, ALICE);
        uint64 day = _dayFor(id, 1, 800);
        _seedUnmarked(id, 0, 6, 6, day - 1);
        vm.warp(uint256(day) * 86400 + 1);
        _actRecord(id, 1, ALICE);
        assertEq(game.characterOf(id).achievementMask & (uint256(1) << 7), uint256(1) << 7);

        ++day;
        vm.warp(uint256(day) * 86400 + 1);
        // Choice 3 requests positive Scars for every event.
        ChogSurvivor.Preview memory risky = game.preview(id, 3);
        assertGt(risky.scarsDelta, 0);
        _actRecord(id, 3, ALICE);
        assertEq(game.characterOf(id).unmarkedStreak, 0);
        assertEq(game.characterOf(id).achievementMask & (uint256(1) << 7), uint256(1) << 7);
    }
}

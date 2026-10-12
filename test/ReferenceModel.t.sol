// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {ChogSurvivor} from "../src/ChogSurvivor.sol";

contract ReferenceOwner {
    mapping(uint256 => address) internal owner;

    function ownerOf(uint256 id) external view returns (address) {
        require(owner[id] != address(0), "NOT_MINTED");
        return owner[id];
    }
}

/// @dev Deliberately separate, table/switch based model of GAME_RULES.md. It never invokes game calculators.
contract ReferenceModelTest is Test {
    address constant COLLECTION = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763;
    address constant ALICE = address(0xA11CE);
    address constant BOB = address(0xB0B);
    bytes32 constant RESOLVED = keccak256(
        "AdventureResolved(uint256,address,uint64,uint8,uint8,uint8,int32,int16,int16,uint32,uint8,uint8,uint8,uint8,uint256)"
    );
    bytes32 constant EARNED = keccak256("AchievementEarned(uint256,uint8,uint64)");
    ChogSurvivor game;

    struct M {
        uint32 xp;
        uint8 trust;
        uint8 scars;
        uint8 streak;
        uint8 unmarked;
        uint64 lastDay;
        uint8 lastOutcome;
        uint8 events;
        uint256 badges;
        bool acted;
        uint32[19] outcomes;
        uint32[7] eventCounts;
    }

    struct ResolutionData {
        uint8 eventId;
        uint8 choiceId;
        uint8 outcomeId;
        int32 xpDelta;
        int16 trustDelta;
        int16 scarsDelta;
        uint32 xpAfter;
        uint8 trustAfter;
        uint8 scarsAfter;
        uint8 streakAfter;
        uint8 unmarkedAfter;
        uint256 badgesAfter;
    }

    function setUp() public {
        ReferenceOwner mock = new ReferenceOwner();
        vm.etch(COLLECTION, address(mock).code);
        vm.store(
            COLLECTION,
            keccak256(abi.encode(uint256(900), uint256(0))),
            bytes32(uint256(uint160(ALICE)))
        );
        game = new ChogSurvivor();
    }

    function _event(uint256 id, uint64 day) internal pure returns (uint8) {
        return uint8(uint256(keccak256(abi.encodePacked(COLLECTION, id, day))) % 6 + 1);
    }

    function _row(uint8 o) internal pure returns (int32 x, int16 t, int16 s) {
        if (o == 1) return (12, 5, 0);
        if (o == 2) return (22, -2, 5);
        if (o == 3) return (9, 9, 1);
        if (o == 4) return (10, 10, 0);
        if (o == 5) return (15, 2, 1);
        if (o == 6) return (19, -6, 3);
        if (o == 7) return (13, 3, 0);
        if (o == 8) return (17, 8, 3);
        if (o == 9) return (24, -3, 6);
        if (o == 10) return (18, 4, 0);
        if (o == 11) return (12, 11, 1);
        if (o == 12) return (26, -4, 5);
        if (o == 13) return (11, 12, 1);
        if (o == 14) return (16, 5, 0);
        if (o == 15) return (23, -1, 4);
        if (o == 16) return (17, 3, 0);
        if (o == 17) return (14, 9, 2);
        return (27, -5, 7);
    }

    function _kind(uint8 o) internal pure returns (uint8) {
        // 0=cautious, 1=reckless, 2=compassionate
        if (o == 1 || o == 5 || o == 7 || o == 10 || o == 14 || o == 16) return 0;
        if (o == 2 || o == 6 || o == 9 || o == 12 || o == 15 || o == 18) return 1;
        return 2;
    }

    function _clamp(int256 v, uint256 hi) internal pure returns (uint256) {
        return v <= 0 ? 0 : v >= int256(hi) ? hi : uint256(v);
    }

    function _title(M memory m) internal pure returns (uint8) {
        if (m.xp >= 500 && m.trust >= 75 && m.scars <= 25) return 3;
        if (m.trust >= 70 && m.scars <= 45) return 2;
        if (m.xp >= 300 && m.scars >= 25) return 1;
        return 0;
    }

    /// @dev Slots are from `forge inspect --json ChogSurvivor storage-layout`: mapping slot 0,
    /// CharacterView slot 0 packed at documented offsets; this is test-only boundary setup.
    function _setView(
        uint256 id,
        uint32 xp,
        uint8 trust,
        uint8 scars,
        uint8 streak,
        uint64 lastDay,
        bool acted
    ) internal {
        bytes32 base = keccak256(abi.encode(id, uint256(0)));
        uint256 packed = uint256(xp) | (uint256(trust) << 32) | (uint256(scars) << 40)
            | (uint256(streak) << 48) | (uint256(lastDay) << 64);
        vm.store(address(game), base, bytes32(packed));
        vm.store(address(game), bytes32(uint256(base) + 2), bytes32(uint256(acted ? 1 : 0)));
    }

    /// @dev Character.outcomeCount/eventCount are mappings at base+3/base+4 per inspected layout.
    function _counterSlot(uint256 id, uint8 key, uint256 memberSlot)
        internal
        pure
        returns (bytes32)
    {
        bytes32 base = keccak256(abi.encode(id, uint256(0)));
        return keccak256(abi.encode(uint256(key), uint256(base) + memberSlot));
    }

    function _mint(uint256 id) internal {
        _setOwner(id, ALICE);
    }

    function _setOwner(uint256 id, address owner) internal {
        vm.store(
            COLLECTION, keccak256(abi.encode(id, uint256(0))), bytes32(uint256(uint160(owner)))
        );
    }

    function testOutcomeCountUint32SaturatesThroughAct() public {
        uint256 id = 901;
        _mint(id);
        uint64 day;
        while (_event(id, day) != 1) ++day;
        uint8 outcome = 1;
        bytes32 target = _counterSlot(id, outcome, 3);
        bytes32 other = _counterSlot(id, 1, 4);
        vm.store(address(game), target, bytes32(uint256(type(uint32).max - 1)));
        vm.warp(uint256(day) * 86400 + 1);
        vm.prank(ALICE);
        game.act(id, 1);
        assertEq(uint256(vm.load(address(game), target)), type(uint32).max);
        assertEq(uint256(vm.load(address(game), other)), 1);
        vm.warp(uint256(day + 1) * 86400 + 1);
        while (_event(id, uint64(block.timestamp / 86400)) != 1) vm.warp(block.timestamp + 86400);
        vm.prank(ALICE);
        game.act(id, 1);
        assertEq(uint256(vm.load(address(game), target)), type(uint32).max);
    }

    function testEventCountUint32SaturatesThroughAct() public {
        uint256 id = 902;
        _mint(id);
        uint64 day;
        while (_event(id, day) != 1) ++day;
        bytes32 target = _counterSlot(id, 1, 4);
        bytes32 other = _counterSlot(id, 1, 3);
        vm.store(address(game), target, bytes32(uint256(type(uint32).max - 1)));
        vm.warp(uint256(day) * 86400 + 1);
        vm.prank(ALICE);
        game.act(id, 1);
        assertEq(uint256(vm.load(address(game), target)), type(uint32).max);
        assertEq(uint256(vm.load(address(game), other)), 1);
        vm.warp(uint256(day + 1) * 86400 + 1);
        while (_event(id, uint64(block.timestamp / 86400)) != 1) vm.warp(block.timestamp + 86400);
        vm.prank(ALICE);
        game.act(id, 1);
        assertEq(uint256(vm.load(address(game), target)), type(uint32).max);
    }

    function testExplicitTrustAndScarBoundaries() public {
        uint64 day;
        while (_event(900, day) != 1) ++day;
        vm.warp(uint256(day) * 86400 + 1);
        uint8[4] memory trusts = [uint8(34), 35, 69, 70];
        int32[4] memory expected = [int32(24), 22, 22, 20];
        for (uint256 i; i < 4; ++i) {
            _setView(900, 0, trusts[i], 19, 0, 0, false);
            assertEq(game.preview(900, 2).xpDelta, expected[i]);
        }
        _setView(900, 0, 50, 19, 0, 0, false);
        assertEq(game.preview(900, 2).scarsDelta, 5);
        _setView(900, 0, 50, 20, 0, 0, false);
        assertEq(game.preview(900, 2).scarsDelta, 7);
    }

    function testStreakAndExtremeDayBoundaries() public {
        uint64 day = type(uint64).max;
        vm.warp(uint256(day) * 86400 + 1);
        (int32 base,,) = _row((_event(900, day) - 1) * 3 + 1);
        _setView(900, 100, 50, 0, 254, day - 1, true);
        ChogSurvivor.Preview memory p = game.preview(900, 1);
        assertEq(p.streakAfter, 255);
        assertEq(p.xpDelta, base + 7);
        _setView(900, 100, 50, 0, 255, day - 1, true);
        p = game.preview(900, 1);
        assertEq(p.streakAfter, 255);
        assertEq(p.xpDelta, base + 7);
        _setView(900, 100, 50, 0, 8, day - 2, true);
        p = game.preview(900, 1);
        assertEq(p.streakAfter, 1);
        assertEq(p.xpDelta, base);
    }

    function testXpCapEffectiveDeltaAndTitlePrecedence() public {
        uint64 day;
        while (_event(900, day) != 1) ++day;
        vm.warp(uint256(day) * 86400 + 1);
        _setView(900, 999_999_999, 50, 0, 0, 0, false);
        assertEq(game.preview(900, 1).xpAfter, 1_000_000_000);
        assertEq(game.preview(900, 1).xpDelta, 1);
        _setView(900, 1_000_000_000, 50, 0, 0, 0, false);
        assertEq(game.preview(900, 1).xpDelta, 0);
        _setView(900, 500, 75, 25, 0, 0, false);
        assertEq(game.titleOf(900), 3);
        _setView(900, 500, 75, 26, 0, 0, false);
        assertEq(game.titleOf(900), 2);
        _setView(900, 300, 69, 25, 0, 0, false);
        assertEq(game.titleOf(900), 1);
        _setView(900, 299, 69, 24, 0, 0, false);
        assertEq(game.titleOf(900), 0);
    }

    function _step(M memory m, uint256 id, uint64 day, uint8 choice)
        internal
        pure
        returns (M memory n, ChogSurvivor.Preview memory p)
    {
        n.xp = m.xp;
        n.trust = m.trust;
        n.scars = m.scars;
        n.streak = m.streak;
        n.unmarked = m.unmarked;
        n.lastDay = m.lastDay;
        n.lastOutcome = m.lastOutcome;
        n.events = m.events;
        n.badges = m.badges;
        n.acted = m.acted;
        for (uint8 i; i < 19; ++i) {
            n.outcomes[i] = m.outcomes[i];
        }
        for (uint8 i; i < 7; ++i) {
            n.eventCounts[i] = m.eventCounts[i];
        }
        uint8 e = _event(id, day);
        uint8 o = (e - 1) * 3 + choice;
        (int32 x, int16 t, int16 s) = _row(o);
        bool next = m.acted && day > m.lastDay && day - m.lastDay == 1;
        if (next) x += int32(uint32(m.streak > 7 ? 7 : m.streak));
        uint8 k = _kind(o);
        if (k == 2) {
            if (m.trust >= 70) {
                x += 2;
            } else if (m.trust < 35) {
                x -= 2;
            }
        } else if (k == 1) {
            if (m.trust < 35) x += 2;
            else if (m.trust >= 70) x -= 2;
        }
        if (m.scars >= 20) {
            if (k == 1) s += 2;
            if (k == 0) s -= 1;
        }
        if (m.lastOutcome == o) x -= 3;
        n.xp = uint32(_clamp(int256(uint256(m.xp)) + x, 1_000_000_000));
        n.trust = uint8(_clamp(int256(uint256(m.trust)) + t, 100));
        n.scars = uint8(_clamp(int256(uint256(m.scars)) + s, 100));
        n.streak = next ? (m.streak == 255 ? 255 : m.streak + 1) : 1;
        // Qualification is based on the requested post-modifier Scar change, not the clamp.
        n.unmarked = s <= 0 ? (next ? (m.unmarked == 7 ? 7 : m.unmarked + 1) : 1) : 0;
        n.acted = true;
        n.lastDay = day;
        n.lastOutcome = o;
        n.events |= uint8(1) << (e - 1);
        if (n.outcomes[o] != type(uint32).max) ++n.outcomes[o];
        if (n.eventCounts[e] != type(uint32).max) ++n.eventCounts[e];
        uint256 b = m.badges;
        if (!m.acted) b |= 1;
        if (n.outcomes[1] >= 3) b |= 2;
        if (n.trust >= 80) b |= 4;
        if (n.scars >= 30) b |= 8;
        if (n.outcomes[10] + n.outcomes[11] + n.outcomes[12] >= 3) b |= 16;
        if (m.events | uint8(1) << (e - 1) == 63) b |= 32;
        if (n.streak >= 7) b |= 64;
        if (n.unmarked >= 7) b |= 128;
        n.badges = b;
        p.day = day;
        p.eventId = e;
        p.choiceId = choice;
        p.outcomeId = o;
        p.xpAfter = n.xp;
        p.trustAfter = n.trust;
        p.scarsAfter = n.scars;
        p.streakAfter = n.streak;
        p.unmarkedStreakAfter = n.unmarked;
        p.achievementMaskAfter = b;
        p.newlyEarnedAchievementMask = b & ~m.badges;
        p.titleId = _title(n);
        p.canAct = true;
        p.xpDelta = int32(int256(uint256(n.xp)) - int256(uint256(m.xp)));
        p.trustDelta = int16(int256(uint256(n.trust)) - int256(uint256(m.trust)));
        p.scarsDelta = int16(int256(uint256(n.scars)) - int256(uint256(m.scars)));
    }

    function testReferenceModelThirtyDaySequence() public {
        M memory m;
        for (uint64 day; day < 30; ++day) {
            vm.warp(uint256(day) * 86400 + 1);
            uint8 c = uint8(day % 3) + 1;
            (M memory next, ChogSurvivor.Preview memory want) = _step(m, 900, day, c);
            ChogSurvivor.Preview memory seen = game.preview(900, c);
            assertEq(seen.eventId, want.eventId);
            assertEq(seen.outcomeId, want.outcomeId);
            assertEq(seen.xpDelta, want.xpDelta);
            assertEq(seen.trustDelta, want.trustDelta);
            assertEq(seen.scarsDelta, want.scarsDelta);
            assertEq(seen.xpAfter, want.xpAfter);
            assertEq(seen.trustAfter, want.trustAfter);
            assertEq(seen.scarsAfter, want.scarsAfter);
            assertEq(seen.streakAfter, want.streakAfter);
            assertEq(seen.unmarkedStreakAfter, want.unmarkedStreakAfter);
            assertEq(seen.achievementMaskAfter, want.achievementMaskAfter);
            assertEq(seen.titleId, want.titleId);
            vm.prank(ALICE);
            assertEq(keccak256(abi.encode(game.act(900, c))), keccak256(abi.encode(want)));
            m = next;
        }
        ChogSurvivor.CharacterView memory actual = game.characterOf(900);
        assertEq(actual.xp, m.xp);
        assertEq(actual.trust, m.trust);
        assertEq(actual.scars, m.scars);
        assertEq(actual.achievementMask, m.badges);
    }

    function _assertPreview(
        ChogSurvivor.Preview memory actual,
        ChogSurvivor.Preview memory expected
    ) internal pure {
        assertEq(
            keccak256(abi.encode(actual)), keccak256(abi.encode(expected)), "reference preview"
        );
    }

    function _assertState(uint256 id, M memory expected) internal view {
        ChogSurvivor.CharacterView memory actual = game.characterOf(id);
        assertEq(actual.xp, expected.xp, "xp");
        assertEq(actual.trust, expected.trust, "trust");
        assertEq(actual.scars, expected.scars, "scars");
        assertEq(actual.streak, expected.streak, "streak");
        assertEq(actual.unmarkedStreak, expected.unmarked, "unmarked");
        assertEq(actual.lastActionDay, expected.lastDay, "last day");
        assertEq(actual.lastOutcomeId, expected.lastOutcome, "last outcome");
        assertEq(actual.eventMask, expected.events, "event mask");
        assertEq(actual.achievementMask, expected.badges, "badges");
        assertEq(actual.hasActed, expected.acted, "acted");
    }

    function _assertLogs(
        Vm.Log[] memory logs,
        uint256 id,
        address owner,
        ChogSurvivor.Preview memory expected
    ) internal pure {
        uint256 earned;
        for (uint8 bit; bit < 8; ++bit) {
            if ((expected.newlyEarnedAchievementMask & (uint256(1) << bit)) != 0) ++earned;
        }
        assertEq(logs.length, earned + 1, "log count");
        Vm.Log memory resolution = logs[0];
        assertEq(resolution.topics[0], RESOLVED, "resolution signature");
        assertEq(resolution.topics[1], bytes32(id), "resolution token");
        assertEq(resolution.topics[2], bytes32(uint256(uint160(owner))), "resolution owner");
        assertEq(resolution.topics[3], bytes32(uint256(expected.day)), "resolution day");
        ResolutionData memory decoded = abi.decode(resolution.data, (ResolutionData));
        assertEq(decoded.eventId, expected.eventId);
        assertEq(decoded.choiceId, expected.choiceId);
        assertEq(decoded.outcomeId, expected.outcomeId);
        assertEq(decoded.xpDelta, expected.xpDelta);
        assertEq(decoded.trustDelta, expected.trustDelta);
        assertEq(decoded.scarsDelta, expected.scarsDelta);
        assertEq(decoded.xpAfter, expected.xpAfter);
        assertEq(decoded.trustAfter, expected.trustAfter);
        assertEq(decoded.scarsAfter, expected.scarsAfter);
        assertEq(decoded.streakAfter, expected.streakAfter);
        assertEq(decoded.unmarkedAfter, expected.unmarkedStreakAfter);
        assertEq(decoded.badgesAfter, expected.achievementMaskAfter);
        uint256 logIndex = 1;
        for (uint8 bit; bit < 8; ++bit) {
            if ((expected.newlyEarnedAchievementMask & (uint256(1) << bit)) != 0) {
                Vm.Log memory earnedLog = logs[logIndex++];
                assertEq(earnedLog.topics[0], EARNED, "earned signature");
                assertEq(earnedLog.topics[1], bytes32(id), "earned token");
                assertEq(earnedLog.topics[2], bytes32(uint256(bit)), "earned bit order");
                assertEq(earnedLog.topics[3], bytes32(uint256(expected.day)), "earned day");
            }
        }
    }

    function _compareAction(M memory prior, uint256 id, uint64 day, uint8 choice, address owner)
        internal
        returns (M memory next)
    {
        ChogSurvivor.Preview memory expected;
        (next, expected) = _step(prior, id, day, choice);
        ChogSurvivor.Preview memory previewed = game.preview(id, choice);
        _assertPreview(previewed, expected);
        vm.recordLogs();
        vm.prank(owner);
        ChogSurvivor.Preview memory returned = game.act(id, choice);
        _assertPreview(returned, expected);
        _assertLogs(vm.getRecordedLogs(), id, owner, expected);
        _assertState(id, next);
        assertEq(
            uint256(vm.load(address(game), _counterSlot(id, expected.outcomeId, 3))),
            next.outcomes[expected.outcomeId]
        );
        assertEq(
            uint256(vm.load(address(game), _counterSlot(id, expected.eventId, 4))),
            next.eventCounts[expected.eventId]
        );

        ChogSurvivor.Preview memory sameDay = game.preview(id, choice);
        assertFalse(sameDay.canAct, "same day is status only");
        assertEq(sameDay.xpDelta, 0);
        assertEq(sameDay.trustDelta, 0);
        assertEq(sameDay.scarsDelta, 0);
        assertEq(sameDay.newlyEarnedAchievementMask, 0);
        assertEq(sameDay.xpAfter, next.xp);
        assertEq(sameDay.achievementMaskAfter, next.badges);
        bytes32 beforeReplay = keccak256(abi.encode(game.characterOf(id)));
        vm.recordLogs();
        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.AlreadyActed.selector, id, day));
        vm.prank(owner);
        game.act(id, choice);
        assertEq(keccak256(abi.encode(game.characterOf(id))), beforeReplay, "replay state");
        assertEq(vm.getRecordedLogs().length, 0, "replay logs");
    }

    function _nextSeed(uint256 seed) internal pure returns (uint256) {
        return uint256(keccak256(abi.encode(seed)));
    }

    /// @dev A failing assertion identifies the test seed; sequence inputs derive only from this PRNG.
    function _runSeed(uint256 seed, uint8 steps) internal {
        uint256 idA = 10_000 + (seed % 10_000) * 2;
        uint256 idB = idA + 1;
        _mint(idA);
        _mint(idB);
        M memory a;
        M memory b;
        address ownerA = ALICE;
        address ownerB = ALICE;
        uint64 day;
        for (uint8 i; i < steps; ++i) {
            seed = _nextSeed(seed);
            day += uint64((seed % 3) + 1); // contains both consecutive actions and skipped UTC days
            bool selectA = (seed & 1) == 0;
            uint8 choice = uint8((seed >> 8) % 3) + 1;
            // Every generated sequence includes a transfer; additional transfers remain seeded.
            if (i == steps / 2 || (seed >> 16) % 7 == 0) {
                if (selectA) {
                    ownerA = ownerA == ALICE ? BOB : ALICE;
                    _setOwner(idA, ownerA);
                } else {
                    ownerB = ownerB == ALICE ? BOB : ALICE;
                    _setOwner(idB, ownerB);
                }
            }
            vm.warp(uint256(day) * 86400 + 1);
            if (selectA) a = _compareAction(a, idA, day, choice, ownerA);
            else b = _compareAction(b, idB, day, choice, ownerB);
        }
        _assertState(idA, a);
        _assertState(idB, b);
    }

    function testSeededInterleavedReferenceSequences() public {
        _runSeed(0xC0FFEE, 32);
        _runSeed(0xBADC0DE, 32);
    }

    function testFuzzSeededInterleavedReferenceSequences(uint256 seed) public {
        _runSeed(seed, 10);
    }

    function testReferenceModelRepeatOutcomeAfterSkippedDays() public {
        uint256 id = 20_001;
        _mint(id);
        M memory m;
        uint64 firstDay;
        while (_event(id, firstDay) != 1) ++firstDay;
        vm.warp(uint256(firstDay) * 86400 + 1);
        m = _compareAction(m, id, firstDay, 1, ALICE);
        uint64 repeatedDay = firstDay + 2;
        while (_event(id, repeatedDay) != 1) ++repeatedDay;
        vm.warp(uint256(repeatedDay) * 86400 + 1);
        (M memory expected, ChogSurvivor.Preview memory resolution) = _step(m, id, repeatedDay, 1);
        assertEq(resolution.streakAfter, 1, "skipped day breaks streak");
        assertEq(resolution.xpDelta, 9, "repeat penalty persists over skipped days");
        m = _compareAction(m, id, repeatedDay, 1, ALICE);
        assertEq(keccak256(abi.encode(m)), keccak256(abi.encode(expected)));
    }

    function testReferenceModelSimultaneousAchievementLogs() public {
        uint256 id = 20_002;
        _mint(id);
        uint64 day;
        while (_event(id, day) != 6) ++day;
        M memory m;
        m.streak = 6;
        m.unmarked = 6;
        m.lastDay = day - 1;
        m.events = 0x1f;
        m.badges = 1;
        m.acted = true;
        bytes32 base = keccak256(abi.encode(id, uint256(0)));
        uint256 packed = (uint256(6) << 48) | (uint256(6) << 56) | (uint256(day - 1) << 64)
            | (uint256(0x1f) << 136);
        vm.store(address(game), base, bytes32(packed));
        vm.store(address(game), bytes32(uint256(base) + 1), bytes32(uint256(1)));
        vm.store(address(game), bytes32(uint256(base) + 2), bytes32(uint256(1)));
        vm.warp(uint256(day) * 86400 + 1);
        m = _compareAction(m, id, day, 1, ALICE);
        assertEq(m.badges, uint256(1) | (uint256(7) << 5));
    }
}

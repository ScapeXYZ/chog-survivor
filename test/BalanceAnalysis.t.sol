// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";

/// @dev Standalone GAME_RULES.md simulator. It deliberately does not import or call ChogSurvivor.
contract BalanceAnalysisTest is Test {
    address constant COLLECTION = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763;

    struct S {
        uint32 xp;
        uint8 trust;
        uint8 scars;
        uint8 streak;
        uint8 unmarked;
        uint64 last;
        uint8 lastOut;
        uint8 events;
        uint256 badges;
        bool acted;
        uint32[19] outcomes;
    }

    struct R {
        uint32 xp;
        uint8 trust;
        uint8 scars;
        uint8 title;
        uint8 badges;
        uint16 acted;
        uint8 longest;
        uint16 mythicDay;
        uint16 allBadgesDay;
    }

    function _event(uint256 id, uint64 day) internal pure returns (uint8) {
        return uint8(uint256(keccak256(abi.encodePacked(COLLECTION, id, day))) % 6) + 1;
    }

    function _row(uint8 o) internal pure returns (int32 x, int16 t, int16 s) {
        int32[18] memory xs =
            [int32(12), 22, 9, 10, 15, 19, 13, 17, 24, 18, 12, 26, 11, 16, 23, 17, 14, 27];
        int16[18] memory ts = [int16(5), -2, 9, 10, 2, -6, 3, 8, -3, 4, 11, -4, 12, 5, -1, 3, 9, -5];
        int16[18] memory ss = [int16(0), 5, 1, 0, 1, 3, 0, 3, 6, 0, 1, 5, 1, 0, 4, 0, 2, 7];
        return (xs[o - 1], ts[o - 1], ss[o - 1]);
    }

    function _tag(uint8 o) internal pure returns (uint8) {
        uint8[18] memory k = [uint8(0), 1, 2, 2, 0, 1, 0, 2, 1, 0, 2, 1, 2, 0, 1, 0, 2, 1];
        return k[o - 1];
    }

    function _clamp(int256 v, uint256 h) internal pure returns (uint256) {
        return v <= 0 ? 0 : v >= int256(h) ? h : uint256(v);
    }

    function _title(S memory s) internal pure returns (uint8) {
        if (s.xp >= 500 && s.trust >= 75 && s.scars <= 25) return 3;
        if (s.trust >= 70 && s.scars <= 45) return 2;
        if (s.xp >= 300 && s.scars >= 25) return 1;
        return 0;
    }

    function _choice(uint8 policy, uint8 e, S memory s) internal pure returns (uint8) {
        uint8[6] memory cautious = [uint8(1), 2, 1, 1, 2, 1];
        uint8[6] memory reckless = [uint8(2), 3, 3, 3, 3, 3];
        uint8[6] memory kind = [uint8(3), 1, 2, 2, 1, 2];
        if (policy == 0) return cautious[e - 1];
        if (policy == 1) return reckless[e - 1];
        if (policy == 2) return kind[e - 1];
        if (policy == 3) return reckless[e - 1]; // greedy base-XP row per event
        if (policy == 4) {
            if (s.scars >= 25) return cautious[e - 1];
            if (s.trust < 75) return kind[e - 1];
            return reckless[e - 1];
        }
        if (policy == 5) return cautious[e - 1]; // Mythic-preserving: zero-scar cautious route
        if (policy == 6) {
            // achievement heuristic: build scars/gates/bridge, then seven safe days
            if (s.unmarked < 7 && s.scars >= 30) return cautious[e - 1];
            if (e == 1 && s.outcomes[1] < 3) return 1;
            if (e == 4 && s.outcomes[10] + s.outcomes[11] + s.outcomes[12] < 3) return 1;
            return reckless[e - 1];
        }
        return e == 6 ? 3 : 0; // wait-for-Shadow-Beast greedy: skip all other events
    }

    function _step(S memory m, uint256 id, uint64 day, uint8 c) internal pure returns (S memory n) {
        n = m;
        uint8 e = _event(id, day);
        uint8 o = (e - 1) * 3 + c;
        (int32 x, int16 t, int16 sc) = _row(o);
        bool con = m.acted && day > m.last && day - m.last == 1;
        if (con) x += int32(uint32(m.streak > 7 ? 7 : m.streak));
        uint8 k = _tag(o);
        if (k == 2) {
            if (m.trust >= 70) {
                x += 2;
            } else if (m.trust < 35) {
                x -= 2;
            } else if (k == 1) {
                if (m.trust < 35) x += 2;
                else if (m.trust >= 70) x -= 2;
            }
        }
        if (m.scars >= 20) if (k == 1) sc += 2;
        else if (k == 0) sc -= 1;
        if (m.lastOut == o) x -= 3;
        n.xp = uint32(_clamp(int256(uint256(m.xp)) + x, 1_000_000_000));
        n.trust = uint8(_clamp(int256(uint256(m.trust)) + t, 100));
        n.scars = uint8(_clamp(int256(uint256(m.scars)) + sc, 100));
        n.streak = con ? (m.streak == 255 ? 255 : m.streak + 1) : 1;
        // Unmarked Week measures a non-positive requested Scar change, before clamping.
        n.unmarked = sc <= 0 ? (con ? (m.unmarked == 7 ? 7 : m.unmarked + 1) : 1) : 0;
        n.acted = true;
        n.last = day;
        n.lastOut = o;
        n.events |= uint8(1) << (e - 1);
        if (n.outcomes[o] != type(uint32).max) ++n.outcomes[o];
        uint256 b = m.badges;
        if (!m.acted) b |= 1;
        if (n.outcomes[1] >= 3) b |= 2;
        if (n.trust >= 80) b |= 4;
        if (n.scars >= 30) b |= 8;
        if (n.outcomes[10] + n.outcomes[11] + n.outcomes[12] >= 3) b |= 16;
        if (n.events == 63) b |= 32;
        if (n.streak >= 7) b |= 64;
        if (n.unmarked >= 7) b |= 128;
        n.badges = b;
    }

    function _pop(uint256 x) internal pure returns (uint8 n) {
        while (x != 0) {
            n += uint8(x & 1);
            x >>= 1;
        }
    }

    function _run(uint256 id, uint16 horizon, uint8 policy) internal pure returns (R memory r) {
        S memory s;
        for (uint16 d; d < horizon; ++d) {
            uint8 e = _event(id, d);
            uint8 c = _choice(policy, e, s);
            if (c == 0) continue;
            s = _step(s, id, d, c);
            ++r.acted;
            if (s.streak > r.longest) r.longest = s.streak;
            if (_title(s) == 3 && r.mythicDay == 0) r.mythicDay = d + 1;
            if (s.badges == 255 && r.allBadgesDay == 0) r.allBadgesDay = d + 1;
        }
        r.xp = s.xp;
        r.trust = s.trust;
        r.scars = s.scars;
        r.title = _title(s);
        r.badges = _pop(s.badges);
    }

    function _emit(uint256 id, uint16 h, uint8 p, string memory name) internal {
        R memory r = _run(id, h, p);
        emit log_named_string("policy", name);
        emit log_named_uint("id", id);
        emit log_named_uint("horizon", h);
        emit log_named_uint("xp", r.xp);
        emit log_named_uint("trust", r.trust);
        emit log_named_uint("scars", r.scars);
        emit log_named_uint("title", r.title);
        emit log_named_uint("badges", r.badges);
        emit log_named_uint("acted", r.acted);
        emit log_named_uint("longest", r.longest);
        emit log_named_uint("mythic day (0=never)", r.mythicDay);
        emit log_named_uint("all badges day (0=never)", r.allBadgesDay);
    }

    function testStandaloneBalanceAnalysis() public {
        // Full matrix is reproducible by calling _run(id, horizon, policy); keep this EVM test
        // bounded because Solidity memory is not reclaimed between matrix iterations.
        R memory shortRun = _run(1425, 30, 4);
        R memory mediumRun = _run(1425, 90, 4);
        R memory longRun = _run(1425, 365, 4);
        assertLe(shortRun.scars, 100);
        assertLe(mediumRun.scars, 100);
        assertLe(longRun.scars, 100);
        // Contract-independent smoke anchors: schedule and known fixed-policy baseline for token 7001.
        R memory cautious365 = _run(7001, 365, 0);
        assertEq(cautious365.xp, 7809);
        assertEq(cautious365.trust, 100);
        assertEq(cautious365.scars, 19);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC721Owner {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @notice Immutable, noncustodial daily adventure history for Chog Genesis tokens.
contract ChogSurvivor {
    address public immutable CHOG_GENESIS;
    uint256 private constant DAY = 86_400;
    uint32 private constant MAX_XP = 1_000_000_000;

    error InvalidChoice(uint8 choiceId);
    error AlreadyActed(uint256 tokenId, uint64 day);
    error NotTokenOwner(uint256 tokenId, address caller);

    struct CharacterView {
        uint32 xp;
        uint8 trust;
        uint8 scars;
        uint8 streak;
        uint8 unmarkedStreak;
        uint64 lastActionDay;
        uint8 lastOutcomeId;
        uint8 eventMask;
        uint256 achievementMask;
        bool hasActed;
    }

    struct Preview {
        uint64 day;
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
        uint8 unmarkedStreakAfter;
        uint256 newlyEarnedAchievementMask;
        uint256 achievementMaskAfter;
        uint8 titleId;
        bool canAct;
    }

    struct Character {
        CharacterView viewData;
        mapping(uint8 outcomeId => uint32 count) outcomeCount;
        mapping(uint8 eventId => uint32 count) eventCount;
    }

    mapping(uint256 tokenId => Character character) private characters;

    event AdventureResolved(
        uint256 indexed tokenId,
        address indexed owner,
        uint64 indexed day,
        uint8 eventId,
        uint8 choiceId,
        uint8 outcomeId,
        int32 xpDelta,
        int16 trustDelta,
        int16 scarsDelta,
        uint32 xpAfter,
        uint8 trustAfter,
        uint8 scarsAfter,
        uint8 streakAfter,
        uint8 unmarkedStreakAfter,
        uint256 achievementMaskAfter
    );
    event AchievementEarned(
        uint256 indexed tokenId, uint8 indexed achievementId, uint64 indexed day
    );

    constructor() {
        CHOG_GENESIS = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763;
    }

    function characterOf(uint256 tokenId) external view returns (CharacterView memory) {
        return characters[tokenId].viewData;
    }

    function eventFor(uint256 tokenId, uint64 day) public view returns (uint8) {
        return uint8(uint256(keccak256(abi.encodePacked(CHOG_GENESIS, tokenId, day))) % 6) + 1;
    }

    function preview(uint256 tokenId, uint8 choiceId)
        external
        view
        returns (Preview memory result)
    {
        _validateChoice(choiceId);
        IERC721Owner(CHOG_GENESIS).ownerOf(tokenId);
        return _resolve(tokenId, choiceId, uint64(block.timestamp / DAY));
    }

    function act(uint256 tokenId, uint8 choiceId) external returns (Preview memory result) {
        _validateChoice(choiceId);
        address owner = IERC721Owner(CHOG_GENESIS).ownerOf(tokenId);
        if (msg.sender != owner) revert NotTokenOwner(tokenId, msg.sender);

        uint64 day = uint64(block.timestamp / DAY);
        Character storage character = characters[tokenId];
        if (character.viewData.hasActed && character.viewData.lastActionDay == day) {
            revert AlreadyActed(tokenId, day);
        }
        result = _resolve(tokenId, choiceId, day);
        CharacterView storage state = character.viewData;
        state.xp = result.xpAfter;
        state.trust = result.trustAfter;
        state.scars = result.scarsAfter;
        state.streak = result.streakAfter;
        state.unmarkedStreak = result.unmarkedStreakAfter;
        state.lastActionDay = day;
        state.lastOutcomeId = result.outcomeId;
        state.eventMask |= uint8(1) << (result.eventId - 1);
        state.hasActed = true;
        if (character.outcomeCount[result.outcomeId] != type(uint32).max) {
            ++character.outcomeCount[result.outcomeId];
        }
        if (character.eventCount[result.eventId] != type(uint32).max) {
            ++character.eventCount[result.eventId];
        }
        state.achievementMask = result.achievementMaskAfter;

        _emitResolution(tokenId, owner, result);
        uint256 bits = result.newlyEarnedAchievementMask;
        for (uint8 achievementId; achievementId < 8; ++achievementId) {
            if ((bits & (uint256(1) << achievementId)) != 0) {
                emit AchievementEarned(tokenId, achievementId, day);
            }
        }
    }

    function titleOf(uint256 tokenId) external view returns (uint8) {
        return _title(characters[tokenId].viewData);
    }

    function _resolve(uint256 tokenId, uint8 choiceId, uint64 day)
        private
        view
        returns (Preview memory result)
    {
        Character storage character = characters[tokenId];
        CharacterView memory prior = character.viewData;
        uint8 eventId = eventFor(tokenId, day);
        uint8 outcomeId = (eventId - 1) * 3 + choiceId;
        result.day = day;
        result.eventId = eventId;
        result.choiceId = choiceId;
        result.outcomeId = outcomeId;
        if (prior.hasActed && prior.lastActionDay == day) {
            result.xpAfter = prior.xp;
            result.trustAfter = prior.trust;
            result.scarsAfter = prior.scars;
            result.streakAfter = prior.streak;
            result.unmarkedStreakAfter = prior.unmarkedStreak;
            result.achievementMaskAfter = prior.achievementMask;
            result.titleId = _title(prior);
            return result;
        }
        (int32 xpChange, int16 trustChange, int16 scarsChange) = _base(outcomeId);
        bool consecutive =
            prior.hasActed && day > prior.lastActionDay && day - prior.lastActionDay == 1;
        if (consecutive) xpChange += int32(uint32(prior.streak > 7 ? 7 : prior.streak));
        uint8 tag = (choiceId - 1); // 0 cautious, 1 reckless, 2 compassionate, except table order differs.
        // Canonical table's tag is outcome-specific, so use tag lookup rather than choice position.
        tag = _tag(outcomeId); // 0 cautious, 1 reckless, 2 compassionate
        if (tag == 2) {
            if (prior.trust >= 70) xpChange += 2;
            else if (prior.trust < 35) xpChange -= 2;
        } else if (tag == 1) {
            if (prior.trust < 35) xpChange += 2;
            else if (prior.trust >= 70) xpChange -= 2;
        }
        if (prior.scars >= 20) {
            if (tag == 1) scarsChange += 2;
            else if (tag == 0) scarsChange -= 1;
        }
        if (prior.lastOutcomeId == outcomeId) xpChange -= 3;

        result.xpAfter = _clampXp(int256(uint256(prior.xp)) + xpChange);
        result.trustAfter = _clamp100(int256(uint256(prior.trust)) + trustChange);
        result.scarsAfter = _clamp100(int256(uint256(prior.scars)) + scarsChange);
        result.xpDelta = int32(int256(uint256(result.xpAfter)) - int256(uint256(prior.xp)));
        result.trustDelta = int16(int256(uint256(result.trustAfter)) - int256(uint256(prior.trust)));
        result.scarsDelta = int16(int256(uint256(result.scarsAfter)) - int256(uint256(prior.scars)));
        result.streakAfter = consecutive ? _incrementByte(prior.streak, 255) : 1;
        // Unmarked Week rewards actions that do not request additional Scars,
        // even when a positive request would be hidden by the 100-Scar clamp.
        if (scarsChange <= 0) {
            result.unmarkedStreakAfter = consecutive ? _incrementByte(prior.unmarkedStreak, 7) : 1;
        }
        // otherwise zero is the default value.
        result.achievementMaskAfter = prior.achievementMask;
        result.achievementMaskAfter |= _earned(character, prior, eventId, outcomeId, result);
        result.newlyEarnedAchievementMask = result.achievementMaskAfter & ~prior.achievementMask;
        result.titleId = _titleValues(result.xpAfter, result.trustAfter, result.scarsAfter);
        result.canAct = true;
    }

    function _earned(
        Character storage character,
        CharacterView memory prior,
        uint8 eventId,
        uint8 outcomeId,
        Preview memory result
    ) private view returns (uint256 bits) {
        if (!prior.hasActed) bits |= 1;
        if (_nextCount(character.outcomeCount[1], outcomeId == 1) >= 3) bits |= 1 << 1;
        if (result.trustAfter >= 80) bits |= 1 << 2;
        if (result.scarsAfter >= 30) bits |= 1 << 3;
        if (_gateCount(character, eventId) >= 3) bits |= 1 << 4;
        uint8 mask = prior.eventMask | (uint8(1) << (eventId - 1));
        if (mask == 0x3f) bits |= 1 << 5;
        if (result.streakAfter >= 7) bits |= 1 << 6;
        if (result.unmarkedStreakAfter >= 7) bits |= 1 << 7;
    }

    function _gateCount(Character storage character, uint8 eventId) private view returns (uint32) {
        uint32 count = character.outcomeCount[10];
        count = _saturatingAdd(count, character.outcomeCount[11]);
        count = _saturatingAdd(count, character.outcomeCount[12]);
        if (eventId == 4 && count != type(uint32).max) ++count;
        return count;
    }

    function _nextCount(uint32 count, bool selected) private pure returns (uint32) {
        return selected && count != type(uint32).max ? count + 1 : count;
    }

    function _base(uint8 outcomeId) private pure returns (int32 xp, int16 trust, int16 scars) {
        int32[18] memory xs =
            [int32(12), 22, 9, 10, 15, 19, 13, 17, 24, 18, 12, 26, 11, 16, 23, 17, 14, 27];
        int16[18] memory ts = [int16(5), -2, 9, 10, 2, -6, 3, 8, -3, 4, 11, -4, 12, 5, -1, 3, 9, -5];
        int16[18] memory ss = [int16(0), 5, 1, 0, 1, 3, 0, 3, 6, 0, 1, 5, 1, 0, 4, 0, 2, 7];
        return (xs[outcomeId - 1], ts[outcomeId - 1], ss[outcomeId - 1]);
    }

    function _tag(uint8 id) private pure returns (uint8) {
        // 0 cautious, 1 reckless, 2 compassionate
        uint8[18] memory tags = [uint8(0), 1, 2, 2, 0, 1, 0, 2, 1, 0, 2, 1, 2, 0, 1, 0, 2, 1];
        return tags[id - 1];
    }

    function _title(CharacterView memory s) private pure returns (uint8) {
        return _titleValues(s.xp, s.trust, s.scars);
    }

    function _titleValues(uint32 xp, uint8 trust, uint8 scars) private pure returns (uint8) {
        if (xp >= 500 && trust >= 75 && scars <= 25) return 3;
        if (trust >= 70 && scars <= 45) return 2;
        if (xp >= 300 && scars >= 25) return 1;
        return 0;
    }

    function _validateChoice(uint8 choiceId) private pure {
        if (choiceId < 1 || choiceId > 3) revert InvalidChoice(choiceId);
    }

    function _clampXp(int256 value) private pure returns (uint32) {
        if (value <= 0) return 0;
        if (value >= int256(uint256(MAX_XP))) return MAX_XP;
        return uint32(uint256(value));
    }

    function _clamp100(int256 value) private pure returns (uint8) {
        if (value <= 0) return 0;
        if (value >= 100) return 100;
        return uint8(uint256(value));
    }

    function _incrementByte(uint8 value, uint8 max) private pure returns (uint8) {
        return value == max ? max : value + 1;
    }

    function _saturatingAdd(uint32 a, uint32 b) private pure returns (uint32) {
        return a > type(uint32).max - b ? type(uint32).max : a + b;
    }

    function _emitResolution(uint256 tokenId, address owner, Preview memory result) private {
        emit AdventureResolved(
            tokenId,
            owner,
            result.day,
            result.eventId,
            result.choiceId,
            result.outcomeId,
            result.xpDelta,
            result.trustDelta,
            result.scarsDelta,
            result.xpAfter,
            result.trustAfter,
            result.scarsAfter,
            result.streakAfter,
            result.unmarkedStreakAfter,
            result.achievementMaskAfter
        );
    }
}

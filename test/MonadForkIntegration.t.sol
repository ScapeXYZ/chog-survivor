// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ChogSurvivor} from "../src/ChogSurvivor.sol";

interface IMonadGenesisERC721 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

/// @notice Opt-in, local-only integration tests against a Monad mainnet fork.
/// @dev The suite never broadcasts or signs. It uses `vm.prank` only to simulate
///      calls in Anvil's forked state, which is reset between Foundry tests.
contract MonadForkIntegrationTest is Test {
    address internal constant CHOG_GENESIS = 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763;
    uint256 internal constant TOKEN_ID = 1425;
    uint256 internal constant NONEXISTENT_TOKEN_ID = type(uint256).max;
    bytes4 internal constant ERC721_INTERFACE_ID = 0x80ac58cd;

    IMonadGenesisERC721 internal collection = IMonadGenesisERC721(CHOG_GENESIS);
    ChogSurvivor internal game;
    address internal tokenOwner;
    bool internal forkAvailable;

    function setUp() public {
        string memory rpcUrl = vm.envOr("MONAD_RPC_URL", string(""));
        if (bytes(rpcUrl).length == 0) return;

        vm.createSelectFork(rpcUrl);
        forkAvailable = true;
        tokenOwner = collection.ownerOf(TOKEN_ID);
        game = new ChogSurvivor();
    }

    function testForkIdentityAndCanonicalERC721() public {
        _requireFork();
        assertEq(block.chainid, 143, "not Monad mainnet");
        assertGt(CHOG_GENESIS.code.length, 0, "canonical collection has no code");
        assertTrue(collection.supportsInterface(ERC721_INTERFACE_ID), "ERC-721 unsupported");
        assertEq(collection.ownerOf(TOKEN_ID), tokenOwner, "ownerOf(1425) changed within fork");
        assertNotEq(tokenOwner, address(0), "ownerOf returned zero");
        assertEq(game.CHOG_GENESIS(), CHOG_GENESIS, "game bound to wrong collection");
    }

    function testRealOwnerAuthorizationAndPreviewParity() public {
        _requireFork();
        ChogSurvivor.Preview memory previewed = game.preview(TOKEN_ID, 1);
        vm.prank(tokenOwner);
        ChogSurvivor.Preview memory acted = game.act(TOKEN_ID, 1);

        assertEq(
            keccak256(abi.encode(acted)),
            keccak256(abi.encode(previewed)),
            "preview/action mismatch"
        );
        assertTrue(game.characterOf(TOKEN_ID).hasActed, "action did not persist state");
    }

    function testRealNonOwnerIsRejected() public {
        _requireFork();
        address outsider = _outsider();
        vm.expectRevert(
            abi.encodeWithSelector(ChogSurvivor.NotTokenOwner.selector, TOKEN_ID, outsider)
        );
        vm.prank(outsider);
        game.act(TOKEN_ID, 1);
    }

    function testOneActionPerUtcDay() public {
        _requireFork();
        uint64 day = uint64(block.timestamp / 86_400);
        vm.prank(tokenOwner);
        game.act(TOKEN_ID, 1);

        vm.expectRevert(abi.encodeWithSelector(ChogSurvivor.AlreadyActed.selector, TOKEN_ID, day));
        vm.prank(tokenOwner);
        game.act(TOKEN_ID, 2);

        vm.warp(uint256(day + 1) * 86_400 + 1);
        vm.prank(tokenOwner);
        game.act(TOKEN_ID, 2);
        assertEq(game.characterOf(TOKEN_ID).lastActionDay, day + 1, "next UTC day did not resolve");
    }

    function testSimulatedRealTransferPreservesTokenKeyedHistoryAndChangesAuthority() public {
        _requireFork();
        address recipient = _outsider();
        uint64 day = uint64(block.timestamp / 86_400);

        vm.prank(tokenOwner);
        game.act(TOKEN_ID, 1);
        ChogSurvivor.CharacterView memory beforeTransfer = game.characterOf(TOKEN_ID);

        vm.prank(tokenOwner);
        try collection.transferFrom(tokenOwner, recipient, TOKEN_ID) {
        // The transfer changes only the local fork state and is never broadcast.
        }
        catch {
            vm.skip(true, "canonical collection transferFrom not permitted at fork block");
            return;
        }

        assertEq(collection.ownerOf(TOKEN_ID), recipient, "local simulated transfer failed");
        vm.expectRevert(
            abi.encodeWithSelector(ChogSurvivor.NotTokenOwner.selector, TOKEN_ID, tokenOwner)
        );
        vm.prank(tokenOwner);
        game.act(TOKEN_ID, 2);

        vm.warp(uint256(day + 1) * 86_400 + 1);
        vm.prank(recipient);
        game.act(TOKEN_ID, 2);
        ChogSurvivor.CharacterView memory afterTransfer = game.characterOf(TOKEN_ID);
        assertTrue(afterTransfer.hasActed, "token state was lost on transfer");
        assertEq(afterTransfer.streak, 2, "token-keyed streak did not persist");
        assertGt(
            afterTransfer.xp, beforeTransfer.xp, "recipient action did not update existing history"
        );
    }

    function testDirectlyVerifiedNonexistentTokenCannotPreviewOrAct() public {
        _requireFork();
        // This verifies absence against the real collection before exercising the game.
        vm.expectRevert();
        collection.ownerOf(NONEXISTENT_TOKEN_ID);

        vm.expectRevert();
        game.preview(NONEXISTENT_TOKEN_ID, 1);
        vm.prank(_outsider());
        vm.expectRevert();
        game.act(NONEXISTENT_TOKEN_ID, 1);
    }

    function _requireFork() internal {
        vm.skip(!forkAvailable, "MONAD_RPC_URL is not set; Monad fork suite not run");
    }

    function _outsider() internal view returns (address) {
        return tokenOwner == address(0xB0B) ? address(0xCAFE) : address(0xB0B);
    }
}

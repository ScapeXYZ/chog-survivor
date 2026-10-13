// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Local-Anvil-only fixture installed at the frozen canonical address.
/// @dev This is never deployed to Monad. Its deliberately open mint endpoint is
/// only safe because the setup script refuses every endpoint except localhost.
contract LocalCanonicalTestNFT {
    string public constant name = unicode"LOCAL TEST NFT — NOT CHOG GENESIS";
    string public constant symbol = "LOCAL-CHOG";

    mapping(uint256 tokenId => address owner) private owners;
    mapping(address owner => uint256 balance) private balances;
    mapping(address owner => uint256[] ids) private ownedIds;
    mapping(uint256 tokenId => uint256 indexPlusOne) private indexPlusOne;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = owners[tokenId];
        require(owner != address(0), "NOT_MINTED");
        return owner;
    }

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "ZERO_ADDRESS");
        return balances[owner];
    }

    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return ownedIds[owner];
    }

    function mint(address to, uint256 tokenId) external {
        require(to != address(0), "ZERO_ADDRESS");
        require(owners[tokenId] == address(0), "ALREADY_MINTED");
        _add(to, tokenId);
        emit Transfer(address(0), to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(msg.sender == from, "NOT_OWNER");
        require(owners[tokenId] == from, "WRONG_FROM");
        require(to != address(0), "ZERO_ADDRESS");
        _remove(from, tokenId);
        _add(to, tokenId);
        emit Transfer(from, to, tokenId);
    }

    function _add(address to, uint256 tokenId) private {
        owners[tokenId] = to;
        ++balances[to];
        ownedIds[to].push(tokenId);
        indexPlusOne[tokenId] = ownedIds[to].length;
    }

    function _remove(address from, uint256 tokenId) private {
        uint256 index = indexPlusOne[tokenId] - 1;
        uint256[] storage ids = ownedIds[from];
        uint256 last = ids[ids.length - 1];
        ids[index] = last;
        indexPlusOne[last] = index + 1;
        ids.pop();
        delete indexPlusOne[tokenId];
        delete owners[tokenId];
        --balances[from];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Locker {
    function balanceOf(address account) external view returns (uint256);
}

/// @notice Self-service ERC-20 time locks. This contract does not pay rewards.
/// @dev Rebasing and fee-on-transfer tokens are not supported.
contract BloxologyLocker {
    struct Lock {
        address owner;
        address token;
        uint256 amount;
        uint256 unlockTime;
        bool withdrawn;
    }

    Lock[] public locks;
    mapping(address => uint256[]) private ownerLocks;
    uint256 private entered;

    event LockCreated(uint256 indexed id, address indexed owner, address indexed token, uint256 amount, uint256 unlockTime);
    event LockWithdrawn(uint256 indexed id, address indexed owner, address indexed token, uint256 amount);

    error InvalidLock();
    error TransferFailed();
    error UnsupportedToken();
    error ReentrantCall();
    error NotOwner();
    error NotWithdrawable();

    modifier nonReentrant() {
        if (entered != 0) revert ReentrantCall();
        entered = 1;
        _;
        entered = 0;
    }

    function lock(address token, uint256 amount, uint256 unlockTime) external nonReentrant returns (uint256 id) {
        if (token.code.length == 0 || amount == 0 || unlockTime <= block.timestamp) revert InvalidLock();

        uint256 beforeBalance = IERC20Locker(token).balanceOf(address(this));
        _transfer(token, abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount));
        uint256 afterBalance = IERC20Locker(token).balanceOf(address(this));
        if (afterBalance < beforeBalance || afterBalance - beforeBalance != amount) revert UnsupportedToken();

        id = locks.length;
        locks.push(Lock(msg.sender, token, amount, unlockTime, false));
        ownerLocks[msg.sender].push(id);
        emit LockCreated(id, msg.sender, token, amount, unlockTime);
    }

    function withdraw(uint256 id) external nonReentrant {
        if (id >= locks.length) revert InvalidLock();
        Lock storage position = locks[id];
        if (position.owner != msg.sender) revert NotOwner();
        if (position.withdrawn || block.timestamp < position.unlockTime) revert NotWithdrawable();

        position.withdrawn = true;
        _transfer(position.token, abi.encodeWithSignature("transfer(address,uint256)", msg.sender, position.amount));
        emit LockWithdrawn(id, msg.sender, position.token, position.amount);
    }

    function lockCount(address owner) external view returns (uint256) {
        return ownerLocks[owner].length;
    }

    function lockIdAt(address owner, uint256 index) external view returns (uint256) {
        return ownerLocks[owner][index];
    }

    function _transfer(address token, bytes memory data) private {
        (bool success, bytes memory result) = token.call(data);
        if (!success || (result.length != 0 && (result.length != 32 || !abi.decode(result, (bool))))) {
            revert TransferFailed();
        }
    }
}

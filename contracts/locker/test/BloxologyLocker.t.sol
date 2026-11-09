// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BloxologyLocker} from "../src/BloxologyLocker.sol";

contract MockToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    bool public chargeFee;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function setChargeFee(bool enabled) external { chargeFee = enabled; }
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += chargeFee ? amount - 1 : amount;
        return true;
    }
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract BloxologyLockerTest is Test {
    BloxologyLocker private locker;
    MockToken private token;
    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);

    function setUp() public {
        locker = new BloxologyLocker();
        token = new MockToken();
        token.mint(alice, 100);
        vm.prank(alice);
        token.approve(address(locker), 100);
    }

    function testLockAndWithdraw() public {
        uint256 unlockTime = block.timestamp + 1 days;
        vm.prank(alice);
        uint256 id = locker.lock(address(token), 40, unlockTime);
        assertEq(locker.lockCount(alice), 1);
        assertEq(locker.lockIdAt(alice, 0), id);
        assertEq(token.balanceOf(address(locker)), 40);

        vm.prank(alice);
        vm.expectRevert(BloxologyLocker.NotWithdrawable.selector);
        locker.withdraw(id);
        vm.warp(unlockTime);
        vm.prank(bob);
        vm.expectRevert(BloxologyLocker.NotOwner.selector);
        locker.withdraw(id);
        vm.prank(alice);
        locker.withdraw(id);
        assertEq(token.balanceOf(alice), 100);
        vm.prank(alice);
        vm.expectRevert(BloxologyLocker.NotWithdrawable.selector);
        locker.withdraw(id);
    }

    function testRejectInvalidLocks() public {
        vm.startPrank(alice);
        vm.expectRevert(BloxologyLocker.InvalidLock.selector);
        locker.lock(address(token), 0, block.timestamp + 1);
        vm.expectRevert(BloxologyLocker.InvalidLock.selector);
        locker.lock(address(token), 1, block.timestamp);
        vm.expectRevert(BloxologyLocker.InvalidLock.selector);
        locker.lock(bob, 1, block.timestamp + 1);
        vm.stopPrank();
    }

    function testRejectFeeOnTransfer() public {
        token.setChargeFee(true);
        vm.prank(alice);
        vm.expectRevert(BloxologyLocker.UnsupportedToken.selector);
        locker.lock(address(token), 10, block.timestamp + 1);
        assertEq(token.balanceOf(alice), 100);
        assertEq(locker.lockCount(alice), 0);
    }
}

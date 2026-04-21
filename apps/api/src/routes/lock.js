import express from 'express';
import { ethers } from 'ethers';
import { createRequire } from 'module';
import logger from '../utils/logger.js';

const router = express.Router();
const require = createRequire(import.meta.url);
const liveLockHandler = require('../../../../api/base/lock.js');

const SUPPORTED_NETWORKS = ['ethereum', 'base', 'polygon', 'kava'];
const VALID_DURATIONS = [30, 60, 90, 180]; // days

// In-memory storage for token locks
const tokenLocks = new Map();

// Helper function to validate Ethereum address
const validateAddress = (address) => {
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
};

// Helper function to validate amount
const validateAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid amount: ${amount}. Must be a positive number.`);
  }
  return num;
};

// Helper function to validate duration
const validateDuration = (duration) => {
  const num = parseInt(duration, 10);
  if (isNaN(num) || !VALID_DURATIONS.includes(num)) {
    throw new Error(
      `Invalid duration: ${duration}. Must be one of: ${VALID_DURATIONS.join(', ')} days`
    );
  }
  return num;
};

// Helper function to generate lock ID
const generateLockId = () => {
  return 'lock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Helper function to generate transaction hash
const generateTxHash = () => {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

// Helper function to calculate rewards based on duration and amount
const calculateRewards = (amount, duration) => {
  // Reward rates: 30 days = 2%, 60 days = 5%, 90 days = 8%, 180 days = 15%
  const rewardRates = {
    30: 0.02,
    60: 0.05,
    90: 0.08,
    180: 0.15,
  };

  const rate = rewardRates[duration] || 0;
  return (amount * rate).toFixed(8);
};

router.get('/', async (_req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Lock endpoint is available. Use POST with either legacy or base lock payload.',
  });
});

router.options('/', async (_req, res) => {
  res.set('Allow', 'GET,POST,OPTIONS');
  return res.status(204).send();
});

router.post('/', async (req, res) => {
  // Compatibility path for clients expecting /base/lock behavior on /lock.
  if (req.body?.tokenAddress && req.body?.unlockDate) {
    return liveLockHandler(req, res);
  }

  const { token, amount, duration, walletAddress, network } = req.body;

  // Validate required fields
  if (!token || !amount || !duration || !walletAddress || !network) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: token, amount, duration, walletAddress, network',
    });
  }

  // Validate token address
  validateAddress(token);

  // Validate amount
  const validatedAmount = validateAmount(amount);

  // Validate duration
  const validatedDuration = validateDuration(duration);

  // Validate wallet address
  validateAddress(walletAddress);

  // Validate network
  const networkLower = network.toLowerCase();
  if (!SUPPORTED_NETWORKS.includes(networkLower)) {
    throw new Error(
      `Unsupported network: ${network}. Supported networks: ${SUPPORTED_NETWORKS.join(', ')}`
    );
  }

  // Generate lock ID
  const lockId = generateLockId();

  // Calculate unlock date
  const now = new Date();
  const unlockDate = new Date(now.getTime() + validatedDuration * 24 * 60 * 60 * 1000);
  const unlockDateIso = unlockDate.toISOString();

  // Calculate rewards
  const rewards = calculateRewards(validatedAmount, validatedDuration);

  // Generate transaction hash
  const transactionHash = generateTxHash();

  // Store lock in memory
  const lock = {
    lockId,
    token,
    amount: validatedAmount,
    duration: validatedDuration,
    walletAddress,
    network: networkLower,
    unlockDate: unlockDateIso,
    rewards,
    transactionHash,
    lockedAt: new Date().toISOString(),
  };

  tokenLocks.set(lockId, lock);

  logger.info(
    `Tokens locked: ${validatedAmount} of ${token} for ${walletAddress} on ${network} for ${validatedDuration} days (Lock ID: ${lockId})`
  );

  res.json({
    success: true,
    lockId,
    unlockDate: unlockDateIso,
    rewards,
    transactionHash,
  });
});

export default router;
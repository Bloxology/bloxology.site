import express from 'express';
import logger from '../utils/logger.js';
import {
  fetchTokenBalance,
  fetchTokenPrice,
  fetchTokenMetadata,
  fetchLiquidityPoolData,
} from '../services/baseRpcService.js';
import { createRequire } from 'module';

const router = express.Router();

// Helper function to validate Ethereum address
const validateAddress = (address) => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
};

// GET /base/token-balance - Fetch token balance for a wallet
const require = createRequire(import.meta.url);
const liveTokenSwapQuoteHandler = require('../../../../api/base/token-swap-quote.js');
const liveLockHandler = require('../../../../api/base/lock.js');
router.get('/token-balance', async (req, res) => {
  const { walletAddress, tokenAddress } = req.query;

  if (!walletAddress || !tokenAddress) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required query parameters: walletAddress, tokenAddress',
    });
  }

  try {
    validateAddress(walletAddress);
    validateAddress(tokenAddress);
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: error.message,
    });
  }

  try {
    const data = await fetchTokenBalance(walletAddress, tokenAddress);

    logger.info(`Token balance fetched for ${walletAddress}`);

    res.json({
      success: true,
      data,
      error: null,
    });
  } catch (err) {
    logger.error('Token balance fetch error:', err);
    if (!res.headersSent) {
      return res.status(502).json({ success: false, data: null, error: err.message || 'Failed to fetch token balance' });
    }
  }
});

// GET /base/token-price - Fetch token price
router.get('/token-price', async (req, res) => {
  const { tokenAddress } = req.query;

  if (!tokenAddress) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required query parameter: tokenAddress',
    });
  }

  try {
    validateAddress(tokenAddress);
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: error.message,
    });
  }

  try {
    const data = await fetchTokenPrice(tokenAddress);

    logger.info(`Token price fetched for ${tokenAddress}`);

    res.json({
      success: true,
      data,
      error: null,
    });
  } catch (err) {
    logger.error('Token price fetch error:', err);
    if (!res.headersSent) {
      return res.status(502).json({ success: false, data: null, error: err.message || 'Failed to fetch token price' });
    }
  }
});

// GET /base/token-metadata - Fetch token metadata
router.get('/token-metadata', async (req, res) => {
  const { tokenAddress } = req.query;

  if (!tokenAddress) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required query parameter: tokenAddress',
    });
  }

  try {
    validateAddress(tokenAddress);
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: error.message,
    });
  }

  try {
    const data = await fetchTokenMetadata(tokenAddress);

    logger.info(`Token metadata fetched for ${tokenAddress}`);

    res.json({
      success: true,
      data,
      error: null,
    });
  } catch (err) {
    logger.error('Token metadata fetch error:', err);
    if (!res.headersSent) {
      return res.status(502).json({ success: false, data: null, error: err.message || 'Failed to fetch token metadata' });
    }
  }
});

// GET /base/liquidity-pool - Fetch liquidity pool data
router.get('/liquidity-pool', async (req, res) => {
  const { poolAddress } = req.query;

  if (!poolAddress) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required query parameter: poolAddress',
    });
  }

  try {
    validateAddress(poolAddress);
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: error.message,
    });
  }

  try {
    const data = await fetchLiquidityPoolData(poolAddress);

    logger.info(`Liquidity pool data fetched for ${poolAddress}`);

    res.json({
      success: true,
      data,
      error: null,
    });
  } catch (err) {
    logger.error('Liquidity pool fetch error:', err);
    if (!res.headersSent) {
      return res.status(502).json({ success: false, data: null, error: err.message || 'Failed to fetch liquidity pool data' });
    }
  }
});

// POST /base/token-swap-quote - Get token swap quote
router.post('/token-swap-quote', async (req, res) => {
  try {
    return await liveTokenSwapQuoteHandler(req, res);
  } catch (err) {
    logger.error('Token swap quote handler error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, data: null, error: err.message || 'Internal server error' });
    }
  }
});

// POST /base/lock - Build lock transaction payload
router.post('/lock', async (req, res) => {
  try {
    return await liveLockHandler(req, res);
  } catch (err) {
    logger.error('Lock handler error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, data: null, error: err.message || 'Internal server error' });
    }
  }
});

// GET /base/wallet-balances - Fetch balances for multiple tokens
router.get('/wallet-balances', async (req, res) => {
  const { walletAddress } = req.query;

  if (!walletAddress) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required query parameter: walletAddress',
    });
  }

  try {
    validateAddress(walletAddress);
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: error.message,
    });
  }

  // Common Base tokens
  const tokens = [
    { symbol: 'ETH', address: '0x4200000000000000000000000000000000000006' },
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
    { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F14122319047A17' },
    { symbol: 'USDT', address: '0xfde4C96c8593536E31F26A3d5cac40ff63546477' },
  ];

  // Fetch balances and prices in parallel
  const balancePromises = tokens.map(async (token) => {
    try {
      const balance = await fetchTokenBalance(walletAddress, token.address);
      const price = await fetchTokenPrice(token.address);

      return {
        token: token.symbol,
        balance: balance.balance,
        price: price.price,
        value: parseFloat(balance.balance) * price.price,
      };
    } catch (error) {
      logger.warn(`Error fetching balance for ${token.symbol}: ${error.message}`);
      return {
        token: token.symbol,
        balance: '0',
        price: 0,
        value: 0,
      };
    }
  });

  const balances = await Promise.all(balancePromises);

  logger.info(`Wallet balances fetched for ${walletAddress}`);

  res.json({
    success: true,
    data: {
      balances,
    },
    error: null,
  });
});

export default router;

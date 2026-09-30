import express from 'express';
import logger from '../utils/logger.js';
import {
  fetchTokenBalance,
  fetchTokenPrice,
  fetchTokenMetadata,
  fetchLiquidityPoolData,
  getTokenSwapQuote,
} from '../services/baseRpcService.js';

const router = express.Router();

// Helper function to validate Ethereum address
const validateAddress = (address) => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
};

// GET /base/token-balance - Fetch token balance for a wallet
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

  const data = await fetchTokenBalance(walletAddress, tokenAddress);

  logger.info(`Token balance fetched for ${walletAddress}`);

  res.json({
    success: true,
    data,
    error: null,
  });
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

  const data = await fetchTokenPrice(tokenAddress);

  logger.info(`Token price fetched for ${tokenAddress}`);

  res.json({
    success: true,
    data,
    error: null,
  });
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

  const data = await fetchTokenMetadata(tokenAddress);

  logger.info(`Token metadata fetched for ${tokenAddress}`);

  res.json({
    success: true,
    data,
    error: null,
  });
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

  const data = await fetchLiquidityPoolData(poolAddress);

  logger.info(`Liquidity pool data fetched for ${poolAddress}`);

  res.json({
    success: true,
    data,
    error: null,
  });
});

// POST /base/token-swap-quote - Get token swap quote
router.post('/token-swap-quote', async (req, res) => {
  const { fromToken, toToken, amount } = req.body;

  if (!fromToken || !toToken || !amount) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required body parameters: fromToken, toToken, amount',
    });
  }

  try {
    validateAddress(fromToken);
    validateAddress(toToken);
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: error.message,
    });
  }

  const data = await getTokenSwapQuote(fromToken, toToken, amount);

  logger.info(`Token swap quote generated: ${amount} ${fromToken} -> ${toToken}`);

  res.json({
    success: true,
    data,
    error: null,
  });
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
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3d' },
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

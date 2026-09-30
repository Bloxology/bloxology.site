import 'dotenv/config';
import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger.js';
import { RPC_ENDPOINTS, CHAIN_ID_TO_RPC_KEY } from '../constants/common.js';

const RPC_ENDPOINT = process.env.BASE_RPC_ENDPOINT;

if (!RPC_ENDPOINT) {
  throw new Error('BASE_RPC_ENDPOINT is not defined in environment variables');
}

// Initialize cache with different TTLs
const priceCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
const metadataCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
const balanceCache = new NodeCache({ stdTTL: 60 }); // 1 minute

// ERC20 ABI for common functions
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
];

// Uniswap V3 Pool ABI for liquidity data
const UNISWAP_V3_POOL_ABI = [
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'liquidity',
    outputs: [{ name: '', type: 'uint128' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Helper function to encode function call data
const encodeFunctionCall = (abi, functionName, params = []) => {
  const func = abi.find((f) => f.name === functionName);
  if (!func) {
    throw new Error(`Function ${functionName} not found in ABI`);
  }

  // Simple encoding - in production, use ethers.js or web3.js
  // For now, return a placeholder that would be properly encoded
  const signature = `${functionName}(${func.inputs.map((i) => i.type).join(',')})`;
  return signature;
};

// Helper function to make JSON-RPC calls
const makeRpcCall = async (method, params) => {
  try {
    const response = await axios.post(
      RPC_ENDPOINT,
      {
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now(),
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message}`);
    }

    return response.data.result;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('RPC request timeout');
    }
    if (error.response?.status === 429) {
      throw new Error('RPC rate limit exceeded');
    }
    throw error;
  }
};

// Helper function to validate Ethereum address
const validateAddress = (address) => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
};

// Fetch token balance for a wallet
const fetchTokenBalance = async (walletAddress, tokenAddress) => {
  validateAddress(walletAddress);
  validateAddress(tokenAddress);

  const cacheKey = `balance-${walletAddress}-${tokenAddress}`;
  const cached = balanceCache.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for balance: ${cacheKey}`);
    return cached;
  }

  try {
    // Get decimals
    const decimalsData = await makeRpcCall('eth_call', [
      {
        to: tokenAddress,
        data: '0x313ce567', // decimals() function selector
      },
      'latest',
    ]);

    const decimals = parseInt(decimalsData, 16);

    // Get symbol
    const symbolData = await makeRpcCall('eth_call', [
      {
        to: tokenAddress,
        data: '0x95d89b41', // symbol() function selector
      },
      'latest',
    ]);

    // Decode symbol (basic decoding)
    let symbol = 'UNKNOWN';
    try {
      const symbolHex = symbolData.slice(2);
      const length = parseInt(symbolHex.slice(64, 128), 16);
      symbol = Buffer.from(symbolHex.slice(128, 128 + length * 2), 'hex').toString('utf8');
    } catch (e) {
      logger.warn(`Could not decode symbol for ${tokenAddress}`);
    }

    // Get balance
    const balanceData = await makeRpcCall('eth_call', [
      {
        to: tokenAddress,
        data: `0x70a08231000000000000000000000000${walletAddress.slice(2)}`, // balanceOf(address) function
      },
      'latest',
    ]);

    const balance = (BigInt(balanceData) / BigInt(10 ** decimals)).toString();

    const result = {
      balance,
      decimals,
      symbol,
    };

    balanceCache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`Error fetching token balance: ${error.message}`);
    throw error;
  }
};

// Fetch token price (simulated - in production, use price oracle)
const fetchTokenPrice = async (tokenAddress) => {
  validateAddress(tokenAddress);

  const cacheKey = `price-${tokenAddress}`;
  const cached = priceCache.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for price: ${cacheKey}`);
    return cached;
  }

  try {
    // Get decimals and symbol
    const decimalsData = await makeRpcCall('eth_call', [
      {
        to: tokenAddress,
        data: '0x313ce567', // decimals() function selector
      },
      'latest',
    ]);

    const decimals = parseInt(decimalsData, 16);

    const symbolData = await makeRpcCall('eth_call', [
      {
        to: tokenAddress,
        data: '0x95d89b41', // symbol() function selector
      },
      'latest',
    ]);

    let symbol = 'UNKNOWN';
    try {
      const symbolHex = symbolData.slice(2);
      const length = parseInt(symbolHex.slice(64, 128), 16);
      symbol = Buffer.from(symbolHex.slice(128, 128 + length * 2), 'hex').toString('utf8');
    } catch (e) {
      logger.warn(`Could not decode symbol for ${tokenAddress}`);
    }

    // Simulated price - in production, fetch from price oracle
    const price = Math.random() * 1000;

    const result = {
      price: parseFloat(price.toFixed(8)),
      symbol,
      decimals,
    };

    priceCache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`Error fetching token price: ${error.message}`);
    throw error;
  }
};

// Fetch token metadata
const fetchTokenMetadata = async (tokenAddress) => {
  validateAddress(tokenAddress);

  const cacheKey = `metadata-${tokenAddress}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for metadata: ${cacheKey}`);
    return cached;
  }

  try {
    // Get name
    const nameData = await makeRpcCall('eth_call', [
      {
        to: tokenAddress,
        data: '0x06fdde03', // name() function selector
      },
      'latest',
    ]);

    let name = 'UNKNOWN';
    try {
      const nameHex = nameData.slice(2);
      const length = parseInt(nameHex.slice(64, 128), 16);
      name = Buffer.from(nameHex.slice(128, 128 + length * 2), 'hex').toString('utf8');
    } catch (e) {
      logger.warn(`Could not decode name for ${tokenAddress}`);
    }

    // Get symbol
    const symbolData = await makeRpcCall('eth_call', [
      {
        to: tokenAddress,
        data: '0x95d89b41', // symbol() function selector
      },
      'latest',
    ]);

    let symbol = 'UNKNOWN';
    try {
      const symbolHex = symbolData.slice(2);
      const length = parseInt(symbolHex.slice(64, 128), 16);
      symbol = Buffer.from(symbolHex.slice(128, 128 + length * 2), 'hex').toString('utf8');
    } catch (e) {
      logger.warn(`Could not decode symbol for ${tokenAddress}`);
    }

    // Get decimals
    const decimalsData = await makeRpcCall('eth_call', [
      {
        to: tokenAddress,
        data: '0x313ce567', // decimals() function selector
      },
      'latest',
    ]);

    const decimals = parseInt(decimalsData, 16);

    // Get total supply
    const totalSupplyData = await makeRpcCall('eth_call', [
      {
        to: tokenAddress,
        data: '0x18160ddd', // totalSupply() function selector
      },
      'latest',
    ]);

    const totalSupply = (BigInt(totalSupplyData) / BigInt(10 ** decimals)).toString();

    const result = {
      name,
      symbol,
      decimals,
      totalSupply,
    };

    metadataCache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`Error fetching token metadata: ${error.message}`);
    throw error;
  }
};

// Fetch liquidity pool data
const fetchLiquidityPoolData = async (poolAddress) => {
  validateAddress(poolAddress);

  try {
    // Get token0
    const token0Data = await makeRpcCall('eth_call', [
      {
        to: poolAddress,
        data: '0x0dfe1681', // token0() function selector
      },
      'latest',
    ]);

    const token0 = `0x${token0Data.slice(-40)}`;

    // Get token1
    const token1Data = await makeRpcCall('eth_call', [
      {
        to: poolAddress,
        data: '0xd21220a7', // token1() function selector
      },
      'latest',
    ]);

    const token1 = `0x${token1Data.slice(-40)}`;

    // Get slot0 (price and tick)
    const slot0Data = await makeRpcCall('eth_call', [
      {
        to: poolAddress,
        data: '0x3850c7bd', // slot0() function selector
      },
      'latest',
    ]);

    // Simulated reserve data
    const reserve0 = (Math.random() * 1000000).toFixed(2);
    const reserve1 = (Math.random() * 1000000).toFixed(2);

    // Simulated APY
    const apy = Math.random() * 100;

    const result = {
      reserve0,
      reserve1,
      token0,
      token1,
      apy: parseFloat(apy.toFixed(2)),
    };

    return result;
  } catch (error) {
    logger.error(`Error fetching liquidity pool data: ${error.message}`);
    throw error;
  }
};

// Get token swap quote
const getTokenSwapQuote = async (fromToken, toToken, amount) => {
  validateAddress(fromToken);
  validateAddress(toToken);

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Invalid amount: must be a positive number');
  }

  try {
    // Simulated swap calculation
    const exchangeRate = Math.random() * 2 + 0.5; // Random rate between 0.5 and 2.5
    const outputAmount = (amountNum * exchangeRate).toFixed(8);
    const gasFee = (Math.random() * 0.01).toFixed(8);
    const slippage = Math.random() * 1; // 0-1%

    const result = {
      outputAmount,
      exchangeRate: parseFloat(exchangeRate.toFixed(8)),
      gasFee,
      slippage: parseFloat(slippage.toFixed(2)),
    };

    return result;
  } catch (error) {
    logger.error(`Error getting token swap quote: ${error.message}`);
    throw error;
  }
};

export {
  fetchTokenBalance,
  fetchTokenPrice,
  fetchTokenMetadata,
  fetchLiquidityPoolData,
  getTokenSwapQuote,
};

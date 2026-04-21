
import 'dotenv/config';
import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger.js';
import * as cdpService from './cdpService.js';
import * as alchemyService from './alchemyService.js';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

logger.info(`[Validation] ETHERSCAN_API_KEY validation: ${ETHERSCAN_API_KEY ? 'API key exists' : 'API key missing — etherscan routes will return errors'}`);

// Initialize cache with different TTLs
const accountCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
const contractCache = new NodeCache({ stdTTL: 600 }); // 10 minutes
const transactionCache = new NodeCache({ stdTTL: 60 }); // 1 minute
const gasCache = new NodeCache({ stdTTL: 30 }); // 30 seconds
const tokenBalanceCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Etherscan V2 unified endpoint — single host with chainid param
const ETHERSCAN_V2_BASE = 'https://api.etherscan.io/v2/api';

// V1 explorer endpoints for chains that may not work on V2 free tier
const V1_EXPLORER_HOSTS = {
  8453: 'https://api.basescan.org/api',
};

// Blockscout API endpoints (free, no key required, Etherscan-compatible V1 format)
const BLOCKSCOUT_HOSTS = {
  8453: 'https://base.blockscout.com/api',
  10: 'https://optimism.blockscout.com/api',
};

// Supported chainIds for validation
const SUPPORTED_CHAIN_IDS = new Set([1, 137, 42161, 10, 8453, 11155111]);

// Helper function to validate chainId is supported
const validateChainId = (chainId) => {
  if (!SUPPORTED_CHAIN_IDS.has(chainId)) {
    logger.error(`[validateChainId] Unsupported chainId: ${chainId}`);
    throw new Error(
      `Unsupported chainId: ${chainId}. Supported chains: ${[...SUPPORTED_CHAIN_IDS].join(', ')}`
    );
  }
};

// Helper function to validate Ethereum address
const validateAddress = (address) => {
  const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
  logger.info(`[Validation] Address ${address} is in valid checksummed format: ${isValid}`);
  if (!isValid) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
};

// Helper function to make Etherscan V2 API calls with exponential backoff
const makeEtherscanCall = async (chainId, params, retries = 3, delay = 1000) => {
  validateChainId(chainId);
  const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const safeApiKey = ETHERSCAN_API_KEY ? ETHERSCAN_API_KEY.substring(0, 10) + '...' : 'none';
  const fullUrl = `${ETHERSCAN_V2_BASE}?chainid=${chainId}&${new URLSearchParams({...params, apikey: 'HIDDEN'}).toString()}`;

  logger.info(`[${callId}] [makeEtherscanCall] BEFORE API CALL (V2):`);
  logger.info(`[${callId}] [makeEtherscanCall] ChainId: ${chainId}`);
  logger.info(`[${callId}] [makeEtherscanCall] Address being queried: ${params.address || 'N/A'}`);
  logger.info(`[${callId}] [makeEtherscanCall] Full Etherscan V2 API URL: ${fullUrl}`);
  logger.info(`[${callId}] [makeEtherscanCall] API key being used: ${safeApiKey}`);

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      logger.info(`[${callId}] [makeEtherscanCall] Attempt ${attempt + 1}/${retries}`);
      
      const response = await axios.get(ETHERSCAN_V2_BASE, {
        params: {
          chainid: chainId,
          ...params,
          apikey: ETHERSCAN_API_KEY,
        },
        timeout: 10000,
      });

      logger.info(`[${callId}] [makeEtherscanCall] AFTER API CALL:`);
      logger.info(`[${callId}] [makeEtherscanCall] Raw response status code: ${response.status}`);
      logger.info(`[${callId}] [makeEtherscanCall] Raw response data: ${JSON.stringify(response.data)}`);
      
      const resultType = typeof response.data.result;
      const isArray = Array.isArray(response.data.result);
      const isNull = response.data.result === null;
      const isUndefined = response.data.result === undefined;
      
      let detailedType = resultType;
      if (isArray) detailedType = 'array';
      if (isNull) detailedType = 'null';
      if (isUndefined) detailedType = 'undefined';

      logger.info(`[${callId}] [makeEtherscanCall] response.data.result type: ${detailedType}`);
      logger.info(`[${callId}] [makeEtherscanCall] response.data.result length: ${isArray ? response.data.result.length : (response.data.result ? response.data.result.length || 'N/A' : 'N/A')}`);
      logger.info(`[${callId}] [makeEtherscanCall] Is array: ${isArray}, Is object: ${resultType === 'object' && !isArray && !isNull}, Is string: ${resultType === 'string'}, Is null: ${isNull}, Is undefined: ${isUndefined}`);

      const status = String(response.data.status ?? '').trim();
      const message = String(response.data.message ?? '').trim();

      if (status === '0' || message === 'NOTOK') {
        const resultStr = String(response.data.result ?? '').toLowerCase();
        const isSoft = message === 'NOTOK' || 
                       message.toLowerCase().includes('no transactions found') || 
                       message.toLowerCase().includes('no records found') ||
                       resultStr.includes('no transactions found') ||
                       resultStr.includes('no records found');
        
        // Treat "not supported for this chain" as soft error (free tier limitation)
        const isUnsupportedChain = resultStr.includes('not supported for this chain') ||
                                   resultStr.includes('please upgrade');
        
        if (isSoft || isUnsupportedChain) {
          if (isUnsupportedChain) {
            logger.warn(`[${callId}] [makeEtherscanCall] Chain ${chainId} not supported on free V2 tier, returning empty`);
          }
          return []; 
        }

        if (message.toLowerCase().includes('rate limit')) {
          if (attempt < retries - 1) {
            const waitTime = delay * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue; 
          }
          throw new Error('Etherscan API rate limit exceeded');
        }

        throw new Error(`Etherscan API error: ${message || 'NOTOK'}`);
      }

      return response.data.result;
    } catch (error) {
      logger.error(`[${callId}] [makeEtherscanCall] Error on attempt ${attempt + 1}/${retries}`);
      logger.error(`[${callId}] [makeEtherscanCall] Full error message: ${error.message}`);
      logger.error(`[${callId}] [makeEtherscanCall] Error stack trace: ${error.stack}`);
      
      if (error.response?.status === 429 || (error.message && error.message.includes('rate limit'))) {
        if (attempt < retries - 1) {
          const waitTime = delay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error('Etherscan API rate limit exceeded');
      }

      if (error.code === 'ECONNABORTED') {
        if (attempt < retries - 1) {
          const waitTime = delay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error('Etherscan API request timeout');
      }

      if (attempt === retries - 1) {
        throw error;
      }

      const waitTime = delay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
};

// V1 explorer fallback for chains not fully supported on V2 free tier
const makeV1ExplorerCall = async (chainId, params) => {
  const host = V1_EXPLORER_HOSTS[chainId];
  if (!host) return null;

  const apiKey = process.env.BASESCAN_API_KEY || ETHERSCAN_API_KEY;
  const callId = `v1-${Date.now()}`;
  logger.info(`[${callId}] [makeV1ExplorerCall] Trying V1 explorer for chain ${chainId}: ${host}`);

  try {
    const response = await axios.get(host, {
      params: { ...params, apikey: apiKey },
      timeout: 10000,
    });

    const status = String(response.data.status ?? '').trim();
    const message = String(response.data.message ?? '').trim();
    const resultStr = String(response.data.result ?? '').toLowerCase();

    if (status === '0') {
      if (resultStr.includes('no transactions found') || resultStr.includes('no records found') || message === 'NOTOK') {
        logger.info(`[${callId}] [makeV1ExplorerCall] No data found (soft)`);
        return [];
      }
      logger.warn(`[${callId}] [makeV1ExplorerCall] V1 error: ${response.data.result}`);
      return null; // Signal caller to skip
    }

    logger.info(`[${callId}] [makeV1ExplorerCall] Got ${Array.isArray(response.data.result) ? response.data.result.length : 'non-array'} results`);
    return response.data.result;
  } catch (error) {
    logger.error(`[${callId}] [makeV1ExplorerCall] Error: ${error.message}`);
    return null;
  }
};

/**
 * Call Blockscout Etherscan-compatible API (free, no API key required).
 * Returns array of results or null on failure.
 */
const makeBlockscoutCall = async (chainId, params) => {
  const host = BLOCKSCOUT_HOSTS[chainId];
  if (!host) return null;

  const callId = `bs-${Date.now()}`;
  logger.info(`[${callId}] [makeBlockscoutCall] Trying Blockscout for chain ${chainId}: ${host}`);

  try {
    const response = await axios.get(host, {
      params,
      timeout: 15000,
    });

    const status = String(response.data.status ?? '').trim();
    const resultData = response.data.result;

    if (status === '0' || !Array.isArray(resultData)) {
      const msg = String(resultData ?? '').toLowerCase();
      if (msg.includes('no transactions found') || msg.includes('no records found')) {
        logger.info(`[${callId}] [makeBlockscoutCall] No data found`);
        return [];
      }
      logger.warn(`[${callId}] [makeBlockscoutCall] Non-success: ${response.data.message}`);
      return null;
    }

    logger.info(`[${callId}] [makeBlockscoutCall] Got ${resultData.length} results from Blockscout`);
    return resultData;
  } catch (error) {
    logger.error(`[${callId}] [makeBlockscoutCall] Error: ${error.message}`);
    return null;
  }
};

const getTokenBalances = async (address, chainId) => {
  const functionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  validateAddress(address);
  validateChainId(chainId);

  const cacheKey = `token-balances-${address.toLowerCase()}-${chainId}`;
  const cached = tokenBalanceCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Try Alchemy first (best coverage for Base, ETH, Arbitrum, Polygon)
  if (alchemyService.isConfigured() && alchemyService.ALCHEMY_HOSTS[chainId]) {
    logger.info(`[${functionId}] [getTokenBalances] Trying Alchemy for chain ${chainId}`);
    const alchemyResult = await alchemyService.getTokenBalances(address, chainId);
    if (alchemyResult !== null) {
      tokenBalanceCache.set(cacheKey, alchemyResult);
      return alchemyResult;
    }
    logger.info(`[${functionId}] [getTokenBalances] Alchemy failed, trying next provider`);
  }

  // Try CDP for Base chain
  if (cdpService.isConfigured() && cdpService.CDP_NETWORK_MAP[chainId]) {
    logger.info(`[${functionId}] [getTokenBalances] Trying CDP for chain ${chainId}`);
    const cdpResult = await cdpService.getTokenBalances(address, chainId);
    if (cdpResult !== null) {
      tokenBalanceCache.set(cacheKey, cdpResult);
      return cdpResult;
    }
    logger.info(`[${functionId}] [getTokenBalances] CDP failed, falling back to Etherscan V2`);
  }

  let tokenTxs = await makeEtherscanCall(chainId, {
    module: 'account',
    action: 'tokentx',
    address,
    startblock: 0,
    endblock: 99999999,
    sort: 'asc',
  });

  // If V2 returned empty and we have a V1 explorer for this chain, try it
  if ((!Array.isArray(tokenTxs) || tokenTxs.length === 0) && V1_EXPLORER_HOSTS[chainId]) {
    logger.info(`[${functionId}] [getTokenBalances] V2 empty for chain ${chainId}, trying V1 explorer`);
    const v1Result = await makeV1ExplorerCall(chainId, {
      module: 'account',
      action: 'tokentx',
      address,
      startblock: 0,
      endblock: 99999999,
      sort: 'asc',
    });
    if (Array.isArray(v1Result) && v1Result.length > 0) {
      tokenTxs = v1Result;
    }
  }

  // Try Blockscout if still empty
  if ((!Array.isArray(tokenTxs) || tokenTxs.length === 0) && BLOCKSCOUT_HOSTS[chainId]) {
    logger.info(`[${functionId}] [getTokenBalances] Trying Blockscout for chain ${chainId}`);
    const bsResult = await makeBlockscoutCall(chainId, {
      module: 'account',
      action: 'tokentx',
      address,
      startblock: 0,
      endblock: 99999999,
      sort: 'asc',
    });
    if (Array.isArray(bsResult) && bsResult.length > 0) {
      tokenTxs = bsResult;
    }
  }

  if (!Array.isArray(tokenTxs) || tokenTxs.length === 0) {
    tokenBalanceCache.set(cacheKey, []);
    return [];
  }

  const tokenBalances = new Map();

  for (const tx of tokenTxs) {
    try {
      const tokenAddress = tx.contractAddress.toLowerCase();
      const from = tx.from.toLowerCase();
      const to = tx.to.toLowerCase();
      const value = BigInt(tx.value);

      if (!tokenBalances.has(tokenAddress)) {
        tokenBalances.set(tokenAddress, {
          address: tokenAddress,
          balance: BigInt(0),
          decimals: Number.isFinite(parseInt(tx.tokenDecimal, 10)) ? parseInt(tx.tokenDecimal, 10) : 18,
          symbol: tx.tokenSymbol || 'UNKNOWN',
          name: tx.tokenName || 'Unknown Token',
        });
      }

      const token = tokenBalances.get(tokenAddress);

      if (to === address.toLowerCase()) {
        token.balance += value;
      } else if (from === address.toLowerCase()) {
        token.balance -= value;
      }
    } catch (error) {
      logger.error(`[${functionId}] [getTokenBalances] Error processing transaction: ${error.message}`);
      logger.error(`[${functionId}] [getTokenBalances] Stack trace: ${error.stack}`);
    }
  }

  // Format a BigInt token balance into a human-readable decimal string
  const formatBigIntBalance = (rawBalance, decimals) => {
    const absBalance = rawBalance < 0n ? 0n : rawBalance;
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = absBalance / divisor;
    const remainder = absBalance % divisor;
    const fractionStr = remainder.toString().padStart(decimals, '0');
    return `${whole}.${fractionStr}`;
  };

  const balances = [];

  for (const [tokenAddress, tokenData] of tokenBalances) {
    try {
      const sourceCode = await makeEtherscanCall(chainId, {
        module: 'contract',
        action: 'getsourcecode',
        address: tokenAddress,
      });

      let symbol = tokenData.symbol;
      let name = tokenData.name;
      let decimals = tokenData.decimals;

      if (Array.isArray(sourceCode) && sourceCode.length > 0) {
        const contractInfo = sourceCode[0];
        if (contractInfo.ContractName) {
          name = contractInfo.ContractName;
        }
      }

      const formatted = formatBigIntBalance(tokenData.balance, decimals);

      balances.push({
        address: tokenAddress,
        symbol: symbol || 'UNKNOWN',
        name: name || 'Unknown Token',
        balance: formatted,
        balanceFormatted: formatted,
        decimals,
        value: null,
      });
    } catch (error) {
      logger.error(`[${functionId}] [getTokenBalances] Error fetching details for token ${tokenAddress}: ${error.message}`);
      logger.error(`[${functionId}] [getTokenBalances] Stack trace: ${error.stack}`);
      
      const formatted = formatBigIntBalance(tokenData.balance, tokenData.decimals);

      balances.push({
        address: tokenAddress,
        symbol: tokenData.symbol || 'UNKNOWN',
        name: tokenData.name || 'Unknown Token',
        balance: formatted,
        balanceFormatted: formatted,
        decimals: tokenData.decimals,
        value: null,
      });
    }
  }

  tokenBalanceCache.set(cacheKey, balances);
  return balances;
};

const getAccountBalance = async (address, chainId = 1) => {
  validateAddress(address);

  const cacheKey = `balance-${address.toLowerCase()}-${chainId}`;
  const cached = accountCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await makeEtherscanCall(chainId, {
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest',
  });

  const balanceWei = result;
  const balanceEth = (BigInt(balanceWei) / BigInt(10 ** 18)).toString();

  const data = {
    address: address.toLowerCase(),
    balanceWei,
    balanceEth,
  };

  accountCache.set(cacheKey, data);
  return data;
};

const getMultipleAccountBalances = async (addresses, chainId = 1) => {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error('addresses must be a non-empty array');
  }

  if (addresses.length > 20) {
    throw new Error('Maximum 20 addresses allowed per request');
  }

  addresses.forEach(validateAddress);

  const result = await makeEtherscanCall(chainId, {
    module: 'account',
    action: 'balancemulti',
    address: addresses.join(','),
    tag: 'latest',
  });

  const balances = result.map((item) => ({
    address: item.account.toLowerCase(),
    balanceWei: item.balance,
    balanceEth: (BigInt(item.balance) / BigInt(10 ** 18)).toString(),
  }));

  return balances;
};

const getAccountTransactions = async (address, startblock = 0, endblock = 99999999, sort = 'asc', chainId = 1) => {
  validateAddress(address);

  if (!['asc', 'desc'].includes(sort)) {
    throw new Error('sort must be either "asc" or "desc"');
  }

  const cacheKey = `transactions-${address.toLowerCase()}-${startblock}-${endblock}-${sort}-${chainId}`;
  const cached = transactionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Try Alchemy first (best coverage for Base, ETH, Arbitrum, Polygon)
  if (alchemyService.isConfigured() && alchemyService.ALCHEMY_HOSTS[chainId]) {
    logger.info(`[getAccountTransactions] Trying Alchemy for chain ${chainId}`);
    const alchemyResult = await alchemyService.getAccountTransactions(address, chainId, sort);
    if (alchemyResult !== null) {
      transactionCache.set(cacheKey, alchemyResult);
      return alchemyResult;
    }
    logger.info(`[getAccountTransactions] Alchemy failed, trying next provider`);
  }

  // Try CDP for Base chain
  if (cdpService.isConfigured() && cdpService.CDP_NETWORK_MAP[chainId]) {
    logger.info(`[getAccountTransactions] Trying CDP for chain ${chainId}`);
    const cdpResult = await cdpService.getAccountTransactions(address, chainId, sort);
    if (cdpResult !== null) {
      transactionCache.set(cacheKey, cdpResult);
      return cdpResult;
    }
    logger.info(`[getAccountTransactions] CDP failed, falling back to Etherscan V2`);
  }

  let result = await makeEtherscanCall(chainId, {
    module: 'account',
    action: 'txlist',
    address,
    startblock,
    endblock,
    sort,
  });

  // If V2 returned empty and we have a V1 explorer for this chain, try it
  if ((!Array.isArray(result) || result.length === 0) && V1_EXPLORER_HOSTS[chainId]) {
    logger.info(`[getAccountTransactions] V2 empty for chain ${chainId}, trying V1 explorer`);
    const v1Result = await makeV1ExplorerCall(chainId, {
      module: 'account',
      action: 'txlist',
      address,
      startblock,
      endblock,
      sort,
    });
    if (Array.isArray(v1Result) && v1Result.length > 0) {
      result = v1Result;
    }
  }

  // If all explorer APIs failed, try Blockscout (free, no key)
  if ((!Array.isArray(result) || result.length === 0) && BLOCKSCOUT_HOSTS[chainId]) {
    logger.info(`[getAccountTransactions] Trying Blockscout for chain ${chainId}`);
    const bsResult = await makeBlockscoutCall(chainId, {
      module: 'account',
      action: 'txlist',
      address,
      startblock,
      endblock,
      sort,
    });
    if (Array.isArray(bsResult) && bsResult.length > 0) {
      result = bsResult;
    }
  }

  const transactions = Array.isArray(result)
    ? result.map((tx) => ({
        hash: tx.hash,
        from: tx.from.toLowerCase(),
        to: tx.to.toLowerCase(),
        value: tx.value,
        valueEth: (BigInt(tx.value) / BigInt(10 ** 18)).toString(),
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        gasUsed: tx.gasUsed,
        blockNumber: tx.blockNumber,
        timeStamp: tx.timeStamp,
        isError: tx.isError === '1',
        input: tx.input,
      }))
    : [];

  transactionCache.set(cacheKey, transactions);
  return transactions;
};

const getContractAbi = async (address, chainId = 1) => {
  validateAddress(address);

  const cacheKey = `abi-${address.toLowerCase()}-${chainId}`;
  const cached = contractCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await makeEtherscanCall(chainId, {
    module: 'contract',
    action: 'getabi',
    address,
  });

  let abi;
  try {
    abi = JSON.parse(result);
  } catch (error) {
    throw new Error(`Failed to parse contract ABI: ${error.message}`);
  }

  contractCache.set(cacheKey, abi);
  return abi;
};

const getContractSourceCode = async (address, chainId = 1) => {
  validateAddress(address);

  const cacheKey = `source-${address.toLowerCase()}-${chainId}`;
  const cached = contractCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await makeEtherscanCall(chainId, {
    module: 'contract',
    action: 'getsourcecode',
    address,
  });

  const sourceCode = Array.isArray(result) ? result[0] : result;

  const data = {
    address: address.toLowerCase(),
    sourceCode: sourceCode.SourceCode,
    contractName: sourceCode.ContractName,
    compilerVersion: sourceCode.CompilerVersion,
    optimizationUsed: sourceCode.OptimizationUsed === '1',
    runs: sourceCode.Runs,
    constructorArguments: sourceCode.ConstructorArguments,
    evmVersion: sourceCode.EVMVersion,
    library: sourceCode.Library,
    licenseType: sourceCode.LicenseType,
    proxy: sourceCode.Proxy === '1',
    implementation: sourceCode.Implementation,
  };

  contractCache.set(cacheKey, data);
  return data;
};

const getGasTracker = async (chainId = 1) => {
  const cacheKey = `gas-tracker-${chainId}`;
  const cached = gasCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await makeEtherscanCall(chainId, {
    module: 'gastracker',
    action: 'gasoracle',
  });

  const data = {
    safeGasPrice: result.SafeGasPrice,
    standardGasPrice: result.StandardGasPrice,
    fastGasPrice: result.FastGasPrice,
    suggestBaseGasPrice: result.suggestBaseGasPrice,
  };

  gasCache.set(cacheKey, data);
  return data;
};

const getTokenBalance = async (contractAddress, walletAddress, chainId = 1) => {
  validateAddress(contractAddress);
  validateAddress(walletAddress);

  const cacheKey = `token-balance-${contractAddress.toLowerCase()}-${walletAddress.toLowerCase()}-${chainId}`;
  const cached = accountCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await makeEtherscanCall(chainId, {
    module: 'account',
    action: 'tokenbalance',
    contractaddress: contractAddress,
    address: walletAddress,
    tag: 'latest',
  });

  const data = {
    contractAddress: contractAddress.toLowerCase(),
    walletAddress: walletAddress.toLowerCase(),
    balance: result,
  };

  accountCache.set(cacheKey, data);
  return data;
};

const getTokenSupply = async (contractAddress, chainId = 1) => {
  validateAddress(contractAddress);

  const cacheKey = `token-supply-${contractAddress.toLowerCase()}-${chainId}`;
  const cached = contractCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await makeEtherscanCall(chainId, {
    module: 'stats',
    action: 'tokensupply',
    contractaddress: contractAddress,
  });

  const data = {
    contractAddress: contractAddress.toLowerCase(),
    totalSupply: result,
  };

  contractCache.set(cacheKey, data);
  return data;
};

export {
  getTokenBalances,
  getAccountBalance,
  getMultipleAccountBalances,
  getAccountTransactions,
  getContractAbi,
  getContractSourceCode,
  getGasTracker,
  getTokenBalance,
  getTokenSupply,
};

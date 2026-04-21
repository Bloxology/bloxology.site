import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger.js';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const txCache = new NodeCache({ stdTTL: 60 });
const balanceCache = new NodeCache({ stdTTL: 300 });

// Alchemy subdomain mapping per chainId
const ALCHEMY_HOSTS = {
  1: 'eth-mainnet',
  8453: 'base-mainnet',
  42161: 'arb-mainnet',
  137: 'polygon-mainnet',
  10: 'opt-mainnet',
  11155111: 'eth-sepolia',
};

const isConfigured = () => !!ALCHEMY_API_KEY;

const getBaseUrl = (chainId) => {
  const host = ALCHEMY_HOSTS[chainId];
  if (!host || !ALCHEMY_API_KEY) return null;
  return `https://${host}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
};

/**
 * Get token balances using alchemy_getTokenBalances.
 * Returns array in the same format as etherscanService for drop-in compatibility.
 */
const getTokenBalances = async (address, chainId) => {
  const url = getBaseUrl(chainId);
  if (!url) return null;

  const cacheKey = `alchemy-bal-${address.toLowerCase()}-${chainId}`;
  const cached = balanceCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Step 1: Get all ERC20 balances
    const balRes = await axios.post(url, {
      jsonrpc: '2.0', method: 'alchemy_getTokenBalances', id: 1,
      params: [address, 'erc20'],
    }, { timeout: 15000 });

    const tokenBalances = balRes.data.result?.tokenBalances || [];

    // Filter non-zero
    const nonZero = tokenBalances.filter(t => {
      const bal = t.tokenBalance;
      return bal && bal !== '0x' && bal !== '0x0' &&
        bal !== '0x0000000000000000000000000000000000000000000000000000000000000000';
    });

    if (nonZero.length === 0) {
      balanceCache.set(cacheKey, []);
      return [];
    }

    // Step 2: Get metadata for each token
    const metadataPromises = nonZero.map(t =>
      axios.post(url, {
        jsonrpc: '2.0', method: 'alchemy_getTokenMetadata', id: 1,
        params: [t.contractAddress],
      }, { timeout: 10000 }).then(r => r.data.result).catch(() => null)
    );

    const metadataResults = await Promise.all(metadataPromises);

    const result = nonZero.map((t, i) => {
      const meta = metadataResults[i] || {};
      const decimals = Number.isFinite(meta.decimals) && meta.decimals >= 0 ? meta.decimals : 18;
      const rawBalance = BigInt(t.tokenBalance);
      const divisor = BigInt(10) ** BigInt(decimals);
      const whole = rawBalance / divisor;
      const remainder = rawBalance % divisor;
      const formatted = `${whole}.${remainder.toString().padStart(decimals, '0')}`;

      return {
        address: t.contractAddress.toLowerCase(),
        symbol: meta.symbol || 'UNKNOWN',
        name: meta.name || 'Unknown Token',
        balance: formatted,
        balanceFormatted: formatted,
        decimals,
        value: null,
      };
    });

    logger.info(`[Alchemy] Got ${result.length} token balances for ${address} on chain ${chainId}`);
    balanceCache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`[Alchemy] getTokenBalances failed for chain ${chainId}: ${error.message}`);
    return null;
  }
};

/**
 * Get transaction history using alchemy_getAssetTransfers.
 * Combines incoming + outgoing, deduplicates, and returns in etherscanService format.
 */
const getAccountTransactions = async (address, chainId, sort = 'desc') => {
  const url = getBaseUrl(chainId);
  if (!url) return null;

  const cacheKey = `alchemy-tx-${address.toLowerCase()}-${chainId}-${sort}`;
  const cached = txCache.get(cacheKey);
  if (cached) return cached;

  try {
    // 'internal' category only supported on ETH (1) and Polygon (137)
    const supportsInternal = [1, 137].includes(Number(chainId));
    const categories = supportsInternal
      ? ['external', 'internal', 'erc20']
      : ['external', 'erc20'];

    // Fetch incoming and outgoing transfers in parallel
    const [inRes, outRes] = await Promise.all([
      axios.post(url, {
        jsonrpc: '2.0', method: 'alchemy_getAssetTransfers', id: 1,
        params: [{
          fromBlock: '0x0', toBlock: 'latest',
          toAddress: address,
          category: categories,
          maxCount: '0x32', // 50
          order: 'desc',
          withMetadata: true,
        }],
      }, { timeout: 15000 }),
      axios.post(url, {
        jsonrpc: '2.0', method: 'alchemy_getAssetTransfers', id: 2,
        params: [{
          fromBlock: '0x0', toBlock: 'latest',
          fromAddress: address,
          category: categories,
          maxCount: '0x32',
          order: 'desc',
          withMetadata: true,
        }],
      }, { timeout: 15000 }),
    ]);

    const inTransfers = inRes.data.result?.transfers || [];
    const outTransfers = outRes.data.result?.transfers || [];

    // Merge and deduplicate by hash
    const seen = new Set();
    const allTransfers = [];
    for (const t of [...inTransfers, ...outTransfers]) {
      if (!seen.has(t.hash)) {
        seen.add(t.hash);
        allTransfers.push(t);
      }
    }

    // Convert to etherscanService format
    const transactions = allTransfers.map(t => {
      const valueWei = t.rawContract?.value
        ? BigInt(t.rawContract.value).toString()
        : t.value
          ? BigInt(Math.floor(t.value * 1e18)).toString()
          : '0';

      return {
        hash: t.hash,
        from: (t.from || '').toLowerCase(),
        to: (t.to || '').toLowerCase(),
        value: valueWei,
        valueEth: t.value != null ? String(t.value) : '0',
        gas: '0',
        gasPrice: '0',
        gasUsed: '0',
        blockNumber: t.blockNum ? String(parseInt(t.blockNum, 16)) : '',
        timeStamp: t.metadata?.blockTimestamp
          ? String(Math.floor(new Date(t.metadata.blockTimestamp).getTime() / 1000))
          : '0',
        isError: false,
        input: '0x',
      };
    });

    // Sort
    transactions.sort((a, b) => {
      const diff = parseInt(a.timeStamp) - parseInt(b.timeStamp);
      return sort === 'desc' ? -diff : diff;
    });

    logger.info(`[Alchemy] Got ${transactions.length} transactions for ${address} on chain ${chainId}`);
    txCache.set(cacheKey, transactions);
    return transactions;
  } catch (error) {
    logger.error(`[Alchemy] getAccountTransactions failed for chain ${chainId}: ${error.message}`);
    return null;
  }
};

export { isConfigured, ALCHEMY_HOSTS, getTokenBalances, getAccountTransactions };

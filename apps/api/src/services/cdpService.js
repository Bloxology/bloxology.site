import 'dotenv/config';
import crypto from 'crypto';
import axios from 'axios';
import { SignJWT, importPKCS8 } from 'jose';
import NodeCache from 'node-cache';
import logger from '../utils/logger.js';

const CDP_KEY_ID = process.env.CDP_KEY_ID;
const CDP_API_KEY = process.env.CDP_API_KEY;
const CDP_BASE_URL = 'https://api.developer.coinbase.com';

const txCache = new NodeCache({ stdTTL: 60 });
const balanceCache = new NodeCache({ stdTTL: 300 });

const CDP_NETWORK_MAP = {
  8453: 'base-mainnet',
};

const isConfigured = () => !!(CDP_KEY_ID && CDP_API_KEY);

/**
 * Generate a CDP JWT for Platform API requests.
 * CDP uses Ed25519 signing when the key has that algorithm.
 * Falls back to Bearer token if no PEM key is available.
 */
const generateJwt = async (method, path) => {
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  // CDP expects the URI in the JWT claims  
  const uri = `${method.toUpperCase()} ${CDP_BASE_URL}${path}`;

  const payload = {
    sub: CDP_KEY_ID,
    iss: 'cdp',
    aud: ['cdp_service'],
    nbf: now,
    exp: now + 120, // 2 min expiry
    uris: [uri],
  };

  // If CDP_API_KEY looks like a PEM private key, use Ed25519 JWT signing
  if (CDP_API_KEY.includes('BEGIN')) {
    const privateKey = await importPKCS8(CDP_API_KEY, 'EdDSA');
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'EdDSA', kid: CDP_KEY_ID, nonce, typ: 'JWT' })
      .sign(privateKey);
  }

  // Otherwise use the API key as a Bearer token (works for Node RPC, 
  // may not work for Platform API — will fall back to Etherscan)
  return null;
};

/**
 * Make an authenticated CDP Platform API call.
 * Uses JWT auth if PEM key available, otherwise Bearer token.
 */
const makeCdpCall = async (path, retries = 2) => {
  if (!isConfigured()) {
    throw new Error('CDP credentials not configured');
  }

  const url = `${CDP_BASE_URL}${path}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      logger.info(`[CDP] ${attempt > 0 ? `Retry ${attempt}` : 'Request'}: GET ${path}`);

      const jwt = await generateJwt('GET', path);
      const authHeader = jwt ? `Bearer ${jwt}` : `Bearer ${CDP_API_KEY}`;

      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;
      logger.error(`[CDP] Error (attempt ${attempt + 1}/${retries + 1}): ${status} ${msg}`);

      // Auth failure — don't retry
      if (status === 401 || status === 403) {
        throw new Error(`CDP auth failed (${status}): ${msg}`);
      }

      // Rate limited or server error — retry with backoff
      if (attempt < retries && (status === 429 || status >= 500)) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }

      throw error;
    }
  }
};

/**
 * Get transaction history for an address on a CDP-supported chain.
 * Returns data in the same format as etherscanService.getAccountTransactions.
 */
const getAccountTransactions = async (address, chainId, sort = 'desc') => {
  const networkId = CDP_NETWORK_MAP[chainId];
  if (!networkId) return null; // Not a CDP-supported chain

  const cacheKey = `cdp-tx-${address.toLowerCase()}-${chainId}-${sort}`;
  const cached = txCache.get(cacheKey);
  if (cached) return cached;

  try {
    const data = await makeCdpCall(
      `/platform/v1/networks/${networkId}/addresses/${address}/transactions?limit=50`
    );

    const transactions = (data.transactions || data.data || []).map(tx => ({
      hash: tx.transaction_hash || tx.hash || '',
      from: (tx.from || '').toLowerCase(),
      to: (tx.to || '').toLowerCase(),
      value: tx.value || '0',
      valueEth: tx.value ? (BigInt(tx.value) / BigInt(10 ** 18)).toString() : '0',
      gas: tx.gas || tx.gas_limit || '0',
      gasPrice: tx.gas_price || '0',
      gasUsed: tx.gas_used || tx.receipt_gas_used || '0',
      blockNumber: String(tx.block_number || tx.blockNumber || ''),
      timeStamp: tx.block_timestamp
        ? String(Math.floor(new Date(tx.block_timestamp).getTime() / 1000))
        : tx.timeStamp || '0',
      isError: tx.status === 'failed' || tx.status === '0' || tx.isError === '1',
      input: tx.input || '0x',
    }));

    if (sort === 'asc') transactions.reverse();

    txCache.set(cacheKey, transactions);
    logger.info(`[CDP] Got ${transactions.length} transactions for ${address} on ${networkId}`);
    return transactions;
  } catch (error) {
    logger.error(`[CDP] Failed to get transactions: ${error.message}`);
    return null; // Signal caller to fall back
  }
};

/**
 * Get token balances for an address on a CDP-supported chain.
 * Returns data in the same format as etherscanService.getTokenBalances.
 */
const getTokenBalances = async (address, chainId) => {
  const networkId = CDP_NETWORK_MAP[chainId];
  if (!networkId) return null;

  const cacheKey = `cdp-tokens-${address.toLowerCase()}-${chainId}`;
  const cached = balanceCache.get(cacheKey);
  if (cached) return cached;

  try {
    const data = await makeCdpCall(
      `/platform/v1/networks/${networkId}/addresses/${address}/balances`
    );

    const balances = (data.balances || data.data || [])
      .filter(b => b.asset?.type === 'erc20' || b.asset?.asset_id !== 'eth')
      .map(b => {
        const decimals = b.asset?.decimals || 18;
        const rawAmount = b.amount || '0';
        return {
          address: (b.asset?.contract_address || '').toLowerCase(),
          symbol: b.asset?.symbol || b.asset?.asset_id || 'UNKNOWN',
          name: b.asset?.name || b.asset?.asset_id || 'Unknown Token',
          balance: rawAmount,
          balanceFormatted: rawAmount,
          decimals,
          value: null,
        };
      });

    balanceCache.set(cacheKey, balances);
    logger.info(`[CDP] Got ${balances.length} token balances for ${address} on ${networkId}`);
    return balances;
  } catch (error) {
    logger.error(`[CDP] Failed to get token balances: ${error.message}`);
    return null;
  }
};

export {
  isConfigured,
  getAccountTransactions,
  getTokenBalances,
  CDP_NETWORK_MAP,
};

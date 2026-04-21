const DEFAULT_BASE_RPC_ENDPOINT = 'https://base-rpc.publicnode.com';

const sanitizeRpcEndpoint = (value, fallback) => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  const lowered = raw.toLowerCase();
  const hasPlaceholder = lowered.includes('your_')
    || lowered.includes('<')
    || lowered.includes('replace_me');

  if (hasPlaceholder) return fallback;

  try {
    const parsed = new URL(raw);
    if (!/^https?:$/.test(parsed.protocol)) return fallback;
    return raw;
  } catch (_) {
    return fallback;
  }
};

const BASE_RPC_ENDPOINT = sanitizeRpcEndpoint(process.env.BASE_RPC_ENDPOINT, DEFAULT_BASE_RPC_ENDPOINT);
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3/simple/price';

const CHAIN_ID_TO_RPC_URL = {
  1: 'https://eth.llamarpc.com',
  137: 'https://polygon-rpc.com',
  8453: BASE_RPC_ENDPOINT,
  42161: 'https://arb1.arbitrum.io/rpc',
  10: 'https://mainnet.optimism.io',
  2222: 'https://evm.kava.io',
  84532: 'https://sepolia.base.org',
  11155111: 'https://rpc.sepolia.org',
};

const getRpcUrl = (chainId) => CHAIN_ID_TO_RPC_URL[Number(chainId)] || BASE_RPC_ENDPOINT;

const CHAIN_ID_TO_COINGECKO_PLATFORM = {
  1: 'ethereum',
  137: 'polygon-pos',
  8453: 'base',
  42161: 'arbitrum-one',
  10: 'optimistic-ethereum',
  2222: 'kava',
  84532: 'base',
  11155111: 'ethereum',
};

const PRICE_CACHE_TTL_MS = 60 * 1000;
const TOKEN_META_CACHE_TTL_MS = 10 * 60 * 1000;

const priceCache = new Map();
const tokenMetaCache = new Map();

const TOKEN_PRICE_IDS = {
  // Base Mainnet
  '0x4200000000000000000000000000000000000006': 'ethereum',
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'usd-coin',
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'dai',
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': 'tether',
  // Ethereum Mainnet
  '0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2': 'ethereum',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin',
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'dai',
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether',
};

const KNOWN_TOKEN_META = {
  '0x4200000000000000000000000000000000000006': { decimals: 18, symbol: 'WETH' },
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { decimals: 6, symbol: 'USDC' },
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': { decimals: 18, symbol: 'DAI' },
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': { decimals: 6, symbol: 'USDT' },
  '0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2': { decimals: 18, symbol: 'WETH' },
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { decimals: 6, symbol: 'USDC' },
  '0x6b175474e89094c44da98b954eedeac495271d0f': { decimals: 18, symbol: 'DAI' },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { decimals: 6, symbol: 'USDT' },
};

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

/** Set CORS headers and handle OPTIONS preflight. Returns true if the request was a preflight. */
const cors = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
};

const isAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(value || '');

const nowMs = () => Date.now();

const shouldUseCache = (cached, ttlMs) => cached && nowMs() - cached.ts < ttlMs;

const rpc = async (method, params, chainId) => {
  const endpoint = chainId ? getRpcUrl(chainId) : BASE_RPC_ENDPOINT;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Base RPC request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || 'Base RPC returned an error');
  }

  return payload.result;
};

const hexToBigInt = (hex) => {
  if (!hex || hex === '0x') return 0n;
  return BigInt(hex);
};

const formatUnits = (value, decimals, precision = 6) => {
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  if (precision <= 0) return whole.toString();

  const fullFraction = fraction.toString().padStart(decimals, '0');
  const trimmed = fullFraction.slice(0, precision).replace(/0+$/, '');
  return trimmed ? `${whole.toString()}.${trimmed}` : whole.toString();
};

const decodeAbiString = (hexData) => {
  if (!hexData || hexData === '0x') return 'UNKNOWN';
  const raw = hexData.startsWith('0x') ? hexData.slice(2) : hexData;

  try {
    if (raw.length >= 128) {
      const length = parseInt(raw.slice(64, 128), 16);
      const strHex = raw.slice(128, 128 + length * 2);
      const decoded = Buffer.from(strHex, 'hex').toString('utf8').replace(/\u0000/g, '').trim();
      if (decoded) return decoded;
    }
  } catch (_) {
    // Try bytes32 fallback below
  }

  try {
    const bytes32 = raw.slice(0, 64);
    const decoded = Buffer.from(bytes32, 'hex').toString('utf8').replace(/\u0000/g, '').trim();
    return decoded || 'UNKNOWN';
  } catch (_) {
    return 'UNKNOWN';
  }
};

const getTokenMeta = async (tokenAddress, chainId) => {
  const key = `${tokenAddress.toLowerCase()}:${chainId || 8453}`;
  const cached = tokenMetaCache.get(key);
  if (shouldUseCache(cached, TOKEN_META_CACHE_TTL_MS)) {
    return cached.value;
  }

  const knownMeta = KNOWN_TOKEN_META[tokenAddress.toLowerCase()];
  if (knownMeta) {
    tokenMetaCache.set(key, { ts: nowMs(), value: knownMeta });
    return knownMeta;
  }

  const [decimalsHex, symbolHex] = await Promise.all([
    rpc('eth_call', [{ to: tokenAddress, data: '0x313ce567' }, 'latest'], chainId),
    rpc('eth_call', [{ to: tokenAddress, data: '0x95d89b41' }, 'latest'], chainId),
  ]);

  const decimals = Number.parseInt(decimalsHex, 16);
  const symbol = decodeAbiString(symbolHex);

  const value = {
    decimals: Number.isFinite(decimals) ? decimals : 18,
    symbol,
  };
  tokenMetaCache.set(key, { ts: nowMs(), value });
  return value;
};

const WETH_ADDRESSES = new Set([
  '0x4200000000000000000000000000000000000006', // Base / Optimism WETH
  '0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2', // Ethereum WETH
]);

const isWrappedNative = (address) => WETH_ADDRESSES.has(address.toLowerCase());

const getErc20Balance = async (walletAddress, tokenAddress, chainId) => {
  const { decimals, symbol } = await getTokenMeta(tokenAddress, chainId);
  const paddedWallet = walletAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');

  // For WETH addresses, return native ETH balance (users hold native ETH, not wrapped)
  if (isWrappedNative(tokenAddress)) {
    const nativeHex = await rpc('eth_getBalance', [walletAddress, 'latest'], chainId);
    const nativeRaw = hexToBigInt(nativeHex);
    const erc20Hex = await rpc(
      'eth_call',
      [{ to: tokenAddress, data: `0x70a08231${paddedWallet}` }, 'latest'],
      chainId
    );
    const erc20Raw = hexToBigInt(erc20Hex);
    const balanceRaw = nativeRaw + erc20Raw;
    return {
      balanceRaw,
      balance: formatUnits(balanceRaw, 18),
      decimals: 18,
      symbol: 'ETH',
    };
  }

  const balanceHex = await rpc(
    'eth_call',
    [{ to: tokenAddress, data: `0x70a08231${paddedWallet}` }, 'latest'],
    chainId
  );
  const balanceRaw = hexToBigInt(balanceHex);

  return {
    balanceRaw,
    balance: formatUnits(balanceRaw, decimals),
    decimals,
    symbol,
  };
};

const getNativeBalance = async (walletAddress) => {
  const result = await rpc('eth_getBalance', [walletAddress, 'latest']);
  const balanceRaw = hexToBigInt(result);
  return {
    balanceRaw,
    balance: formatUnits(balanceRaw, 18),
    decimals: 18,
    symbol: 'ETH',
  };
};

const getUsdPrice = async (tokenAddress, platform = 'base') => {
  const key = tokenAddress.toLowerCase();
  const id = TOKEN_PRICE_IDS[key];
  const cacheKey = id ? `id:${id}` : `addr:${key}:${platform}`;

  const cached = priceCache.get(cacheKey);
  if (shouldUseCache(cached, PRICE_CACHE_TTL_MS)) {
    return cached.value;
  }

  if (id) {
    const url = `${COINGECKO_BASE}?ids=${encodeURIComponent(id)}&vs_currencies=usd`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`CoinGecko request failed: ${response.status}`);
    }

    const payload = await response.json();
    const value = Number(payload?.[id]?.usd || 0);
    const priceResult = {
      value,
      source: 'coingecko-id',
      available: value > 0,
    };
    priceCache.set(cacheKey, { ts: nowMs(), value: priceResult });
    return priceResult;
  }

  const safePlatform = CHAIN_ID_TO_COINGECKO_PLATFORM[platform] || platform || 'base';
  const tokenUrl = `https://api.coingecko.com/api/v3/simple/token_price/${encodeURIComponent(safePlatform)}?contract_addresses=${encodeURIComponent(key)}&vs_currencies=usd`;
  const tokenResponse = await fetch(tokenUrl, { headers: { Accept: 'application/json' } });
  if (!tokenResponse.ok) {
    // Don't throw — return unavailable so callers can decide what to do.
    const priceResult = { value: 0, source: 'coingecko-contract', available: false };
    priceCache.set(cacheKey, { ts: nowMs(), value: priceResult });
    return priceResult;
  }

  const tokenPayload = await tokenResponse.json();
  const value = Number(tokenPayload?.[key]?.usd || 0);
  const priceResult = {
    value,
    source: 'coingecko-contract',
    available: value > 0,
  };
  priceCache.set(cacheKey, { ts: nowMs(), value: priceResult });
  return priceResult;
};

module.exports = {
  TOKEN_PRICE_IDS,
  CHAIN_ID_TO_COINGECKO_PLATFORM,
  CHAIN_ID_TO_RPC_URL,
  getRpcUrl,
  formatUnits,
  getErc20Balance,
  getTokenMeta,
  getNativeBalance,
  getUsdPrice,
  isAddress,
  json,
  cors,
};
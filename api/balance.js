const { getErc20Balance, getNativeBalance, formatUnits, isAddress, json, cors } = require('./base/_helpers');

const TRACKED_TOKENS = [
  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
];

const discoverTokens = async (address) => {
  if (!process.env.ALCHEMY_API_KEY) return null;

  const endpoint = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  const tokenBalances = [];
  let pageKey;

  do {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [address, 'erc20', { maxCount: 100, ...(pageKey ? { pageKey } : {}) }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Alchemy token discovery failed: ${response.status}`);
    const payload = await response.json();
    if (payload.error || !Array.isArray(payload.result?.tokenBalances)) {
      throw new Error(payload.error?.message || 'Invalid Alchemy token balance response');
    }

    tokenBalances.push(...payload.result.tokenBalances);
    pageKey = payload.result.pageKey;
  } while (pageKey);

  const nonZeroTokens = tokenBalances.filter((token) => {
    try {
      return /^0x[a-fA-F0-9]{40}$/.test(token?.contractAddress) && BigInt(token.tokenBalance || '0x0') > 0n;
    } catch (_) {
      return false;
    }
  });
  const tokens = [];

  for (let i = 0; i < nonZeroTokens.length; i += 10) {
    const batch = nonZeroTokens.slice(i, i + 10);
    const metadata = await Promise.all(batch.map(async ({ contractAddress }) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenMetadata',
          params: [contractAddress],
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload.error ? null : payload.result;
    }));

    batch.forEach((token, index) => {
      const metadataDecimals = Number(metadata[index]?.decimals);
      const decimals = Number.isInteger(metadataDecimals) && metadataDecimals >= 0 && metadataDecimals <= 255
        ? metadataDecimals
        : 18;
      const balanceRaw = BigInt(token.tokenBalance);
      const balance = formatUnits(balanceRaw, decimals);
      tokens.push({
        address: token.contractAddress.toLowerCase(),
        symbol: metadata[index]?.symbol || 'UNKNOWN',
        name: metadata[index]?.name || 'Unknown Token',
        balance,
        balanceFormatted: balance,
        decimals,
        value: null,
      });
    });
  }

  return tokens;
};

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const address = req.query && req.query.address;
  if (!address) {
    return json(res, 400, {
      success: false,
      data: null,
      error: 'Missing required query parameter: address',
    });
  }

  if (!isAddress(address)) {
    return json(res, 400, {
      success: false,
      data: null,
      error: `Invalid wallet address: ${address}`,
    });
  }

  try {
    const [nativeResult, discoveredTokens] = await Promise.all([
      getNativeBalance(address),
      discoverTokens(address).catch((error) => {
        console.error('Token auto-discovery failed:', error.message);
        return null;
      }),
    ]);
    const tokenResults = discoveredTokens ?? await Promise.all(
      TRACKED_TOKENS.map(async (token) => {
        try {
          const result = await getErc20Balance(address, token.address);
          return {
            address: token.address.toLowerCase(),
            symbol: result.symbol || token.symbol,
            name: token.name,
            balance: result.balance,
            balanceFormatted: result.balance,
            decimals: result.decimals || token.decimals,
            value: null,
          };
        } catch (_) {
          return null;
        }
      })
    );
    const allTokens = tokenResults.filter(Boolean);

    return json(res, 200, {
      success: true,
      data: {
        native: {
          address: address.toLowerCase(),
          balanceWei: nativeResult.balanceRaw.toString(),
          balanceEth: nativeResult.balance,
        },
        tokens: allTokens,
      },
      error: null,
    });
  } catch (error) {
    return json(res, 502, {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch balances',
    });
  }
};
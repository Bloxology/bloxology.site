const { getErc20Balance, getNativeBalance, isAddress, json, cors } = require('./base/_helpers');

const TRACKED_TOKENS = [
  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
];

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
    const [nativeResult, tokenResults] = await Promise.all([
      getNativeBalance(address),
      Promise.all(
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
      ),
    ]);

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
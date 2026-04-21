const { getErc20Balance, getNativeBalance, getUsdPrice, isAddress, json, cors } = require('./_helpers');

const TRACKED_TOKENS = [
  { symbol: 'ETH', address: '0x4200000000000000000000000000000000000006', native: true },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' },
  { symbol: 'USDT', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' },
];

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const walletAddress = req.query && req.query.walletAddress;
  if (!walletAddress) {
    return json(res, 400, { success: false, data: null, error: 'Missing required query parameter: walletAddress' });
  }
  if (!isAddress(walletAddress)) {
    return json(res, 400, { success: false, data: null, error: 'Invalid Ethereum address' });
  }

  try {
    const balances = await Promise.all(
      TRACKED_TOKENS.map(async (token) => {
        try {
          const [balanceResult, usdPrice] = await Promise.all([
            token.native ? getNativeBalance(walletAddress) : getErc20Balance(walletAddress, token.address),
            getUsdPrice(token.address),
          ]);
          const numericBalance = Number(balanceResult.balance);
          const value = Number.isFinite(numericBalance)
            ? Number((numericBalance * usdPrice.value).toFixed(2))
            : 0;

          return {
            token: token.symbol,
            balance: balanceResult.balance,
            price: Number(usdPrice.value.toFixed(6)),
            value,
            priceAvailable: usdPrice.available,
            priceSource: usdPrice.source,
          };
        } catch (_) {
          return {
            token: token.symbol,
            balance: '0',
            price: 0,
            value: 0,
            priceAvailable: false,
            priceSource: 'unavailable',
          };
        }
      })
    );

    return json(res, 200, {
      success: true,
      data: { balances },
      error: null,
    });
  } catch (error) {
    return json(res, 502, {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch wallet balances',
    });
  }
};

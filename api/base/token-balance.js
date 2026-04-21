const { getErc20Balance, isAddress, json, cors } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const walletAddress = req.query && req.query.walletAddress;
  const tokenAddress = req.query && req.query.tokenAddress;
  const chainId = req.query && req.query.chainId ? Number(req.query.chainId) : 8453;

  if (!walletAddress || !tokenAddress) {
    return json(res, 400, {
      success: false,
      data: null,
      error: 'Missing required query parameters: walletAddress, tokenAddress',
    });
  }

  if (!isAddress(walletAddress) || !isAddress(tokenAddress)) {
    return json(res, 400, { success: false, data: null, error: 'Invalid Ethereum address' });
  }

  try {
    const balance = await getErc20Balance(walletAddress, tokenAddress, chainId);
    return json(res, 200, {
      success: true,
      data: {
        balance: balance.balance,
        symbol: balance.symbol,
        decimals: balance.decimals,
        tokenAddress,
        walletAddress,
      },
      error: null,
    });
  } catch (error) {
    return json(res, 502, {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch token balance',
    });
  }
};

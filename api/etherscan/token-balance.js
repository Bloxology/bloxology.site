const { getErc20Balance, isAddress, json, cors } = require('../base/_helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const walletAddress = req.query && req.query.walletAddress;
  const contractAddress = req.query && req.query.contractAddress;

  if (!walletAddress || !contractAddress) {
    return json(res, 400, {
      success: false,
      data: null,
      error: 'Missing required query parameters: walletAddress, contractAddress',
    });
  }

  if (!isAddress(walletAddress) || !isAddress(contractAddress)) {
    return json(res, 400, {
      success: false,
      data: null,
      error: 'Invalid Ethereum address',
    });
  }

  try {
    const result = await getErc20Balance(walletAddress, contractAddress);
    return json(res, 200, {
      success: true,
      data: {
        balance: result.balanceRaw.toString(),
        symbol: result.symbol,
        decimals: result.decimals,
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
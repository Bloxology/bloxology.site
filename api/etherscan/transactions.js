const { isAddress, json, cors } = require('../base/_helpers');

const ETHERSCAN_V1_HOSTS = {
  1: 'https://api.etherscan.io/api',
  8453: 'https://api.basescan.org/api',
  137: 'https://api.polygonscan.com/api',
  42161: 'https://api.arbiscan.io/api',
};

const BLOCKSCOUT_HOSTS = {
  1: 'https://eth.blockscout.com/api',
  8453: 'https://base.blockscout.com/api',
  137: 'https://polygon.blockscout.com/api',
  42161: 'https://arbitrum.blockscout.com/api',
};

const parseSort = (value) => (value === 'asc' ? 'asc' : 'desc');

const formatUnits = (valueRaw, decimals, precision) => {
  const value = BigInt(valueRaw || '0');
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  if (precision <= 0) return whole.toString();

  const fullFraction = fraction.toString().padStart(decimals, '0');
  const trimmed = fullFraction.slice(0, precision).replace(/0+$/, '');
  return trimmed ? `${whole.toString()}.${trimmed}` : whole.toString();
};

const normalizeTx = (tx) => {
  const valueRaw = tx.value || '0';
  return {
    hash: tx.hash || tx.transaction_hash || '',
    from: (tx.from || '').toLowerCase(),
    to: (tx.to || '').toLowerCase(),
    value: valueRaw,
    valueEth: formatUnits(valueRaw, 18, 18),
    gas: tx.gas || '0',
    gasPrice: tx.gasPrice || tx.gas_price || '0',
    gasUsed: tx.gasUsed || tx.gas_used || '0',
    blockNumber: tx.blockNumber || tx.block_number || '0',
    timeStamp: tx.timeStamp || tx.timestamp || '0',
    isError: tx.isError === '1' || tx.status === '0' ? '1' : '0',
    input: tx.input || tx.data || '0x',
  };
};

const mapTxList = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map(normalizeTx)
    .filter((tx) => tx.hash);
};

const getEtherscanV2 = async ({ address, startblock, endblock, sort, chainId }) => {
  const apiKey = process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY || 'YourApiKeyToken';
  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address,
    startblock: String(startblock),
    endblock: String(endblock),
    sort,
    chainid: String(chainId),
    apikey: apiKey,
  });

  const response = await fetch(`https://api.etherscan.io/v2/api?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Etherscan V2 request failed: ${response.status}`);
  }

  const payload = await response.json();

  if (payload?.status === '1' && Array.isArray(payload?.result)) {
    return payload.result;
  }

  if (String(payload?.message || '').toLowerCase().includes('no transactions')) {
    return [];
  }

  throw new Error(payload?.result || payload?.message || 'Etherscan V2 returned an error');
};

const getEtherscanV1 = async ({ address, startblock, endblock, sort, chainId }) => {
  const host = ETHERSCAN_V1_HOSTS[chainId];
  if (!host) {
    throw new Error(`No V1 explorer configured for chain ${chainId}`);
  }

  const apiKey = process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY || 'YourApiKeyToken';
  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address,
    startblock: String(startblock),
    endblock: String(endblock),
    sort,
    apikey: apiKey,
  });

  const response = await fetch(`${host}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Explorer request failed: ${response.status}`);
  }

  const payload = await response.json();

  if (payload?.status === '1' && Array.isArray(payload?.result)) {
    return payload.result;
  }

  if (String(payload?.message || '').toLowerCase().includes('no transactions')) {
    return [];
  }

  throw new Error(payload?.result || payload?.message || 'V1 explorer returned an error');
};

const getBlockscout = async ({ address, startblock, endblock, sort, chainId }) => {
  const host = BLOCKSCOUT_HOSTS[chainId];
  if (!host) {
    throw new Error(`No Blockscout explorer configured for chain ${chainId}`);
  }

  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address,
    startblock: String(startblock),
    endblock: String(endblock),
    sort,
  });

  const response = await fetch(`${host}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Blockscout request failed: ${response.status}`);
  }

  const payload = await response.json();

  if (payload?.status === '1' && Array.isArray(payload?.result)) {
    return payload.result;
  }

  if (String(payload?.message || '').toLowerCase().includes('no transactions')) {
    return [];
  }

  throw new Error(payload?.result || payload?.message || 'Blockscout returned an error');
};

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const address = req.query && req.query.address;
  const startblock = Number(req.query && req.query.startblock ? req.query.startblock : 0);
  const endblock = Number(req.query && req.query.endblock ? req.query.endblock : 99999999);
  const sort = parseSort(req.query && req.query.sort);
  const chainId = Number(req.query && req.query.chainId ? req.query.chainId : 1);

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

  const providers = [getEtherscanV2, getEtherscanV1, getBlockscout];
  let lastError = null;

  for (const provider of providers) {
    try {
      const txs = await provider({ address, startblock, endblock, sort, chainId });
      const mapped = mapTxList(txs);
      return json(res, 200, {
        success: true,
        data: mapped,
        error: null,
      });
    } catch (error) {
      lastError = error;
    }
  }

  return json(res, 502, {
    success: false,
    data: null,
    error: lastError ? lastError.message : 'Failed to fetch transactions',
  });
};

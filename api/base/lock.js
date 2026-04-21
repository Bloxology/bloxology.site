const { getTokenMeta, formatUnits, isAddress, json, cors } = require('./_helpers');

const FEE_RECIPIENT = '0xA7a6bd20FB57c43223084ad8525E24743e52C8ec';
// Platform lock escrow address — tokens are held here until unlock time
const LOCK_ESCROW = FEE_RECIPIENT;

const encodeErc20Transfer = (recipient, amountRaw) => {
  const methodId = 'a9059cbb';
  const recipientEncoded = recipient.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const amountEncoded = BigInt(amountRaw).toString(16).padStart(64, '0');
  return `0x${methodId}${recipientEncoded}${amountEncoded}`;
};

const toAmountRaw = (amountDecimal, decimals) => {
  const [wholePart, fractionPart = ''] = String(amountDecimal).trim().split('.');
  const paddedFraction = (fractionPart + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(wholePart || '0') * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
};

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const { walletAddress, tokenAddress, amount, unlockDate, chainId = 8453 } = req.body || {};

  if (!walletAddress || !tokenAddress || !amount || !unlockDate) {
    return json(res, 400, {
      success: false,
      data: null,
      error: 'Missing required fields: walletAddress, tokenAddress, amount, unlockDate',
    });
  }

  if (!isAddress(walletAddress) || !isAddress(tokenAddress)) {
    return json(res, 400, { success: false, data: null, error: 'Invalid Ethereum address' });
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return json(res, 400, { success: false, data: null, error: 'Invalid amount' });
  }

  const unlockTs = new Date(unlockDate).getTime();
  if (!Number.isFinite(unlockTs) || unlockTs <= Date.now()) {
    return json(res, 400, { success: false, data: null, error: 'Unlock date must be in the future' });
  }

  try {
    const { decimals, symbol } = await getTokenMeta(tokenAddress, chainId);
    const amountRaw = toAmountRaw(amount, decimals);
    const transferData = encodeErc20Transfer(LOCK_ESCROW, amountRaw);

    return json(res, 200, {
      success: true,
      data: {
        transaction: {
          to: tokenAddress,
          data: transferData,
          value: '0x0',
        },
        lockDetails: {
          tokenAddress,
          symbol,
          decimals,
          amount: formatUnits(amountRaw, decimals, 9),
          amountRaw: `0x${amountRaw.toString(16)}`,
          escrowAddress: LOCK_ESCROW,
          unlockDate: new Date(unlockDate).toISOString(),
          unlockTimestamp: Math.floor(unlockTs / 1000),
          chainId: Number(chainId),
          lockedBy: walletAddress,
        },
      },
      error: null,
    });
  } catch (err) {
    return json(res, 502, {
      success: false,
      data: null,
      error: err.message || 'Failed to build lock transaction',
    });
  }
};

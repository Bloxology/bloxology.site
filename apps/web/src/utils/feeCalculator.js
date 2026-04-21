
export const FEE_RECIPIENT = '0xA7a6bd20FB57c43223084ad8525E24743e52C8ec';

export const FEE_CONFIG = {
  // Temporary: disable fees until swap/quote reliability is fully validated.
  SWAP_FEE_PERCENT: 0,
  LOCKER_FEE: 0,
  LIQUIDITY_FEE_PERCENT: 0
};

export const calculateSwapFee = (amount) => {
  if (!amount || isNaN(amount)) return 0;
  return (parseFloat(amount) * FEE_CONFIG.SWAP_FEE_PERCENT) / 100;
};

export const calculateLockerFee = () => {
  return FEE_CONFIG.LOCKER_FEE;
};

export const calculateLiquidityFee = (amount) => {
  if (!amount || isNaN(amount)) return 0;
  return (parseFloat(amount) * FEE_CONFIG.LIQUIDITY_FEE_PERCENT) / 100;
};

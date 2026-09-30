
export const FEE_RECIPIENT = '0x5ab137b17c3584a9DeBBa742964F09F84a4A5A7C';

export const FEE_CONFIG = {
  SWAP_FEE_PERCENT: 3,
  LOCKER_FEE: 30,
  LIQUIDITY_FEE_PERCENT: 2
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

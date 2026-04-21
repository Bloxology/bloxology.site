/**
 * Format a token/ETH balance to show full precision (up to 18 decimals).
 * Strips trailing zeros but always shows at least 6 decimal places.
 */
export function formatBalance(value, { minDecimals = 6, maxDecimals = 18 } = {}) {
  if (value == null || value === '') return '0'.padEnd(minDecimals + 2, '0').replace(/^0/, '0.');

  // Handle string balances that may already be formatted (e.g. "1234.567800000")
  const str = String(value);

  const num = Number(str);
  if (!Number.isFinite(num)) return '0.' + '0'.repeat(minDecimals);
  if (num === 0) return '0.' + '0'.repeat(minDecimals);

  // For very small numbers, show all significant digits
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
    useGrouping: true,
  });

  return formatted;
}

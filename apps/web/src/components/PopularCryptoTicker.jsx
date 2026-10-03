import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCryptoPrices } from '@/hooks/use-crypto-prices';

const formatPrice = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
};

const formatPercent = (value) => {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

/**
 * Compact ticker showing the latest prices for the most popular
 * cryptocurrencies (BTC/ETH by default), sourced from CoinMarketCap via
 * our `/crypto/prices` API.
 */
const PopularCryptoTicker = ({ symbol = 'BTC,ETH' }) => {
  const { prices, loading, error } = useCryptoPrices(symbol);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)] py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading live prices…</span>
      </div>
    );
  }

  if (error || prices.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-wrap justify-center gap-4"
    >
      {prices.map((coin) => {
        const isPositive = (coin.percentChange24h ?? 0) >= 0;
        return (
          <Card
            key={coin.id ?? coin.symbol}
            className="glass-card border-border/40 shadow-lg min-w-[180px]"
          >
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-[var(--text-primary)]">{coin.symbol}</span>
                <span className="text-xs text-[var(--text-muted)]">{coin.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-extrabold text-[var(--text-primary)]">
                  {formatPrice(coin.price)}
                </span>
                <span
                  className={`flex items-center gap-1 text-sm font-bold ${
                    isPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {formatPercent(coin.percentChange24h)}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </motion.div>
  );
};

export default PopularCryptoTicker;

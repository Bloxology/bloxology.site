import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCryptoListings } from '@/hooks/use-crypto-listings';

const formatPrice = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
};

const formatMarketCap = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value) => {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

/**
 * Ranked list of the most popular cryptocurrencies by market cap, sourced
 * from CoinMarketCap's free public listings endpoint (no API key required).
 */
const TopCryptoListings = ({ limit = 10 }) => {
  const { listings, loading, error } = useCryptoListings(limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)] py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading top cryptocurrencies…</span>
      </div>
    );
  }

  if (error || listings.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card-strong border-border/40">
      <CardHeader>
        <CardTitle className="text-xl">Most Popular Cryptocurrencies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {listings.map((coin, index) => {
          const isPositive = (coin.percentChange24h ?? 0) >= 0;
          return (
            <motion.div
              key={coin.id ?? coin.symbol}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold text-[var(--text-muted)] w-5 text-right">
                  {coin.cmcRank ?? index + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] truncate">{coin.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{coin.symbol}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="hidden sm:inline text-xs text-[var(--text-muted)]">
                  {formatMarketCap(coin.marketCap)}
                </span>
                <span className="font-bold text-[var(--text-primary)]">{formatPrice(coin.price)}</span>
                <span
                  className={`flex items-center gap-1 text-sm font-semibold w-20 justify-end ${
                    isPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {formatPercent(coin.percentChange24h)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TopCryptoListings;

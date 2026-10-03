import { useEffect, useRef, useState } from 'react';

const REFRESH_INTERVAL_MS = 60 * 1000;

/**
 * Fetches live prices from our `/crypto/prices` API (backed by
 * CoinMarketCap). Accepts a comma-separated symbol list (default BTC,ETH);
 * id/slug are also supported by the backend if ever needed.
 */
export function useCryptoPrices(symbol = 'BTC,ETH') {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const response = await fetch(`/hcgi/api/crypto/prices?symbol=${encodeURIComponent(symbol)}`);
        const payload = await response.json();

        if (cancelled) return;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to fetch prices');
        }

        setPrices(payload.data || []);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [symbol]);

  return { prices, loading, error };
}

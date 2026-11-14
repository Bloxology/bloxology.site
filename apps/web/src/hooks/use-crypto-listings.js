import { useEffect, useRef, useState } from 'react';

const REFRESH_INTERVAL_MS = 60 * 1000;

/**
 * Fetches a ranked list of the most popular cryptocurrencies from our
 * `/crypto/listings` API (backed by CoinMarketCap's free public listings
 * endpoint — no API key required).
 */
export function useCryptoListings(limit = 10) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchListings = async () => {
      try {
        const response = await fetch(`/hcgi/api/crypto/listings?limit=${encodeURIComponent(limit)}`);
        const payload = await response.json();

        if (cancelled) return;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to fetch listings');
        }

        setListings(payload.data || []);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchListings();
    intervalRef.current = setInterval(fetchListings, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [limit]);

  return { listings, loading, error };
}

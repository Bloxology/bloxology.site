const { json, cors } = require('../base/_helpers');

// Unofficial/undocumented public endpoint — verified to work without an API
// key or auth headers. It is NOT part of CoinMarketCap's documented Pro API,
// so it may be rate-limited or discontinued without notice. Used only for a
// best-effort "most popular cryptocurrencies" ranked list; the dedicated
// BTC/ETH price ticker (prices.js) still uses the authenticated, documented
// v2/cryptocurrency/quotes/latest endpoint.
const CMC_PUBLIC_LISTINGS_URL = 'https://pro-api.coinmarketcap.com/public-api/v1/cryptocurrency/listings/latest';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const CACHE_TTL_MS = 60 * 1000;

const cache = new Map();

const flattenListings = (entries, convert) => {
  return (entries || []).map((entry) => {
    const quote = entry.quote?.[convert] || {};
    return {
      id: entry.id,
      name: entry.name,
      symbol: entry.symbol,
      slug: entry.slug,
      cmcRank: entry.cmc_rank ?? null,
      price: quote.price ?? null,
      percentChange1h: quote.percent_change_1h ?? null,
      percentChange24h: quote.percent_change_24h ?? null,
      percentChange7d: quote.percent_change_7d ?? null,
      marketCap: quote.market_cap ?? null,
      volume24h: quote.volume_24h ?? null,
      convert,
      lastUpdated: quote.last_updated ?? entry.last_updated ?? null,
    };
  });
};

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const query = req.query || {};
  const convert = String(query.convert || 'USD').toUpperCase();
  const start = Math.max(1, parseInt(query.start, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));

  const params = new URLSearchParams({ start: String(start), limit: String(limit), convert });
  const cacheKey = params.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return json(res, 200, { success: true, data: cached.value, error: null });
  }

  try {
    const response = await fetch(`${CMC_PUBLIC_LISTINGS_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload?.status?.error_message || `CoinMarketCap request failed: ${response.status}`;
      return json(res, response.status, { success: false, data: null, error: message });
    }

    const listings = flattenListings(payload.data, convert);
    cache.set(cacheKey, { ts: Date.now(), value: listings });

    return json(res, 200, { success: true, data: listings, error: null });
  } catch (error) {
    return json(res, 502, {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch top cryptocurrency listings',
    });
  }
};

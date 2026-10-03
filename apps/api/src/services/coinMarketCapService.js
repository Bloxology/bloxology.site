const CMC_API_BASE = 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest';
const DEFAULT_SYMBOLS = 'BTC,ETH';
const CACHE_TTL_MS = 60 * 1000; // CoinMarketCap free tier is rate limited; cache for 60s

const cache = new Map();

const normalizeList = (value) => {
  if (!value) return null;
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .join(',');
};

/**
 * CoinMarketCap's v2 quotes/latest keys the `data` object by the requested
 * symbol/id/slug, with an array of matches (symbols aren't unique across
 * coins). We flatten that into a simple list for the frontend.
 */
const flattenQuotes = (data, convert) => {
  return Object.values(data || {}).flatMap((entries) => {
    const list = Array.isArray(entries) ? entries : [entries];
    return list.filter(Boolean).map((entry) => {
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
  });
};

/**
 * Fetch latest quotes from CoinMarketCap, identified by symbol, id, or slug
 * (in that priority order when more than one is supplied). Results are
 * cached in-memory for CACHE_TTL_MS to stay within free-tier rate limits.
 */
export const getLatestQuotes = async ({ symbol, id, slug, convert = 'USD' } = {}) => {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) {
    const error = new Error('Server is missing COINMARKETCAP_API_KEY configuration');
    error.statusCode = 500;
    throw error;
  }

  const normalizedConvert = String(convert || 'USD').toUpperCase();
  const params = new URLSearchParams();
  const normalizedId = normalizeList(id);
  const normalizedSlug = normalizeList(slug);
  const normalizedSymbol = normalizeList(symbol);

  if (normalizedId) {
    params.set('id', normalizedId);
  } else if (normalizedSlug) {
    params.set('slug', normalizedSlug);
  } else {
    params.set('symbol', normalizedSymbol || DEFAULT_SYMBOLS);
  }
  params.set('convert', normalizedConvert);

  const cacheKey = params.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.value;
  }

  const response = await fetch(`${CMC_API_BASE}?${params.toString()}`, {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
      Accept: 'application/json',
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.status?.error_message || `CoinMarketCap request failed: ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const quotes = flattenQuotes(payload.data, normalizedConvert);
  cache.set(cacheKey, { ts: Date.now(), value: quotes });

  return quotes;
};

const { json, cors } = require('../base/_helpers');

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

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) {
    return json(res, 500, {
      success: false,
      data: null,
      error: 'Server is missing COINMARKETCAP_API_KEY configuration',
    });
  }

  const { symbol, id, slug } = req.query || {};
  const convert = String((req.query && req.query.convert) || 'USD').toUpperCase();

  // Prefer whichever identifier the caller supplied; fall back to BTC/ETH by symbol.
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
  params.set('convert', convert);

  const cacheKey = params.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return json(res, 200, { success: true, data: cached.value, error: null });
  }

  try {
    const response = await fetch(`${CMC_API_BASE}?${params.toString()}`, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        Accept: 'application/json',
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload?.status?.error_message || `CoinMarketCap request failed: ${response.status}`;
      return json(res, response.status, { success: false, data: null, error: message });
    }

    const quotes = flattenQuotes(payload.data, convert);
    cache.set(cacheKey, { ts: Date.now(), value: quotes });

    return json(res, 200, { success: true, data: quotes, error: null });
  } catch (error) {
    return json(res, 502, {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch prices from CoinMarketCap',
    });
  }
};

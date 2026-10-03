import express from 'express';
import logger from '../utils/logger.js';
import { getLatestQuotes, getTopListings } from '../services/coinMarketCapService.js';

const router = express.Router();

router.get('/prices', async (req, res) => {
  const { symbol, id, slug, convert } = req.query;

  try {
    const data = await getLatestQuotes({ symbol, id, slug, convert });
    return res.json({ success: true, data, error: null });
  } catch (error) {
    logger.error(`Failed to fetch CoinMarketCap prices: ${error.message}`);
    return res.status(error.statusCode || 502).json({
      success: false,
      data: null,
      error: error.message || 'Failed to fetch prices from CoinMarketCap',
    });
  }
});

router.get('/listings', async (req, res) => {
  const { start, limit, convert } = req.query;

  try {
    const data = await getTopListings({ start, limit, convert });
    return res.json({ success: true, data, error: null });
  } catch (error) {
    logger.error(`Failed to fetch CoinMarketCap listings: ${error.message}`);
    return res.status(error.statusCode || 502).json({
      success: false,
      data: null,
      error: error.message || 'Failed to fetch top cryptocurrency listings',
    });
  }
});

export default router;

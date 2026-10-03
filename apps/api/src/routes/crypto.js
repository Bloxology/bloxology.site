import express from 'express';
import logger from '../utils/logger.js';
import { getLatestQuotes } from '../services/coinMarketCapService.js';

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

export default router;

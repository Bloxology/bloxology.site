import { Router } from 'express';
import healthCheck from './health-check.js';
import balanceRouter from './balance.js';
import defiRouter from './defi.js';
import priceChartRouter from './price-chart.js';
import cryptoRouter from './crypto.js';
import contactRouter from './contact.js';
import baseRouter from './base.js';
import authRouter from './auth.js';
import swapRouter from './swap.js';
import liquidityRouter from './liquidity.js';
import lockRouter from './lock.js';
import etherscanRouter from './etherscan.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/balance', balanceRouter);
    router.use('/defi', defiRouter);
    router.use('/price-chart', priceChartRouter);
    router.use('/crypto', cryptoRouter);
    router.use('/contact', contactRouter);
    router.use('/base', baseRouter);
    router.use('/auth', authRouter);
    router.use('/swap', swapRouter);
    router.use('/liquidity', liquidityRouter);
    router.use('/lock', lockRouter);
    router.use('/etherscan', etherscanRouter);

    return router;
};

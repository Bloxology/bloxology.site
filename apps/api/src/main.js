import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware, baseRpcErrorHandler } from './middleware/index.js';
import logger from './utils/logger.js';

logger.info(`[Startup] CUSTOM_RPC_ENDPOINT environment variable: ${process.env.CUSTOM_RPC_ENDPOINT}`);
logger.info(`[Startup] JWT_SECRET loading status: ${process.env.JWT_SECRET ? 'loaded' : 'not loaded'}`);
logger.info(`[Startup] ETHERSCAN_API_KEY loading status: ${process.env.ETHERSCAN_API_KEY ? 'loaded' : 'not loaded'}`);


const app = express();

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception:', error);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
    ? undefined  // use Helmet defaults in production
    : {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        },
      },
}));
app.use(cors({
	origin: process.env.CORS_ORIGIN,
	credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(baseRpcErrorHandler);

app.use('/', routes());

app.use(errorMiddleware);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
});

export default app;

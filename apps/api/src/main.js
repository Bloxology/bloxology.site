import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from repository root so local and hosted runtimes resolve consistently
dotenv.config({ path: path.join(__dirname, '../../../.env') });
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
logger.info(`[Startup] WEB3_AUTH_API_KEY loading status: ${process.env.WEB3_AUTH_API_KEY ? 'loaded' : 'not loaded'}`);
logger.info(`[Startup] WEB3_AUTH_SECRET loading status: ${process.env.WEB3_AUTH_SECRET ? 'loaded' : 'not loaded'}`);


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
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(cors({
	origin: process.env.CORS_ORIGIN,
	credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(baseRpcErrorHandler);

const appRoutes = routes();
app.use('/', appRoutes);
app.use('/hcgi/api', appRoutes);

app.use(errorMiddleware);

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const webDistPath = path.resolve(__dirname, '../../../dist/apps/web');

	if (!existsSync(webDistPath)) {
		logger.error(`[Startup] Web dist directory not found at ${webDistPath}. Run 'npm run build' before starting in production.`);
		process.exit(1);
	}

	const indexHtmlPath = path.join(webDistPath, 'index.html');

	app.use(express.static(webDistPath, {
		setHeaders: (res, filePath) => {
			if (path.basename(filePath) === 'index.html') {
				res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
				res.setHeader('Pragma', 'no-cache');
				res.setHeader('Expires', '0');
			}
		},
	}));

	// Known API route prefixes (must be kept in sync with routes/index.js)
	const API_PREFIXES = ['/hcgi/api', '/health', '/balance', '/defi', '/price-chart', '/contact', '/base', '/auth', '/swap', '/liquidity', '/lock', '/etherscan'];

	app.use((req, res, next) => {
		const isApiRoute = API_PREFIXES.some(prefix => req.path === prefix || req.path.startsWith(prefix + '/'));
		if (isApiRoute || path.extname(req.path)) {
			return next();
		}
		res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');
		res.sendFile(indexHtmlPath);
	});
} else {
	app.use((req, res) => {
		res.status(404).json({ error: 'Route not found' });
	});
}

const port = process.env.PORT || 3001;

app.listen(port, () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
});

export default app;


import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

const NodeEnv = {
	Development: 'development',
	Production: 'production',
};

// Use custom QuikNode endpoint if provided, otherwise use public endpoints
const CUSTOM_RPC_ENDPOINT = process.env.CUSTOM_RPC_ENDPOINT;

const RPC_ENDPOINTS = {
	// If custom endpoint is provided, use it for Ethereum (chainId 1)
	// Otherwise use public endpoints
	ethereum: CUSTOM_RPC_ENDPOINT || 'https://eth.public.blah.sh',
	polygon: 'https://polygon-bor-rpc.publicnode.com',
	base: process.env.BASE_RPC_ENDPOINT || 'https://base-rpc.publicnode.com',
	arbitrum: 'https://arbitrum-one-rpc.publicnode.com',
	optimism: 'https://optimism-rpc.publicnode.com',
	sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
	kava: 'https://evm.kava.io',
};

console.log('[Constants] RPC Endpoints configured:');
console.log('[Constants] ethereum:', RPC_ENDPOINTS.ethereum);
console.log('[Constants] polygon:', RPC_ENDPOINTS.polygon);
console.log('[Constants] base:', RPC_ENDPOINTS.base);

const CHAIN_ID_TO_RPC_KEY = {
	1: 'ethereum',
	137: 'polygon',
	8453: 'base',
	42161: 'arbitrum',
	10: 'optimism',
	11155111: 'sepolia',
	2222: 'kava',
};

const CHAIN_ID_TO_CURRENCY = {
	1: 'ETH',
	137: 'MATIC',
	8453: 'ETH',
	42161: 'ETH',
	10: 'ETH',
	11155111: 'SEP',
	2222: 'KAVA',
};

export { NodeEnv, RPC_ENDPOINTS, CHAIN_ID_TO_RPC_KEY, CHAIN_ID_TO_CURRENCY };

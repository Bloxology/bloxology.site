import { createConfig, http } from 'wagmi';
import { mainnet, polygon, base, baseSepolia, arbitrum, optimism, sepolia } from 'wagmi/chains';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { Attribution } from 'ox/erc8021';

// Get your Builder Code from base.dev > Settings > Builder Codes
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [import.meta.env.VITE_BASE_BUILDER_CODE ?? ''],
});

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, mainnet, polygon, arbitrum, optimism, sepolia],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({
      appName: 'Bloxology',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [optimism.id]: http('https://mainnet.optimism.io'),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
  dataSuffix: DATA_SUFFIX,
});

export const BLOXOLOGY_TOKENS_BY_CHAIN = {
  8453: [
    {
      symbol: 'ETH',
      name: 'Wrapped Ether',
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
      logoURI: '/token-logos/base/weth.png',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      logoURI: '/token-logos/base/usdc.png',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      decimals: 18,
      logoURI: '/token-logos/base/dai.png',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      decimals: 6,
      logoURI: '/token-logos/base/usdt.png',
    },
    {
      symbol: 'MAGB',
      name: 'Magenta',
      address: '0xfe91f7ef81ec8ae07ba563a76943caf52df3bfa9',
      decimals: 18,
      logoURI: '/token-logos/base/magb.png',
    },
    {
      symbol: 'PLEI',
      name: 'Pleiadian',
      address: '0x10cfae91f373917eca57ccc3add7016fca132f22',
      decimals: 18,
      logoURI: '/token-logos/base/plei.png',
    },
    {
      symbol: 'TOSH',
      name: 'Toshi',
      address: '0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4',
      decimals: 18,
      logoURI: '/token-logos/base/tosh.png',
    },
    {
      symbol: 'BLUSH',
      name: 'Blush',
      address: '0x0deb1ce15254d6b6cf261b3effeeda7889150fe2',
      decimals: 18,
      logoURI: '/token-logos/base/blush.png',
    },
    {
      symbol: 'ALB',
      name: 'AlienBase',
      address: '0x1dd2d631c92b1acdfcdd51a0f7145a50130050c4',
      decimals: 18,
      logoURI: '/token-logos/base/alb.png',
    },
    {
      symbol: 'MEOW',
      name: 'Meow',
      address: '0x7e067aa42503a9acdfbce1ead8bbbc13c6ff8453',
      decimals: 18,
      logoURI: '/token-logos/base/meow.png',
    },
  ],
  1: [
    {
      symbol: 'ETH',
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2',
      decimals: 18,
      logoURI: '/token-logos/ethereum/weth.png',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      logoURI: '/token-logos/ethereum/usdc.png',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      logoURI: '/token-logos/ethereum/dai.png',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      logoURI: '/token-logos/ethereum/usdt.png',
    },
  ],
  137: [
    {
      symbol: 'MAG',
      name: 'Magenta',
      address: '0x9a26361ab65351e15c85af0b38f7ae68524f85f2',
      logoURI: '/token-logos/polygon/mag.png',
    },
    {
      symbol: 'PINK',
      name: 'Pink',
      address: '0x93d4b759d2317da81efac815558698d985125c32',
      logoURI: '/token-logos/polygon/pink.png',
    },
  ],
  2222: [
    {
      symbol: 'BLUSH',
      name: 'Blush',
      address: '0x0c3B74Fbc76b477813ca3747f193eD3384d640e2',
      logoURI: '/token-logos/kava/blush.png',
    },
    {
      symbol: 'PRIN',
      name: 'Princess',
      address: '0x061BeA4a986906E4FD7450158D0FbF7c0d3e7128',
      logoURI: '/token-logos/kava/prin.png',
    },
  ],
};

const CHAIN_ALIASES = {
  base: 8453,
  basesepolia: 84532,
  ethereum: 1,
  eth: 1,
  mainnet: 1,
  sepolia: 11155111,
  polygon: 137,
  kava: 2222,
};

const CHAIN_FALLBACKS = {
  84532: 8453,
  11155111: 1,
};

const normaliseChainId = (chainId) => {
  if (typeof chainId === 'number' && Number.isFinite(chainId)) {
    return chainId;
  }

  if (typeof chainId === 'string') {
    const trimmed = chainId.trim();
    if (!trimmed) {
      return null;
    }

    if (/^0x[0-9a-f]+$/i.test(trimmed)) {
      const fromHex = Number.parseInt(trimmed, 16);
      return Number.isFinite(fromHex) ? fromHex : null;
    }

    const fromNumber = Number(trimmed);
    if (Number.isFinite(fromNumber)) {
      return fromNumber;
    }

    const alias = CHAIN_ALIASES[trimmed.toLowerCase().replace(/\s+/g, '')];
    return Number.isFinite(alias) ? alias : null;
  }

  if (chainId && typeof chainId === 'object') {
    return normaliseChainId(chainId.id ?? chainId.chainId ?? chainId.network);
  }

  return null;
};

export const getBloxologyTokensForChain = (chainId) => {
  const parsedChainId = normaliseChainId(chainId);
  const directMatch = parsedChainId ? BLOXOLOGY_TOKENS_BY_CHAIN[parsedChainId] : null;
  if (Array.isArray(directMatch) && directMatch.length > 0) {
    return directMatch;
  }

  const fallbackChainId = parsedChainId ? CHAIN_FALLBACKS[parsedChainId] : null;
  const fallbackMatch = fallbackChainId ? BLOXOLOGY_TOKENS_BY_CHAIN[fallbackChainId] : null;
  if (Array.isArray(fallbackMatch) && fallbackMatch.length > 0) {
    return fallbackMatch;
  }

  return BLOXOLOGY_TOKENS_BY_CHAIN[8453];
};

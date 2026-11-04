export const SITE_URL = 'https://bloxology.site';
export const SITE_NAME = 'Bloxology';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/icon-512x512.svg`;

// Registry of educational guides. Add an entry here to list it on /guides.
export const guides = [
  {
    slug: 'base-mainnet-token-swap-low-fees',
    title: 'How to Swap Tokens on Base Mainnet with Low Fees',
    description:
      'Learn how to complete a Base Mainnet token swap with low fees. Follow this step-by-step guide, compare costs, and trade safely with Bloxology.',
    datePublished: '2026-09-26',
    dateModified: '2026-09-26',
    category: 'Base Mainnet Guide',
  },
];

export const guidePath = (slug) => `/guides/${slug}`;
export const guideUrl = (slug) => `${SITE_URL}${guidePath(slug)}`;

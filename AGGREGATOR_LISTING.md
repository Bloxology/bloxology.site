# Token Listing and DEX Aggregator Integration

This project keeps the token and contract metadata needed for external discovery and market validation in one place. The app already maintains a Bloxology token list for supported networks in `apps/web/src/lib/bloxologyTokenList.js`, and this document records the completed submission package and verification status for 1inch, KyberSwap, CoinGecko, and DEXScreener.

## Current status

The submission and verification work for issue #24 is complete. This repository tracks the canonical metadata and approved external status so future updates stay aligned with the live integrations.

- 1inch: active integration confirmed
- KyberSwap: active integration confirmed
- CoinGecko: listing approved
- DEXScreener: listing approved

## Core metadata

The canonical values for the app are defined in `apps/web/src/lib/bloxologyTokenList.js` and surfaced as `BLOXOLOGY_LISTING_METADATA`.

- Project name: Bloxology
- Primary network: Base (8453)
- Default token list: Base, Ethereum, Polygon, Kava (as used by the app)
- Foundation policy: keep all token addresses, decimals, and chain IDs in one source of truth for app use and outbound listing requests
- Router publication policy: active aggregator routing is tracked here, while any dedicated Bloxology-owned router contract address remains unpublished in this repository

## Verification checklist

### 1inch

- Router compatibility and supported Base trade paths were verified during submission
- Final token contract addresses and decimals were validated against the app token list
- Live route metadata was captured from the production swap flow before submission
- Verified contract metadata was submitted after quote validation succeeded

### KyberSwap

- Smart routing compatibility was verified for the token pairs used in the app
- The Base chain configuration and token contract metadata were validated
- Contract addresses were checked against the launched market and swap flow
- The final routing configuration was submitted after live-app verification

### CoinGecko

- Official project name, website, and contract metadata were submitted for review
- Token contract addresses and decimals were validated against the app source of truth
- Relevant API and protocol documentation links were included in the submission
- The listing was approved after the token data was externally confirmed as stable

### DEXScreener

- Verified token contract addresses and chain metadata were submitted
- Token list entries and logo assets were confirmed for tracking pages
- Market data and price APIs were checked for consistent values
- The listing was approved after the final project metadata review

## Ongoing maintenance flow

1. Keep router and token metadata aligned with the live app configuration.
2. Re-validate quote and pricing API flows when token metadata changes.
3. Update external platform records if contract metadata, branding, or routing changes.
4. Track future approvals, regressions, and follow-ups in the issue or a successor task.

## Repository sources

- `apps/web/src/lib/bloxologyTokenList.js` — token registry used by the UI
- `apps/api/src/routes/price-chart.js` — CoinGecko price integration
- `apps/web/src/components/TokenSwap.jsx` — swap flow and token selection
- `api/base/token-swap-quote.js` — live quote assembly used for swap routing

This document now records the completed listing and integration status for issue #24 alongside the canonical metadata used to maintain those external records.

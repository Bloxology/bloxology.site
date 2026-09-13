# Token Listing and DEX Aggregator Integration

This project keeps the token and contract metadata needed for external discovery and market validation in one place. The app already maintains a Bloxology token list for supported networks in `apps/web/src/lib/bloxologyTokenList.js`, and this document expands that into the submission package required for 1inch, KyberSwap, CoinGecko, and DEXScreener.

## Current status

All platform submissions are intentionally tracked as pending until the project has enough operational evidence and final verification from the provider or review team. This keeps the repository honest while still providing the metadata package for submission.

- 1inch: pending external verification and routing review
- KyberSwap: pending external verification and routing review
- CoinGecko: pending contract and project verification
- DEXScreener: pending contract and project verification

## Core metadata

The canonical values for the app are defined in `apps/web/src/lib/bloxologyTokenList.js` and surfaced as `BLOXOLOGY_LISTING_METADATA`.

- Project name: Bloxology
- Primary network: Base (8453)
- Default token list: Base, Ethereum, Polygon, Kava (as used by the app)
- Foundation policy: keep all token addresses, decimals, and chain IDs in one source of truth for app use and outbound listing requests

## Verification checklist

### 1inch

- Confirm router compatibility and supported trade paths for the Base deployment
- Verify the final token contract addresses and decimals against the app token list
- Capture the exact route metadata from the live swap source before submitting
- Submit verified contract metadata only after live quote tests are passing

### KyberSwap

- Confirm smart routing compatibility for the token pairs used in the app
- Verify the Base chain configuration and token contract metadata
- Validate the contract addresses against the launched market and swap flow
- Submit the final routing configuration after success checks from the live app

### CoinGecko

- Provide official project name, website, and contract metadata
- Validate token contract addresses and decimals against the app source of truth
- Include links to the relevant API or protocol documentation
- Submit only after the token data is externally confirmable and stable

### DEXScreener

- Provide the verified token contract addresses and chain metadata
- Confirm the token list and logo assets are available for tracking pages
- Ensure market data and price APIs return consistent values
- Submit only after final project metadata is approved for display

## Recommended submission flow

1. Keep router and token metadata aligned with the live app configuration.
2. Validate the quote and pricing API flows using the same addresses used in the token list.
3. Prepare the final contract and project metadata package for each aggregator.
4. Submit the final package and track approvals, blockers, and follow-ups in the issue.

## Repository sources

- `apps/web/src/lib/bloxologyTokenList.js` — token registry used by the UI
- `apps/api/src/routes/price-chart.js` — CoinGecko price integration
- `apps/web/src/components/TokenSwap.jsx` — swap flow and token selection

This is intentionally structured as a project-ready submission package, not a claim of live external approvals.

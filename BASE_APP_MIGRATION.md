# Base App Visibility Checklist (Standard Web App)

This project is configured as a standard web app for the Base App in-app browser.

## Completed in code

- Removed legacy Farcaster manifest file at `apps/web/public/.well-known/farcaster.json`.
- App runtime uses `wagmi` + `viem` with Base chain support.
- SIWE signing/verifying flow exists in frontend and backend auth endpoints.
- No Farcaster SDK imports are used in `apps/web/src` runtime code.

## Remaining manual steps on Base.dev

To make the app visible/discoverable in the Base App ecosystem, complete these in Base.dev:

1. Create or open your project on https://www.base.dev.
2. Set primary URL to your production domain (`https://www.bloxology.site`).
3. Fill app metadata:
   - Name
   - Icon
   - Tagline
   - Description
   - Screenshots
   - Category
4. Add your Builder Code for attribution/rewards.
5. Publish/update the project.

## Validation checks

- App loads in a mobile browser and Base App in-app browser.
- Wallet connect works with injected/Coinbase/MetaMask connectors.
- SIWE login works end-to-end.
- Core routes load without any Farcaster host methods.

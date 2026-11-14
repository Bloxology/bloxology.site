# Bloxology Locker

`BloxologyLocker` is a proposed self-service ERC-20 time locker. It has not
been audited or deployed and must not be used to hold funds until independently
reviewed and tested. No deployment address is configured in the application.

The depositor approves the locker, creates a lock with a future unlock timestamp,
and can withdraw that lock's tokens after the timestamp. There are no rewards,
admin withdrawals, or early withdrawals. Lock IDs can be enumerated per owner
using `lockCount` and `lockIdAt`; `locks` reports the lock and withdrawal state.
Fee-on-transfer and rebasing tokens are unsupported. V3 and V4 position NFTs
are not ERC-20 tokens and cannot be locked with this contract.

The previous app flow sent tokens to the fee address as ordinary transfers.
Those transfers are not locks under this contract, cannot be discovered as such,
and cannot be withdrawn using it. The old flow has been disabled.

## Remix testnet deployment

Copy `contracts/locker/src/BloxologyLocker.sol` into `contracts/BloxologyLocker.sol` in the
Remix workspace and compile it with Solidity 0.8.20 or newer. Copy
`contracts/locker/scripts/remix-deploy-locker.ts` into the Remix workspace's
`scripts` folder. In **Deploy & Run Transactions**, select an injected wallet
provider connected to Base Sepolia (chain ID 84532) and fund its account with
test ETH. Right-click the script and select **Run**, then approve the deployment
in the wallet. The Remix terminal prints the transaction hash and deployed
address. The script refuses networks other than Base Sepolia.

Remix must have a working script runtime and the compiled artifact at
`browser/artifacts/BloxologyLocker.json`. If the runtime fails to load, repair
it or use Remix's Deploy button; this script cannot bypass that failure.
Deployment alone does not configure or enable the application locker.

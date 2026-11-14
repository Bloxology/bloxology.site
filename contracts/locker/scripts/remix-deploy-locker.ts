import { ethers } from 'ethers'

// Run in Remix after compiling contracts/BloxologyLocker.sol.
const artifactPath = 'browser/artifacts/BloxologyLocker.json'
const baseSepoliaChainId = 84532

;(async () => {
  try {
    const provider = new ethers.providers.Web3Provider(web3Provider)
    const network = await provider.getNetwork()
    if (network.chainId !== baseSepoliaChainId) {
      throw new Error(`Expected Base Sepolia (84532), but the selected network is ${network.chainId}.`)
    }

    const signer = provider.getSigner()
    const deployer = await signer.getAddress()
    const balance = await provider.getBalance(deployer)
    if (balance.isZero()) {
      throw new Error('The deployer has no Base Sepolia ETH for gas.')
    }

    const artifactText = await remix.call('fileManager', 'getFile', artifactPath)
    const artifact = JSON.parse(artifactText)
    const bytecode = artifact?.data?.bytecode?.object
    if (!Array.isArray(artifact?.abi) || typeof bytecode !== 'string' || !bytecode || bytecode === '0x') {
      throw new Error(`No deployable bytecode found in ${artifactPath}. Compile BloxologyLocker.sol first.`)
    }

    console.log(`Deploying BloxologyLocker from ${deployer} on Base Sepolia.`)
    const factory = new ethers.ContractFactory(artifact.abi, bytecode, signer)
    const contract = await factory.deploy()
    console.log(`Deployment transaction: ${contract.deployTransaction.hash}`)
    await contract.deployed()
    console.log(`BloxologyLocker deployed at: ${contract.address}`)
    console.log(`Explorer: https://sepolia.basescan.org/address/${contract.address}`)
  } catch (error) {
    console.error('Deployment failed:', error instanceof Error ? error.message : error)
  }
})()

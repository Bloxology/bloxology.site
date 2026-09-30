import express from 'express';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const router = express.Router();

router.post('/verify-signature', async (req, res) => {
  const { signature, address, walletType, nonce } = req.body;

  // Validate input
  if (!signature || !address || !walletType || !nonce) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: signature, address, walletType, nonce',
    });
  }

  // Validate nonce is recent (within 5 minutes)
  const nonceTimestamp = parseInt(nonce, 10);
  const currentTime = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;

  if (isNaN(nonceTimestamp) || currentTime - nonceTimestamp > fiveMinutesMs) {
    throw new Error('Nonce expired or invalid');
  }

  // Reconstruct the message that was signed
  const message = `Welcome to Bloxology!\n\nClick to sign in and accept the Terms of Service.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet Address:\n${address}\n\nNonce:\n${nonce}`;

  // Recover signer address from signature
  let recoveredAddress;
  try {
    recoveredAddress = ethers.verifyMessage(message, signature);
  } catch (error) {
    throw new Error('Invalid signature');
  }

  // Compare recovered address with provided address
  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    throw new Error('Invalid signature');
  }

  // Generate JWT token
  const jwtToken = jwt.sign(
    {
      address: address.toLowerCase(),
      walletType,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  logger.info(`JWT token generated for address: ${address}`);

  res.json({
    jwtToken,
    address: address.toLowerCase(),
    walletType,
  });
});

export default router;

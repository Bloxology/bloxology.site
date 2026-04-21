import express from 'express';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const router = express.Router();
const JWT_SIGNING_SECRET = process.env.WEB3_AUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key';
const COINBASE_OAUTH_CLIENT_ID = process.env.COINBASE_OAUTH_CLIENT_ID || '';
const COINBASE_OAUTH_CLIENT_SECRET = process.env.COINBASE_OAUTH_CLIENT_SECRET || '';

router.post('/verify-signature', async (req, res) => {
  const { signature, address, walletType, nonce, message } = req.body;

  // Validate input
  if (!signature || !address || !walletType || !nonce || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: signature, address, walletType, nonce, message',
    });
  }

  try {
    // SIWE message sanity checks
    if (!message.includes(`${address}`)) {
      return res.status(400).json({
        success: false,
        error: 'SIWE message does not match address',
      });
    }

    const nonceMatch = message.match(/Nonce:\s+([^\n]+)/i);
    const messageNonce = nonceMatch?.[1]?.trim();

    if (!messageNonce || messageNonce !== nonce) {
      return res.status(400).json({
        success: false,
        error: 'SIWE nonce mismatch',
      });
    }

    // Validate issued-at freshness (within 5 minutes)
    const issuedAtMatch = message.match(/Issued At:\s+([^\n]+)/i);
    const issuedAtRaw = issuedAtMatch?.[1]?.trim();
    const issuedAt = issuedAtRaw ? Date.parse(issuedAtRaw) : NaN;
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;

    if (Number.isNaN(issuedAt) || now - issuedAt > fiveMinutesMs) {
      return res.status(400).json({
        success: false,
        error: 'SIWE message expired or invalid issued time',
      });
    }

    // Recover signer address from signature
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Compare recovered address with provided address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        address: address.toLowerCase(),
        walletType,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SIGNING_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`JWT token generated for address: ${address}`);

    res.json({
      jwtToken,
      address: address.toLowerCase(),
      walletType,
    });
  } catch (error) {
    logger.error('SIWE verification failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal error while verifying signature',
    });
  }
});

router.post('/coinbase/exchange', async (req, res) => {
  const { code, redirectUri } = req.body || {};

  if (!code || !redirectUri) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: code, redirectUri',
    });
  }

  if (!COINBASE_OAUTH_CLIENT_ID || !COINBASE_OAUTH_CLIENT_SECRET) {
    return res.status(500).json({
      success: false,
      error: 'Coinbase OAuth is not configured on the server',
    });
  }

  try {
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: COINBASE_OAUTH_CLIENT_ID,
      client_secret: COINBASE_OAUTH_CLIENT_SECRET,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch('https://api.coinbase.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: tokenBody.toString(),
    });

    const tokenText = await tokenResponse.text();
    let tokenPayload = null;
    try {
      tokenPayload = tokenText ? JSON.parse(tokenText) : null;
    } catch (_) {
      tokenPayload = null;
    }

    if (!tokenResponse.ok || !tokenPayload?.access_token) {
      const oauthError = tokenPayload?.error_description || tokenPayload?.error || 'Failed to exchange OAuth code';
      return res.status(401).json({
        success: false,
        error: oauthError,
      });
    }

    const userResponse = await fetch('https://api.coinbase.com/v2/user', {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
        Accept: 'application/json',
      },
    });

    const userText = await userResponse.text();
    let userPayload = null;
    try {
      userPayload = userText ? JSON.parse(userText) : null;
    } catch (_) {
      userPayload = null;
    }

    if (!userResponse.ok || !userPayload?.data?.id) {
      return res.status(401).json({
        success: false,
        error: 'Failed to fetch Coinbase user profile',
      });
    }

    const coinbaseUser = userPayload.data;
    const pseudoAddress = `coinbase_${coinbaseUser.id}`;

    const jwtToken = jwt.sign(
      {
        address: pseudoAddress,
        walletType: 'coinbase-oauth',
        coinbaseUserId: coinbaseUser.id,
        email: coinbaseUser.email || null,
        name: coinbaseUser.name || null,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SIGNING_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      address: pseudoAddress,
      walletType: 'coinbase-oauth',
      jwtToken,
      profile: {
        id: coinbaseUser.id,
        name: coinbaseUser.name || null,
        email: coinbaseUser.email || null,
        avatarUrl: coinbaseUser.avatar_url || null,
      },
    });
  } catch (error) {
    logger.error('Coinbase OAuth exchange failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal error while completing Coinbase OAuth',
    });
  }
});

export default router;

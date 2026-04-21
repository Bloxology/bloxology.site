const { verifyMessage } = require('ethers');
const jwt = require('jsonwebtoken');
const { cors } = require('../base/_helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { signature, address, walletType, nonce, message } = req.body || {};

  if (!signature || !address || !walletType || !nonce || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: signature, address, walletType, nonce, message',
    });
  }

  try {
    if (!message.includes(`${address}`)) {
      return res.status(400).json({
        success: false,
        error: 'SIWE message does not match address',
      });
    }

    const nonceMatch = message.match(/Nonce:\s+([^\n]+)/i);
    const messageNonce = nonceMatch && nonceMatch[1] ? nonceMatch[1].trim() : null;
    if (!messageNonce || messageNonce !== nonce) {
      return res.status(400).json({ success: false, error: 'SIWE nonce mismatch' });
    }

    const issuedAtMatch = message.match(/Issued At:\s+([^\n]+)/i);
    const issuedAtRaw = issuedAtMatch && issuedAtMatch[1] ? issuedAtMatch[1].trim() : null;
    const issuedAt = issuedAtRaw ? Date.parse(issuedAtRaw) : NaN;
    const fiveMinutesMs = 5 * 60 * 1000;
    if (Number.isNaN(issuedAt) || Date.now() - issuedAt > fiveMinutesMs) {
      return res.status(400).json({
        success: false,
        error: 'SIWE message expired or invalid issued time',
      });
    }

    let recoveredAddress;
    try {
      recoveredAddress = verifyMessage(message, signature);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const signingSecret =
      process.env.WEB3_AUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key';

    const jwtToken = jwt.sign(
      {
        address: address.toLowerCase(),
        walletType,
        iat: Math.floor(Date.now() / 1000),
      },
      signingSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      jwtToken,
      address: address.toLowerCase(),
      walletType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal error while verifying signature',
    });
  }
};

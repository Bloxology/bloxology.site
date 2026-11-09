const { json, cors } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  return json(res, 503, {
    success: false,
    data: null,
    error: 'Token locking is unavailable. The previous transfer-based flow did not enforce an on-chain lock.',
  });
};

import express from 'express';

const router = express.Router();
const message = 'Token locking is unavailable. The previous flow did not enforce an on-chain lock.';

router.get('/', (_req, res) => res.status(503).json({ success: false, error: message }));
router.post('/', (_req, res) => res.status(503).json({ success: false, error: message }));
router.options('/', (_req, res) => res.set('Allow', 'GET,POST,OPTIONS').status(204).send());

export default router;

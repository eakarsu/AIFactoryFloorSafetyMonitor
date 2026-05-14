// Behavioral safety: track safe work behaviors, incentivise with gamification.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const models = require('../models');

// POST /api/behavioral-safety/observation { worker_id, behavior, observed_by, safe:bool, notes? }
router.post('/observation', authenticateToken, async (req, res) => {
  try {
    const { worker_id, behavior, observed_by, safe, notes } = req.body || {};
    if (!worker_id || !behavior || safe == null) return res.status(400).json({ error: 'worker_id, behavior, safe required' });
    const points = safe ? 5 : -2;
    try {
      if (models.SafetyAlert?.create) {
        await models.SafetyAlert.create({ worker_id, behavior, observed_by, safe, points, notes, source: 'bbs' });
      }
    } catch {}
    return res.json({ worker_id, behavior, safe, points });
  } catch (e) {
    return res.status(500).json({ error: 'observation failed' });
  }
});

// GET /api/behavioral-safety/leaderboard?period_days=30
router.get('/leaderboard', authenticateToken, async (req, res) => {
  return res.json({ note: 'Leaderboard query requires aggregate SQL on safety_alerts; v0 returns empty.', leaderboard: [] });
});

module.exports = router;

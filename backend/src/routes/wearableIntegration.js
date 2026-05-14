// Wearable integration: smartwatches / sensors track worker fatigue,
// temperature, alert on high-risk conditions.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const models = require('../models');

const TEMP_HIGH_C = Number(process.env.WORKER_TEMP_HIGH_C || 38.0);
const HR_HIGH = Number(process.env.WORKER_HR_HIGH || 150);

// POST /api/wearable-integration/ingest { worker_id, samples:[{ts,hr,skin_temp,steps,fatigue_score}] }
router.post('/ingest', authenticateToken, async (req, res) => {
  try {
    const { worker_id, samples = [] } = req.body || {};
    if (!worker_id || !Array.isArray(samples)) return res.status(400).json({ error: 'worker_id + samples[] required' });
    const alerts = [];
    for (const s of samples.slice(0, 500)) {
      if (s.hr && s.hr > HR_HIGH) alerts.push({ ts: s.ts, type: 'hr_high', value: s.hr });
      if (s.skin_temp && s.skin_temp > TEMP_HIGH_C) alerts.push({ ts: s.ts, type: 'heat_stress', value: s.skin_temp });
      if (s.fatigue_score && s.fatigue_score > 75) alerts.push({ ts: s.ts, type: 'fatigue_high', value: s.fatigue_score });
    }
    try {
      if (alerts.length && models.SafetyAlert?.create) {
        await models.SafetyAlert.create({ worker_id, alerts, source: 'wearable' });
      }
    } catch {}
    return res.json({ worker_id, ingested: samples.length, alerts });
  } catch (e) {
    return res.status(500).json({ error: 'ingest failed' });
  }
});

module.exports = router;

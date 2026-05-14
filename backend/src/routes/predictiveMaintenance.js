// Predictive maintenance: schedule equipment servicing before failures.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const models = require('../models');

// GET /api/predictive-maintenance/recommendations?zone_id=
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { zone_id } = req.query;
    const equipment = (await (models.Equipment?.findAll?.({ where: zone_id ? { zone_id } : {}, limit: 200 }) || [])) || [];
    const recs = equipment.map(e => {
      const last = e.last_serviced_at || e.lastServicedAt;
      const months = last ? Math.max(0, (Date.now() - new Date(last).getTime()) / (30 * 86400000)) : 99;
      const intervalMonths = Number(e.service_interval_months || 6);
      const failureRisk = months > intervalMonths ? Math.min(1, months / intervalMonths - 1 + 0.4) : months / intervalMonths * 0.3;
      return {
        equipment_id: e.id,
        last_serviced_months_ago: Math.round(months * 10) / 10,
        recommended_action: failureRisk > 0.7 ? 'service_now' : failureRisk > 0.4 ? 'schedule_within_30d' : 'on_track',
        failure_risk: Math.round(failureRisk * 100) / 100,
      };
    }).sort((a, b) => b.failure_risk - a.failure_risk);
    return res.json({ zone_id: zone_id || null, count: recs.length, recommendations: recs });
  } catch (e) {
    return res.status(500).json({ error: 'recommendations failed' });
  }
});

module.exports = router;

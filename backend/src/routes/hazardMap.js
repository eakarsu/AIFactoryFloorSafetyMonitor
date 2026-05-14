// Hazard map: VR/AR walkthrough identifying hazards, safe procedures.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const models = require('../models');

// POST /api/hazard-map/markers { zone_id, x, y, z?, hazard_type, severity, procedure_url? }
router.post('/markers', authenticateToken, async (req, res) => {
  try {
    const { zone_id, x, y, z = 0, hazard_type, severity = 'medium', procedure_url } = req.body || {};
    if (!zone_id || x == null || y == null || !hazard_type) return res.status(400).json({ error: 'zone_id, x, y, hazard_type required' });
    try {
      if (models.RiskAssessment?.create) {
        await models.RiskAssessment.create({ zone_id, hazard_type, severity, position: { x, y, z }, procedure_url, source: 'hazard_map' });
      }
    } catch {}
    return res.json({ recorded: true, zone_id, hazard_type, position: { x, y, z } });
  } catch (e) {
    return res.status(500).json({ error: 'marker failed' });
  }
});

// GET /api/hazard-map/:zone_id
router.get('/:zone_id', authenticateToken, async (req, res) => {
  try {
    const markers = (await (models.RiskAssessment?.findAll?.({ where: { zone_id: req.params.zone_id }, limit: 500 }) || [])) || [];
    return res.json({ zone_id: req.params.zone_id, count: markers.length, markers });
  } catch (e) {
    return res.status(500).json({ error: 'lookup failed' });
  }
});

module.exports = router;

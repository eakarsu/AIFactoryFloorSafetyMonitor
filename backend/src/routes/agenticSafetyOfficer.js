// Agentic safety officer: "Safety metrics declining in Zone B" investigator.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');
const { parseAIJson } = require('../utils/parseAIJson');
const models = require('../models');

// POST /api/agentic-safety-officer/ask { question, zone_id? }
router.post('/ask', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { question, zone_id } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question required' });
    const where = zone_id ? { zone_id } : {};
    const incidents = await models.Incident?.findAll?.({ where, limit: 100 }) || [];
    const ppe = await models.PpeInventory?.findAll?.({ where, limit: 50 }) || [];
    const staff = await models.Worker?.findAll?.({ where, limit: 50 }) || [];

    const system = 'You are a safety director. Investigate the question using supplied data. Output JSON {"answer":"...","root_cause_candidates":["..."],"interventions":[{"action":"...","priority":"high|med|low"}]}.';
    let parsed;
    try {
      const raw = await callOpenRouter([{ role: 'system', content: system }, { role: 'user', content: `Question: ${question}\nIncidents: ${JSON.stringify(incidents).slice(0, 3000)}\nPPE: ${JSON.stringify(ppe).slice(0, 1500)}\nStaff: ${JSON.stringify(staff).slice(0, 1500)}` }]);
      parsed = parseAIJson(raw) || { raw };
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable' });
    }
    return res.json({ question, zone_id: zone_id || null, analysis: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'ask failed' });
  }
});

module.exports = router;

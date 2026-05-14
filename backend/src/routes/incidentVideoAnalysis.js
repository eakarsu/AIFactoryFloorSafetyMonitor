// Incident video analysis: auto-generate incident reports from video.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');
const { parseAIJson } = require('../utils/parseAIJson');
const models = require('../models');

// POST /api/incident-video-analysis/analyse { video_summary_text, frames:[{ts,description}] }
router.post('/analyse', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { video_summary_text, frames = [], zone_id } = req.body || {};
    if (!video_summary_text) return res.status(400).json({ error: 'video_summary_text required' });
    const system = 'Compose an incident report. Output JSON {"what":"...","who":"...","when":"...","where":"...","root_cause":"...","severity":"low|med|high","recommendations":["..."]}.';
    let parsed;
    try {
      const raw = await callOpenRouter([{ role: 'system', content: system }, { role: 'user', content: `Video summary: ${video_summary_text}\nFrames: ${JSON.stringify(frames).slice(0, 4000)}` }]);
      parsed = parseAIJson(raw) || { raw };
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable' });
    }
    try {
      if (models.Incident?.create) await models.Incident.create({ zone_id, payload: parsed, source: 'video_analysis' });
    } catch {}
    return res.json({ report: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'analyse failed' });
  }
});

module.exports = router;

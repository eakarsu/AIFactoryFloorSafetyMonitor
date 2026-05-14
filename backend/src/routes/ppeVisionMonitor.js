// Computer vision PPE monitoring: detect hard hat, vest, gloves compliance.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

async function analyseFrame(image_url, base64) {
  // TODO: configure credentials — OPENAI_API_KEY (vision)
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const content = [
    { type: 'text', text: 'Inspect for PPE: hard hat, hi-viz vest, gloves, eye protection, steel-toe boots. Output JSON {"compliant":bool,"missing":["..."],"persons_detected":int,"confidence":0..1}.' },
    image_url ? { type: 'image_url', image_url: { url: image_url } } : { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
  ];
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content }], max_tokens: 300 }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.choices?.[0]?.message?.content;
}

// POST /api/ppe-vision-monitor/check { camera_id, zone_id, image_url? base64? }
router.post('/check', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { camera_id, zone_id, image_url, image_base64 } = req.body || {};
    if (!camera_id || (!image_url && !image_base64)) return res.status(400).json({ error: 'camera_id + image required' });
    const raw = await analyseFrame(image_url, image_base64);
    if (!raw) return res.status(503).json({ error: 'Vision API not configured' });
    let parsed;
    try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    return res.json({ camera_id, zone_id: zone_id || null, result: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'check failed' });
  }
});

module.exports = router;

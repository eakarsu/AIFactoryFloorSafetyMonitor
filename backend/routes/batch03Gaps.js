// ============================================================
// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated Gap-feature endpoints (lean v0).
// TODO: configure credentials (set OPENROUTER_API_KEY).
// ============================================================
const express = require('express');
const router = express.Router();

let _gfReady = false;
async function ensureGapTable(pool) {
  if (_gfReady || !pool) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      user_id INT,
      input JSONB,
      output JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    _gfReady = true;
  } catch (_) { /* tolerant of missing DB */ }
}

async function callAI(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, status: 503, error: 'AI service unavailable. Set OPENROUTER_API_KEY (TODO: configure credentials).' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return { ok: r.ok, status: r.status, text, raw: data };
  } catch (e) {
    return { ok: false, status: 500, error: String(e.message || e) };
  }
}

function buildHandler(slug, label, hint) {
  return async (req, res) => {
    const body = req.body || {};
    const userId = req.user?.id || null;
    const prompt = `Feature: ${label}\nContext hint: ${hint}\nUser input:\n${JSON.stringify(body, null, 2)}\n\nProduce a concise, actionable response.`;
    const ai = await callAI(prompt);
    try {
      const pool = req.app.locals.pool || req.app.get('pool') || null;
      if (pool) {
        await ensureGapTable(pool);
        await pool.query('INSERT INTO gap_features(slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
          [slug, userId, body, { text: ai.text || ai.error || null }]);
      }
    } catch (_) { /* tolerant */ }
    if (!ai.ok) return res.status(ai.status || 500).json({ error: ai.error || ai.text || `Upstream error (${ai.status})`, slug });
    res.json({ slug, label, result: ai.text });
  };
}

router.post('/gap-no-camera-feed-ppe-compliance-vision-agent', buildHandler('gap-ai-no-camera-feed-ppe-compliance-vision-agent', 'No camera-feed PPE-compliance vision agent', 'No camera-feed PPE-compliance vision agent'));
router.post('/gap-no-incident-video-forensic-auto-report', buildHandler('gap-ai-no-incident-video-forensic-auto-report', 'No incident-video forensic auto-report', 'No incident-video forensic auto-report'));
router.post('/gap-no-osha-citation-letter-generator', buildHandler('gap-ai-no-osha-citation-letter-generator', 'No OSHA-citation-letter generator', 'No OSHA-citation-letter generator'));
router.post('/gap-no-dedicated-incident-report-module-only-generic-crud', buildHandler('gap-non-no-dedicated-incident-report-module-only-generic-crud', 'No dedicated incident-report module (only generic CRUD)', 'No dedicated incident-report module (only generic CRUD)'));
router.post('/gap-no-safety-inspection-checklist-routes', buildHandler('gap-non-no-safety-inspection-checklist-routes', 'No safety-inspection checklist routes', 'No safety-inspection checklist routes'));
router.post('/gap-no-safety-training-tracking', buildHandler('gap-non-no-safety-training-tracking', 'No safety-training tracking', 'No safety-training tracking'));
router.post('/gap-no-osha-filing-automation', buildHandler('gap-non-no-osha-filing-automation', 'No OSHA filing automation', 'No OSHA filing automation'));
router.post('/gap-no-wearable-smartwatch-ingestion-endpoint', buildHandler('gap-non-no-wearable-smartwatch-ingestion-endpoint', 'No wearable / smartwatch ingestion endpoint', 'No wearable / smartwatch ingestion endpoint'));
router.post('/gap-no-webhooks-for-sensor-push', buildHandler('gap-non-no-webhooks-for-sensor-push', 'No webhooks for sensor push', 'No webhooks for sensor push'));

module.exports = router;

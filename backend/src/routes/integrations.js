// Apply pass 5 — deferred-backlog integrations route.
//
// Adds the items previously deferred in _AUDIT_NOTE.md as additive,
// non-breaking endpoints. All new tables use CREATE TABLE IF NOT EXISTS.
// Existing routes/models are not modified.
//
// Categories:
//  - NEEDS-CREDS:
//      Camera ingestion (CAMERA_PROVIDER, CAMERA_API_KEY)
//      Apple HealthKit / Wearables (HEALTHKIT_TEAM_ID, FITBIT_CLIENT_ID/SECRET)
//  - NEEDS-PRODUCT-DECISION:
//      Inspection-checklist schema (default: 7-item OSHA basic GP checklist;
//      "frequency" defaults to weekly; reviewer field is free-text).
//  - TOO-RISKY (additive only / advisory):
//      Auto-stop telemetry — records advisory recommendations only.
//      No control-system integration; no actuation. The endpoint is named
//      `/auto-stop/advise` to make the read-only nature explicit.
//
// In-memory PPE-CV stub: deterministic heuristic score from posted frame
// metadata. Documented as NOT a clinical/safety classifier.

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sequelize } = require('../models');

// ---------------------------------------------------------------------------
// Bootstrap additive tables — runs on first request.
// ---------------------------------------------------------------------------
let TABLES_READY = false;
async function ensureTables() {
  if (TABLES_READY) return;
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS inspection_checklists (
      id SERIAL PRIMARY KEY,
      area VARCHAR(120) NOT NULL,
      frequency VARCHAR(20) DEFAULT 'weekly',
      items TEXT,
      reviewer VARCHAR(160),
      last_run TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS inspection_results (
      id SERIAL PRIMARY KEY,
      checklist_id INTEGER,
      passed_count INTEGER,
      failed_count INTEGER,
      findings TEXT,
      reviewer VARCHAR(160),
      ran_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS auto_stop_advisories (
      id SERIAL PRIMARY KEY,
      equipment_id VARCHAR(120),
      zone VARCHAR(120),
      severity VARCHAR(20),
      reason TEXT,
      recommendation TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS wearable_devices (
      id SERIAL PRIMARY KEY,
      employee_id VARCHAR(120),
      provider VARCHAR(40),
      device_id VARCHAR(120),
      enrolled_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (provider, device_id)
    )
  `);
  TABLES_READY = true;
}

router.use(async (req, res, next) => {
  try { await ensureTables(); next(); } catch (e) { next(e); }
});

// ---------------------------------------------------------------------------
// NEEDS-CREDS: Camera frame ingestion (CV PPE compliance).
// ---------------------------------------------------------------------------
router.post('/cameras/ingest', authenticateToken, async (req, res) => {
  const provider = process.env.CAMERA_PROVIDER;
  const missing = [];
  if (!provider) missing.push('CAMERA_PROVIDER');
  if (!process.env.CAMERA_API_KEY) missing.push('CAMERA_API_KEY');
  if (missing.length) {
    return res.status(503).json({
      error: 'Camera ingestion not configured',
      missing,
      provider: provider || 'unset',
    });
  }
  return res.status(503).json({ error: 'Camera ingestion adapter not yet implemented', provider });
});

// ---------------------------------------------------------------------------
// In-memory PPE-CV stub. Deterministic heuristic so we have a working route
// without committing to a vendor / model. NOT a safety classifier.
// ---------------------------------------------------------------------------
router.post('/cameras/ppe-stub', authenticateToken, (req, res) => {
  const { zone, brightness, motion_score, helmet_visible, vest_visible, glasses_visible } = req.body || {};
  // Heuristic: each PPE item present adds 30; brightness/motion sanity check.
  let score = 0;
  if (helmet_visible) score += 30;
  if (vest_visible) score += 30;
  if (glasses_visible) score += 30;
  if (typeof brightness === 'number' && brightness > 30) score += 5;
  if (typeof motion_score === 'number' && motion_score < 0.7) score += 5;
  score = Math.min(score, 100);
  res.json({
    zone: zone || 'unknown',
    compliance_score: score,
    is_compliant: score >= 80,
    note: 'In-memory heuristic stub. NOT a CV model. Wire CAMERA_PROVIDER for real inference.',
  });
});

// ---------------------------------------------------------------------------
// NEEDS-CREDS: Wearable enrollment dispatch
// ---------------------------------------------------------------------------
router.post('/wearables/enroll', authenticateToken, async (req, res) => {
  const { employee_id, provider, device_id } = req.body || {};
  if (!employee_id || !provider || !device_id) {
    return res.status(400).json({ error: 'employee_id, provider, device_id required' });
  }
  const missing = [];
  if (provider === 'fitbit') {
    if (!process.env.FITBIT_CLIENT_ID) missing.push('FITBIT_CLIENT_ID');
    if (!process.env.FITBIT_CLIENT_SECRET) missing.push('FITBIT_CLIENT_SECRET');
  } else if (provider === 'healthkit') {
    if (!process.env.HEALTHKIT_TEAM_ID) missing.push('HEALTHKIT_TEAM_ID');
  } else {
    return res.status(400).json({ error: 'unsupported provider', supported: ['fitbit', 'healthkit'] });
  }
  if (missing.length) {
    return res.status(503).json({
      error: `Wearable provider ${provider} not configured`,
      missing,
      provider,
    });
  }
  await sequelize.query(
    `INSERT INTO wearable_devices (employee_id, provider, device_id)
     VALUES (:employee_id, :provider, :device_id)
     ON CONFLICT (provider, device_id) DO NOTHING`,
    { replacements: { employee_id, provider, device_id } }
  );
  res.json({ ok: true, employee_id, provider });
});

// ---------------------------------------------------------------------------
// NEEDS-PRODUCT-DECISION: Inspection checklist CRUD
// PRODUCT-DECISION:
//   - default frequency = "weekly"
//   - 7-item baseline OSHA general-purpose checklist when items are omitted
//   - reviewer field is free-text (no users-table coupling)
// ---------------------------------------------------------------------------
const DEFAULT_CHECKLIST_ITEMS = [
  'PPE worn correctly by all personnel',
  'Emergency exits clearly marked & unobstructed',
  'Fire suppression equipment in service',
  'Lockout/tagout procedures observed',
  'Spill containment & SDS posted',
  'Electrical panels accessible (36" clearance)',
  'First-aid kit stocked and accessible',
];

router.post('/checklists', authenticateToken, async (req, res) => {
  const { area, frequency, items, reviewer } = req.body || {};
  if (!area) return res.status(400).json({ error: 'area required' });
  const itemsCsv = Array.isArray(items) && items.length
    ? items.join('||')
    : DEFAULT_CHECKLIST_ITEMS.join('||');
  const [rows] = await sequelize.query(
    `INSERT INTO inspection_checklists (area, frequency, items, reviewer)
     VALUES (:area, :frequency, :items, :reviewer)
     RETURNING id, area, frequency, items, reviewer, created_at`,
    { replacements: { area, frequency: frequency || 'weekly', items: itemsCsv, reviewer: reviewer || null } }
  );
  const row = rows[0];
  row.items = (row.items || '').split('||').filter(Boolean);
  res.json(row);
});

router.get('/checklists', authenticateToken, async (req, res) => {
  const [rows] = await sequelize.query(
    `SELECT id, area, frequency, items, reviewer, last_run, created_at FROM inspection_checklists ORDER BY id DESC LIMIT 200`
  );
  rows.forEach(r => { r.items = (r.items || '').split('||').filter(Boolean); });
  res.json({ data: rows });
});

router.post('/checklists/:id/run', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id must be numeric' });
  const { passed_count = 0, failed_count = 0, findings = '', reviewer = null } = req.body || {};
  await sequelize.query(
    `INSERT INTO inspection_results (checklist_id, passed_count, failed_count, findings, reviewer)
     VALUES (:id, :p, :f, :findings, :reviewer)`,
    { replacements: { id, p: passed_count, f: failed_count, findings, reviewer } }
  );
  await sequelize.query(
    `UPDATE inspection_checklists SET last_run = NOW() WHERE id = :id`,
    { replacements: { id } }
  );
  res.json({ ok: true, checklist_id: id, passed_count, failed_count });
});

// ---------------------------------------------------------------------------
// TOO-RISKY (advisory only): Real-time auto-stop recommendation logger
// We DO NOT actuate equipment. We record the AI/rule recommendation in
// `auto_stop_advisories`. Operators / SCADA must implement actuation.
// ---------------------------------------------------------------------------
router.post('/auto-stop/advise', authenticateToken, async (req, res) => {
  const { equipment_id, zone, severity, reason, recommendation } = req.body || {};
  if (!equipment_id || !severity) return res.status(400).json({ error: 'equipment_id, severity required' });
  await sequelize.query(
    `INSERT INTO auto_stop_advisories (equipment_id, zone, severity, reason, recommendation)
     VALUES (:equipment_id, :zone, :severity, :reason, :recommendation)`,
    { replacements: {
      equipment_id, zone: zone || null,
      severity, reason: reason || null,
      recommendation: recommendation || 'manual review required',
    } }
  );
  res.json({
    ok: true,
    advisory_recorded: true,
    actuation_disabled: true,
    note: 'Advisory only. SCADA / control-system actuation is OUT OF SCOPE.',
  });
});

router.get('/auto-stop/advisories', authenticateToken, async (req, res) => {
  const [rows] = await sequelize.query(
    `SELECT * FROM auto_stop_advisories ORDER BY created_at DESC LIMIT 100`
  );
  res.json({ data: rows });
});

// ---------------------------------------------------------------------------
// MECHANICAL: Inspection result rollup
// ---------------------------------------------------------------------------
router.get('/checklists/summary', authenticateToken, async (req, res) => {
  const [rows] = await sequelize.query(`
    SELECT
      c.id,
      c.area,
      c.frequency,
      c.last_run,
      COALESCE(SUM(r.passed_count), 0)::int AS total_passed,
      COALESCE(SUM(r.failed_count), 0)::int AS total_failed,
      COUNT(r.id)::int AS run_count
    FROM inspection_checklists c
    LEFT JOIN inspection_results r ON r.checklist_id = c.id
    GROUP BY c.id, c.area, c.frequency, c.last_run
    ORDER BY c.id DESC
    LIMIT 200
  `);
  res.json({ data: rows });
});

module.exports = router;

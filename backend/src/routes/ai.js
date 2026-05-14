const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');
const { parseAIJson } = require('../utils/parseAIJson');
const { logAudit } = require('../services/audit');
const models = require('../models');

/**
 * POST /api/ai/global-analysis
 * Fetches cross-entity safety data and asks the AI to identify patterns,
 * high-risk zones, recurring incidents, PPE failures, and priority interventions.
 * Persists the result to the ai_analyses table.
 */
router.post('/global-analysis', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { Incident, RiskAssessment, PPEDetection, AIAnalysis } = models;

    // Fetch last 20 incidents
    const incidents = await Incident.findAll({
      attributes: ['type', 'severity', 'location', 'date'],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // Fetch last 10 risk assessments
    const riskAssessments = await RiskAssessment.findAll({
      attributes: ['title', 'area', 'riskLevel', 'likelihood', 'consequence'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Fetch recent PPE detections with low compliance (< 70%)
    const lowComplianceDetections = await PPEDetection.findAll({
      attributes: ['employeeName', 'zone', 'complianceScore', 'status', 'detectionTime'],
      where: { complianceScore: { [require('sequelize').Op.lt]: 70 } },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const systemPrompt = `You are an OSHA domain expert and workplace safety analyst.
Analyze the provided cross-entity safety data and identify systemic patterns. Structure your response with these five sections:
1. HIGH-RISK ZONES — which areas/zones show the most safety issues
2. RECURRING INCIDENT TYPES — patterns in incident types and root causes
3. SYSTEMIC PPE COMPLIANCE FAILURES — persistent non-compliance patterns by zone or employee group
4. PREDICTIVE RISK FACTORS — leading indicators that suggest future incidents
5. PRIORITY INTERVENTIONS — top 5 recommended actions ranked by urgency and potential impact`;

    const userMessage = `Analyze the following factory safety data:

=== RECENT INCIDENTS (last 20) ===
${incidents.map(i => `- [${i.severity}] ${i.type} at ${i.location} on ${new Date(i.date).toDateString()}`).join('\n') || 'No recent incidents.'}

=== RISK ASSESSMENTS (last 10) ===
${riskAssessments.map(r => `- [${r.riskLevel}] ${r.title} — Zone: ${r.area} — Likelihood: ${r.likelihood}, Consequence: ${r.consequence}`).join('\n') || 'No risk assessments.'}

=== LOW PPE COMPLIANCE DETECTIONS (score < 70%) ===
${lowComplianceDetections.map(d => `- ${d.employeeName} in zone ${d.zone}: ${d.complianceScore}% compliance (${d.status})`).join('\n') || 'No low-compliance detections.'}`;

    const analysis = await callOpenRouter(systemPrompt, userMessage);

    if (!analysis.success) {
      return res.status(502).json({ error: analysis.error });
    }

    // Persist to ai_analyses table
    const saved = await AIAnalysis.create({
      analysis_type: 'global_pattern_detection',
      content: analysis.result,
      model: analysis.model || 'anthropic/claude-3-5-sonnet-20241022'
    });
    await logAudit('AIAnalysis', saved.id, 'AI_GLOBAL_ANALYSIS', req.user?.email || req.user?.id, null, { model: analysis.model });

    res.json({
      success: true,
      analysis_id: saved.id,
      result: analysis.result,
      model: analysis.model,
      usage: analysis.usage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/predictive-risk-scoring
 * Weekly batch AI job that reviews all open incidents + risk assessments and produces
 * a facility-wide risk heat map by zone, identifying areas trending toward higher severity.
 */
router.post('/predictive-risk-scoring', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { Incident, RiskAssessment, HazardZone, SafetyAlert } = models;
    const { Op } = require('sequelize');

    const [openIncidents, openRisks, zones] = await Promise.all([
      Incident.findAll({
        where: { status: { [Op.notIn]: ['closed'] } },
        attributes: ['type', 'severity', 'location', 'date', 'rootCause'],
        order: [['date', 'DESC']],
        limit: 50
      }),
      RiskAssessment.findAll({
        where: { status: { [Op.notIn]: ['closed', 'accepted'] } },
        attributes: ['title', 'area', 'riskLevel', 'likelihood', 'consequence', 'controls'],
        order: [['createdAt', 'DESC']]
      }),
      HazardZone.findAll({
        attributes: ['name', 'location', 'riskLevel', 'type', 'currentOccupancy', 'maxOccupancy'],
        order: [['riskLevel', 'DESC']]
      })
    ]);

    const systemPrompt = `You are an OSHA predictive safety analytics expert. Analyze the provided facility-wide safety data and generate a comprehensive risk heat map. Return a JSON object with this structure:
{
  "facility_risk_score": <number 0-100>,
  "risk_trend": "improving|stable|deteriorating",
  "zone_heat_map": [
    { "zone": "<name>", "risk_score": <0-100>, "trend": "increasing|stable|decreasing", "key_factors": ["factor1"] }
  ],
  "top_predictive_risks": [
    { "risk": "<description>", "probability": "high|medium|low", "potential_severity": "critical|major|moderate|minor", "timeframe_days": <number> }
  ],
  "priority_interventions": [
    { "action": "<description>", "urgency": "immediate|this_week|this_month", "estimated_impact": "<description>" }
  ],
  "summary": "<2-3 sentence executive summary>"
}`;

    const userMessage = `Analyze facility safety data for predictive risk scoring:

=== OPEN INCIDENTS (${openIncidents.length}) ===
${openIncidents.map(i => `[${i.severity}] ${i.type} at ${i.location} — ${new Date(i.date).toDateString()} — Root cause: ${i.rootCause || 'TBD'}`).join('\n') || 'None'}

=== OPEN RISK ASSESSMENTS (${openRisks.length}) ===
${openRisks.map(r => `[${r.riskLevel}] ${r.title} — Zone: ${r.area} — Likelihood: ${r.likelihood}, Consequence: ${r.consequence} — Controls: ${r.controls || 'none'}`).join('\n') || 'None'}

=== HAZARD ZONES (${zones.length}) ===
${zones.map(z => `${z.name} (${z.location}) — Risk: ${z.riskLevel} — Occupancy: ${z.currentOccupancy}/${z.maxOccupancy}`).join('\n') || 'None'}`;

    const analysis = await callOpenRouter(systemPrompt, userMessage);

    if (!analysis.success) {
      return res.status(502).json({ error: analysis.error });
    }

    // Parse structured JSON response (3-strategy parser)
    const parsed = parseAIJson(analysis.result);

    // Persist to ai_analyses
    const { AIAnalysis } = models;
    const saved = await AIAnalysis.create({
      analysis_type: 'predictive_risk_scoring',
      content: analysis.result,
      model: analysis.model || 'anthropic/claude-3-5-sonnet-20241022'
    });

    // If facility risk score is critical (>75), auto-create a SafetyAlert
    let alertRow = null;
    if (parsed && parsed.facility_risk_score > 75) {
      alertRow = await SafetyAlert.create({
        title: `PREDICTIVE RISK ALERT — Facility Risk Score: ${parsed.facility_risk_score}/100`,
        message: parsed.summary || 'AI predictive analysis has identified high facility risk. Immediate review required.',
        type: 'critical',
        priority: 'urgent',
        zone: 'Facility-Wide',
        issuedBy: 'AI Predictive Risk System',
        status: 'active',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      await logAudit('SafetyAlert', alertRow.id, 'AUTO_CREATE', 'AI Predictive Risk System', null, alertRow.toJSON());
    }
    await logAudit('AIAnalysis', saved.id, 'AI_PREDICTIVE_RISK', req.user?.email || req.user?.id, null, { score: parsed?.facility_risk_score });

    res.json({
      success: true,
      analysis_id: saved.id,
      result: analysis.result,
      parsed,
      model: analysis.model,
      alert_created: parsed && parsed.facility_risk_score > 75
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ai/analyses
 * Returns paginated list of all stored AI analyses (global pattern detection + predictive risk).
 */
router.get('/analyses', authenticateToken, async (req, res) => {
  try {
    const { AIAnalysis } = models;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await AIAnalysis.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/ppe-reorder-alerts
 * Checks PPE inventory for below-minimum items and creates SafetyAlerts + AI reorder recommendations.
 */
router.post('/ppe-reorder-alerts', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { PPEInventory, SafetyAlert, sequelize: seq } = models;
    const { Op } = require('sequelize');

    const lowStockItems = await PPEInventory.findAll({
      where: { quantity: { [Op.lte]: seq.literal('"PPEInventory"."minQuantity"') } },
      order: [['quantity', 'ASC']]
    });

    if (lowStockItems.length === 0) {
      return res.json({ message: 'All PPE inventory is adequately stocked.', alerts_created: 0, reorder_recommendations: [] });
    }

    const systemPrompt = `You are a safety procurement specialist. Given a list of low-stock PPE items, generate reorder recommendations. Return JSON:
{
  "reorder_recommendations": [
    {
      "item": "<itemName>",
      "current_qty": <number>,
      "min_qty": <number>,
      "recommended_order_qty": <number>,
      "priority": "urgent|high|medium",
      "supplier_note": "<note>"
    }
  ],
  "total_estimated_cost": <number>,
  "action_summary": "<brief summary>"
}`;

    const userMessage = `These PPE items are at or below minimum stock levels:
${lowStockItems.map(i => `- ${i.itemName} (${i.category}): ${i.quantity} in stock, minimum is ${i.minQuantity} — Supplier: ${i.supplier || 'Unknown'}, Unit cost: $${i.unitCost}`).join('\n')}`;

    const analysis = await callOpenRouter(systemPrompt, userMessage);

    const parsed = parseAIJson(analysis.result || '');

    // Create one consolidated SafetyAlert for the low-stock situation
    const alertCreated = await SafetyAlert.create({
      title: `PPE Inventory Alert — ${lowStockItems.length} item(s) below minimum stock`,
      message: `The following PPE items require immediate reorder: ${lowStockItems.map(i => i.itemName).join(', ')}. AI reorder recommendations have been generated.`,
      type: 'warning',
      priority: lowStockItems.length > 3 ? 'urgent' : 'high',
      zone: 'PPE Storage',
      issuedBy: 'PPE Inventory System',
      status: 'active',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });
    await logAudit('SafetyAlert', alertCreated.id, 'AUTO_CREATE_PPE', req.user?.email || 'PPE Inventory System', null, alertCreated.toJSON());

    res.json({
      success: true,
      low_stock_items: lowStockItems.length,
      alert_id: alertCreated.id,
      reorder_recommendations: parsed?.reorder_recommendations || [],
      action_summary: parsed?.action_summary || analysis.result,
      model: analysis.model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/incident-predict
 * Accepts { zone (optional), shift (optional), days_back (optional) }
 * Returns AI-driven prediction of likely incident types per zone/shift
 * based on Incident + RiskAssessment history.
 */
router.post('/incident-predict', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { Incident, RiskAssessment, AIAnalysis } = models;
    const { zone, shift, days_back } = req.body || {};
    const lookback = Math.min(Math.max(parseInt(days_back, 10) || 90, 7), 365);
    const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);

    const incidentWhere = { occurredAt: { [Op.gte]: since } };
    if (zone) incidentWhere.zone = zone;
    if (shift) incidentWhere.shift = shift;

    const [incidents, risks] = await Promise.all([
      Incident.findAll({ where: incidentWhere, limit: 100, order: [['occurredAt', 'DESC']] }),
      RiskAssessment.findAll({ limit: 50, order: [['createdAt', 'DESC']] }),
    ]);

    const incidentSummary = incidents.length
      ? incidents.map(i => `- ${i.occurredAt}: zone=${i.zone || 'N/A'} shift=${i.shift || 'N/A'} type=${i.type || 'N/A'} severity=${i.severity || 'N/A'} cause=${i.rootCause || 'unknown'}`).join('\n')
      : 'No incident history in window.';
    const riskSummary = risks.length
      ? risks.map(r => `- ${r.createdAt}: zone=${r.zone || 'N/A'} score=${r.riskScore || 'N/A'} hazards=${r.hazards || 'N/A'}`).join('\n')
      : 'No risk assessments available.';

    const systemPrompt = 'You are an industrial safety analyst specializing in incident prediction. Return only valid JSON.';
    const userPrompt = `Predict the most likely incident types for the next 30 days.

Filters: zone=${zone || 'ALL'}, shift=${shift || 'ALL'}, lookback_days=${lookback}

Incident history (${incidents.length}):
${incidentSummary}

Risk assessments (${risks.length}):
${riskSummary}

Return JSON only with shape:
{
  "predictions": [
    {
      "incident_type": "...",
      "likelihood": "low|medium|high|very_high",
      "expected_zones": ["..."],
      "expected_shifts": ["..."],
      "leading_indicators": ["..."],
      "preventive_actions": ["..."]
    }
  ],
  "horizon_days": 30,
  "confidence": <0-100>,
  "summary": "<short narrative>"
}`;

    const analysis = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(analysis.result);

    const created = await AIAnalysis.create({
      analysisType: 'incident_predict',
      input: JSON.stringify({ zone: zone || null, shift: shift || null, days_back: lookback }),
      result: analysis.result,
      model: analysis.model,
    });
    await logAudit('AIAnalysis', created.id, 'AI_INCIDENT_PREDICT', req.user?.email || 'system', null, { zone, shift, lookback });

    res.json({
      analysis_id: created.id,
      filters: { zone: zone || null, shift: shift || null, lookback_days: lookback },
      incident_count: incidents.length,
      risk_assessment_count: risks.length,
      predictions: parsed,
      model: analysis.model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/osha-compliance-check
 * Accepts { focus_areas?: [], scope?: 'facility'|'department', department? }
 * Returns a 29 CFR 1910 compliance gap analysis grounded in recent incidents
 * and PPE inventory data.
 * 503 if OPENROUTER_API_KEY is unset (consistent with the FE's 503 handling).
 */
router.post('/osha-compliance-check', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI not configured: OPENROUTER_API_KEY is missing' });
    }
    const { Op } = require('sequelize');
    const { Incident, PPEInventory, AIAnalysis } = models;
    const { focus_areas, scope, department } = req.body || {};
    const focusList = Array.isArray(focus_areas) ? focus_areas.filter(Boolean) : [];

    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const incidentWhere = { createdAt: { [Op.gte]: since } };

    const [incidents, ppeRows] = await Promise.all([
      Incident.findAll({
        where: incidentWhere,
        attributes: ['type', 'severity', 'location', 'date', 'rootCause', 'status'],
        order: [['createdAt', 'DESC']],
        limit: 60
      }),
      PPEInventory.findAll({
        attributes: ['itemName', 'category', 'quantity', 'minQuantity', 'expirationDate', 'status'],
        order: [['itemName', 'ASC']],
        limit: 80
      })
    ]);

    const incidentSummary = incidents.length
      ? incidents.map(i => `- [${i.severity}] ${i.type} at ${i.location} on ${i.date ? new Date(i.date).toDateString() : 'unknown'} (status=${i.status || 'n/a'}; root_cause=${i.rootCause || 'TBD'})`).join('\n')
      : 'No incidents recorded in the past 12 months.';

    const ppeSummary = ppeRows.length
      ? ppeRows.map(p => `- ${p.itemName} (${p.category}): qty=${p.quantity}, min=${p.minQuantity}, exp=${p.expirationDate || 'N/A'}, status=${p.status || 'n/a'}`).join('\n')
      : 'No PPE inventory recorded.';

    const systemPrompt = `You are a senior OSHA compliance auditor specializing in 29 CFR 1910 (general industry).
For each relevant CFR subpart, identify gaps from the provided incident + PPE data and recommend specific corrective actions.
Return ONLY valid JSON in this shape:
{
  "overall_compliance_score": <0-100>,
  "overall_summary": "<2-3 sentences>",
  "cfr_findings": [
    {
      "cfr_section": "29 CFR 1910.xxxx",
      "topic": "<Subpart name e.g. Subpart I - PPE>",
      "compliance_status": "compliant|partial|non_compliant",
      "evidence": ["<quote facts from inputs>"],
      "gaps": ["<gap 1>"],
      "recommended_actions": ["<action 1>"],
      "priority": "low|medium|high|critical"
    }
  ],
  "top_priority_actions": ["<action 1>"]
}`;

    const userMessage = `Run a 29 CFR 1910 compliance gap analysis.

Scope: ${scope || 'facility'}${department ? ` / department=${department}` : ''}
Focus areas (optional): ${focusList.length ? focusList.join(', ') : 'all relevant subparts'}

=== INCIDENTS (past 12 months, last ${incidents.length}) ===
${incidentSummary}

=== PPE INVENTORY (${ppeRows.length}) ===
${ppeSummary}`;

    const analysis = await callOpenRouter(systemPrompt, userMessage);

    if (!analysis.success) {
      return res.status(502).json({ error: analysis.error });
    }

    const parsed = parseAIJson(analysis.result);

    const saved = await AIAnalysis.create({
      analysis_type: 'osha_compliance_check',
      content: analysis.result,
      model: analysis.model || 'anthropic/claude-3-5-sonnet-20241022'
    });
    await logAudit('AIAnalysis', saved.id, 'AI_OSHA_COMPLIANCE_CHECK', req.user?.email || req.user?.id, null, { scope: scope || 'facility', department: department || null });

    res.json({
      success: true,
      analysis_id: saved.id,
      filters: { scope: scope || 'facility', department: department || null, focus_areas: focusList },
      incident_count: incidents.length,
      ppe_item_count: ppeRows.length,
      result: analysis.result,
      parsed,
      model: analysis.model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/near-miss-analyze
 * Accepts { reports?: [{ description, location?, date?, contributing_factors? }], window_days? }
 * If `reports` is omitted, the route pulls Incident rows of type "near_miss" from the
 * specified window (default 90 days) and analyzes them.
 * Returns trend analysis: hotspots, recurring contributing factors, and
 * preventive recommendations.
 * 503 if OPENROUTER_API_KEY is unset.
 */
router.post('/near-miss-analyze', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI not configured: OPENROUTER_API_KEY is missing' });
    }
    const { Op } = require('sequelize');
    const { Incident, AIAnalysis } = models;
    const { reports, window_days } = req.body || {};
    const windowDays = Math.min(Math.max(parseInt(window_days, 10) || 90, 7), 365);

    let nearMisses = [];
    if (Array.isArray(reports) && reports.length > 0) {
      nearMisses = reports.slice(0, 100).map((r, idx) => ({
        id: `r${idx + 1}`,
        description: String(r.description || '').slice(0, 1000),
        location: r.location || 'unknown',
        date: r.date || null,
        contributing_factors: r.contributing_factors || null
      }));
    } else {
      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
      const dbRows = await Incident.findAll({
        where: { type: 'near_miss', createdAt: { [Op.gte]: since } },
        attributes: ['id', 'description', 'location', 'date', 'rootCause'],
        order: [['createdAt', 'DESC']],
        limit: 100
      });
      nearMisses = dbRows.map(r => ({
        id: `db${r.id}`,
        description: r.description || '',
        location: r.location || 'unknown',
        date: r.date ? new Date(r.date).toISOString().slice(0, 10) : null,
        contributing_factors: r.rootCause || null
      }));
    }

    if (nearMisses.length === 0) {
      return res.json({
        success: true,
        message: `No near-miss data available (looked back ${windowDays} days).`,
        report_count: 0,
        result: null,
        parsed: null
      });
    }

    const systemPrompt = `You are an industrial safety analyst specializing in near-miss trend analysis. Apply Heinrich's safety triangle reasoning. Return ONLY valid JSON:
{
  "report_count": <number>,
  "trend_summary": "<2-3 sentence overview>",
  "location_hotspots": [{ "location": "...", "count": <n>, "risk_level": "low|medium|high" }],
  "recurring_contributing_factors": [{ "factor": "...", "count": <n>, "examples": ["id1"] }],
  "incident_categories": [{ "category": "...", "count": <n> }],
  "leading_indicators": ["..."],
  "preventive_recommendations": [
    { "recommendation": "...", "target_factor": "...", "priority": "low|medium|high|critical", "expected_impact": "..." }
  ]
}`;

    const userMessage = `Analyze the following near-miss reports and identify trends.

Window: ${windowDays} days
Reports (${nearMisses.length}):
${nearMisses.map(r => `[${r.id}] location=${r.location} date=${r.date || 'unknown'} factors=${r.contributing_factors || 'unspecified'} description=${r.description}`).join('\n')}`;

    const analysis = await callOpenRouter(systemPrompt, userMessage);

    if (!analysis.success) {
      return res.status(502).json({ error: analysis.error });
    }

    const parsed = parseAIJson(analysis.result);

    const saved = await AIAnalysis.create({
      analysis_type: 'near_miss_analysis',
      content: analysis.result,
      model: analysis.model || 'anthropic/claude-3-5-sonnet-20241022'
    });
    await logAudit('AIAnalysis', saved.id, 'AI_NEAR_MISS_ANALYZE', req.user?.email || req.user?.id, null, { window_days: windowDays, report_count: nearMisses.length });

    res.json({
      success: true,
      analysis_id: saved.id,
      window_days: windowDays,
      report_count: nearMisses.length,
      result: analysis.result,
      parsed,
      model: analysis.model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Apply pass 5 wave-1 — agentic-safety-officer + predictive-maintenance
// ============================================================

/**
 * POST /api/ai/agentic-safety-officer
 * Body: { focus?, department?, window_days? }
 * Synthesizes incidents + risk assessments + PPE inventory into a
 * multi-step intervention plan.
 * 503 if OPENROUTER_API_KEY is unset.
 */
router.post('/agentic-safety-officer', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI not configured: OPENROUTER_API_KEY is missing' });
    }
    const { Op } = require('sequelize');
    const { Incident, RiskAssessment, PPEInventory, AIAnalysis } = models;
    const { focus = 'overall safety performance', department, window_days } = req.body || {};
    const windowDays = Math.min(Math.max(parseInt(window_days || 30, 10) || 30, 7), 365);
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const incidentWhere = { createdAt: { [Op.gte]: since } };
    if (department) incidentWhere.department = department;

    const [incidents, risks, ppe] = await Promise.all([
      Incident.findAll({ where: incidentWhere, attributes: ['type', 'severity', 'location', 'department', 'date'], order: [['createdAt', 'DESC']], limit: 50 }).catch(() => []),
      RiskAssessment.findAll({ attributes: ['title', 'area', 'riskLevel', 'likelihood', 'consequence'], order: [['createdAt', 'DESC']], limit: 20 }).catch(() => []),
      PPEInventory.findAll({ attributes: ['itemType', 'quantity', 'reorderLevel'], limit: 50 }).catch(() => []),
    ]);

    const stats = {
      window_days: windowDays,
      department: department || 'all',
      incident_count: incidents.length,
      high_severity_count: incidents.filter(i => ['high', 'critical', 'severe'].includes(String(i.severity || '').toLowerCase())).length,
      ppe_below_reorder: ppe.filter(p => Number(p.quantity || 0) < Number(p.reorderLevel || 0)).length,
    };

    const systemPrompt = `You are an agentic factory safety officer. Synthesize incidents, risk assessments, and PPE inventory into a multi-phase intervention plan. Cite OSHA 29 CFR 1910 references when relevant.`;
    const userMessage = `FOCUS: ${focus}
SCOPE: ${stats.department} (last ${windowDays} days)
DETERMINISTIC_STATS: ${JSON.stringify(stats)}
INCIDENTS (sample): ${JSON.stringify(incidents.slice(0, 25))}
RISK_ASSESSMENTS: ${JSON.stringify(risks.slice(0, 15))}
PPE_INVENTORY: ${JSON.stringify(ppe.slice(0, 30))}

Return strict JSON:
{
  "investigation_findings": [{"finding": "...", "evidence": "..."}],
  "interventions": [{"phase": "0-7 days|8-30 days|31-90 days", "action": "...", "owner_role": "...", "success_metric": "...", "cfr_reference": "29 CFR 1910.x or n/a"}],
  "ppe_actions": [{"item": "...", "action": "reorder|replace|reposition", "rationale": "..."}],
  "training_actions": [{"topic": "...", "audience": "...", "urgency": "high|medium|low"}],
  "predicted_risk_change_pct": -50,
  "executive_summary": "<3-5 sentences>",
  "disclaimer": "AI planning aid only — does not replace safety officer judgment or OSHA compliance audits."
}`;

    const analysis = await callOpenRouter(systemPrompt, userMessage);
    if (!analysis.success) {
      return res.status(502).json({ error: analysis.error || 'AI call failed' });
    }
    const parsed = parseAIJson(analysis.result);

    const saved = await AIAnalysis.create({
      analysis_type: 'agentic_safety_officer',
      content: analysis.result,
      model: analysis.model || 'anthropic/claude-3-5-sonnet-20241022'
    });
    await logAudit('AIAnalysis', saved.id, 'AI_AGENTIC_SAFETY_OFFICER', req.user?.email || req.user?.id, null, stats);

    res.json({
      success: true,
      analysis_id: saved.id,
      stats,
      result: analysis.result,
      parsed,
      model: analysis.model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/predictive-maintenance
 * Body: { department?, equipment_focus?, window_days? }
 * Uses EquipmentInspection rows + recent equipment-related incidents
 * to recommend preemptive maintenance windows.
 * 503 if OPENROUTER_API_KEY is unset.
 */
router.post('/predictive-maintenance', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI not configured: OPENROUTER_API_KEY is missing' });
    }
    const { Op } = require('sequelize');
    const { Incident, EquipmentInspection, AIAnalysis } = models;
    const { department, equipment_focus, window_days } = req.body || {};
    const windowDays = Math.min(Math.max(parseInt(window_days || 90, 10) || 90, 14), 365);
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const incidentWhere = { createdAt: { [Op.gte]: since } };
    if (department) incidentWhere.department = department;

    const [inspections, incidents] = await Promise.all([
      EquipmentInspection.findAll({ order: [['createdAt', 'DESC']], limit: 100 }).catch(() => []),
      Incident.findAll({ where: incidentWhere, attributes: ['type', 'severity', 'description', 'date'], order: [['createdAt', 'DESC']], limit: 60 }).catch(() => []),
    ]);

    const stats = {
      window_days: windowDays,
      inspection_count: inspections.length,
      incident_count: incidents.length,
      department: department || 'all',
      equipment_focus: equipment_focus || 'all',
    };

    const systemPrompt = `You are an industrial reliability engineer. Use the inspection history and recent equipment-related incidents to predict likely failures and recommend preemptive maintenance windows.`;
    const userMessage = `DETERMINISTIC_STATS: ${JSON.stringify(stats)}
INSPECTIONS (sample): ${JSON.stringify(inspections.slice(0, 30))}
INCIDENTS_RECENT: ${JSON.stringify(incidents.slice(0, 30))}

Return strict JSON:
{
  "high_risk_assets": [{"asset_label": "...", "reasoning": "...", "recommended_action": "...", "horizon_days": <number>}],
  "preventive_schedule": [{"asset_label": "...", "task": "...", "recommended_date_range": "YYYY-MM-DD..YYYY-MM-DD"}],
  "spare_parts_to_stock": [{"part": "...", "qty_recommended": <number>, "reason": "..."}],
  "executive_summary": "<3-5 sentences>",
  "disclaimer": "Predictive guide only — does not replace OEM and certified inspector findings."
}`;

    const analysis = await callOpenRouter(systemPrompt, userMessage);
    if (!analysis.success) {
      return res.status(502).json({ error: analysis.error || 'AI call failed' });
    }
    const parsed = parseAIJson(analysis.result);

    const saved = await AIAnalysis.create({
      analysis_type: 'predictive_maintenance',
      content: analysis.result,
      model: analysis.model || 'anthropic/claude-3-5-sonnet-20241022'
    });
    await logAudit('AIAnalysis', saved.id, 'AI_PREDICTIVE_MAINTENANCE', req.user?.email || req.user?.id, null, stats);

    res.json({
      success: true,
      analysis_id: saved.id,
      stats,
      result: analysis.result,
      parsed,
      model: analysis.model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

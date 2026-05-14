const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const models = require('../models');
const { logAudit } = require('../services/audit');
const {
  analyzePPECompliance,
  analyzeIncident,
  analyzeRisk,
  analyzeAudit,
  generateComplianceAnalysis,
  analyzeHazardZone,
  callOpenRouter
} = require('../services/openrouter');

// Recompute PPEInventory.status based on quantity vs minQuantity and expirationDate
function computePPEStatus(item) {
  const today = new Date();
  if (item.expirationDate && new Date(item.expirationDate) < today) return 'expired';
  if (item.quantity <= 0) return 'out_of_stock';
  if (item.quantity <= item.minQuantity) return 'low_stock';
  return 'in_stock';
}

// Generic CRUD route factory
function createCrudRoutes(modelName, aiAnalyzer) {
  const router = express.Router();
  const Model = models[modelName];

  // Get all — with pagination
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const { count, rows } = await Model.findAndCountAll({
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get by ID
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: `${modelName} not found` });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const payload = { ...req.body };
      if (modelName === 'PPEInventory') {
        payload.status = computePPEStatus(payload);
      }
      const item = await Model.create(payload);
      await logAudit(modelName, item.id, 'CREATE', req.user?.email || req.user?.id, null, item.toJSON());
      res.status(201).json(item);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: `${modelName} not found` });

      const previous = item.toJSON();
      const updateData = { ...req.body };
      if (modelName === 'PPEInventory') {
        const merged = { ...previous, ...updateData };
        updateData.status = computePPEStatus(merged);
      }
      await item.update(updateData);
      await logAudit(modelName, item.id, 'UPDATE', req.user?.email || req.user?.id, previous, item.toJSON());
      res.json(item);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: `${modelName} not found` });
      const previous = item.toJSON();
      await item.destroy();
      await logAudit(modelName, item.id, 'DELETE', req.user?.email || req.user?.id, previous, null);
      res.json({ message: `${modelName} deleted successfully` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI Analysis endpoint (if applicable) — rate limited
  if (aiAnalyzer) {
    router.post('/:id/analyze', authenticateToken, aiRateLimiter, async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: `${modelName} not found` });

        const analysis = await aiAnalyzer(item.toJSON());

        if (analysis.success) {
          await item.update({ aiAnalysis: analysis.result });
          await logAudit(modelName, item.id, 'AI_ANALYZE', req.user?.email || req.user?.id, null, { model: analysis.model });
        }

        res.json({
          ...analysis,
          item: item.toJSON()
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  return router;
}

// PPE Inventory low-stock endpoint
const ppeInventoryRouter = createCrudRoutes('PPEInventory');
ppeInventoryRouter.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    const { PPEInventory, sequelize } = models;
    const items = await PPEInventory.findAll({
      where: sequelize.literal('"quantity" <= "minQuantity"'),
      order: [['quantity', 'ASC']]
    });
    // Compute shortfall
    const result = items.map(item => ({
      ...item.toJSON(),
      shortfall: item.minQuantity - item.quantity
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compliance report export endpoint
const complianceReportRouter = createCrudRoutes('ComplianceReport', generateComplianceAnalysis);
complianceReportRouter.get('/:id/export', authenticateToken, async (req, res) => {
  try {
    const { ComplianceReport, Incident } = models;
    const report = await ComplianceReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Compliance report not found' });

    // Fetch related recent incidents
    const incidents = await Incident.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const reportData = report.toJSON();
    const incidentLines = incidents.map(i =>
      `  - [${i.severity.toUpperCase()}] ${i.title} (${i.type}) — ${i.location} — ${new Date(i.date).toDateString()}`
    ).join('\n');

    const text = `
================================================================================
OSHA COMPLIANCE REPORT
================================================================================
Report Number : ${reportData.reportNumber}
Title         : ${reportData.title}
Type          : ${reportData.type.toUpperCase()}
Period        : ${reportData.period}
Prepared By   : ${reportData.preparedBy}
Status        : ${reportData.status.toUpperCase()}
Submission    : ${reportData.submissionDate || 'N/A'}
Generated On  : ${new Date().toUTCString()}

--------------------------------------------------------------------------------
KEY METRICS
--------------------------------------------------------------------------------
Total Incidents   : ${reportData.totalIncidents}
Total Trainings   : ${reportData.totalTrainings}
Compliance Rate   : ${reportData.complianceRate}%

--------------------------------------------------------------------------------
SUMMARY
--------------------------------------------------------------------------------
${reportData.summary || 'No summary available.'}

--------------------------------------------------------------------------------
RECENT INCIDENTS (last 20)
--------------------------------------------------------------------------------
${incidentLines || '  No recent incidents.'}

--------------------------------------------------------------------------------
AI ANALYSIS
--------------------------------------------------------------------------------
${reportData.aiAnalysis || 'No AI analysis generated yet. Use the /analyze endpoint first.'}

================================================================================
END OF REPORT
================================================================================
`.trim();

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${reportData.reportNumber}.txt"`);
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = {
  employeeRoutes: createCrudRoutes('Employee'),
  ppeDetectionRoutes: createCrudRoutes('PPEDetection', analyzePPECompliance),
  hazardZoneRoutes: createCrudRoutes('HazardZone', analyzeHazardZone),
  incidentRoutes: createCrudRoutes('Incident', analyzeIncident),
  safetyTrainingRoutes: createCrudRoutes('SafetyTraining'),
  equipmentInspectionRoutes: createCrudRoutes('EquipmentInspection'),
  safetyAuditRoutes: createCrudRoutes('SafetyAudit', analyzeAudit),
  emergencyContactRoutes: createCrudRoutes('EmergencyContact'),
  ppeInventoryRoutes: ppeInventoryRouter,
  complianceReportRoutes: complianceReportRouter,
  shiftScheduleRoutes: createCrudRoutes('ShiftSchedule'),
  riskAssessmentRoutes: createCrudRoutes('RiskAssessment', analyzeRisk),
  safetyAlertRoutes: createCrudRoutes('SafetyAlert')
};

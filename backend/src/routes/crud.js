const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const models = require('../models');
const {
  analyzePPECompliance,
  analyzeIncident,
  analyzeRisk,
  analyzeAudit,
  generateComplianceAnalysis,
  analyzeHazardZone
} = require('../services/openrouter');

// Generic CRUD route factory
function createCrudRoutes(modelName, aiAnalyzer) {
  const router = express.Router();
  const Model = models[modelName];

  // Get all
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const items = await Model.findAll({ order: [['createdAt', 'DESC']] });
      res.json(items);
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
      const item = await Model.create(req.body);
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
      await item.update(req.body);
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
      await item.destroy();
      res.json({ message: `${modelName} deleted successfully` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI Analysis endpoint (if applicable)
  if (aiAnalyzer) {
    router.post('/:id/analyze', authenticateToken, async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: `${modelName} not found` });

        const analysis = await aiAnalyzer(item.toJSON());

        if (analysis.success) {
          await item.update({ aiAnalysis: analysis.result });
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

module.exports = {
  employeeRoutes: createCrudRoutes('Employee'),
  ppeDetectionRoutes: createCrudRoutes('PPEDetection', analyzePPECompliance),
  hazardZoneRoutes: createCrudRoutes('HazardZone', analyzeHazardZone),
  incidentRoutes: createCrudRoutes('Incident', analyzeIncident),
  safetyTrainingRoutes: createCrudRoutes('SafetyTraining'),
  equipmentInspectionRoutes: createCrudRoutes('EquipmentInspection'),
  safetyAuditRoutes: createCrudRoutes('SafetyAudit', analyzeAudit),
  emergencyContactRoutes: createCrudRoutes('EmergencyContact'),
  ppeInventoryRoutes: createCrudRoutes('PPEInventory'),
  complianceReportRoutes: createCrudRoutes('ComplianceReport', generateComplianceAnalysis),
  shiftScheduleRoutes: createCrudRoutes('ShiftSchedule'),
  riskAssessmentRoutes: createCrudRoutes('RiskAssessment', analyzeRisk),
  safetyAlertRoutes: createCrudRoutes('SafetyAlert')
};

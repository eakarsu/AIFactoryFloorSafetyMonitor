const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  Employee, PPEDetection, HazardZone, Incident, SafetyTraining,
  EquipmentInspection, SafetyAudit, EmergencyContact, PPEInventory,
  ComplianceReport, ShiftSchedule, RiskAssessment, SafetyAlert
} = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      totalIncidents,
      openIncidents,
      totalTrainings,
      ppeCompliance,
      activeZones,
      activeAlerts,
      pendingInspections,
      riskAssessments,
      lowStockPPE,
      upcomingAudits
    ] = await Promise.all([
      Employee.count(),
      Employee.count({ where: { status: 'active' } }),
      Incident.count(),
      Incident.count({ where: { status: { [Op.in]: ['open', 'investigating'] } } }),
      SafetyTraining.count(),
      PPEDetection.count({ where: { status: 'compliant' } }),
      HazardZone.count({ where: { status: 'active' } }),
      SafetyAlert.count({ where: { status: 'active' } }),
      EquipmentInspection.count({ where: { status: { [Op.in]: ['failed', 'needs_repair'] } } }),
      RiskAssessment.count({ where: { status: 'open' } }),
      PPEInventory.count({ where: { status: { [Op.in]: ['low_stock', 'out_of_stock'] } } }),
      SafetyAudit.count({ where: { status: { [Op.in]: ['scheduled', 'in_progress'] } } })
    ]);

    const totalPPEChecks = await PPEDetection.count();
    const complianceRate = totalPPEChecks > 0 ? ((ppeCompliance / totalPPEChecks) * 100).toFixed(1) : 100;

    res.json({
      totalEmployees,
      activeEmployees,
      totalIncidents,
      openIncidents,
      totalTrainings,
      complianceRate: parseFloat(complianceRate),
      activeZones,
      activeAlerts,
      pendingInspections,
      openRiskAssessments: riskAssessments,
      lowStockPPE,
      upcomingAudits
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

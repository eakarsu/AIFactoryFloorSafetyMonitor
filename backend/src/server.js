require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('./governance/runtime').validateRuntime();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models');
const app = express();
const PORT = process.env.BACKEND_PORT || 4000;
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((v) => v.trim());
app.use(helmet());
app.use(cors({ origin: (origin, cb) => !origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('Origin not allowed')), credentials: true }));
app.use(express.json({ limit: '10mb' }));
const { employeeRoutes, ppeDetectionRoutes, hazardZoneRoutes, incidentRoutes, safetyTrainingRoutes, equipmentInspectionRoutes, safetyAuditRoutes, emergencyContactRoutes, ppeInventoryRoutes, complianceReportRoutes, shiftScheduleRoutes, riskAssessmentRoutes, safetyAlertRoutes } = require('./routes/crud');
const routes = [
  ['/api/auth', require('./routes/auth')], ['/api/dashboard', require('./routes/dashboard')], ['/api/employees', employeeRoutes],
  ['/api/ppe-detections', ppeDetectionRoutes], ['/api/hazard-zones', hazardZoneRoutes], ['/api/incidents', incidentRoutes],
  ['/api/safety-trainings', safetyTrainingRoutes], ['/api/equipment-inspections', equipmentInspectionRoutes], ['/api/safety-audits', safetyAuditRoutes],
  ['/api/emergency-contacts', emergencyContactRoutes], ['/api/ppe-inventory', ppeInventoryRoutes], ['/api/compliance-reports', complianceReportRoutes],
  ['/api/shift-schedules', shiftScheduleRoutes], ['/api/risk-assessments', riskAssessmentRoutes], ['/api/safety-alerts', safetyAlertRoutes],
  ['/api/ai', require('./routes/ai')], ['/api/audit-logs', require('./routes/auditLogs')], ['/api/integrations', require('./routes/integrations')],
  ['/api/agentic-safety-officer', require('./routes/agenticSafetyOfficer')], ['/api/ppe-vision-monitor', require('./routes/ppeVisionMonitor')],
  ['/api/wearable-integration', require('./routes/wearableIntegration')], ['/api/incident-video-analysis', require('./routes/incidentVideoAnalysis')],
  ['/api/behavioral-safety', require('./routes/behavioralSafety')], ['/api/predictive-maintenance', require('./routes/predictiveMaintenance')],
  ['/api/hazard-map', require('./routes/hazardMap')], ['/api/lockout-tagout-review', require('./routes/lockoutTagoutReview')],
  ['/api/custom-views', require('../routes/customViews')], ['/api/governed-workflow', require('./governance/router')],
];
routes.forEach(([mount, router]) => app.use(mount, router));
app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.use((err, _req, res, _next) => { console.error('Request failed:', err.message); res.status(500).json({ error: 'Internal server error' }); });
async function start() { await sequelize.authenticate(); app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`)); }
if (require.main === module) start().catch((error) => { console.error('Startup failed:', error.message); process.exit(1); });
module.exports = app;

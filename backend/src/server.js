require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const auditLogRoutes = require('./routes/auditLogs');
const integrationsRoutes = require('./routes/integrations');
const {
  employeeRoutes, ppeDetectionRoutes, hazardZoneRoutes, incidentRoutes,
  safetyTrainingRoutes, equipmentInspectionRoutes, safetyAuditRoutes,
  emergencyContactRoutes, ppeInventoryRoutes, complianceReportRoutes,
  shiftScheduleRoutes, riskAssessmentRoutes, safetyAlertRoutes
} = require('./routes/crud');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Security headers
app.use(helmet());

// Env-based CORS allowlist
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/ppe-detections', ppeDetectionRoutes);
app.use('/api/hazard-zones', hazardZoneRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/safety-trainings', safetyTrainingRoutes);
app.use('/api/equipment-inspections', equipmentInspectionRoutes);
app.use('/api/safety-audits', safetyAuditRoutes);
app.use('/api/emergency-contacts', emergencyContactRoutes);
app.use('/api/ppe-inventory', ppeInventoryRoutes);
app.use('/api/compliance-reports', complianceReportRoutes);
app.use('/api/shift-schedules', shiftScheduleRoutes);
app.use('/api/risk-assessments', riskAssessmentRoutes);
app.use('/api/safety-alerts', safetyAlertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/agentic-safety-officer', require('./routes/agenticSafetyOfficer'));
app.use('/api/ppe-vision-monitor', require('./routes/ppeVisionMonitor'));
app.use('/api/wearable-integration', require('./routes/wearableIntegration'));
app.use('/api/incident-video-analysis', require('./routes/incidentVideoAnalysis'));
app.use('/api/behavioral-safety', require('./routes/behavioralSafety'));
app.use('/api/predictive-maintenance', require('./routes/predictiveMaintenance'));
app.use('/api/hazard-map', require('./routes/hazardMap'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    // Only auto-sync in non-production. In production use sequelize-cli migrations.
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Database synced (dev mode)');
    } else {
      console.log('Production mode: skipping auto-sync; ensure migrations are run');
    }

    
// === Batch 03 Gaps & Frontend Mounts ===
try {
  const _batch03 = require('../routes/batch03Gaps');
  if (typeof authenticateToken === 'function') app.use('/api', authenticateToken, _batch03);
  else app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const {
  employeeRoutes, ppeDetectionRoutes, hazardZoneRoutes, incidentRoutes,
  safetyTrainingRoutes, equipmentInspectionRoutes, safetyAuditRoutes,
  emergencyContactRoutes, ppeInventoryRoutes, complianceReportRoutes,
  shiftScheduleRoutes, riskAssessmentRoutes, safetyAlertRoutes
} = require('./routes/crud');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors());
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

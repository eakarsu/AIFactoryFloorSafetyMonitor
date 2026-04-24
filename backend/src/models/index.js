const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// User Model
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'manager', 'supervisor', 'worker'), defaultValue: 'worker' }
}, { tableName: 'users', timestamps: true });

// Employee Model
const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employeeId: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  position: { type: DataTypes.STRING, allowNull: false },
  shift: { type: DataTypes.ENUM('morning', 'afternoon', 'night'), defaultValue: 'morning' },
  status: { type: DataTypes.ENUM('active', 'inactive', 'on_leave'), defaultValue: 'active' },
  phone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  hireDate: { type: DataTypes.DATEONLY },
  certifications: { type: DataTypes.TEXT }
}, { tableName: 'employees', timestamps: true });

// PPE Detection Records
const PPEDetection = sequelize.define('PPEDetection', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employeeName: { type: DataTypes.STRING, allowNull: false },
  zone: { type: DataTypes.STRING, allowNull: false },
  detectionTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  helmet: { type: DataTypes.BOOLEAN, defaultValue: false },
  safetyVest: { type: DataTypes.BOOLEAN, defaultValue: false },
  safetyGlasses: { type: DataTypes.BOOLEAN, defaultValue: false },
  gloves: { type: DataTypes.BOOLEAN, defaultValue: false },
  safetyBoots: { type: DataTypes.BOOLEAN, defaultValue: false },
  earProtection: { type: DataTypes.BOOLEAN, defaultValue: false },
  complianceScore: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.ENUM('compliant', 'non_compliant', 'partial'), defaultValue: 'compliant' },
  aiAnalysis: { type: DataTypes.TEXT },
  imageUrl: { type: DataTypes.STRING }
}, { tableName: 'ppe_detections', timestamps: true });

// Hazard Zones
const HazardZone = sequelize.define('HazardZone', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('restricted', 'caution', 'danger', 'safe'), defaultValue: 'caution' },
  location: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  maxOccupancy: { type: DataTypes.INTEGER, defaultValue: 10 },
  currentOccupancy: { type: DataTypes.INTEGER, defaultValue: 0 },
  requiredPPE: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('active', 'inactive', 'lockdown'), defaultValue: 'active' },
  riskLevel: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  aiAnalysis: { type: DataTypes.TEXT }
}, { tableName: 'hazard_zones', timestamps: true });

// Incidents
const Incident = sequelize.define('Incident', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  incidentNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('injury', 'near_miss', 'property_damage', 'environmental', 'fire', 'chemical_spill'), allowNull: false },
  severity: { type: DataTypes.ENUM('minor', 'moderate', 'major', 'critical'), defaultValue: 'minor' },
  location: { type: DataTypes.STRING, allowNull: false },
  reportedBy: { type: DataTypes.STRING, allowNull: false },
  assignedTo: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('open', 'investigating', 'resolved', 'closed'), defaultValue: 'open' },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  rootCause: { type: DataTypes.TEXT },
  correctiveAction: { type: DataTypes.TEXT },
  aiAnalysis: { type: DataTypes.TEXT }
}, { tableName: 'incidents', timestamps: true });

// Safety Training
const SafetyTraining = sequelize.define('SafetyTraining', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  type: { type: DataTypes.ENUM('osha_required', 'equipment', 'emergency', 'hazmat', 'general', 'ppe'), allowNull: false },
  instructor: { type: DataTypes.STRING, allowNull: false },
  duration: { type: DataTypes.STRING },
  maxParticipants: { type: DataTypes.INTEGER, defaultValue: 30 },
  currentParticipants: { type: DataTypes.INTEGER, defaultValue: 0 },
  scheduledDate: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'), defaultValue: 'scheduled' },
  location: { type: DataTypes.STRING },
  certificationValid: { type: DataTypes.STRING }
}, { tableName: 'safety_trainings', timestamps: true });

// Equipment Inspections
const EquipmentInspection = sequelize.define('EquipmentInspection', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  equipmentName: { type: DataTypes.STRING, allowNull: false },
  equipmentId: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'annual'), defaultValue: 'daily' },
  inspector: { type: DataTypes.STRING, allowNull: false },
  inspectionDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('passed', 'failed', 'needs_repair', 'out_of_service'), defaultValue: 'passed' },
  condition: { type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'), defaultValue: 'good' },
  notes: { type: DataTypes.TEXT },
  nextInspectionDate: { type: DataTypes.DATEONLY }
}, { tableName: 'equipment_inspections', timestamps: true });

// Safety Audits
const SafetyAudit = sequelize.define('SafetyAudit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  auditNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  auditor: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  auditDate: { type: DataTypes.DATEONLY, allowNull: false },
  score: { type: DataTypes.FLOAT, defaultValue: 0 },
  maxScore: { type: DataTypes.FLOAT, defaultValue: 100 },
  status: { type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'follow_up'), defaultValue: 'scheduled' },
  findings: { type: DataTypes.TEXT },
  recommendations: { type: DataTypes.TEXT },
  aiAnalysis: { type: DataTypes.TEXT }
}, { tableName: 'safety_audits', timestamps: true });

// Emergency Contacts
const EmergencyContact = sequelize.define('EmergencyContact', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  alternatePhone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  type: { type: DataTypes.ENUM('internal', 'external', 'medical', 'fire', 'hazmat'), defaultValue: 'internal' },
  available24x7: { type: DataTypes.BOOLEAN, defaultValue: false },
  priority: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { tableName: 'emergency_contacts', timestamps: true });

// PPE Inventory
const PPEInventory = sequelize.define('PPEInventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  itemName: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.ENUM('head', 'eye', 'ear', 'hand', 'foot', 'body', 'respiratory'), allowNull: false },
  brand: { type: DataTypes.STRING },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  minQuantity: { type: DataTypes.INTEGER, defaultValue: 10 },
  unitCost: { type: DataTypes.FLOAT, defaultValue: 0 },
  location: { type: DataTypes.STRING },
  expirationDate: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock', 'expired'), defaultValue: 'in_stock' },
  lastRestocked: { type: DataTypes.DATEONLY },
  supplier: { type: DataTypes.STRING }
}, { tableName: 'ppe_inventory', timestamps: true });

// Compliance Reports
const ComplianceReport = sequelize.define('ComplianceReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reportNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('osha_300', 'osha_301', 'osha_300a', 'monthly', 'quarterly', 'annual'), allowNull: false },
  period: { type: DataTypes.STRING, allowNull: false },
  preparedBy: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('draft', 'review', 'submitted', 'approved'), defaultValue: 'draft' },
  totalIncidents: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalTrainings: { type: DataTypes.INTEGER, defaultValue: 0 },
  complianceRate: { type: DataTypes.FLOAT, defaultValue: 0 },
  summary: { type: DataTypes.TEXT },
  aiAnalysis: { type: DataTypes.TEXT },
  submissionDate: { type: DataTypes.DATEONLY }
}, { tableName: 'compliance_reports', timestamps: true });

// Shift Schedules
const ShiftSchedule = sequelize.define('ShiftSchedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employeeName: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  shift: { type: DataTypes.ENUM('morning', 'afternoon', 'night'), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  zone: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('scheduled', 'active', 'completed', 'absent', 'swapped'), defaultValue: 'scheduled' },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'shift_schedules', timestamps: true });

// Risk Assessments (AI)
const RiskAssessment = sequelize.define('RiskAssessment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  area: { type: DataTypes.STRING, allowNull: false },
  assessor: { type: DataTypes.STRING, allowNull: false },
  assessmentDate: { type: DataTypes.DATEONLY, allowNull: false },
  hazardDescription: { type: DataTypes.TEXT, allowNull: false },
  likelihood: { type: DataTypes.ENUM('rare', 'unlikely', 'possible', 'likely', 'certain'), defaultValue: 'possible' },
  consequence: { type: DataTypes.ENUM('negligible', 'minor', 'moderate', 'major', 'catastrophic'), defaultValue: 'moderate' },
  riskLevel: { type: DataTypes.ENUM('low', 'medium', 'high', 'extreme'), defaultValue: 'medium' },
  controls: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('open', 'mitigated', 'accepted', 'closed'), defaultValue: 'open' },
  aiAnalysis: { type: DataTypes.TEXT }
}, { tableName: 'risk_assessments', timestamps: true });

// Safety Alerts
const SafetyAlert = sequelize.define('SafetyAlert', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('warning', 'danger', 'info', 'critical'), defaultValue: 'warning' },
  zone: { type: DataTypes.STRING },
  issuedBy: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'acknowledged', 'resolved', 'expired'), defaultValue: 'active' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  expiresAt: { type: DataTypes.DATE }
}, { tableName: 'safety_alerts', timestamps: true });

module.exports = {
  sequelize,
  User,
  Employee,
  PPEDetection,
  HazardZone,
  Incident,
  SafetyTraining,
  EquipmentInspection,
  SafetyAudit,
  EmergencyContact,
  PPEInventory,
  ComplianceReport,
  ShiftSchedule,
  RiskAssessment,
  SafetyAlert
};

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User, Employee, PPEDetection, HazardZone, Incident, SafetyTraining,
  EquipmentInspection, SafetyAudit, EmergencyContact, PPEInventory, ComplianceReport,
  ShiftSchedule, RiskAssessment, SafetyAlert } = require('../models');

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12) throw new Error('DEMO_PASSWORD must be at least 12 characters');
  return password;
}

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('📦 Connected to database, starting seed...');
    await sequelize.sync({ force: true });
    console.log('🗑️  Tables recreated');

    // Users
    const hashedPassword = await bcrypt.hash(requireDemoPassword(), 10);
    await User.bulkCreate([
      { email: 'admin@factory.com', password: hashedPassword, name: 'John Admin', role: 'admin' },
      { email: 'manager@factory.com', password: hashedPassword, name: 'Sarah Manager', role: 'manager' },
      { email: 'supervisor@factory.com', password: hashedPassword, name: 'Mike Supervisor', role: 'supervisor' },
      { email: 'worker@factory.com', password: hashedPassword, name: 'Jane Worker', role: 'worker' }
    ]);
    console.log('✅ Users seeded');

    // Employees (15)
    await Employee.bulkCreate([
      { employeeId: 'EMP-001', name: 'Robert Chen', department: 'Assembly Line A', position: 'Machine Operator', shift: 'morning', status: 'active', phone: '555-0101', email: 'rchen@factory.com', hireDate: '2020-03-15', certifications: 'Forklift, Crane Operation' },
      { employeeId: 'EMP-002', name: 'Maria Garcia', department: 'Welding Bay', position: 'Welder', shift: 'morning', status: 'active', phone: '555-0102', email: 'mgarcia@factory.com', hireDate: '2019-07-22', certifications: 'AWS Certified Welder' },
      { employeeId: 'EMP-003', name: 'James Wilson', department: 'Paint Shop', position: 'Paint Technician', shift: 'afternoon', status: 'active', phone: '555-0103', email: 'jwilson@factory.com', hireDate: '2021-01-10', certifications: 'Hazmat Handling' },
      { employeeId: 'EMP-004', name: 'Aisha Patel', department: 'Quality Control', position: 'QC Inspector', shift: 'morning', status: 'active', phone: '555-0104', email: 'apatel@factory.com', hireDate: '2018-11-05', certifications: 'ISO 9001 Lead Auditor' },
      { employeeId: 'EMP-005', name: 'Tommy Nguyen', department: 'Warehouse', position: 'Forklift Operator', shift: 'night', status: 'active', phone: '555-0105', email: 'tnguyen@factory.com', hireDate: '2022-04-18', certifications: 'Forklift License' },
      { employeeId: 'EMP-006', name: 'Sarah Johnson', department: 'Assembly Line B', position: 'Line Supervisor', shift: 'morning', status: 'active', phone: '555-0106', email: 'sjohnson@factory.com', hireDate: '2017-06-30', certifications: 'OSHA 30-Hour' },
      { employeeId: 'EMP-007', name: 'David Kim', department: 'Maintenance', position: 'Electrician', shift: 'afternoon', status: 'active', phone: '555-0107', email: 'dkim@factory.com', hireDate: '2019-09-12', certifications: 'Licensed Electrician, Lockout/Tagout' },
      { employeeId: 'EMP-008', name: 'Lisa Brown', department: 'Chemical Storage', position: 'Chemical Handler', shift: 'morning', status: 'on_leave', phone: '555-0108', email: 'lbrown@factory.com', hireDate: '2020-08-25', certifications: 'Hazmat Technician' },
      { employeeId: 'EMP-009', name: 'Carlos Rivera', department: 'Shipping', position: 'Dock Worker', shift: 'afternoon', status: 'active', phone: '555-0109', email: 'crivera@factory.com', hireDate: '2021-12-01', certifications: 'Forklift, First Aid' },
      { employeeId: 'EMP-010', name: 'Emily Zhang', department: 'Assembly Line A', position: 'Assembly Tech', shift: 'night', status: 'active', phone: '555-0110', email: 'ezhang@factory.com', hireDate: '2023-02-14', certifications: 'None' },
      { employeeId: 'EMP-011', name: 'Marcus Thompson', department: 'Welding Bay', position: 'Senior Welder', shift: 'morning', status: 'active', phone: '555-0111', email: 'mthompson@factory.com', hireDate: '2016-05-20', certifications: 'AWS D1.1, CWI' },
      { employeeId: 'EMP-012', name: 'Priya Sharma', department: 'Safety', position: 'Safety Officer', shift: 'morning', status: 'active', phone: '555-0112', email: 'psharma@factory.com', hireDate: '2018-03-08', certifications: 'CSP, OSHA 500' },
      { employeeId: 'EMP-013', name: 'Ryan O\'Brien', department: 'CNC Shop', position: 'CNC Operator', shift: 'afternoon', status: 'active', phone: '555-0113', email: 'robrien@factory.com', hireDate: '2020-10-15', certifications: 'CNC Programming' },
      { employeeId: 'EMP-014', name: 'Fatima Al-Hassan', department: 'Quality Control', position: 'Lab Technician', shift: 'morning', status: 'active', phone: '555-0114', email: 'falhassan@factory.com', hireDate: '2022-07-03', certifications: 'Lab Safety' },
      { employeeId: 'EMP-015', name: 'Kevin Murphy', department: 'Maintenance', position: 'Mechanic', shift: 'night', status: 'inactive', phone: '555-0115', email: 'kmurphy@factory.com', hireDate: '2019-01-22', certifications: 'Industrial Mechanic' }
    ]);
    console.log('✅ Employees seeded');

    // PPE Detections (15)
    await PPEDetection.bulkCreate([
      { employeeName: 'Robert Chen', zone: 'Assembly Line A', helmet: true, safetyVest: true, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: true, complianceScore: 100, status: 'compliant' },
      { employeeName: 'Maria Garcia', zone: 'Welding Bay', helmet: true, safetyVest: true, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: false, complianceScore: 83, status: 'partial' },
      { employeeName: 'James Wilson', zone: 'Paint Shop', helmet: false, safetyVest: true, safetyGlasses: false, gloves: true, safetyBoots: true, earProtection: true, complianceScore: 67, status: 'non_compliant' },
      { employeeName: 'Tommy Nguyen', zone: 'Warehouse', helmet: true, safetyVest: true, safetyGlasses: false, gloves: false, safetyBoots: true, earProtection: false, complianceScore: 50, status: 'non_compliant' },
      { employeeName: 'Sarah Johnson', zone: 'Assembly Line B', helmet: true, safetyVest: true, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: true, complianceScore: 100, status: 'compliant' },
      { employeeName: 'David Kim', zone: 'Electrical Panel Room', helmet: true, safetyVest: false, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: false, complianceScore: 67, status: 'partial' },
      { employeeName: 'Carlos Rivera', zone: 'Shipping Dock', helmet: true, safetyVest: true, safetyGlasses: false, gloves: true, safetyBoots: true, earProtection: false, complianceScore: 67, status: 'partial' },
      { employeeName: 'Emily Zhang', zone: 'Assembly Line A', helmet: true, safetyVest: true, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: true, complianceScore: 100, status: 'compliant' },
      { employeeName: 'Marcus Thompson', zone: 'Welding Bay', helmet: true, safetyVest: true, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: true, complianceScore: 100, status: 'compliant' },
      { employeeName: 'Priya Sharma', zone: 'Factory Floor', helmet: true, safetyVest: true, safetyGlasses: true, gloves: false, safetyBoots: true, earProtection: false, complianceScore: 67, status: 'partial' },
      { employeeName: 'Ryan O\'Brien', zone: 'CNC Shop', helmet: false, safetyVest: false, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: true, complianceScore: 67, status: 'non_compliant' },
      { employeeName: 'Lisa Brown', zone: 'Chemical Storage', helmet: true, safetyVest: true, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: false, complianceScore: 83, status: 'partial' },
      { employeeName: 'Aisha Patel', zone: 'Quality Lab', helmet: false, safetyVest: false, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: false, complianceScore: 50, status: 'non_compliant' },
      { employeeName: 'Kevin Murphy', zone: 'Maintenance Bay', helmet: true, safetyVest: true, safetyGlasses: true, gloves: true, safetyBoots: false, earProtection: true, complianceScore: 83, status: 'partial' },
      { employeeName: 'Fatima Al-Hassan', zone: 'Quality Lab', helmet: false, safetyVest: true, safetyGlasses: true, gloves: true, safetyBoots: true, earProtection: false, complianceScore: 67, status: 'partial' }
    ]);
    console.log('✅ PPE Detections seeded');

    // Hazard Zones (15)
    await HazardZone.bulkCreate([
      { name: 'Assembly Line A', type: 'caution', location: 'Building 1 - Floor 1', description: 'Primary assembly line with heavy machinery', maxOccupancy: 25, currentOccupancy: 18, requiredPPE: 'Helmet, Safety Glasses, Safety Boots, Ear Protection', status: 'active', riskLevel: 'medium' },
      { name: 'Welding Bay', type: 'danger', location: 'Building 1 - Floor 1 East', description: 'Arc welding and gas welding operations area', maxOccupancy: 10, currentOccupancy: 6, requiredPPE: 'Welding Helmet, Leather Gloves, Fire-Resistant Clothing, Safety Boots', status: 'active', riskLevel: 'high' },
      { name: 'Paint Shop', type: 'danger', location: 'Building 2 - Floor 1', description: 'Industrial painting with volatile chemicals', maxOccupancy: 8, currentOccupancy: 4, requiredPPE: 'Respirator, Chemical Gloves, Safety Glasses, Chemical Suit', status: 'active', riskLevel: 'high' },
      { name: 'Chemical Storage', type: 'restricted', location: 'Building 3', description: 'Hazardous chemical storage facility', maxOccupancy: 4, currentOccupancy: 1, requiredPPE: 'Full PPE, Respirator, Chemical Suit', status: 'active', riskLevel: 'critical' },
      { name: 'Warehouse', type: 'caution', location: 'Building 4', description: 'Storage and logistics area with forklift traffic', maxOccupancy: 30, currentOccupancy: 12, requiredPPE: 'Helmet, Safety Vest, Safety Boots', status: 'active', riskLevel: 'medium' },
      { name: 'CNC Machine Shop', type: 'caution', location: 'Building 1 - Floor 2', description: 'Computer numerical control machining area', maxOccupancy: 12, currentOccupancy: 8, requiredPPE: 'Safety Glasses, Ear Protection, Safety Boots, Gloves', status: 'active', riskLevel: 'medium' },
      { name: 'Electrical Panel Room', type: 'restricted', location: 'Building 1 - Basement', description: 'High voltage electrical distribution', maxOccupancy: 3, currentOccupancy: 0, requiredPPE: 'Arc Flash Suit, Insulated Gloves, Face Shield', status: 'active', riskLevel: 'critical' },
      { name: 'Shipping Dock', type: 'caution', location: 'Building 4 - North', description: 'Loading and unloading area for trucks', maxOccupancy: 15, currentOccupancy: 7, requiredPPE: 'Safety Vest, Helmet, Safety Boots', status: 'active', riskLevel: 'medium' },
      { name: 'Compressed Gas Storage', type: 'restricted', location: 'Building 3 - East', description: 'Pressurized gas cylinder storage', maxOccupancy: 4, currentOccupancy: 0, requiredPPE: 'Safety Glasses, Safety Boots, Gloves', status: 'active', riskLevel: 'high' },
      { name: 'Assembly Line B', type: 'caution', location: 'Building 1 - Floor 1 West', description: 'Secondary assembly line for smaller components', maxOccupancy: 20, currentOccupancy: 15, requiredPPE: 'Safety Glasses, Safety Boots, Ear Protection', status: 'active', riskLevel: 'medium' },
      { name: 'Quality Control Lab', type: 'safe', location: 'Building 2 - Floor 2', description: 'Testing and quality assurance laboratory', maxOccupancy: 15, currentOccupancy: 5, requiredPPE: 'Safety Glasses, Lab Coat, Gloves', status: 'active', riskLevel: 'low' },
      { name: 'Maintenance Workshop', type: 'caution', location: 'Building 1 - Ground', description: 'Equipment repair and maintenance area', maxOccupancy: 10, currentOccupancy: 4, requiredPPE: 'Helmet, Safety Glasses, Gloves, Safety Boots', status: 'active', riskLevel: 'medium' },
      { name: 'Furnace Room', type: 'danger', location: 'Building 5', description: 'Industrial furnace and heat treatment area', maxOccupancy: 6, currentOccupancy: 3, requiredPPE: 'Heat-Resistant Suit, Face Shield, Heat Gloves, Safety Boots', status: 'active', riskLevel: 'high' },
      { name: 'Roof Access Area', type: 'restricted', location: 'All Buildings - Roof', description: 'Rooftop maintenance access points', maxOccupancy: 3, currentOccupancy: 0, requiredPPE: 'Fall Harness, Helmet, Safety Boots', status: 'active', riskLevel: 'high' },
      { name: 'Break Room & Cafeteria', type: 'safe', location: 'Building 6', description: 'Employee rest and dining area', maxOccupancy: 50, currentOccupancy: 22, requiredPPE: 'None', status: 'active', riskLevel: 'low' }
    ]);
    console.log('✅ Hazard Zones seeded');

    // Incidents (15)
    await Incident.bulkCreate([
      { incidentNumber: 'INC-2024-001', title: 'Forklift near-miss in Warehouse', description: 'A forklift nearly collided with a pedestrian worker near aisle 7. The worker was not in the designated walkway.', type: 'near_miss', severity: 'moderate', location: 'Warehouse - Aisle 7', reportedBy: 'Tommy Nguyen', assignedTo: 'Priya Sharma', status: 'investigating', date: '2024-01-15' },
      { incidentNumber: 'INC-2024-002', title: 'Minor burn in Welding Bay', description: 'Welder received minor burn on forearm due to sparks penetrating worn sleeve cuff.', type: 'injury', severity: 'minor', location: 'Welding Bay - Station 3', reportedBy: 'Maria Garcia', assignedTo: 'Priya Sharma', status: 'resolved', date: '2024-01-22', rootCause: 'Worn PPE not replaced', correctiveAction: 'PPE inspection schedule implemented' },
      { incidentNumber: 'INC-2024-003', title: 'Chemical spill in Paint Shop', description: 'Approximately 2 gallons of paint thinner spilled from damaged container during transfer.', type: 'chemical_spill', severity: 'moderate', location: 'Paint Shop', reportedBy: 'James Wilson', assignedTo: 'Sarah Johnson', status: 'resolved', date: '2024-02-03', rootCause: 'Defective container', correctiveAction: 'Container inspection protocol updated' },
      { incidentNumber: 'INC-2024-004', title: 'Electrical panel arc flash', description: 'Small arc flash occurred during panel maintenance. No injuries due to proper PPE use.', type: 'near_miss', severity: 'major', location: 'Electrical Panel Room', reportedBy: 'David Kim', assignedTo: 'Priya Sharma', status: 'closed', date: '2024-02-10', rootCause: 'Lockout/tagout procedure not fully followed', correctiveAction: 'LOTO refresher training conducted' },
      { incidentNumber: 'INC-2024-005', title: 'Slip and fall on wet floor', description: 'Worker slipped on wet floor near wash station, resulting in sprained ankle.', type: 'injury', severity: 'minor', location: 'Assembly Line A - Wash Station', reportedBy: 'Robert Chen', assignedTo: 'Sarah Johnson', status: 'closed', date: '2024-02-18', rootCause: 'Inadequate floor drainage', correctiveAction: 'Non-slip mats installed and drainage improved' },
      { incidentNumber: 'INC-2024-006', title: 'Crane cable fraying detected', description: 'During pre-shift inspection, overhead crane cable showed signs of fraying at connection point.', type: 'near_miss', severity: 'major', location: 'Assembly Line B', reportedBy: 'Sarah Johnson', assignedTo: 'David Kim', status: 'resolved', date: '2024-03-01', rootCause: 'Cable age and wear', correctiveAction: 'Cable replaced, inspection frequency increased' },
      { incidentNumber: 'INC-2024-007', title: 'Noise exposure incident', description: 'Three workers reported ringing in ears after CNC machine malfunction caused excessive noise.', type: 'injury', severity: 'moderate', location: 'CNC Machine Shop', reportedBy: 'Ryan O\'Brien', assignedTo: 'Priya Sharma', status: 'investigating', date: '2024-03-08' },
      { incidentNumber: 'INC-2024-008', title: 'Fire in waste bin', description: 'Small fire erupted in metal waste bin near welding area. Extinguished immediately.', type: 'fire', severity: 'moderate', location: 'Welding Bay', reportedBy: 'Marcus Thompson', assignedTo: 'Sarah Johnson', status: 'resolved', date: '2024-03-12', rootCause: 'Hot slag in waste bin with combustible material', correctiveAction: 'Designated hot work waste bins installed' },
      { incidentNumber: 'INC-2024-009', title: 'Loading dock collision', description: 'Delivery truck backed into dock bumper causing minor property damage to dock plate.', type: 'property_damage', severity: 'minor', location: 'Shipping Dock - Bay 3', reportedBy: 'Carlos Rivera', status: 'open', date: '2024-03-15' },
      { incidentNumber: 'INC-2024-010', title: 'Gas leak detected', description: 'Hydrogen gas leak detected by sensors in compressed gas storage area.', type: 'environmental', severity: 'critical', location: 'Compressed Gas Storage', reportedBy: 'Priya Sharma', assignedTo: 'David Kim', status: 'resolved', date: '2024-03-20', rootCause: 'Faulty valve seal', correctiveAction: 'All valves inspected and replaced' },
      { incidentNumber: 'INC-2024-011', title: 'Repetitive strain complaint', description: 'Multiple workers on Assembly Line A reported wrist pain from repetitive motions.', type: 'injury', severity: 'minor', location: 'Assembly Line A', reportedBy: 'Emily Zhang', assignedTo: 'Priya Sharma', status: 'investigating', date: '2024-03-25' },
      { incidentNumber: 'INC-2024-012', title: 'Falling object near-miss', description: 'Unsecured tool fell from elevated platform, narrowly missing worker below.', type: 'near_miss', severity: 'major', location: 'Maintenance Workshop', reportedBy: 'Kevin Murphy', assignedTo: 'Sarah Johnson', status: 'open', date: '2024-04-01' },
      { incidentNumber: 'INC-2024-013', title: 'Eye irritation from fumes', description: 'Worker experienced eye irritation from paint fumes due to ventilation malfunction.', type: 'injury', severity: 'minor', location: 'Paint Shop', reportedBy: 'James Wilson', assignedTo: 'David Kim', status: 'resolved', date: '2024-04-05', rootCause: 'Ventilation fan failure', correctiveAction: 'Ventilation system repaired and backup fan installed' },
      { incidentNumber: 'INC-2024-014', title: 'Unauthorized zone entry', description: 'Visitor entered restricted chemical storage area without proper escort or PPE.', type: 'near_miss', severity: 'moderate', location: 'Chemical Storage', reportedBy: 'Lisa Brown', assignedTo: 'Priya Sharma', status: 'closed', date: '2024-04-10', rootCause: 'Inadequate access control', correctiveAction: 'Electronic access control system installed' },
      { incidentNumber: 'INC-2024-015', title: 'Heat stress incident', description: 'Worker experienced heat exhaustion near furnace area during peak summer temperatures.', type: 'injury', severity: 'moderate', location: 'Furnace Room', reportedBy: 'Priya Sharma', assignedTo: 'Sarah Johnson', status: 'open', date: '2024-04-15' }
    ]);
    console.log('✅ Incidents seeded');

    // Safety Training (15)
    await SafetyTraining.bulkCreate([
      { title: 'OSHA 10-Hour General Industry', description: 'Comprehensive OSHA safety and health training covering general industry standards', type: 'osha_required', instructor: 'Priya Sharma', duration: '10 hours', maxParticipants: 30, currentParticipants: 25, scheduledDate: '2024-02-15', status: 'completed', location: 'Training Room A', certificationValid: '5 years' },
      { title: 'Forklift Operation Safety', description: 'Safe forklift operation including pre-use inspection and load handling', type: 'equipment', instructor: 'Carlos Rivera', duration: '4 hours', maxParticipants: 15, currentParticipants: 12, scheduledDate: '2024-02-20', status: 'completed', location: 'Warehouse', certificationValid: '3 years' },
      { title: 'Fire Extinguisher Training', description: 'Proper use of fire extinguishers including PASS technique', type: 'emergency', instructor: 'Priya Sharma', duration: '2 hours', maxParticipants: 40, currentParticipants: 35, scheduledDate: '2024-03-01', status: 'completed', location: 'Parking Lot B', certificationValid: '1 year' },
      { title: 'Hazardous Materials Handling', description: 'Safe handling, storage, and disposal of hazardous materials', type: 'hazmat', instructor: 'Lisa Brown', duration: '8 hours', maxParticipants: 20, currentParticipants: 15, scheduledDate: '2024-03-10', status: 'completed', location: 'Training Room B', certificationValid: '2 years' },
      { title: 'PPE Selection and Use', description: 'Proper selection, fitting, use, and maintenance of PPE', type: 'ppe', instructor: 'Priya Sharma', duration: '3 hours', maxParticipants: 30, currentParticipants: 28, scheduledDate: '2024-03-15', status: 'completed', location: 'Training Room A', certificationValid: '1 year' },
      { title: 'Lockout/Tagout Procedures', description: 'Energy isolation procedures for equipment maintenance', type: 'equipment', instructor: 'David Kim', duration: '4 hours', maxParticipants: 20, currentParticipants: 18, scheduledDate: '2024-03-20', status: 'completed', location: 'Maintenance Workshop', certificationValid: '1 year' },
      { title: 'Confined Space Entry', description: 'Safe entry procedures for permit-required confined spaces', type: 'osha_required', instructor: 'Priya Sharma', duration: '6 hours', maxParticipants: 15, currentParticipants: 10, scheduledDate: '2024-04-05', status: 'completed', location: 'Training Room B', certificationValid: '1 year' },
      { title: 'Crane and Hoist Safety', description: 'Safe operation of overhead cranes and hoists', type: 'equipment', instructor: 'Sarah Johnson', duration: '4 hours', maxParticipants: 12, currentParticipants: 0, scheduledDate: '2024-05-10', status: 'scheduled', location: 'Assembly Line B', certificationValid: '2 years' },
      { title: 'Emergency Evacuation Drill', description: 'Facility-wide emergency evacuation procedures and drill', type: 'emergency', instructor: 'Priya Sharma', duration: '2 hours', maxParticipants: 100, currentParticipants: 0, scheduledDate: '2024-05-15', status: 'scheduled', location: 'All Buildings', certificationValid: 'Annual' },
      { title: 'Respiratory Protection', description: 'Proper use and fit testing of respiratory protection equipment', type: 'ppe', instructor: 'Lisa Brown', duration: '3 hours', maxParticipants: 25, currentParticipants: 22, scheduledDate: '2024-04-01', status: 'completed', location: 'Training Room A', certificationValid: '1 year' },
      { title: 'Electrical Safety Awareness', description: 'Electrical hazard recognition and safe work practices', type: 'general', instructor: 'David Kim', duration: '3 hours', maxParticipants: 30, currentParticipants: 0, scheduledDate: '2024-05-20', status: 'scheduled', location: 'Training Room A', certificationValid: '2 years' },
      { title: 'Fall Protection Training', description: 'Fall prevention and protection systems for elevated work', type: 'osha_required', instructor: 'Priya Sharma', duration: '4 hours', maxParticipants: 20, currentParticipants: 15, scheduledDate: '2024-04-10', status: 'completed', location: 'Training Room B', certificationValid: '1 year' },
      { title: 'Chemical Spill Response', description: 'Emergency response procedures for chemical spills', type: 'hazmat', instructor: 'Lisa Brown', duration: '4 hours', maxParticipants: 20, currentParticipants: 0, scheduledDate: '2024-06-01', status: 'scheduled', location: 'Chemical Storage Area', certificationValid: '1 year' },
      { title: 'Ergonomics and Manual Handling', description: 'Proper lifting techniques and workstation ergonomics', type: 'general', instructor: 'Sarah Johnson', duration: '2 hours', maxParticipants: 40, currentParticipants: 30, scheduledDate: '2024-04-15', status: 'completed', location: 'Training Room A', certificationValid: '2 years' },
      { title: 'Welding Safety Certification', description: 'Safe welding practices including fire prevention and ventilation', type: 'equipment', instructor: 'Marcus Thompson', duration: '6 hours', maxParticipants: 10, currentParticipants: 8, scheduledDate: '2024-04-20', status: 'in_progress', location: 'Welding Bay', certificationValid: '1 year' }
    ]);
    console.log('✅ Safety Training seeded');

    // Equipment Inspections (15)
    await EquipmentInspection.bulkCreate([
      { equipmentName: 'Overhead Crane #1', equipmentId: 'CR-001', type: 'monthly', inspector: 'David Kim', inspectionDate: '2024-04-01', status: 'passed', condition: 'good', notes: 'All systems functioning normally', nextInspectionDate: '2024-05-01' },
      { equipmentName: 'Forklift Toyota 8FGU25', equipmentId: 'FK-001', type: 'daily', inspector: 'Tommy Nguyen', inspectionDate: '2024-04-15', status: 'passed', condition: 'excellent', notes: 'Pre-shift check complete, no issues', nextInspectionDate: '2024-04-16' },
      { equipmentName: 'CNC Milling Machine #3', equipmentId: 'CNC-003', type: 'weekly', inspector: 'Ryan O\'Brien', inspectionDate: '2024-04-14', status: 'needs_repair', condition: 'fair', notes: 'Coolant system showing reduced flow. Needs pump replacement.', nextInspectionDate: '2024-04-21' },
      { equipmentName: 'Welding Machine Lincoln 350MP', equipmentId: 'WD-002', type: 'weekly', inspector: 'Marcus Thompson', inspectionDate: '2024-04-13', status: 'passed', condition: 'good', notes: 'Wire feed mechanism cleaned and calibrated', nextInspectionDate: '2024-04-20' },
      { equipmentName: 'Air Compressor Ingersoll Rand', equipmentId: 'AC-001', type: 'monthly', inspector: 'David Kim', inspectionDate: '2024-04-01', status: 'passed', condition: 'good', notes: 'Pressure holding steady, filters clean', nextInspectionDate: '2024-05-01' },
      { equipmentName: 'Paint Spray Booth #1', equipmentId: 'PB-001', type: 'weekly', inspector: 'James Wilson', inspectionDate: '2024-04-12', status: 'failed', condition: 'poor', notes: 'Ventilation filters clogged, exhaust fan vibrating. Immediate repair needed.', nextInspectionDate: '2024-04-13' },
      { equipmentName: 'Conveyor Belt Assembly Line A', equipmentId: 'CV-001', type: 'monthly', inspector: 'Kevin Murphy', inspectionDate: '2024-04-05', status: 'passed', condition: 'good', notes: 'Belt tension adjusted, rollers lubricated', nextInspectionDate: '2024-05-05' },
      { equipmentName: 'Emergency Eyewash Station #3', equipmentId: 'EW-003', type: 'weekly', inspector: 'Priya Sharma', inspectionDate: '2024-04-14', status: 'passed', condition: 'excellent', notes: 'Water flow and temperature within spec', nextInspectionDate: '2024-04-21' },
      { equipmentName: 'Fire Suppression System', equipmentId: 'FS-001', type: 'annual', inspector: 'External Vendor', inspectionDate: '2024-01-15', status: 'passed', condition: 'excellent', notes: 'Annual inspection complete. All heads, valves, and alarms functional.', nextInspectionDate: '2025-01-15' },
      { equipmentName: 'Hydraulic Press #2', equipmentId: 'HP-002', type: 'monthly', inspector: 'Kevin Murphy', inspectionDate: '2024-04-03', status: 'passed', condition: 'fair', notes: 'Minor hydraulic fluid seep noted. Monitor closely.', nextInspectionDate: '2024-05-03' },
      { equipmentName: 'Industrial Furnace', equipmentId: 'FN-001', type: 'monthly', inspector: 'David Kim', inspectionDate: '2024-04-02', status: 'passed', condition: 'good', notes: 'Temperature controls calibrated, refractory lining intact', nextInspectionDate: '2024-05-02' },
      { equipmentName: 'Forklift Hyster H50FT', equipmentId: 'FK-002', type: 'daily', inspector: 'Carlos Rivera', inspectionDate: '2024-04-15', status: 'out_of_service', condition: 'poor', notes: 'Brake system failure detected. Taken out of service pending repair.', nextInspectionDate: '2024-04-16' },
      { equipmentName: 'Dust Collection System', equipmentId: 'DC-001', type: 'weekly', inspector: 'James Wilson', inspectionDate: '2024-04-11', status: 'passed', condition: 'good', notes: 'Filters cleaned, airflow within parameters', nextInspectionDate: '2024-04-18' },
      { equipmentName: 'Overhead Crane #2', equipmentId: 'CR-002', type: 'monthly', inspector: 'David Kim', inspectionDate: '2024-04-01', status: 'needs_repair', condition: 'fair', notes: 'Limit switch showing intermittent fault. Schedule repair.', nextInspectionDate: '2024-04-15' },
      { equipmentName: 'Emergency Generator', equipmentId: 'GN-001', type: 'monthly', inspector: 'David Kim', inspectionDate: '2024-04-01', status: 'passed', condition: 'excellent', notes: 'Load test passed, fuel tank full, auto-transfer switch verified', nextInspectionDate: '2024-05-01' }
    ]);
    console.log('✅ Equipment Inspections seeded');

    // Safety Audits (15)
    await SafetyAudit.bulkCreate([
      { auditNumber: 'AUD-2024-001', title: 'Q1 Assembly Line A Safety Audit', auditor: 'Priya Sharma', department: 'Assembly Line A', auditDate: '2024-01-30', score: 87, maxScore: 100, status: 'completed', findings: 'Minor housekeeping issues, one blocked emergency exit', recommendations: 'Implement daily 5S audit, clear exit path immediately' },
      { auditNumber: 'AUD-2024-002', title: 'Welding Bay Monthly Audit', auditor: 'Priya Sharma', department: 'Welding Bay', auditDate: '2024-02-15', score: 92, maxScore: 100, status: 'completed', findings: 'Excellent PPE compliance, fire watch procedures followed', recommendations: 'Continue current practices, update fire extinguisher locations' },
      { auditNumber: 'AUD-2024-003', title: 'Chemical Storage Quarterly Audit', auditor: 'External Auditor', department: 'Chemical Storage', auditDate: '2024-03-01', score: 78, maxScore: 100, status: 'follow_up', findings: 'SDS sheets not current for 3 chemicals, secondary containment crack detected', recommendations: 'Update SDS immediately, repair containment berm' },
      { auditNumber: 'AUD-2024-004', title: 'Warehouse Safety Inspection', auditor: 'Sarah Johnson', department: 'Warehouse', auditDate: '2024-03-10', score: 85, maxScore: 100, status: 'completed', findings: 'Racking inspection current, floor markings faded in 2 areas', recommendations: 'Repaint floor markings, add reflective tape to racking' },
      { auditNumber: 'AUD-2024-005', title: 'Electrical Safety Compliance Audit', auditor: 'External Auditor', department: 'Maintenance', auditDate: '2024-03-15', score: 95, maxScore: 100, status: 'completed', findings: 'Arc flash labels current, LOTO program excellent', recommendations: 'Update single-line diagrams for new panel additions' },
      { auditNumber: 'AUD-2024-006', title: 'Paint Shop Ventilation Audit', auditor: 'Priya Sharma', department: 'Paint Shop', auditDate: '2024-03-20', score: 72, maxScore: 100, status: 'follow_up', findings: 'Ventilation below OSHA requirements in 2 booths, respirator fit test records incomplete', recommendations: 'Immediate ventilation repair, complete all fit testing' },
      { auditNumber: 'AUD-2024-007', title: 'Emergency Preparedness Audit', auditor: 'Priya Sharma', department: 'All Departments', auditDate: '2024-03-25', score: 88, maxScore: 100, status: 'completed', findings: 'Evacuation maps current, assembly points clearly marked, 2 exit signs burned out', recommendations: 'Replace exit signs, schedule quarterly drill' },
      { auditNumber: 'AUD-2024-008', title: 'CNC Shop Machine Guard Audit', auditor: 'Sarah Johnson', department: 'CNC Shop', auditDate: '2024-04-01', score: 82, maxScore: 100, status: 'completed', findings: 'One machine guard bypassed with zip tie, light curtain on CNC-003 needs calibration', recommendations: 'Discipline for guard bypass, calibrate light curtain immediately' },
      { auditNumber: 'AUD-2024-009', title: 'PPE Program Annual Review', auditor: 'External Auditor', department: 'All Departments', auditDate: '2024-04-05', score: 90, maxScore: 100, status: 'completed', findings: 'PPE hazard assessment current, good training records, some expired certifications', recommendations: 'Implement automated certification tracking' },
      { auditNumber: 'AUD-2024-010', title: 'Shipping Dock Safety Audit', auditor: 'Sarah Johnson', department: 'Shipping', auditDate: '2024-04-08', score: 80, maxScore: 100, status: 'completed', findings: 'Dock locks functional, chock usage inconsistent, pedestrian barriers need repair', recommendations: 'Enforce chock policy, replace damaged barriers' },
      { auditNumber: 'AUD-2024-011', title: 'Furnace Room Heat Stress Audit', auditor: 'Priya Sharma', department: 'Furnace Room', auditDate: '2024-04-10', score: 75, maxScore: 100, status: 'follow_up', findings: 'WBGT monitoring inconsistent, hydration station needs maintenance', recommendations: 'Install permanent WBGT monitor, repair water cooler' },
      { auditNumber: 'AUD-2024-012', title: 'Noise Exposure Assessment', auditor: 'External Auditor', department: 'All Departments', auditDate: '2024-04-12', score: 83, maxScore: 100, status: 'completed', findings: '3 areas exceed 85 dB TWA, hearing protection usage at 85%', recommendations: 'Engineering controls for high-noise areas, enforce hearing protection' },
      { auditNumber: 'AUD-2024-013', title: 'Q2 Assembly Line B Audit', auditor: 'Priya Sharma', department: 'Assembly Line B', auditDate: '2024-04-15', score: 0, maxScore: 100, status: 'scheduled', findings: null, recommendations: null },
      { auditNumber: 'AUD-2024-014', title: 'Compressed Gas Storage Audit', auditor: 'Priya Sharma', department: 'Chemical Storage', auditDate: '2024-04-20', score: 0, maxScore: 100, status: 'scheduled', findings: null, recommendations: null },
      { auditNumber: 'AUD-2024-015', title: 'Annual OSHA Compliance Review', auditor: 'External Auditor', department: 'All Departments', auditDate: '2024-05-01', score: 0, maxScore: 100, status: 'scheduled', findings: null, recommendations: null }
    ]);
    console.log('✅ Safety Audits seeded');

    // Emergency Contacts (15)
    await EmergencyContact.bulkCreate([
      { name: 'Priya Sharma', role: 'Chief Safety Officer', department: 'Safety', phone: '555-0112', alternatePhone: '555-9901', email: 'psharma@factory.com', type: 'internal', available24x7: true, priority: 1 },
      { name: 'Sarah Johnson', role: 'Floor Supervisor', department: 'Assembly', phone: '555-0106', alternatePhone: '555-9902', email: 'sjohnson@factory.com', type: 'internal', available24x7: false, priority: 2 },
      { name: 'David Kim', role: 'Lead Electrician', department: 'Maintenance', phone: '555-0107', alternatePhone: '555-9903', email: 'dkim@factory.com', type: 'internal', available24x7: true, priority: 3 },
      { name: 'Dr. Amanda Foster', role: 'Company Physician', department: 'Medical', phone: '555-8001', alternatePhone: '555-8002', email: 'afoster@healthcorp.com', type: 'medical', available24x7: true, priority: 1 },
      { name: 'City Fire Department', role: 'Fire Emergency', department: 'External', phone: '911', alternatePhone: '555-7001', email: 'dispatch@cityfire.gov', type: 'fire', available24x7: true, priority: 1 },
      { name: 'HazMat Response Team', role: 'Chemical Emergency', department: 'External', phone: '555-7100', alternatePhone: '800-424-8802', email: 'response@hazmat.com', type: 'hazmat', available24x7: true, priority: 1 },
      { name: 'Lisa Brown', role: 'Chemical Safety Specialist', department: 'Chemical Storage', phone: '555-0108', alternatePhone: '555-9904', email: 'lbrown@factory.com', type: 'internal', available24x7: false, priority: 4 },
      { name: 'Poison Control Center', role: 'Toxicology Hotline', department: 'External', phone: '800-222-1222', email: 'info@poisoncontrol.org', type: 'medical', available24x7: true, priority: 2 },
      { name: 'Marcus Thompson', role: 'Fire Warden - Welding', department: 'Welding Bay', phone: '555-0111', alternatePhone: '555-9905', email: 'mthompson@factory.com', type: 'internal', available24x7: false, priority: 5 },
      { name: 'Environmental Protection Agency', role: 'Environmental Emergency', department: 'External', phone: '800-424-9346', email: 'emergency@epa.gov', type: 'external', available24x7: true, priority: 2 },
      { name: 'John Admin', role: 'Plant Manager', department: 'Management', phone: '555-0001', alternatePhone: '555-9900', email: 'admin@factory.com', type: 'internal', available24x7: true, priority: 1 },
      { name: 'OSHA Area Office', role: 'Regulatory Authority', department: 'External', phone: '555-6001', email: 'area-office@osha.gov', type: 'external', available24x7: false, priority: 3 },
      { name: 'Security Command Center', role: 'Facility Security', department: 'Security', phone: '555-5001', alternatePhone: '555-5002', email: 'security@factory.com', type: 'internal', available24x7: true, priority: 2 },
      { name: 'Dr. Robert Chang', role: 'Occupational Health Specialist', department: 'Medical', phone: '555-8003', email: 'rchang@healthcorp.com', type: 'medical', available24x7: false, priority: 3 },
      { name: 'Insurance Emergency Line', role: 'Workers Comp Claims', department: 'External', phone: '800-555-0199', email: 'claims@insuranceco.com', type: 'external', available24x7: true, priority: 4 }
    ]);
    console.log('✅ Emergency Contacts seeded');

    // PPE Inventory (15)
    await PPEInventory.bulkCreate([
      { itemName: 'Hard Hat - White (Standard)', category: 'head', brand: '3M', quantity: 120, minQuantity: 30, unitCost: 25.99, location: 'PPE Storage Room A', expirationDate: '2029-01-15', status: 'in_stock', lastRestocked: '2024-03-01', supplier: 'SafetyFirst Supplies' },
      { itemName: 'Safety Glasses - Clear Lens', category: 'eye', brand: 'Honeywell', quantity: 200, minQuantity: 50, unitCost: 12.50, location: 'PPE Storage Room A', expirationDate: null, status: 'in_stock', lastRestocked: '2024-03-15', supplier: 'SafetyFirst Supplies' },
      { itemName: 'Welding Helmet - Auto-Darkening', category: 'eye', brand: 'Lincoln Electric', quantity: 15, minQuantity: 5, unitCost: 189.99, location: 'Welding Bay Storage', expirationDate: null, status: 'in_stock', lastRestocked: '2024-02-01', supplier: 'WeldTech Corp' },
      { itemName: 'Nitrile Gloves - Large (Box of 100)', category: 'hand', brand: 'Ansell', quantity: 8, minQuantity: 15, unitCost: 18.99, location: 'PPE Storage Room A', expirationDate: '2026-06-30', status: 'low_stock', lastRestocked: '2024-01-20', supplier: 'SafetyFirst Supplies' },
      { itemName: 'Steel-Toe Boots - Various Sizes', category: 'foot', brand: 'Red Wing', quantity: 45, minQuantity: 20, unitCost: 165.00, location: 'PPE Storage Room B', expirationDate: null, status: 'in_stock', lastRestocked: '2024-03-10', supplier: 'Industrial Footwear Co' },
      { itemName: 'High-Visibility Safety Vest', category: 'body', brand: '3M', quantity: 75, minQuantity: 25, unitCost: 15.99, location: 'PPE Storage Room A', expirationDate: null, status: 'in_stock', lastRestocked: '2024-03-01', supplier: 'SafetyFirst Supplies' },
      { itemName: 'Ear Plugs - Disposable (Box of 200)', category: 'ear', brand: '3M', quantity: 5, minQuantity: 10, unitCost: 45.00, location: 'PPE Storage Room A', expirationDate: '2027-12-31', status: 'low_stock', lastRestocked: '2024-01-15', supplier: 'SafetyFirst Supplies' },
      { itemName: 'Earmuff - Over-the-Head', category: 'ear', brand: 'Honeywell', quantity: 35, minQuantity: 15, unitCost: 28.50, location: 'PPE Storage Room A', expirationDate: null, status: 'in_stock', lastRestocked: '2024-02-20', supplier: 'SafetyFirst Supplies' },
      { itemName: 'Half-Face Respirator', category: 'respiratory', brand: '3M', quantity: 25, minQuantity: 10, unitCost: 35.00, location: 'PPE Storage Room B', expirationDate: null, status: 'in_stock', lastRestocked: '2024-03-05', supplier: 'SafetyFirst Supplies' },
      { itemName: 'P100 Respirator Filters (Pair)', category: 'respiratory', brand: '3M', quantity: 3, minQuantity: 20, unitCost: 12.99, location: 'PPE Storage Room B', expirationDate: '2026-03-15', status: 'low_stock', lastRestocked: '2024-01-10', supplier: 'SafetyFirst Supplies' },
      { itemName: 'Chemical Splash Goggles', category: 'eye', brand: 'Honeywell', quantity: 30, minQuantity: 10, unitCost: 22.00, location: 'Chemical Storage', expirationDate: null, status: 'in_stock', lastRestocked: '2024-02-28', supplier: 'SafetyFirst Supplies' },
      { itemName: 'Leather Welding Gloves', category: 'hand', brand: 'Tillman', quantity: 20, minQuantity: 10, unitCost: 24.50, location: 'Welding Bay Storage', expirationDate: null, status: 'in_stock', lastRestocked: '2024-03-01', supplier: 'WeldTech Corp' },
      { itemName: 'Chemical Resistant Suit', category: 'body', brand: 'DuPont Tychem', quantity: 0, minQuantity: 5, unitCost: 85.00, location: 'Chemical Storage', expirationDate: '2025-12-31', status: 'out_of_stock', lastRestocked: '2023-06-15', supplier: 'ChemSafe Industries' },
      { itemName: 'Fall Protection Harness', category: 'body', brand: '3M DBI-SALA', quantity: 12, minQuantity: 5, unitCost: 210.00, location: 'PPE Storage Room B', expirationDate: null, status: 'in_stock', lastRestocked: '2024-01-30', supplier: 'Heights Safety Inc' },
      { itemName: 'Arc Flash Face Shield', category: 'eye', brand: 'Honeywell', quantity: 8, minQuantity: 3, unitCost: 75.00, location: 'Electrical Panel Room', expirationDate: null, status: 'in_stock', lastRestocked: '2024-02-15', supplier: 'ElecSafe Products' }
    ]);
    console.log('✅ PPE Inventory seeded');

    // Compliance Reports (15)
    await ComplianceReport.bulkCreate([
      { reportNumber: 'CR-2024-001', title: 'January Monthly Safety Report', type: 'monthly', period: 'January 2024', preparedBy: 'Priya Sharma', status: 'approved', totalIncidents: 2, totalTrainings: 1, complianceRate: 92.5, summary: 'Two incidents reported. Both minor with no lost time. One OSHA training completed.', submissionDate: '2024-02-05' },
      { reportNumber: 'CR-2024-002', title: 'February Monthly Safety Report', type: 'monthly', period: 'February 2024', preparedBy: 'Priya Sharma', status: 'approved', totalIncidents: 3, totalTrainings: 3, complianceRate: 89.0, summary: 'Three incidents including one major near-miss. Three training sessions completed.', submissionDate: '2024-03-05' },
      { reportNumber: 'CR-2024-003', title: 'March Monthly Safety Report', type: 'monthly', period: 'March 2024', preparedBy: 'Priya Sharma', status: 'approved', totalIncidents: 5, totalTrainings: 4, complianceRate: 85.5, summary: 'Elevated incident count. Gas leak was critical. Four trainings completed.', submissionDate: '2024-04-05' },
      { reportNumber: 'CR-2024-004', title: 'Q1 2024 Quarterly Report', type: 'quarterly', period: 'Q1 2024', preparedBy: 'Priya Sharma', status: 'approved', totalIncidents: 10, totalTrainings: 8, complianceRate: 88.7, summary: 'Q1 saw 10 incidents with no fatalities. 8 training programs delivered. Overall compliance trending down.', submissionDate: '2024-04-10' },
      { reportNumber: 'CR-2024-005', title: 'OSHA 300 Log - Q1 2024', type: 'osha_300', period: 'Q1 2024', preparedBy: 'Priya Sharma', status: 'submitted', totalIncidents: 4, totalTrainings: 0, complianceRate: 95.0, summary: '4 recordable injuries/illnesses logged. DART rate: 2.1. TRIR: 3.2.', submissionDate: '2024-04-15' },
      { reportNumber: 'CR-2024-006', title: 'April Monthly Safety Report', type: 'monthly', period: 'April 2024', preparedBy: 'Priya Sharma', status: 'review', totalIncidents: 5, totalTrainings: 3, complianceRate: 82.0, summary: 'Five incidents reported including unauthorized zone entry. Three trainings ongoing.', submissionDate: null },
      { reportNumber: 'CR-2024-007', title: 'PPE Compliance Annual Report', type: 'annual', period: '2023', preparedBy: 'Priya Sharma', status: 'approved', totalIncidents: 0, totalTrainings: 24, complianceRate: 91.3, summary: 'Annual PPE compliance at 91.3%. 24 PPE-related trainings conducted. 12 violations documented.', submissionDate: '2024-01-30' },
      { reportNumber: 'CR-2024-008', title: 'OSHA 301 - Incident Detail (Burn)', type: 'osha_301', period: 'January 2024', preparedBy: 'Priya Sharma', status: 'submitted', totalIncidents: 1, totalTrainings: 0, complianceRate: 100, summary: 'Detailed report for welding burn incident INC-2024-002.', submissionDate: '2024-02-01' },
      { reportNumber: 'CR-2024-009', title: 'OSHA 300A Summary - 2023', type: 'osha_300a', period: '2023', preparedBy: 'Priya Sharma', status: 'approved', totalIncidents: 18, totalTrainings: 36, complianceRate: 90.2, summary: '2023 annual summary: 18 recordable cases, 36 trainings, 15,200 employee hours. Posted Feb 1.', submissionDate: '2024-02-01' },
      { reportNumber: 'CR-2024-010', title: 'Hazmat Compliance Report', type: 'quarterly', period: 'Q1 2024', preparedBy: 'Lisa Brown', status: 'approved', totalIncidents: 2, totalTrainings: 2, complianceRate: 88.0, summary: 'Two chemical-related incidents. Hazmat training completed for 15 employees. SDS updates needed.', submissionDate: '2024-04-08' },
      { reportNumber: 'CR-2024-011', title: 'Noise Exposure Monitoring Report', type: 'annual', period: '2023', preparedBy: 'External Auditor', status: 'approved', totalIncidents: 3, totalTrainings: 2, complianceRate: 85.0, summary: 'Annual noise monitoring: 3 areas exceed PEL. Hearing conservation program updates recommended.', submissionDate: '2024-01-20' },
      { reportNumber: 'CR-2024-012', title: 'Machine Guarding Compliance', type: 'quarterly', period: 'Q1 2024', preparedBy: 'Sarah Johnson', status: 'approved', totalIncidents: 1, totalTrainings: 1, complianceRate: 94.0, summary: 'One guard bypass incident. All machines inspected. 94% compliance rate.', submissionDate: '2024-04-12' },
      { reportNumber: 'CR-2024-013', title: 'Emergency Response Readiness', type: 'quarterly', period: 'Q1 2024', preparedBy: 'Priya Sharma', status: 'approved', totalIncidents: 0, totalTrainings: 2, complianceRate: 96.0, summary: 'Emergency systems tested. Evacuation drill completed. Two emergency trainings held.', submissionDate: '2024-04-05' },
      { reportNumber: 'CR-2024-014', title: 'May Monthly Safety Report', type: 'monthly', period: 'May 2024', preparedBy: 'Priya Sharma', status: 'draft', totalIncidents: 0, totalTrainings: 4, complianceRate: 0, summary: 'Report in preparation. Four trainings scheduled.', submissionDate: null },
      { reportNumber: 'CR-2024-015', title: 'Q2 2024 Quarterly Report', type: 'quarterly', period: 'Q2 2024', preparedBy: 'Priya Sharma', status: 'draft', totalIncidents: 0, totalTrainings: 0, complianceRate: 0, summary: 'Quarterly report template prepared for Q2 data collection.', submissionDate: null }
    ]);
    console.log('✅ Compliance Reports seeded');

    // Shift Schedules (15)
    await ShiftSchedule.bulkCreate([
      { employeeName: 'Robert Chen', department: 'Assembly Line A', shift: 'morning', date: '2024-04-15', startTime: '06:00', endTime: '14:00', zone: 'Assembly Line A', status: 'completed' },
      { employeeName: 'Maria Garcia', department: 'Welding Bay', shift: 'morning', date: '2024-04-15', startTime: '06:00', endTime: '14:00', zone: 'Welding Bay', status: 'completed' },
      { employeeName: 'James Wilson', department: 'Paint Shop', shift: 'afternoon', date: '2024-04-15', startTime: '14:00', endTime: '22:00', zone: 'Paint Shop', status: 'completed' },
      { employeeName: 'Tommy Nguyen', department: 'Warehouse', shift: 'night', date: '2024-04-15', startTime: '22:00', endTime: '06:00', zone: 'Warehouse', status: 'completed' },
      { employeeName: 'Sarah Johnson', department: 'Assembly Line B', shift: 'morning', date: '2024-04-16', startTime: '06:00', endTime: '14:00', zone: 'Assembly Line B', status: 'scheduled' },
      { employeeName: 'David Kim', department: 'Maintenance', shift: 'afternoon', date: '2024-04-16', startTime: '14:00', endTime: '22:00', zone: 'Maintenance Workshop', status: 'scheduled' },
      { employeeName: 'Carlos Rivera', department: 'Shipping', shift: 'afternoon', date: '2024-04-16', startTime: '14:00', endTime: '22:00', zone: 'Shipping Dock', status: 'scheduled' },
      { employeeName: 'Emily Zhang', department: 'Assembly Line A', shift: 'night', date: '2024-04-16', startTime: '22:00', endTime: '06:00', zone: 'Assembly Line A', status: 'scheduled' },
      { employeeName: 'Marcus Thompson', department: 'Welding Bay', shift: 'morning', date: '2024-04-16', startTime: '06:00', endTime: '14:00', zone: 'Welding Bay', status: 'scheduled' },
      { employeeName: 'Ryan O\'Brien', department: 'CNC Shop', shift: 'afternoon', date: '2024-04-16', startTime: '14:00', endTime: '22:00', zone: 'CNC Machine Shop', status: 'scheduled' },
      { employeeName: 'Priya Sharma', department: 'Safety', shift: 'morning', date: '2024-04-16', startTime: '07:00', endTime: '15:00', zone: 'All Zones', status: 'scheduled' },
      { employeeName: 'Kevin Murphy', department: 'Maintenance', shift: 'night', date: '2024-04-15', startTime: '22:00', endTime: '06:00', zone: 'Maintenance Workshop', status: 'absent', notes: 'Called in sick' },
      { employeeName: 'Fatima Al-Hassan', department: 'Quality Control', shift: 'morning', date: '2024-04-16', startTime: '06:00', endTime: '14:00', zone: 'Quality Lab', status: 'scheduled' },
      { employeeName: 'Aisha Patel', department: 'Quality Control', shift: 'morning', date: '2024-04-15', startTime: '06:00', endTime: '14:00', zone: 'Quality Lab', status: 'completed' },
      { employeeName: 'Robert Chen', department: 'Assembly Line A', shift: 'morning', date: '2024-04-16', startTime: '06:00', endTime: '14:00', zone: 'Assembly Line A', status: 'scheduled' }
    ]);
    console.log('✅ Shift Schedules seeded');

    // Risk Assessments (15)
    await RiskAssessment.bulkCreate([
      { title: 'Forklift Pedestrian Interaction Risk', area: 'Warehouse', assessor: 'Priya Sharma', assessmentDate: '2024-01-20', hazardDescription: 'Risk of collision between forklifts and pedestrian workers in shared warehouse aisles', likelihood: 'likely', consequence: 'major', riskLevel: 'high', controls: 'Designated walkways, speed limits, warning lights', status: 'mitigated' },
      { title: 'Arc Flash Hazard - Main Panel', area: 'Electrical Panel Room', assessor: 'David Kim', assessmentDate: '2024-02-01', hazardDescription: 'Potential arc flash during electrical panel maintenance causing severe burns', likelihood: 'unlikely', consequence: 'catastrophic', riskLevel: 'high', controls: 'LOTO procedures, arc flash PPE, energized work permits', status: 'mitigated' },
      { title: 'Chemical Exposure - Paint Shop', area: 'Paint Shop', assessor: 'Priya Sharma', assessmentDate: '2024-02-10', hazardDescription: 'Inhalation of volatile organic compounds from paint application and solvents', likelihood: 'possible', consequence: 'major', riskLevel: 'high', controls: 'Ventilation system, respirators, exposure monitoring', status: 'open' },
      { title: 'Noise-Induced Hearing Loss', area: 'CNC Machine Shop', assessor: 'Priya Sharma', assessmentDate: '2024-02-15', hazardDescription: 'Prolonged exposure to noise levels exceeding 85 dB in CNC machining area', likelihood: 'likely', consequence: 'moderate', riskLevel: 'high', controls: 'Hearing protection mandatory, engineering controls being evaluated', status: 'open' },
      { title: 'Burn Hazard - Welding Operations', area: 'Welding Bay', assessor: 'Marcus Thompson', assessmentDate: '2024-02-20', hazardDescription: 'Risk of burns from welding sparks, hot metal, and UV radiation', likelihood: 'possible', consequence: 'moderate', riskLevel: 'medium', controls: 'Welding PPE, fire-resistant clothing, welding screens', status: 'mitigated' },
      { title: 'Fall from Height - Roof Maintenance', area: 'Roof Access Area', assessor: 'Priya Sharma', assessmentDate: '2024-03-01', hazardDescription: 'Risk of falls during rooftop equipment maintenance and HVAC servicing', likelihood: 'unlikely', consequence: 'catastrophic', riskLevel: 'high', controls: 'Fall protection harnesses, guardrails, work permits', status: 'mitigated' },
      { title: 'Struck-By Hazard - Overhead Crane', area: 'Assembly Line B', assessor: 'Sarah Johnson', assessmentDate: '2024-03-05', hazardDescription: 'Risk of being struck by crane loads or falling objects during lifting operations', likelihood: 'unlikely', consequence: 'major', riskLevel: 'medium', controls: 'Trained operators, load capacity limits, exclusion zones', status: 'mitigated' },
      { title: 'Chemical Spill - Storage Area', area: 'Chemical Storage', assessor: 'Lisa Brown', assessmentDate: '2024-03-10', hazardDescription: 'Risk of hazardous chemical release from container failure or handling error', likelihood: 'possible', consequence: 'major', riskLevel: 'high', controls: 'Secondary containment, spill kits, chemical handling training', status: 'open' },
      { title: 'Ergonomic - Repetitive Motion', area: 'Assembly Line A', assessor: 'Priya Sharma', assessmentDate: '2024-03-15', hazardDescription: 'Cumulative musculoskeletal disorders from repetitive assembly tasks', likelihood: 'likely', consequence: 'moderate', riskLevel: 'medium', controls: 'Job rotation, ergonomic tools, stretch breaks', status: 'open' },
      { title: 'Heat Stress - Furnace Operations', area: 'Furnace Room', assessor: 'Priya Sharma', assessmentDate: '2024-03-20', hazardDescription: 'Heat-related illness from working near industrial furnaces', likelihood: 'likely', consequence: 'major', riskLevel: 'extreme', controls: 'WBGT monitoring, hydration program, work-rest cycles', status: 'open' },
      { title: 'Compressed Gas Cylinder Hazard', area: 'Compressed Gas Storage', assessor: 'Lisa Brown', assessmentDate: '2024-03-25', hazardDescription: 'Risk of cylinder rupture, valve failure, or gas release in storage area', likelihood: 'rare', consequence: 'catastrophic', riskLevel: 'medium', controls: 'Proper storage, chain securing, valve caps, ventilation', status: 'mitigated' },
      { title: 'Machine Entanglement - Conveyor', area: 'Assembly Line A', assessor: 'Sarah Johnson', assessmentDate: '2024-04-01', hazardDescription: 'Risk of clothing or body part entanglement in conveyor belt mechanisms', likelihood: 'unlikely', consequence: 'major', riskLevel: 'medium', controls: 'Machine guards, emergency stops, loose clothing policy', status: 'mitigated' },
      { title: 'Slip/Trip/Fall - General Factory', area: 'All Areas', assessor: 'Priya Sharma', assessmentDate: '2024-04-05', hazardDescription: 'General risk of slips, trips, and falls from wet floors, obstacles, and uneven surfaces', likelihood: 'likely', consequence: 'minor', riskLevel: 'medium', controls: 'Housekeeping program, non-slip flooring, proper lighting', status: 'open' },
      { title: 'Electrical Shock - Portable Tools', area: 'Maintenance Workshop', assessor: 'David Kim', assessmentDate: '2024-04-10', hazardDescription: 'Risk of electrical shock from damaged portable electrical tools and equipment', likelihood: 'possible', consequence: 'major', riskLevel: 'medium', controls: 'GFCI protection, tool inspection program, PAT testing', status: 'mitigated' },
      { title: 'Vehicle-Pedestrian Collision - Dock', area: 'Shipping Dock', assessor: 'Carlos Rivera', assessmentDate: '2024-04-12', hazardDescription: 'Risk of collision between delivery vehicles and dock workers during loading/unloading', likelihood: 'possible', consequence: 'major', riskLevel: 'high', controls: 'Dock barriers, spotters, vehicle restraint systems', status: 'open' }
    ]);
    console.log('✅ Risk Assessments seeded');

    // Safety Alerts (15)
    await SafetyAlert.bulkCreate([
      { title: 'PPE Compliance Alert - Paint Shop', message: 'Multiple PPE violations detected in Paint Shop area. All personnel must wear required respiratory protection at all times.', type: 'warning', zone: 'Paint Shop', issuedBy: 'Priya Sharma', status: 'active', priority: 'high' },
      { title: 'Forklift Speed Limit Reminder', message: 'Maximum forklift speed in warehouse is 5 MPH. Multiple speeding incidents reported this week.', type: 'warning', zone: 'Warehouse', issuedBy: 'Sarah Johnson', status: 'active', priority: 'medium' },
      { title: 'Chemical Storage Area Restricted', message: 'Chemical storage area access restricted to authorized personnel only during container replacement.', type: 'danger', zone: 'Chemical Storage', issuedBy: 'Lisa Brown', status: 'active', priority: 'urgent' },
      { title: 'Heat Advisory - Furnace Room', message: 'Temperatures exceeding safe limits. Mandatory 15-minute breaks every hour. Hydration stations active.', type: 'critical', zone: 'Furnace Room', issuedBy: 'Priya Sharma', status: 'active', priority: 'urgent' },
      { title: 'New Safety Glasses Required', message: 'Updated safety glasses standard effective next week. All personnel must obtain new ANSI Z87.1+ rated glasses.', type: 'info', zone: 'All Zones', issuedBy: 'Priya Sharma', status: 'active', priority: 'medium' },
      { title: 'Emergency Exit Drill Scheduled', message: 'Emergency evacuation drill scheduled for Friday at 10:00 AM. All personnel must participate.', type: 'info', zone: 'All Zones', issuedBy: 'John Admin', status: 'active', priority: 'medium' },
      { title: 'Crane Out of Service - Line B', message: 'Overhead Crane #2 is out of service for limit switch repair. Do not attempt to operate.', type: 'danger', zone: 'Assembly Line B', issuedBy: 'David Kim', status: 'active', priority: 'high' },
      { title: 'Spill Kit Locations Updated', message: 'New spill kit stations have been installed. Check updated emergency response maps on bulletin boards.', type: 'info', zone: 'All Zones', issuedBy: 'Lisa Brown', status: 'acknowledged', priority: 'low' },
      { title: 'Lockout/Tagout Procedure Update', message: 'Updated LOTO procedures posted at all energy isolation points. Review before performing maintenance.', type: 'warning', zone: 'All Zones', issuedBy: 'David Kim', status: 'active', priority: 'high' },
      { title: 'Noise Level Warning - CNC Shop', message: 'Noise levels in CNC Shop measured at 92 dB. Ear protection is MANDATORY in this area.', type: 'warning', zone: 'CNC Machine Shop', issuedBy: 'Priya Sharma', status: 'active', priority: 'high' },
      { title: 'Wet Floor Hazard - Assembly Line A', message: 'Water leak from cooling system creating slip hazard near Station 5. Area cordoned off.', type: 'danger', zone: 'Assembly Line A', issuedBy: 'Robert Chen', status: 'resolved', priority: 'high' },
      { title: 'First Aid Kit Restocking', message: 'First aid kits in Building 1 and 3 have been restocked. Please report any missing supplies.', type: 'info', zone: 'All Zones', issuedBy: 'Priya Sharma', status: 'acknowledged', priority: 'low' },
      { title: 'Visitor Safety Protocol Reminder', message: 'All visitors must be escorted and wear required PPE. Recent unauthorized entry incident reported.', type: 'warning', zone: 'All Zones', issuedBy: 'John Admin', status: 'active', priority: 'medium' },
      { title: 'Paint Booth Ventilation Repair', message: 'Paint Booth #1 ventilation under repair. Do not use until cleared by maintenance.', type: 'danger', zone: 'Paint Shop', issuedBy: 'James Wilson', status: 'active', priority: 'urgent' },
      { title: 'Quarterly Safety Meeting', message: 'Mandatory quarterly safety meeting next Tuesday at 7:00 AM in Training Room A. All supervisors must attend.', type: 'info', zone: 'All Zones', issuedBy: 'Priya Sharma', status: 'active', priority: 'medium' }
    ]);
    console.log('✅ Safety Alerts seeded');

    console.log('\n🎉 All seed data loaded successfully!');
    console.log('📊 Seeded: Users(4), Employees(15), PPE Detections(15), Hazard Zones(15),');
    console.log('   Incidents(15), Safety Training(15), Equipment Inspections(15),');
    console.log('   Safety Audits(15), Emergency Contacts(15), PPE Inventory(15),');
    console.log('   Compliance Reports(15), Shift Schedules(15), Risk Assessments(15),');
    console.log('   Safety Alerts(15)');
    console.log('\n🔑 Demo login users provisioned.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();

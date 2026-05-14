import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShield, FiAlertTriangle, FiActivity, FiCheckSquare, FiTool,
  FiClipboard, FiPhone, FiPackage, FiFileText, FiClock, FiBell, FiZap, FiBookOpen } from 'react-icons/fi';
import { dashboardAPI } from '../services/api';

const features = [
  { path: '/ppe-detections', title: 'PPE Detection', desc: 'AI-powered PPE compliance monitoring. Detect safety gear violations in real-time.', icon: FiShield, color: '#3b82f6', bg: '#eff6ff', ai: true },
  { path: '/incidents', title: 'Incident Analysis', desc: 'AI-driven incident investigation. Root cause analysis and corrective action recommendations.', icon: FiAlertTriangle, color: '#ef4444', bg: '#fef2f2', ai: true },
  { path: '/risk-assessments', title: 'Risk Assessment', desc: 'AI hazard evaluation. Automated risk scoring and control recommendations.', icon: FiActivity, color: '#8b5cf6', bg: '#faf5ff', ai: true },
  { path: '/safety-audits', title: 'Safety Audits', desc: 'AI audit analysis. Score interpretation, gap assessment, and action plans.', icon: FiClipboard, color: '#f59e0b', bg: '#fffbeb', ai: true },
  { path: '/compliance-reports', title: 'Compliance Reports', desc: 'AI OSHA compliance analysis. Automated report generation and trend analysis.', icon: FiFileText, color: '#06b6d4', bg: '#ecfeff', ai: true },
  { path: '/hazard-zones', title: 'Hazard Zones', desc: 'AI zone safety analysis. Occupancy monitoring and PPE enforcement.', icon: FiAlertTriangle, color: '#dc2626', bg: '#fff1f2', ai: true },
  { path: '/employees', title: 'Employee Management', desc: 'Track all factory personnel, certifications, departments, and shift assignments.', icon: FiUsers, color: '#10b981', bg: '#ecfdf5' },
  { path: '/safety-trainings', title: 'Safety Training', desc: 'Manage OSHA-required training programs, certifications, and scheduling.', icon: FiCheckSquare, color: '#6366f1', bg: '#eef2ff' },
  { path: '/equipment-inspections', title: 'Equipment Inspections', desc: 'Track equipment condition, inspection schedules, and maintenance needs.', icon: FiTool, color: '#64748b', bg: '#f8fafc' },
  { path: '/ppe-inventory', title: 'PPE Inventory', desc: 'Monitor PPE stock levels, expiration dates, and reorder thresholds.', icon: FiPackage, color: '#0891b2', bg: '#ecfeff' },
  { path: '/shift-schedules', title: 'Shift Schedules', desc: 'Manage worker shift assignments, zone coverage, and attendance tracking.', icon: FiClock, color: '#a855f7', bg: '#faf5ff' },
  { path: '/emergency-contacts', title: 'Emergency Contacts', desc: 'Quick access to internal, medical, fire, and hazmat emergency contacts.', icon: FiPhone, color: '#e11d48', bg: '#fff1f2' },
  { path: '/safety-alerts', title: 'Safety Alerts', desc: 'Issue and manage factory-wide safety alerts, warnings, and notifications.', icon: FiBell, color: '#ea580c', bg: '#fff7ed' },
  { path: '/ai-insights', title: 'AI Insights', desc: 'Cross-entity AI: global pattern detection, predictive risk scoring, and PPE reorder alerts.', icon: FiZap, color: '#7c3aed', bg: '#f5f3ff', ai: true },
  { path: '/audit-logs', title: 'Audit Log', desc: 'Tamper-evident audit log of every CRUD, AI analysis, login, and auto-alert event.', icon: FiBookOpen, color: '#475569', bg: '#f1f5f9' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardAPI.getStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const statCards = stats ? [
    { label: 'Active Employees', value: stats.activeEmployees, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Open Incidents', value: stats.openIncidents, color: '#ef4444', bg: '#fef2f2' },
    { label: 'PPE Compliance', value: `${stats.complianceRate}%`, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Active Alerts', value: stats.activeAlerts, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Pending Inspections', value: stats.pendingInspections, color: '#8b5cf6', bg: '#faf5ff' },
    { label: 'Open Risks', value: stats.openRiskAssessments, color: '#dc2626', bg: '#fff1f2' },
    { label: 'Low Stock PPE', value: stats.lowStockPPE, color: '#0891b2', bg: '#ecfeff' },
    { label: 'Upcoming Audits', value: stats.upcomingAudits, color: '#6366f1', bg: '#eef2ff' },
  ] : [];

  return (
    <div>
      <div className="top-bar">
        <h1>Safety Dashboard</h1>
      </div>

      {stats && (
        <div className="cards-grid">
          {statCards.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <FiActivity />
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Features</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click any card to access the feature</p>
      </div>

      <div className="feature-cards">
        {features.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
              {f.ai ? <span className="card-badge badge-ai">AI POWERED</span> : <span className="card-badge badge-core">CORE</span>}
              <div className="card-header">
                <div className="card-icon" style={{ background: f.bg, color: f.color }}>
                  <Icon />
                </div>
                <div className="card-title">{f.title}</div>
              </div>
              <div className="card-desc">{f.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

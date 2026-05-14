import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiShield, FiAlertTriangle, FiFileText, FiCalendar,
  FiTool, FiClipboard, FiPhone, FiPackage, FiCheckSquare, FiClock,
  FiActivity, FiBell, FiLogOut } from 'react-icons/fi';

const navItems = [
  { section: 'Overview' },
  { path: '/', label: 'Dashboard', icon: FiHome },
  { section: 'AI-Powered Features' },
  { path: '/ppe-detections', label: 'PPE Detection', icon: FiShield, ai: true },
  { path: '/incidents', label: 'Incident Analysis', icon: FiAlertTriangle, ai: true },
  { path: '/risk-assessments', label: 'Risk Assessment', icon: FiActivity, ai: true },
  { path: '/safety-audits', label: 'Safety Audits', icon: FiClipboard, ai: true },
  { path: '/compliance-reports', label: 'Compliance Reports', icon: FiFileText, ai: true },
  { path: '/hazard-zones', label: 'Hazard Zones', icon: FiAlertTriangle, ai: true },
  { path: '/ai/incident-predict', label: 'Incident Predict', icon: FiActivity, ai: true },
  { path: '/ai/osha-near-miss', label: 'OSHA & Near-Miss', icon: FiCheckSquare, ai: true },
  { path: '/ai/agentic-predictive', label: 'Agentic & Predictive', icon: FiTool, ai: true },
  { section: 'Management' },
  { path: '/employees', label: 'Employees', icon: FiUsers },
  { path: '/safety-trainings', label: 'Safety Training', icon: FiCheckSquare },
  { path: '/equipment-inspections', label: 'Equipment Inspections', icon: FiTool },
  { path: '/ppe-inventory', label: 'PPE Inventory', icon: FiPackage },
  { path: '/shift-schedules', label: 'Shift Schedules', icon: FiClock },
  { path: '/emergency-contacts', label: 'Emergency Contacts', icon: FiPhone },
  { path: '/safety-alerts', label: 'Safety Alerts', icon: FiBell },
];

export default function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Factory Safety AI</h2>
          <p>OSHA Compliance Monitor</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if (item.section) {
              return <div key={i} className="sidebar-section">{item.section}</div>;
            }
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon />
                <span>{item.label}</span>
                {item.ai && <span className="ai-badge">AI</span>}
              </div>
            );
          })}
          <button className="logout-btn" onClick={onLogout}>
            <FiLogOut />
            <span>Logout ({user.name})</span>
          </button>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

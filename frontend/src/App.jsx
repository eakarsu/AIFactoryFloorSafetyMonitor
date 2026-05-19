import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AuditLogPage from './pages/AuditLogPage';
import AIInsightsPage from './pages/AIInsightsPage';
import IncidentPredictPage from './pages/IncidentPredictPage';
import OshaNearMissPage from './pages/OshaNearMissPage';
import AgenticPredictivePage from './pages/AgenticPredictivePage';
import IntegrationsPage from './pages/IntegrationsPage';
import Layout from './components/Layout';

import Batch03Features from './pages/Batch03Features';
import CustomViewsPage from './pages/CustomViewsPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div className="loading-container"><div className="loader"></div></div>;

  if (!user) {
    return (
      <Routes>
          <Route path="/batch03" element={<Batch03Features />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<FeaturePage feature="employees" />} />
        <Route path="/ppe-detections" element={<FeaturePage feature="ppe-detections" />} />
        <Route path="/hazard-zones" element={<FeaturePage feature="hazard-zones" />} />
        <Route path="/incidents" element={<FeaturePage feature="incidents" />} />
        <Route path="/safety-trainings" element={<FeaturePage feature="safety-trainings" />} />
        <Route path="/equipment-inspections" element={<FeaturePage feature="equipment-inspections" />} />
        <Route path="/safety-audits" element={<FeaturePage feature="safety-audits" />} />
        <Route path="/emergency-contacts" element={<FeaturePage feature="emergency-contacts" />} />
        <Route path="/ppe-inventory" element={<FeaturePage feature="ppe-inventory" />} />
        <Route path="/compliance-reports" element={<FeaturePage feature="compliance-reports" />} />
        <Route path="/shift-schedules" element={<FeaturePage feature="shift-schedules" />} />
        <Route path="/risk-assessments" element={<FeaturePage feature="risk-assessments" />} />
        <Route path="/safety-alerts" element={<FeaturePage feature="safety-alerts" />} />
        <Route path="/audit-logs" element={<AuditLogPage />} />
        <Route path="/ai-insights" element={<AIInsightsPage />} />
        <Route path="/ai/incident-predict" element={<IncidentPredictPage />} />
        <Route path="/ai/osha-near-miss" element={<OshaNearMissPage />} />
        <Route path="/ai/agentic-predictive" element={<AgenticPredictivePage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/custom-views" element={<CustomViewsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

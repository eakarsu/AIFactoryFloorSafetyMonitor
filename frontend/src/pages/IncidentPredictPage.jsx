import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import api from '../services/api';

export default function IncidentPredictPage() {
  const navigate = useNavigate();
  const [zone, setZone] = useState('');
  const [shift, setShift] = useState('');
  const [daysBack, setDaysBack] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const body = {};
      if (zone) body.zone = zone;
      if (shift) body.shift = shift;
      if (daysBack) body.days_back = parseInt(daysBack, 10);
      const { data } = await api.post('/ai/incident-predict', body);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const predictions = result?.predictions?.predictions || [];
  const summary = result?.predictions?.summary;
  const horizon = result?.predictions?.horizon_days;
  const confidence = result?.predictions?.confidence;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft /> Back to Dashboard
      </button>

      <div className="data-section">
        <div className="data-header">
          <h2>Incident Prediction</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="form-group">
            <label>Zone (optional)</label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="e.g. Assembly Line A"
            />
          </div>
          <div className="form-group">
            <label>Shift (optional)</label>
            <input
              type="text"
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              placeholder="e.g. night"
            />
          </div>
          <div className="form-group">
            <label>Days Back (7-365)</label>
            <input
              type="number"
              min="7"
              max="365"
              value={daysBack}
              onChange={(e) => setDaysBack(e.target.value)}
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              <FiAlertTriangle /> {loading ? 'Predicting…' : 'Predict Incidents'}
            </button>
          </div>
        </form>

        {error && <div className="error-message" style={{ margin: 16 }}>{error}</div>}

        {loading && (
          <div className="loading-container" style={{ padding: 32 }}>
            <div className="loader" />
          </div>
        )}

        {result && !loading && (
          <div className="ai-analysis-container" style={{ margin: 16 }}>
            <div className="ai-analysis-header">
              <div className="ai-icon"><FiAlertTriangle /></div>
              <h3>30-Day Incident Forecast</h3>
            </div>
            <div className="ai-analysis-content">
              <p>
                <strong>Filters:</strong>{' '}
                zone={result.filters?.zone || 'ALL'}, shift={result.filters?.shift || 'ALL'},
                lookback={result.filters?.lookback_days} days
              </p>
              <p>
                <strong>Source data:</strong> {result.incident_count} incidents,{' '}
                {result.risk_assessment_count} risk assessments
              </p>
              {typeof horizon === 'number' && <p><strong>Horizon:</strong> {horizon} days</p>}
              {typeof confidence === 'number' && <p><strong>Confidence:</strong> {confidence}%</p>}
              {summary && <p><strong>Summary:</strong> {summary}</p>}

              {predictions.length > 0 ? (
                <table className="data-table" style={{ marginTop: 16 }}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Likelihood</th>
                      <th>Zones</th>
                      <th>Shifts</th>
                      <th>Leading Indicators</th>
                      <th>Preventive Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p, i) => (
                      <tr key={i}>
                        <td>{p.incident_type}</td>
                        <td><span className="status-badge">{p.likelihood}</span></td>
                        <td>{Array.isArray(p.expected_zones) ? p.expected_zones.join(', ') : '-'}</td>
                        <td>{Array.isArray(p.expected_shifts) ? p.expected_shifts.join(', ') : '-'}</td>
                        <td>{Array.isArray(p.leading_indicators) ? p.leading_indicators.join('; ') : '-'}</td>
                        <td>{Array.isArray(p.preventive_actions) ? p.preventive_actions.join('; ') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 11, overflow: 'auto' }}>
                  {JSON.stringify(result.predictions, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

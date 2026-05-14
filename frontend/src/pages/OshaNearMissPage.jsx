import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckSquare, FiAlertTriangle } from 'react-icons/fi';
import { aiAPI } from '../services/api';

export default function OshaNearMissPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('osha');

  // OSHA tab state
  const [scope, setScope] = useState('facility');
  const [department, setDepartment] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [oshaLoading, setOshaLoading] = useState(false);
  const [oshaError, setOshaError] = useState('');
  const [oshaResult, setOshaResult] = useState(null);

  // Near-miss tab state
  const [reportsText, setReportsText] = useState('');
  const [windowDays, setWindowDays] = useState(90);
  const [nmLoading, setNmLoading] = useState(false);
  const [nmError, setNmError] = useState('');
  const [nmResult, setNmResult] = useState(null);

  const handleOshaSubmit = async (e) => {
    e.preventDefault();
    setOshaError('');
    setOshaResult(null);
    setOshaLoading(true);
    try {
      const focusList = focusAreas
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const body = { scope };
      if (department) body.department = department;
      if (focusList.length) body.focus_areas = focusList;
      const { data } = await aiAPI.oshaComplianceCheck(body);
      setOshaResult(data);
    } catch (err) {
      if (err.response?.status === 503) {
        setOshaError('AI not configured: please set OPENROUTER_API_KEY on the server.');
      } else {
        setOshaError(err.response?.data?.error || err.message || 'OSHA compliance check failed');
      }
    } finally {
      setOshaLoading(false);
    }
  };

  const handleNearMissSubmit = async (e) => {
    e.preventDefault();
    setNmError('');
    setNmResult(null);
    setNmLoading(true);
    try {
      const body = {};
      if (windowDays) body.window_days = parseInt(windowDays, 10);
      const trimmed = reportsText.trim();
      if (trimmed) {
        // Each non-empty line is one report description
        const reports = trimmed
          .split(/\n+/)
          .map(line => line.trim())
          .filter(Boolean)
          .map(description => ({ description }));
        if (reports.length > 0) body.reports = reports;
      }
      const { data } = await aiAPI.nearMissAnalyze(body);
      setNmResult(data);
    } catch (err) {
      if (err.response?.status === 503) {
        setNmError('AI not configured: please set OPENROUTER_API_KEY on the server.');
      } else {
        setNmError(err.response?.data?.error || err.message || 'Near-miss analysis failed');
      }
    } finally {
      setNmLoading(false);
    }
  };

  const oshaParsed = oshaResult?.parsed;
  const nmParsed = nmResult?.parsed;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft /> Back to Dashboard
      </button>

      <div className="data-section">
        <div className="data-header">
          <h2>OSHA Compliance & Near-Miss Analysis</h2>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
          <button
            className={`btn ${tab === 'osha' ? 'btn-ai' : 'btn-secondary'}`}
            onClick={() => setTab('osha')}
            type="button"
          >
            <FiCheckSquare /> OSHA Compliance Check
          </button>
          <button
            className={`btn ${tab === 'nearmiss' ? 'btn-ai' : 'btn-secondary'}`}
            onClick={() => setTab('nearmiss')}
            type="button"
          >
            <FiAlertTriangle /> Near-Miss Trends
          </button>
        </div>

        {tab === 'osha' && (
          <>
            <form onSubmit={handleOshaSubmit} style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="form-group">
                <label>Scope</label>
                <select value={scope} onChange={e => setScope(e.target.value)}>
                  <option value="facility">Facility</option>
                  <option value="department">Department</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department (optional)</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Assembly"
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
                <label>Focus Areas (comma-separated, optional)</label>
                <input
                  type="text"
                  value={focusAreas}
                  onChange={e => setFocusAreas(e.target.value)}
                  placeholder="PPE, hazard communication, machine guarding"
                />
              </div>
              <div style={{ alignSelf: 'flex-end' }}>
                <button type="submit" className="btn btn-ai" disabled={oshaLoading}>
                  <FiCheckSquare /> {oshaLoading ? 'Running…' : 'Run Compliance Check'}
                </button>
              </div>
            </form>

            {oshaError && <div className="error-message" style={{ margin: 16 }}>{oshaError}</div>}

            {oshaLoading && (
              <div className="loading-container" style={{ padding: 32 }}>
                <div className="loader" />
              </div>
            )}

            {oshaResult && !oshaLoading && (
              <div className="ai-analysis-container" style={{ margin: 16 }}>
                <div className="ai-analysis-header">
                  <div className="ai-icon"><FiCheckSquare /></div>
                  <h3>29 CFR 1910 Compliance Report</h3>
                </div>
                <div className="ai-analysis-content">
                  <p>
                    <strong>Scope:</strong> {oshaResult.filters?.scope || 'facility'}
                    {oshaResult.filters?.department ? ` / ${oshaResult.filters.department}` : ''}
                  </p>
                  <p>
                    <strong>Source data:</strong> {oshaResult.incident_count} incidents,{' '}
                    {oshaResult.ppe_item_count} PPE items
                  </p>
                  {typeof oshaParsed?.overall_compliance_score === 'number' && (
                    <p><strong>Overall score:</strong> {oshaParsed.overall_compliance_score}/100</p>
                  )}
                  {oshaParsed?.overall_summary && <p><strong>Summary:</strong> {oshaParsed.overall_summary}</p>}

                  {Array.isArray(oshaParsed?.cfr_findings) && oshaParsed.cfr_findings.length > 0 ? (
                    <table className="data-table" style={{ marginTop: 16 }}>
                      <thead>
                        <tr>
                          <th>CFR Section</th>
                          <th>Topic</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Gaps</th>
                          <th>Recommended Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oshaParsed.cfr_findings.map((f, i) => (
                          <tr key={i}>
                            <td>{f.cfr_section}</td>
                            <td>{f.topic}</td>
                            <td><span className="status-badge">{f.compliance_status}</span></td>
                            <td><span className="status-badge">{f.priority}</span></td>
                            <td>{Array.isArray(f.gaps) ? f.gaps.join('; ') : '-'}</td>
                            <td>{Array.isArray(f.recommended_actions) ? f.recommended_actions.join('; ') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 11, overflow: 'auto' }}>
                      {oshaResult.result || JSON.stringify(oshaParsed, null, 2)}
                    </pre>
                  )}

                  {Array.isArray(oshaParsed?.top_priority_actions) && oshaParsed.top_priority_actions.length > 0 && (
                    <>
                      <h4 style={{ marginTop: 16 }}>Top Priority Actions</h4>
                      <ul>
                        {oshaParsed.top_priority_actions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'nearmiss' && (
          <>
            <form onSubmit={handleNearMissSubmit} style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 320 }}>
                <label>Reports (one per line; leave empty to use stored near-misses)</label>
                <textarea
                  rows={5}
                  value={reportsText}
                  onChange={e => setReportsText(e.target.value)}
                  placeholder={'Forklift nearly hit pedestrian in aisle 3\nChemical spill almost reached drain\n...'}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group">
                <label>Window (days, 7-365)</label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={windowDays}
                  onChange={e => setWindowDays(e.target.value)}
                />
              </div>
              <div style={{ alignSelf: 'flex-end' }}>
                <button type="submit" className="btn btn-ai" disabled={nmLoading}>
                  <FiAlertTriangle /> {nmLoading ? 'Analyzing…' : 'Analyze Near-Misses'}
                </button>
              </div>
            </form>

            {nmError && <div className="error-message" style={{ margin: 16 }}>{nmError}</div>}

            {nmLoading && (
              <div className="loading-container" style={{ padding: 32 }}>
                <div className="loader" />
              </div>
            )}

            {nmResult && !nmLoading && (
              <div className="ai-analysis-container" style={{ margin: 16 }}>
                <div className="ai-analysis-header">
                  <div className="ai-icon"><FiAlertTriangle /></div>
                  <h3>Near-Miss Trend Analysis</h3>
                </div>
                <div className="ai-analysis-content">
                  <p>
                    <strong>Window:</strong> {nmResult.window_days} days &nbsp;
                    <strong>Reports analyzed:</strong> {nmResult.report_count}
                  </p>
                  {nmResult.message && <p>{nmResult.message}</p>}
                  {nmParsed?.trend_summary && <p><strong>Summary:</strong> {nmParsed.trend_summary}</p>}

                  {Array.isArray(nmParsed?.location_hotspots) && nmParsed.location_hotspots.length > 0 && (
                    <>
                      <h4>Location Hotspots</h4>
                      <table className="data-table">
                        <thead><tr><th>Location</th><th>Count</th><th>Risk</th></tr></thead>
                        <tbody>
                          {nmParsed.location_hotspots.map((h, i) => (
                            <tr key={i}>
                              <td>{h.location}</td>
                              <td>{h.count}</td>
                              <td><span className="status-badge">{h.risk_level}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {Array.isArray(nmParsed?.recurring_contributing_factors) && nmParsed.recurring_contributing_factors.length > 0 && (
                    <>
                      <h4 style={{ marginTop: 12 }}>Recurring Contributing Factors</h4>
                      <ul>
                        {nmParsed.recurring_contributing_factors.map((f, i) => (
                          <li key={i}>
                            <strong>{f.factor}</strong> — count {f.count}
                            {Array.isArray(f.examples) && f.examples.length > 0 && ` (examples: ${f.examples.join(', ')})`}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {Array.isArray(nmParsed?.preventive_recommendations) && nmParsed.preventive_recommendations.length > 0 && (
                    <>
                      <h4 style={{ marginTop: 12 }}>Preventive Recommendations</h4>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Recommendation</th>
                            <th>Target Factor</th>
                            <th>Priority</th>
                            <th>Expected Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nmParsed.preventive_recommendations.map((r, i) => (
                            <tr key={i}>
                              <td>{r.recommendation}</td>
                              <td>{r.target_factor}</td>
                              <td><span className="status-badge">{r.priority}</span></td>
                              <td>{r.expected_impact}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {!nmParsed && nmResult.result && (
                    <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 11, overflow: 'auto' }}>
                      {nmResult.result}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

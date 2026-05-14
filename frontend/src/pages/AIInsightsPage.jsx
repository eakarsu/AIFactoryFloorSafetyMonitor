import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiZap, FiTrendingUp, FiPackage } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { aiAPI } from '../services/api';

export default function AIInsightsPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await aiAPI.analyses({ page, limit: 20 });
      setAnalyses(data.data || []);
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 1 });
    } catch (e) {
      setError('Failed to load AI analyses');
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const run = async (kind) => {
    setRunning(kind);
    setError('');
    setLatest(null);
    try {
      let res;
      if (kind === 'global') res = await aiAPI.globalAnalysis();
      else if (kind === 'predictive') res = await aiAPI.predictiveRiskScoring();
      else if (kind === 'reorder') res = await aiAPI.ppeReorderAlerts();
      setLatest({ kind, data: res.data });
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'AI run failed');
    }
    setRunning(null);
  };

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft /> Back to Dashboard
      </button>

      <div className="data-section">
        <div className="data-header">
          <h2>AI Safety Insights</h2>
        </div>

        <div style={{ display: 'flex', gap: 12, padding: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-ai" disabled={running === 'global'} onClick={() => run('global')}>
            <FiZap /> {running === 'global' ? 'Running…' : 'Global Pattern Analysis'}
          </button>
          <button className="btn btn-ai" disabled={running === 'predictive'} onClick={() => run('predictive')}>
            <FiTrendingUp /> {running === 'predictive' ? 'Running…' : 'Predictive Risk Scoring'}
          </button>
          <button className="btn btn-ai" disabled={running === 'reorder'} onClick={() => run('reorder')}>
            <FiPackage /> {running === 'reorder' ? 'Running…' : 'PPE Reorder Alerts'}
          </button>
        </div>

        {error && <div className="error-message" style={{ margin: 16 }}>{error}</div>}

        {latest && (
          <div className="ai-analysis-container" style={{ margin: 16 }}>
            <div className="ai-analysis-header">
              <div className="ai-icon"><FiZap /></div>
              <h3>Latest: {latest.kind}</h3>
            </div>
            {latest.data?.result && (
              <div className="ai-analysis-content">
                <ReactMarkdown>{latest.data.result}</ReactMarkdown>
              </div>
            )}
            {latest.data?.parsed && (
              <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 11, overflow: 'auto' }}>
                {JSON.stringify(latest.data.parsed, null, 2)}
              </pre>
            )}
            {latest.data?.reorder_recommendations && (
              <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 11, overflow: 'auto' }}>
                {JSON.stringify(latest.data.reorder_recommendations, null, 2)}
              </pre>
            )}
          </div>
        )}

        <h3 style={{ padding: '0 16px' }}>Past Analyses</h3>

        {loading ? (
          <div className="loading-container"><div className="loader" /></div>
        ) : analyses.length === 0 ? (
          <div className="empty-state"><h3>No analyses yet</h3></div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Model</th>
                  <th>Snippet</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map(a => (
                  <tr key={a.id}>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                    <td><span className="status-badge">{a.analysis_type}</span></td>
                    <td style={{ fontSize: 11 }}>{a.model}</td>
                    <td style={{ fontSize: 11 }}>{(a.content || '').substring(0, 200)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 }}>
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                <span style={{ fontSize: 13 }}>Page {pagination.page} of {pagination.totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

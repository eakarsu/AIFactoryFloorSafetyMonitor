import FormattedAIReport from "../components/FormattedAIReport";
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiZap, FiTrendingUp, FiPackage } from 'react-icons/fi';
import { aiAPI } from '../services/api';

export default function AIInsightsPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [latest, setLatest] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await aiAPI.analyses({ page, limit: 20 });
      if (!Array.isArray(data?.data)) throw new Error('Invalid AI analyses response');
      setAnalyses(data.data);
      setPagination(data.pagination || { page, limit: 20, total: data.data.length, totalPages: 1 });
    } catch (e) {
      setAnalyses([]);
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
            {(latest.data?.parsed !== undefined || latest.data?.result !== undefined) &&
              <FormattedAIReport response={latest.data.parsed ?? latest.data.result} />}
            {latest.data?.reorder_recommendations && (
              <FormattedAIReport response={latest.data.reorder_recommendations} />
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
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map(a => (<React.Fragment key={a.id}>
                  <tr>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                    <td><span className="status-badge">{a.analysis_type}</span></td>
                    <td style={{ fontSize: 11 }}>{a.model}</td>
                    <td><button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} aria-expanded={expandedId === a.id}>{expandedId === a.id ? 'Hide report' : 'View report'}</button></td>
                  </tr>
                  {expandedId === a.id && <tr><td colSpan={4}><FormattedAIReport response={a.content} title={`${a.analysis_type.replaceAll('_', ' ')} report`} /></td></tr>}
                </React.Fragment>))}
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

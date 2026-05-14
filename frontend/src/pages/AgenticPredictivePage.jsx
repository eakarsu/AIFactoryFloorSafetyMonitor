import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiActivity, FiTool } from 'react-icons/fi';
import { aiAPI } from '../services/api';

/**
 * Apply pass 5 wave-1 — agentic safety officer + predictive maintenance.
 * Mirrors OshaNearMissPage structure (back-btn / data-section / btn-ai / data-table / ai-analysis-container).
 */
export default function AgenticPredictivePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('agentic');

  // Agentic safety officer state
  const [focus, setFocus] = useState('overall safety performance');
  const [agDept, setAgDept] = useState('');
  const [agWindow, setAgWindow] = useState(30);
  const [agLoading, setAgLoading] = useState(false);
  const [agError, setAgError] = useState('');
  const [agResult, setAgResult] = useState(null);

  // Predictive maintenance state
  const [pmDept, setPmDept] = useState('');
  const [pmFocus, setPmFocus] = useState('');
  const [pmWindow, setPmWindow] = useState(90);
  const [pmLoading, setPmLoading] = useState(false);
  const [pmError, setPmError] = useState('');
  const [pmResult, setPmResult] = useState(null);

  const handleAgenticSubmit = async (e) => {
    e.preventDefault();
    setAgError(''); setAgResult(null); setAgLoading(true);
    try {
      const body = { focus };
      if (agDept) body.department = agDept;
      if (agWindow) body.window_days = parseInt(agWindow, 10);
      const { data } = await aiAPI.agenticSafetyOfficer(body);
      setAgResult(data);
    } catch (err) {
      if (err.response?.status === 503) setAgError('AI not configured: please set OPENROUTER_API_KEY on the server.');
      else setAgError(err.response?.data?.error || err.message || 'Agentic safety officer failed');
    } finally {
      setAgLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setPmError(''); setPmResult(null); setPmLoading(true);
    try {
      const body = {};
      if (pmDept) body.department = pmDept;
      if (pmFocus) body.equipment_focus = pmFocus;
      if (pmWindow) body.window_days = parseInt(pmWindow, 10);
      const { data } = await aiAPI.predictiveMaintenance(body);
      setPmResult(data);
    } catch (err) {
      if (err.response?.status === 503) setPmError('AI not configured: please set OPENROUTER_API_KEY on the server.');
      else setPmError(err.response?.data?.error || err.message || 'Predictive maintenance failed');
    } finally {
      setPmLoading(false);
    }
  };

  return (
    <div>
      <button className="back-btn" onClick={() => navigate(-1)}><FiArrowLeft /> Back</button>

      <div className="data-section">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className={`btn-ai ${tab === 'agentic' ? 'active' : ''}`} onClick={() => setTab('agentic')}>
            <FiActivity /> Agentic Safety Officer
          </button>
          <button className={`btn-ai ${tab === 'predictive' ? 'active' : ''}`} onClick={() => setTab('predictive')}>
            <FiTool /> Predictive Maintenance
          </button>
        </div>

        {tab === 'agentic' && (
          <form onSubmit={handleAgenticSubmit} className="data-table">
            <h2>Agentic Safety Officer</h2>
            <p>Synthesizes incidents, risk assessments, and PPE inventory into a multi-phase intervention plan.</p>
            <div className="form-grid">
              <label>Focus
                <input type="text" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Zone B forklift incidents" />
              </label>
              <label>Department
                <input type="text" value={agDept} onChange={(e) => setAgDept(e.target.value)} placeholder="leave blank for all" />
              </label>
              <label>Window (days)
                <input type="number" value={agWindow} onChange={(e) => setAgWindow(e.target.value)} min={7} max={365} />
              </label>
            </div>
            <button className="btn-ai" type="submit" disabled={agLoading}>{agLoading ? 'Investigating...' : 'Run Agentic Officer'}</button>
            {agError && <div className="error" style={{ marginTop: 12 }}>{agError}</div>}
            {agResult && (
              <div className="ai-analysis-container" style={{ marginTop: 12 }}>
                <h3>Stats</h3>
                <pre>{JSON.stringify(agResult.stats, null, 2)}</pre>
                {agResult.parsed && <>
                  <h3>Plan</h3>
                  <pre>{JSON.stringify(agResult.parsed, null, 2)}</pre>
                </>}
                {!agResult.parsed && <>
                  <h3>Raw</h3>
                  <pre>{agResult.result}</pre>
                </>}
              </div>
            )}
          </form>
        )}

        {tab === 'predictive' && (
          <form onSubmit={handleMaintenanceSubmit} className="data-table">
            <h2>Predictive Maintenance</h2>
            <p>Uses inspection history and recent equipment incidents to recommend preemptive maintenance windows.</p>
            <div className="form-grid">
              <label>Department
                <input type="text" value={pmDept} onChange={(e) => setPmDept(e.target.value)} placeholder="leave blank for all" />
              </label>
              <label>Equipment focus
                <input type="text" value={pmFocus} onChange={(e) => setPmFocus(e.target.value)} placeholder="e.g. forklifts, conveyors" />
              </label>
              <label>Window (days)
                <input type="number" value={pmWindow} onChange={(e) => setPmWindow(e.target.value)} min={14} max={365} />
              </label>
            </div>
            <button className="btn-ai" type="submit" disabled={pmLoading}>{pmLoading ? 'Predicting...' : 'Run Predictive Maintenance'}</button>
            {pmError && <div className="error" style={{ marginTop: 12 }}>{pmError}</div>}
            {pmResult && (
              <div className="ai-analysis-container" style={{ marginTop: 12 }}>
                <h3>Stats</h3>
                <pre>{JSON.stringify(pmResult.stats, null, 2)}</pre>
                {pmResult.parsed && <>
                  <h3>Forecast</h3>
                  <pre>{JSON.stringify(pmResult.parsed, null, 2)}</pre>
                </>}
                {!pmResult.parsed && <>
                  <h3>Raw</h3>
                  <pre>{pmResult.result}</pre>
                </>}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

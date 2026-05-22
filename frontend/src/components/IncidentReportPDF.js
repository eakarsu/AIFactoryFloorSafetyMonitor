import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function IncidentReportPDF() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/custom-views/incidents')
      .then(r => {
        if (cancelled) return;
        const list = r?.data?.items || [];
        setItems(list);
        if (list.length > 0) setSelectedId(String(list[0].id));
      })
      .catch(e => {
        if (cancelled) return;
        setError(e?.response?.data?.error || e.message || 'Failed to load incidents');
      });
    return () => { cancelled = true; };
  }, []);

  const handleGenerate = async () => {
    setError('');
    setStatus('');
    if (!selectedId) { setError('Pick an incident first.'); return; }
    setLoading(true);
    try {
      const res = await api.post(`/custom-views/incident-report?id=${encodeURIComponent(selectedId)}`, {}, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sel = items.find(i => String(i.id) === String(selectedId));
      a.download = `incident_${sel?.incidentNumber || selectedId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStatus(`PDF generated (${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const sel = items.find(i => String(i.id) === String(selectedId));

  return (
    <div data-testid="incident-report-pdf" style={{ background: '#0b1220', borderRadius: 12, padding: 20, color: '#e2e8f0', border: '1px solid #1e293b' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Incident Report PDF</h2>
        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>
          Pick an incident and generate a full investigation report (date, location, type, severity, witnesses, root cause, corrective actions).
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, color: '#cbd5e1' }}>Incident</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
            minWidth: 320,
          }}
        >
          {items.length === 0 && <option value="">(no incidents available)</option>}
          {items.map(i => (
            <option key={i.id} value={i.id}>
              {(i.incidentNumber || `INC-${i.id}`) + ' - ' + (i.title || '(untitled)')}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedId}
          style={{
            padding: '9px 16px',
            borderRadius: 6,
            background: loading ? '#475569' : '#2563eb',
            color: '#f8fafc',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {sel && (
        <div style={{ marginTop: 16, padding: 12, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 4 }}>
            <span style={{ color: '#94a3b8' }}>Number</span><span>{sel.incidentNumber || `INC-${sel.id}`}</span>
            <span style={{ color: '#94a3b8' }}>Title</span><span>{sel.title || '(untitled)'}</span>
            <span style={{ color: '#94a3b8' }}>Type</span><span>{String(sel.type || '').replace('_', ' ')}</span>
            <span style={{ color: '#94a3b8' }}>Severity</span><span style={{ textTransform: 'uppercase' }}>{sel.severity || 'n/a'}</span>
            <span style={{ color: '#94a3b8' }}>Location</span><span>{sel.location || 'Unknown'}</span>
            <span style={{ color: '#94a3b8' }}>Date</span><span>{sel.date ? new Date(sel.date).toUTCString() : 'Unknown'}</span>
          </div>
        </div>
      )}

      {error && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>Error: {error}</div>}
      {status && <div style={{ marginTop: 12, color: '#34d399', fontSize: 13 }}>{status}</div>}
    </div>
  );
}

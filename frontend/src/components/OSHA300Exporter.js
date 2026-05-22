import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function parseCsvPreview(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  return lines.slice(0, 8).map(line => {
    // simple CSV split honoring quoted commas
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  });
}

export default function OSHA300Exporter() {
  const currentYear = new Date().getUTCFullYear();
  const years = useMemo(() => {
    const arr = [];
    for (let y = currentYear; y >= currentYear - 5; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  const [year, setYear] = useState(String(currentYear));
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [previewYear, setPreviewYear] = useState('');

  // Auto-load CSV preview whenever year changes
  useEffect(() => {
    let cancelled = false;
    setError('');
    api.get(`/custom-views/osha-300?year=${encodeURIComponent(year)}&format=csv`, { responseType: 'text' })
      .then(r => {
        if (cancelled) return;
        const text = typeof r.data === 'string' ? r.data : '';
        setPreviewRows(parseCsvPreview(text));
        setPreviewYear(year);
      })
      .catch(e => {
        if (cancelled) return;
        setError(e?.response?.data?.error || e.message || 'Failed to load preview');
      });
    return () => { cancelled = true; };
  }, [year]);

  const handleExport = async () => {
    setError('');
    setStatus('');
    setLoading(true);
    try {
      const res = await api.get(`/custom-views/osha-300?year=${encodeURIComponent(year)}&format=${format}`, { responseType: 'blob' });
      const mime = format === 'pdf' ? 'application/pdf' : 'text/csv';
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `osha300_${year}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStatus(`Form 300 exported (${format.toUpperCase()}, ${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to export Form 300');
    } finally {
      setLoading(false);
    }
  };

  const headerRow = previewRows[0] || [];
  const dataRows = previewRows.slice(1);

  return (
    <div data-testid="osha-300-exporter" style={{ background: '#0b1220', borderRadius: 12, padding: 20, color: '#e2e8f0', border: '1px solid #1e293b' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>OSHA Form 300 Export</h2>
        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>
          Export the OSHA 300 log of recordable injuries and illnesses for any year as CSV or PDF.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, color: '#cbd5e1' }}>Year</label>
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          style={{
            padding: '8px 10px', borderRadius: 6, background: '#0f172a',
            color: '#f8fafc', border: '1px solid #334155', minWidth: 110,
          }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <label style={{ fontSize: 13, color: '#cbd5e1', marginLeft: 8 }}>Format</label>
        <select
          value={format}
          onChange={e => setFormat(e.target.value)}
          style={{
            padding: '8px 10px', borderRadius: 6, background: '#0f172a',
            color: '#f8fafc', border: '1px solid #334155', minWidth: 110,
          }}
        >
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
        </select>

        <button
          onClick={handleExport}
          disabled={loading}
          style={{
            padding: '9px 16px', borderRadius: 6,
            background: loading ? '#475569' : '#16a34a',
            color: '#f8fafc', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: 13,
          }}
        >
          {loading ? 'Exporting...' : 'Export Form 300'}
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong style={{ fontSize: 14, color: '#f8fafc' }}>Preview (Form 300, {previewYear || year})</strong>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>
            {Math.max(0, dataRows.length)} recordable row(s) shown
          </span>
        </div>
        <div style={{ overflowX: 'auto', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#0a0f1c' }}>
                {(headerRow.length ? headerRow : ['Case', 'Employee', 'Job', 'Date', 'Where', 'Describe']).map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '8px 10px', color: '#cbd5e1', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.length === 0 ? (
                <tr><td colSpan={headerRow.length || 6} style={{ padding: 12, color: '#94a3b8' }}>No preview rows.</td></tr>
              ) : dataRows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} style={{ padding: '8px 10px', borderBottom: '1px solid #1e293b', color: '#e2e8f0' }}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>Error: {error}</div>}
      {status && <div style={{ marginTop: 12, color: '#34d399', fontSize: 13 }}>{status}</div>}
    </div>
  );
}

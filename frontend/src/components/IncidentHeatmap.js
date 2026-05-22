import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../services/api';

function cellColor(count, max) {
  if (max <= 0) return '#1e293b';
  const intensity = Math.min(1, count / max);
  // interpolate from deep slate to alert red through orange/yellow
  if (intensity < 0.001) return '#0f172a';
  if (intensity < 0.25)  return '#1d4ed8';
  if (intensity < 0.5)   return '#f59e0b';
  if (intensity < 0.75)  return '#ef4444';
  return '#b91c1c';
}

export default function IncidentHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/custom-views/incident-heatmap')
      .then(r => { if (!cancelled) setData(r.data); })
      .catch(e => { if (!cancelled) setError(e?.response?.data?.error || e.message || 'Failed to load incident heatmap'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading incident heatmap…</div>;

  const { zones, shifts, matrix, summary } = data;
  const max = summary.max;

  return (
    <div style={{ background: '#0b1220', borderRadius: 12, padding: 20, color: '#e2e8f0', border: '1px solid #1e293b' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Incident Heatmap</h2>
        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>
          {summary.total} incidents across {zones.length} zones × {shifts.length} shifts •
          Hot spot: <strong style={{ color: '#ef4444' }}>{summary.mostIncidentsZone.zone}</strong> •
          Peak shift: <strong style={{ color: '#f59e0b' }}>{summary.mostIncidentsShift.shift}</strong>
        </p>
      </div>

      {/* CSS grid heatmap */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `200px repeat(${shifts.length}, 1fr)`,
          gap: 4,
          minWidth: 520
        }}>
          <div />
          {shifts.map(s => (
            <div key={s} style={{ textAlign: 'center', fontWeight: 600, padding: 8, color: '#cbd5e1' }}>{s}</div>
          ))}

          {zones.map((zone, zi) => (
            <React.Fragment key={zone}>
              <div style={{ padding: '8px 12px', fontSize: 13, color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {zone}
              </div>
              {matrix[zi].map(cell => {
                const bg = cellColor(cell.count, max);
                return (
                  <div key={`${cell.zone}-${cell.shift}`}
                       title={`${cell.zone} • ${cell.shift}: ${cell.count} incidents`}
                       style={{
                         background: bg,
                         color: '#f8fafc',
                         textAlign: 'center',
                         padding: '18px 0',
                         borderRadius: 6,
                         fontWeight: 700,
                         fontSize: 16,
                         border: '1px solid #1e293b'
                       }}>
                    {cell.count}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recharts bar chart of zone totals */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#cbd5e1' }}>Total Incidents per Zone</h3>
        <div style={{ width: '100%', height: 260, background: '#0f172a', borderRadius: 8, padding: 12, border: '1px solid #1e293b' }}>
          <ResponsiveContainer>
            <BarChart data={summary.byZone}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="zone" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc' }} />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Bar dataKey="total" name="Incidents" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: '#94a3b8' }}>
        <span>Intensity:</span>
        {[
          { c: '#0f172a', l: '0' },
          { c: '#1d4ed8', l: 'Low' },
          { c: '#f59e0b', l: 'Med' },
          { c: '#ef4444', l: 'High' },
          { c: '#b91c1c', l: 'Critical' }
        ].map(e => (
          <span key={e.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 16, background: e.c, borderRadius: 3, border: '1px solid #334155' }} />
            {e.l}
          </span>
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import api from '../services/api';

const STATUS_COLORS = {
  safe:    { fill: '#1f4d2b', stroke: '#3ddc84', label: 'Safe'    },
  caution: { fill: '#5a4513', stroke: '#facc15', label: 'Caution' },
  hazard:  { fill: '#5b1d1d', stroke: '#ef4444', label: 'Hazard'  },
};

export default function HazardZoneMap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [hoveredZone, setHoveredZone] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/custom-views/hazard-zone-map')
      .then(r => { if (!cancelled) setData(r.data); })
      .catch(e => { if (!cancelled) setError(e?.response?.data?.error || e.message || 'Failed to load hazard zone map'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading hazard zone map…</div>;

  const { zones, workers, summary } = data;
  const w = summary.floorWidth || 700;
  const h = summary.floorHeight || 510;

  return (
    <div style={{ background: '#0b1220', borderRadius: 12, padding: 20, color: '#e2e8f0', border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Hazard Zone Map</h2>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>
            Live floor layout • {summary.zones} zones • {summary.workers} workers • {summary.ppeNonCompliant} PPE non-compliant
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, background: v.fill, border: `2px solid ${v.stroke}`, borderRadius: 3, display: 'inline-block' }} />
              <span>{v.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, background: '#38bdf8', borderRadius: '50%', display: 'inline-block' }} />
            <span>Worker</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: 880, background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b' }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill="url(#grid)" />

          {zones.map(z => {
            const c = STATUS_COLORS[z.status] || STATUS_COLORS.safe;
            const isHover = hoveredZone === z.id;
            return (
              <g key={z.id}
                 onMouseEnter={() => setHoveredZone(z.id)}
                 onMouseLeave={() => setHoveredZone(null)}
                 style={{ cursor: 'pointer' }}>
                <rect x={z.x} y={z.y} width={z.w} height={z.h}
                      fill={c.fill} stroke={c.stroke}
                      strokeWidth={isHover ? 3 : 2}
                      opacity={isHover ? 0.95 : 0.7}
                      rx={6} />
                <text x={z.x + 10} y={z.y + 22} fill="#f8fafc" fontSize={14} fontWeight="600">{z.name}</text>
                <text x={z.x + 10} y={z.y + 40} fill={c.stroke} fontSize={11} textTransform="uppercase">{c.label} • {z.id}</text>
              </g>
            );
          })}

          {workers.map(wk => (
            <circle key={wk.id} cx={wk.x} cy={wk.y} r={5}
                    fill={wk.ppeCompliant ? '#38bdf8' : '#f97316'}
                    stroke="#0b1220" strokeWidth={1.5}>
              <title>{wk.id} ({wk.zoneId}) {wk.ppeCompliant ? 'PPE OK' : 'PPE MISSING'}</title>
            </circle>
          ))}
        </svg>
      </div>

      {hoveredZone && (() => {
        const z = zones.find(zz => zz.id === hoveredZone);
        const c = STATUS_COLORS[z.status] || STATUS_COLORS.safe;
        const inZone = workers.filter(w => w.zoneId === z.id);
        return (
          <div style={{ marginTop: 16, padding: 12, background: '#0f172a', border: `1px solid ${c.stroke}`, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ color: c.stroke }}>{z.name} — {c.label}</strong>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Workers in zone: {inZone.length}</span>
            </div>
            <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 13 }}>{z.description}</div>
          </div>
        );
      })()}
    </div>
  );
}

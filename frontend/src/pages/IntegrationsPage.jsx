import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';

// Apply pass 5 — deferred-backlog UI: cameras, wearables, inspection
// checklists, and auto-stop advisories.

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('cameras');
  const [probe, setProbe] = useState(null);
  const [stub, setStub] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [newCl, setNewCl] = useState({ area: '', frequency: 'weekly', items: '' });
  const [advisories, setAdvisories] = useState([]);
  const [adv, setAdv] = useState({ equipment_id: '', zone: '', severity: 'medium', reason: '' });

  const safe = async (fn) => {
    try {
      const { data } = await fn();
      return { ok: true, data };
    } catch (err) {
      return { ok: false, status: err.response?.status, data: err.response?.data || { error: err.message } };
    }
  };

  const loadChecklists = async () => {
    const r = await safe(() => api.get('/integrations/checklists'));
    if (r.ok) setChecklists(r.data?.data || []);
  };
  const loadAdvisories = async () => {
    const r = await safe(() => api.get('/integrations/auto-stop/advisories'));
    if (r.ok) setAdvisories(r.data?.data || []);
  };

  useEffect(() => { loadChecklists(); loadAdvisories(); }, []);

  const probeCameras = async () => setProbe(await safe(() => api.post('/integrations/cameras/ingest', {})));
  const ppeStub = async () => {
    const r = await safe(() => api.post('/integrations/cameras/ppe-stub', {
      zone: 'Line A', brightness: 60, motion_score: 0.4,
      helmet_visible: true, vest_visible: true, glasses_visible: false,
    }));
    setStub(r);
  };
  const probeWearables = async () => setProbe(await safe(() => api.post('/integrations/wearables/enroll', {
    employee_id: 'EMP-1', provider: 'fitbit', device_id: 'dev-' + Date.now(),
  })));

  const submitChecklist = async () => {
    const items = newCl.items ? newCl.items.split('\n').map(s => s.trim()).filter(Boolean) : [];
    const r = await safe(() => api.post('/integrations/checklists', { ...newCl, items }));
    if (r.ok) { setNewCl({ area: '', frequency: 'weekly', items: '' }); loadChecklists(); }
  };
  const runChecklist = async (id) => {
    await safe(() => api.post(`/integrations/checklists/${id}/run`, {
      passed_count: 5, failed_count: 2, findings: 'demo run', reviewer: 'auto',
    }));
    loadChecklists();
  };

  const submitAdvisory = async () => {
    const r = await safe(() => api.post('/integrations/auto-stop/advise', adv));
    if (r.ok) { setAdv({ equipment_id: '', zone: '', severity: 'medium', reason: '' }); loadAdvisories(); }
  };

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}><FiArrowLeft /> Back</button>
      <div className="data-section">
        <div className="data-header"><h2>Integrations & Backlog</h2></div>
        <div style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['cameras', 'wearables', 'checklists', 'auto-stop'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={tab === t ? 'btn-ai' : ''} style={{ padding: '6px 14px' }}>{t}</button>
          ))}
        </div>

        {tab === 'cameras' && (
          <div style={{ padding: 16 }}>
            <button className="btn-ai" onClick={probeCameras}>Probe camera ingest (expects 503)</button>
            <button className="btn-ai" onClick={ppeStub} style={{ marginLeft: 8 }}>Run in-memory PPE stub</button>
            {probe && <pre>{JSON.stringify(probe, null, 2)}</pre>}
            {stub && <pre>{JSON.stringify(stub, null, 2)}</pre>}
          </div>
        )}

        {tab === 'wearables' && (
          <div style={{ padding: 16 }}>
            <button className="btn-ai" onClick={probeWearables}>Probe Fitbit enroll (expects 503 if creds missing)</button>
            {probe && <pre>{JSON.stringify(probe, null, 2)}</pre>}
          </div>
        )}

        {tab === 'checklists' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
              <input placeholder="area" value={newCl.area} onChange={e => setNewCl({ ...newCl, area: e.target.value })} />
              <select value={newCl.frequency} onChange={e => setNewCl({ ...newCl, frequency: e.target.value })}>
                <option>weekly</option><option>daily</option><option>monthly</option>
              </select>
              <textarea placeholder="items (one per line; empty = use default)" value={newCl.items}
                onChange={e => setNewCl({ ...newCl, items: e.target.value })} />
              <button className="btn-ai" onClick={submitChecklist}>Create checklist</button>
            </div>
            <table className="data-table" style={{ marginTop: 16 }}>
              <thead><tr><th>ID</th><th>Area</th><th>Frequency</th><th>Last run</th><th>Items</th><th></th></tr></thead>
              <tbody>
                {checklists.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td><td>{c.area}</td><td>{c.frequency}</td>
                    <td>{c.last_run || '-'}</td>
                    <td>{(c.items || []).length}</td>
                    <td><button onClick={() => runChecklist(c.id)}>Run</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'auto-stop' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
              <input placeholder="equipment_id" value={adv.equipment_id} onChange={e => setAdv({ ...adv, equipment_id: e.target.value })} />
              <input placeholder="zone" value={adv.zone} onChange={e => setAdv({ ...adv, zone: e.target.value })} />
              <select value={adv.severity} onChange={e => setAdv({ ...adv, severity: e.target.value })}>
                <option>low</option><option>medium</option><option>high</option><option>critical</option>
              </select>
              <textarea placeholder="reason" value={adv.reason} onChange={e => setAdv({ ...adv, reason: e.target.value })} />
              <button className="btn-ai" onClick={submitAdvisory}>Record advisory</button>
              <p style={{ color: '#9ca3af' }}>Advisory only — does NOT actuate equipment.</p>
            </div>
            <table className="data-table" style={{ marginTop: 16 }}>
              <thead><tr><th>ID</th><th>Equipment</th><th>Zone</th><th>Severity</th><th>Reason</th><th>When</th></tr></thead>
              <tbody>
                {advisories.map(a => (
                  <tr key={a.id}><td>{a.id}</td><td>{a.equipment_id}</td><td>{a.zone}</td><td>{a.severity}</td><td>{a.reason}</td><td>{a.created_at}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

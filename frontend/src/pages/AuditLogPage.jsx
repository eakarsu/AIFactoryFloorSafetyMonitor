import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { auditLogsAPI } from '../services/api';

export default function AuditLogPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterType) params.entity_type = filterType;
      if (filterAction) params.action = filterAction;
      if (search) params.q = search;
      const { data } = await auditLogsAPI.getAll(params);
      setItems(data.data || []);
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [page, filterType, filterAction, search]);

  useEffect(() => { load(); }, [load]);

  const safeJson = (s) => {
    if (!s) return null;
    try { return JSON.parse(s); } catch { return s; }
  };

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft /> Back to Dashboard
      </button>

      <div className="data-section">
        <div className="data-header">
          <div>
            <h2>Audit Log</h2>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{pagination.total} entries</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-control"
              placeholder="Filter by entity (e.g. Incident)"
              value={filterType}
              onChange={(e) => { setPage(1); setFilterType(e.target.value); }}
              style={{ width: 200 }}
            />
            <select
              className="form-control"
              value={filterAction}
              onChange={(e) => { setPage(1); setFilterAction(e.target.value); }}
              style={{ width: 160 }}
            >
              <option value="">All actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="AI_ANALYZE">AI_ANALYZE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="REGISTER">REGISTER</option>
              <option value="AUTO_CREATE">AUTO_CREATE</option>
              <option value="AUTO_CREATE_PPE">AUTO_CREATE_PPE</option>
              <option value="AI_GLOBAL_ANALYSIS">AI_GLOBAL_ANALYSIS</option>
              <option value="AI_PREDICTIVE_RISK">AI_PREDICTIVE_RISK</option>
            </select>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: 8, top: 10, color: '#999' }} />
              <input
                className="form-control"
                placeholder="Search"
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                style={{ paddingLeft: 28, width: 200 }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="loader" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><h3>No audit entries</h3></div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Entity</th>
                  <th>ID</th>
                  <th>Action</th>
                  <th>Changed By</th>
                  <th>Diff</th>
                </tr>
              </thead>
              <tbody>
                {items.map(row => (
                  <tr key={row.id} onClick={() => setSelected(row)}>
                    <td>{new Date(row.createdAt).toLocaleString()}</td>
                    <td>{row.entity_type}</td>
                    <td>{row.entity_id}</td>
                    <td><span className={`status-badge status-${row.action.toLowerCase()}`}>{row.action}</span></td>
                    <td>{row.changed_by || '-'}</td>
                    <td>
                      <span style={{ fontSize: 11, color: '#666' }}>
                        {row.previous_value ? 'before' : ''} {row.new_value ? '→ after' : ''}
                      </span>
                    </td>
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

        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Audit Entry #{selected.id}</h2>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item"><label>Time</label><div className="value">{new Date(selected.createdAt).toLocaleString()}</div></div>
                  <div className="detail-item"><label>Entity</label><div className="value">{selected.entity_type} #{selected.entity_id}</div></div>
                  <div className="detail-item"><label>Action</label><div className="value">{selected.action}</div></div>
                  <div className="detail-item"><label>Changed By</label><div className="value">{selected.changed_by || '-'}</div></div>
                </div>
                <h4 style={{ marginTop: 16 }}>Before</h4>
                <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 11, overflow: 'auto', maxHeight: 200 }}>{JSON.stringify(safeJson(selected.previous_value), null, 2) || 'null'}</pre>
                <h4>After</h4>
                <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 11, overflow: 'auto', maxHeight: 200 }}>{JSON.stringify(safeJson(selected.new_value), null, 2) || 'null'}</pre>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

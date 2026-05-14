import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiZap, FiX } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import * as apis from '../services/api';
import { featureConfig } from '../services/featureConfig';

export default function FeaturePage({ feature }) {
  const navigate = useNavigate();
  const config = featureConfig[feature];
  const api = apis[config.apiKey];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getAll({ page, limit });
      // Backend returns { data: [...], pagination: {...} } for paginated lists,
      // or a raw array for endpoints like /low-stock.
      if (Array.isArray(data)) {
        setItems(data);
        setPagination({ page: 1, limit: data.length, total: data.length, totalPages: 1 });
      } else if (data && Array.isArray(data.data)) {
        setItems(data.data);
        setPagination(data.pagination || { page, limit, total: data.data.length, totalPages: 1 });
      } else {
        setItems([]);
      }
    } catch (err) {
      setError('Failed to load data');
    }
    setLoading(false);
  }, [api, page]);

  useEffect(() => {
    loadData();
    setSelectedItem(null);
    setShowForm(false);
    setAiResult(null);
  }, [feature, loadData]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setAiResult(null);
  };

  const handleCreate = () => {
    setEditItem(null);
    setFormData(config.defaultValues || {});
    setShowForm(true);
  };

  const handleEdit = (item, e) => {
    e?.stopPropagation();
    setEditItem(item);
    const data = {};
    config.fields.forEach(f => {
      data[f.key] = item[f.key] ?? '';
    });
    setFormData(data);
    setShowForm(true);
  };

  const handleDelete = async (item, e) => {
    e?.stopPropagation();
    if (!confirm(`Delete this ${config.singular}?`)) return;
    try {
      await api.delete(item.id);
      setItems(items.filter(i => i.id !== item.id));
      if (selectedItem?.id === item.id) setSelectedItem(null);
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        const { data } = await api.update(editItem.id, formData);
        setItems(items.map(i => i.id === editItem.id ? data : i));
        if (selectedItem?.id === editItem.id) setSelectedItem(data);
      } else {
        const { data } = await api.create(formData);
        setItems([data, ...items]);
      }
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleAiAnalyze = async (item) => {
    if (!config.hasAI) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data } = await api.analyze(item.id);
      setAiResult(data);
      if (data.success && data.item) {
        setSelectedItem(data.item);
        setItems(items.map(i => i.id === data.item.id ? data.item : i));
      }
    } catch (err) {
      setAiResult({ success: false, error: err.response?.data?.error || 'AI analysis failed' });
    }
    setAiLoading(false);
  };

  if (loading) return <div className="loading-container"><div className="loader"></div></div>;

  // Detail View
  if (selectedItem) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelectedItem(null)}>
          <FiArrowLeft /> Back to {config.title}
        </button>
        <div className="data-section">
          <div className="data-header">
            <h2>{config.getItemTitle ? config.getItemTitle(selectedItem) : `${config.singular} Details`}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {config.hasAI && (
                <button className="btn btn-ai btn-sm" onClick={() => handleAiAnalyze(selectedItem)} disabled={aiLoading}>
                  <FiZap /> {aiLoading ? 'Analyzing...' : 'AI Analysis'}
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={(e) => handleEdit(selectedItem, e)}>
                <FiEdit2 /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(selectedItem, e)}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
          <div className="modal-body">
            <div className="detail-grid">
              {config.fields.map(f => (
                <div key={f.key} className={`detail-item ${f.fullWidth ? 'detail-full' : ''}`}>
                  <label>{f.label}</label>
                  <div className="value">
                    {f.type === 'boolean' ? (selectedItem[f.key] ? 'Yes' : 'No') :
                     f.type === 'select' || f.type === 'enum' ? (
                       <span className={`status-badge status-${selectedItem[f.key]}`}>{String(selectedItem[f.key] || '-').replace(/_/g, ' ')}</span>
                     ) : String(selectedItem[f.key] || '-')}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Analysis Display */}
            {aiLoading && (
              <div className="ai-analysis-container">
                <div className="ai-analysis-loading">
                  <div className="ai-spinner"></div>
                  Running AI analysis with Claude Haiku...
                </div>
              </div>
            )}

            {aiResult && (
              <div className="ai-analysis-container">
                <div className="ai-analysis-header">
                  <div className="ai-icon"><FiZap /></div>
                  <h3>AI Safety Analysis</h3>
                  <span className="model-tag">{aiResult.model || 'Claude Haiku'}</span>
                </div>
                {aiResult.success ? (
                  <div className="ai-analysis-content">
                    <ReactMarkdown>{aiResult.result}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="error-message">{aiResult.error}</div>
                )}
                {aiResult.usage && (
                  <div style={{ marginTop: 12, fontSize: 11, color: '#6d28d9', opacity: 0.6 }}>
                    Tokens: {aiResult.usage.prompt_tokens} in / {aiResult.usage.completion_tokens} out
                  </div>
                )}
              </div>
            )}

            {/* Show existing AI analysis if available */}
            {!aiLoading && !aiResult && selectedItem.aiAnalysis && (
              <div className="ai-analysis-container">
                <div className="ai-analysis-header">
                  <div className="ai-icon"><FiZap /></div>
                  <h3>Previous AI Analysis</h3>
                </div>
                <div className="ai-analysis-content">
                  <ReactMarkdown>{selectedItem.aiAnalysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        {showForm && renderForm()}
      </div>
    );
  }

  function renderForm() {
    return (
      <div className="modal-overlay" onClick={() => setShowForm(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{editItem ? `Edit ${config.singular}` : `New ${config.singular}`}</h2>
            <button className="btn btn-icon btn-secondary" onClick={() => setShowForm(false)}><FiX /></button>
          </div>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              {config.fields.filter(f => !f.readOnly).map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  {f.type === 'select' || f.type === 'enum' ? (
                    <select className="form-control" value={formData[f.key] || ''}
                      onChange={e => setFormData({...formData, [f.key]: e.target.value})}>
                      <option value="">Select...</option>
                      {f.options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea className="form-control" value={formData[f.key] || ''}
                      onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                      required={f.required} />
                  ) : f.type === 'boolean' ? (
                    <div className="form-check">
                      <input type="checkbox" checked={!!formData[f.key]}
                        onChange={e => setFormData({...formData, [f.key]: e.target.checked})} />
                      <label>{f.label}</label>
                    </div>
                  ) : (
                    <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      className="form-control" value={formData[f.key] || ''}
                      onChange={e => setFormData({...formData, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value})}
                      required={f.required}
                      step={f.type === 'number' ? 'any' : undefined} />
                  )}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft /> Back to Dashboard
      </button>

      <div className="data-section">
        <div className="data-header">
          <div>
            <h2>{config.title}</h2>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{pagination.total} records</span>
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            <FiPlus /> New {config.singular}
          </button>
        </div>

        {error && <div className="error-message" style={{ margin: 16 }}>{error}</div>}

        {items.length === 0 ? (
          <div className="empty-state">
            <h3>No {config.title} Found</h3>
            <p>Click the button above to add your first record.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {config.columns.map(c => <th key={c.key}>{c.label}</th>)}
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => handleRowClick(item)}>
                  {config.columns.map(c => (
                    <td key={c.key}>
                      {c.render ? c.render(item[c.key], item) :
                       c.badge ? <span className={`status-badge status-${item[c.key]}`}>{String(item[c.key] || '-').replace(/_/g, ' ')}</span> :
                       String(item[c.key] || '-')}
                    </td>
                  ))}
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-icon btn-secondary btn-xs" onClick={e => handleEdit(item, e)} title="Edit">
                        <FiEdit2 size={14} />
                      </button>
                      <button className="btn btn-icon btn-danger btn-xs" onClick={e => handleDelete(item, e)} title="Delete">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showForm && renderForm()}
    </div>
  );
}

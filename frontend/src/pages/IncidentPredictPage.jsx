import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import api from '../services/api';
import FactoryAIExamples from '../components/FactoryAIExamples';
import FactoryAIResponse from '../components/FactoryAIResponse';
import useFactoryAIRequest from '../components/useFactoryAIRequest';

export default function IncidentPredictPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ zone: '*', daysBack: 90 });
  const [locations, setLocations] = useState([]);
  const [sourceError, setSourceError] = useState('');
  const request = useFactoryAIRequest();
  useEffect(() => {
    const controller = new AbortController();
    api.get('/incidents', { params: { limit: 100 }, signal: controller.signal }).then(({ data }) => {
      if (!Array.isArray(data?.data)) throw new Error('The native incident list returned an invalid response.');
      if (!controller.signal.aborted) setLocations([...new Set(data.data.map(row => row.location).filter(Boolean))]);
    }).catch(error => { if (!controller.signal.aborted) setSourceError(error.response?.data?.error || error.message || 'Could not load saved incident locations.'); });
    return () => controller.abort();
  }, []);
  const fill = index => {
    const zone = locations.includes(form.zone) ? form.zone : (locations[0] || '*');
    setForm({ zone, daysBack: [30, 60, 90][index] }); request.clear();
  };
  const submit = event => {
    event.preventDefault();
    const body = { days_back: Number(form.daysBack) };
    if (form.zone !== '*') body.zone = form.zone;
    request.run(signal => api.post('/ai/incident-predict', body, { signal }));
  };
  return <div>
    <button className="back-btn" onClick={() => navigate('/')}><FiArrowLeft /> Back to Dashboard</button>
    <section className="data-section">
      <div className="data-header"><h2>Incident Prediction</h2></div>
      <form onSubmit={submit} style={{ padding: 16 }}>
        <FactoryAIExamples onFill={fill} disabled={request.loading} />
        <div className="form-grid">
          <label>Zone (optional saved location)
            <select name="zone" value={form.zone} disabled={request.loading} onChange={event => setForm({ ...form, zone: event.target.value })}>
              <option value="*">All saved locations</option>
              {locations.map(location => <option key={location} value={location}>{location}</option>)}
            </select>
          </label>
          <label>Shift (source unavailable)<input name="shift" value="Not recorded on native incidents" readOnly /></label>
          <label>Days Back (7–365)<input name="days_back" type="number" min={7} max={365} step={1} required value={form.daysBack} disabled={request.loading} onChange={event => setForm({ ...form, daysBack: event.target.value })} /></label>
        </div>
        <p>Shift-specific filtering is unavailable because saved incidents have no shift assignment. Example buttons use an actual saved location or all locations.</p>
        {sourceError && <p role="alert">{sourceError} You can review all saved locations; no location is invented.</p>}
        <button type="submit" className="btn btn-ai" disabled={request.loading}><FiAlertTriangle /> {request.loading ? 'Generating…' : 'Generate with OpenRouter'}</button>
        {request.loading && <button type="button" className="btn btn-secondary" onClick={request.cancel}>Cancel</button>}
        <FactoryAIResponse request={request} title="Incident forecast" />
      </form>
    </section>
  </div>;
}

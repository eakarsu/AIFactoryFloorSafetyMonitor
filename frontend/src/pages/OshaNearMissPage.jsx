import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckSquare, FiAlertTriangle } from 'react-icons/fi';
import { aiAPI } from '../services/api';
import FactoryAIExamples from '../components/FactoryAIExamples';
import FactoryAIResponse from '../components/FactoryAIResponse';
import useFactoryAIRequest from '../components/useFactoryAIRequest';
const complianceExamples = [
  { scope: 'facility', focusAreas: 'PPE, hazard communication' },
  { scope: 'facility', focusAreas: 'Machine guarding, training, emergency planning' },
  { scope: 'facility', focusAreas: 'PPE, hazard communication, machine guarding, documented evidence gaps' }
];
const nearMissExamples = [
  { reports: [
    { description: 'Fictional training scenario: a cart stopped before entering a pedestrian crossing.', location: 'Fictional practice crossing', date: '2026-10-01', contributing_factors: 'Fictional training factor: limited sight line' },
    { description: 'Fictional training scenario: a loose cable was noticed before anyone tripped.', location: 'Fictional practice walkway', date: '2026-10-02', contributing_factors: 'Fictional training factor: temporary cable routing' }
  ], windowDays: 30 },
  { reports: [
    { description: 'Fictional training scenario: a team spotted a blocked evacuation aisle during a practice walkthrough.', location: 'Fictional practice evacuation aisle', date: '2026-10-03', contributing_factors: 'Fictional training factor: misplaced training supplies' },
    { description: 'Fictional training scenario: an unsecured container was caught before it fell.', location: 'Fictional practice storage shelf', date: '2026-10-04', contributing_factors: 'Fictional training factor: unsecured practice container' }
  ], windowDays: 60 },
  { reports: [
    { description: 'Fictional training scenario: a guard was found loose before a simulated machine startup.', location: 'Fictional practice machine area', date: '2026-10-05', contributing_factors: 'Fictional training factor: loose training guard' },
    { description: 'Fictional training scenario: a leaking training container was contained before reaching a drain.', location: 'Fictional practice containment area', date: '2026-10-06', contributing_factors: 'Fictional training factor: damaged practice container' },
    { description: 'Fictional training scenario: a visibility issue was identified before a practice vehicle maneuver.', location: 'Fictional practice vehicle route', date: '2026-10-07', contributing_factors: 'Fictional training factor: obstructed practice view' }
  ], windowDays: 90 }
];
export default function OshaNearMissPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('osha');
  const [compliance, setCompliance] = useState({ scope: 'facility', focusAreas: '' });
  const [nearMiss, setNearMiss] = useState({ reports: [], windowDays: 90 });
  const request = useFactoryAIRequest();
  const changeTab = value => { setTab(value); request.clear(); };
  const fill = index => {
    if (tab === 'osha') setCompliance({ ...complianceExamples[index] });
    else setNearMiss({ ...nearMissExamples[index], reports: nearMissExamples[index].reports.map(report => ({ ...report })) });
    request.clear();
  };
  const submit = event => {
    event.preventDefault();
    if (tab === 'osha') {
      const focusAreas = compliance.focusAreas.split(',').map(value => value.trim()).filter(Boolean);
      request.run(signal => aiAPI.oshaComplianceCheck({ scope: compliance.scope, focus_areas: focusAreas }, { signal }));
    } else {
      const body = { window_days: Number(nearMiss.windowDays) };
      const reports = nearMiss.reports.map(report => Object.fromEntries(Object.entries(report).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value)));
      if (reports.length) body.reports = reports;
      request.run(signal => aiAPI.nearMissAnalyze(body, { signal }));
    }
  };
  return <div>
    <button className="back-btn" onClick={() => navigate('/')}><FiArrowLeft /> Back to Dashboard</button>
    <section className="data-section">
      <div className="data-header"><h2>OSHA Compliance &amp; Near-Miss Analysis</h2></div>
      <div style={{ display: 'flex', gap: 8, padding: 16 }}>
        <button type="button" className="btn btn-ai" disabled={request.loading} onClick={() => changeTab('osha')}><FiCheckSquare /> OSHA Compliance Check</button>
        <button type="button" className="btn btn-ai" disabled={request.loading} onClick={() => changeTab('nearmiss')}><FiAlertTriangle /> Near-Miss Trends</button>
      </div>
      <form onSubmit={submit} style={{ padding: 16 }}>
        <FactoryAIExamples onFill={fill} disabled={request.loading} training={tab === 'nearmiss'} />
        <div className="form-grid">
          {tab === 'osha' ? <>
            <label>Scope<select name="scope" value={compliance.scope} disabled={request.loading} onChange={event => setCompliance({ ...compliance, scope: event.target.value })}>
              <option value="facility">Facility</option><option value="department" disabled>Department — source attribution unavailable</option>
            </select></label>
            <label>Department (source unavailable)<input name="department" value="Not recorded on native incidents" readOnly /></label>
            <label>Focus Areas (comma-separated, optional)<input name="focus_areas" value={compliance.focusAreas} disabled={request.loading} onChange={event => setCompliance({ ...compliance, focusAreas: event.target.value })} /></label>
          </> : <>
            <div style={{ gridColumn: '1 / -1' }}>
              <h3>Optional submitted reports</h3>
              <p>No submitted reports uses actual saved near-misses. Submitted practice descriptions are not saved as incident facts.</p>
              {nearMiss.reports.map((report, index) => <fieldset key={index} data-report-index={index} disabled={request.loading} style={{ marginBottom: 12 }}>
                <legend>Report {index + 1}</legend>
                <label>Description<textarea name={`reports.${index}.description`} required maxLength={1000} value={report.description} onChange={event => setNearMiss({ ...nearMiss, reports: nearMiss.reports.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row) })} /></label>
                <label>Location (optional)<input name={`reports.${index}.location`} value={report.location} onChange={event => setNearMiss({ ...nearMiss, reports: nearMiss.reports.map((row, rowIndex) => rowIndex === index ? { ...row, location: event.target.value } : row) })} /></label>
                <label>Date (optional)<input name={`reports.${index}.date`} type="date" value={report.date} onChange={event => setNearMiss({ ...nearMiss, reports: nearMiss.reports.map((row, rowIndex) => rowIndex === index ? { ...row, date: event.target.value } : row) })} /></label>
                <label>Contributing factors (optional)<input name={`reports.${index}.contributing_factors`} value={report.contributing_factors} onChange={event => setNearMiss({ ...nearMiss, reports: nearMiss.reports.map((row, rowIndex) => rowIndex === index ? { ...row, contributing_factors: event.target.value } : row) })} /></label>
                <button type="button" className="btn btn-secondary" onClick={() => setNearMiss({ ...nearMiss, reports: nearMiss.reports.filter((_, rowIndex) => rowIndex !== index) })}>Remove report {index + 1}</button>
              </fieldset>)}
              <button type="button" className="btn btn-secondary" disabled={request.loading || nearMiss.reports.length >= 100} onClick={() => setNearMiss({ ...nearMiss, reports: [...nearMiss.reports, { description: '', location: '', date: '', contributing_factors: '' }] })}>Add report</button>
              <button type="button" className="btn btn-secondary" disabled={request.loading} onClick={() => setNearMiss({ ...nearMiss, reports: [] })}>Use saved near-misses</button>
            </div>
            <label>Window (days, 7–365)<input name="window_days" type="number" min={7} max={365} step={1} required value={nearMiss.windowDays} disabled={request.loading} onChange={event => setNearMiss({ ...nearMiss, windowDays: event.target.value })} /></label>
          </>}
        </div>
        <p>{tab === 'osha' ? 'Saved incidents have no department attribution. The facility review is an advisory analysis of actual saved source data, not a certified audit.' : 'Example text is fictional training input, separate from saved incident facts. Clear it to review stored near-misses. No incident or safety approval is created.'}</p>
        <button type="submit" className="btn btn-ai" disabled={request.loading}>{request.loading ? 'Generating…' : 'Generate with OpenRouter'}</button>
        {request.loading && <button type="button" className="btn btn-secondary" onClick={request.cancel}>Cancel</button>}
        <FactoryAIResponse request={request} title={tab === 'osha' ? 'Compliance advisory review' : 'Near-miss trend review'} />
      </form>
    </section>
  </div>;
}

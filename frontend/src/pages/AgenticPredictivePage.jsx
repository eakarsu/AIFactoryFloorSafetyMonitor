import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiActivity, FiTool } from 'react-icons/fi';
import { aiAPI } from '../services/api';
import FactoryAIExamples from '../components/FactoryAIExamples';
import FactoryAIResponse from '../components/FactoryAIResponse';
import useFactoryAIRequest from '../components/useFactoryAIRequest';
const officerExamples = [
  { focus: 'Review documented incidents and propose immediate safety checks.', windowDays: 30 },
  { focus: 'Plan team training and PPE follow-up using the saved safety records.', windowDays: 60 },
  { focus: 'Prepare a detailed intervention plan with source limitations, owners and review metrics.', windowDays: 90 }
];
const maintenanceExamples = [
  { equipmentFocus: 'Prioritize equipment with failed or overdue saved inspections.', windowDays: 30 },
  { equipmentFocus: 'Review inspection trends and plan preventive work for the maintenance team.', windowDays: 90 },
  { equipmentFocus: 'Prepare a detailed maintenance review using actual inspected assets; flag undocumented evidence.', windowDays: 180 }
];
export default function AgenticPredictivePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('agentic');
  const [officer, setOfficer] = useState({ focus: 'overall safety performance', windowDays: 30 });
  const [maintenance, setMaintenance] = useState({ equipmentFocus: '', windowDays: 90 });
  const request = useFactoryAIRequest();
  const changeTab = value => { setTab(value); request.clear(); };
  const fill = index => {
    if (tab === 'agentic') setOfficer({ ...officerExamples[index] }); else setMaintenance({ ...maintenanceExamples[index] });
    request.clear();
  };
  const submit = event => {
    event.preventDefault();
    if (tab === 'agentic') request.run(signal => aiAPI.agenticSafetyOfficer({ focus: officer.focus, window_days: Number(officer.windowDays) }, { signal }));
    else request.run(signal => aiAPI.predictiveMaintenance({ equipment_focus: maintenance.equipmentFocus, window_days: Number(maintenance.windowDays) }, { signal }));
  };
  return <div>
    <button className="back-btn" onClick={() => navigate(-1)}><FiArrowLeft /> Back</button>
    <section className="data-section">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button type="button" className="btn-ai" disabled={request.loading} onClick={() => changeTab('agentic')}><FiActivity /> Agentic Safety Officer</button>
        <button type="button" className="btn-ai" disabled={request.loading} onClick={() => changeTab('predictive')}><FiTool /> Predictive Maintenance</button>
      </div>
      <form onSubmit={submit} style={{ padding: 16 }}>
        <h2>{tab === 'agentic' ? 'Agentic Safety Officer' : 'Predictive Maintenance'}</h2>
        <p>{tab === 'agentic' ? 'Review saved incidents, risk assessments and PPE inventory before planning interventions.' : 'Review actual equipment inspections and recent incidents before planning maintenance.'}</p>
        <FactoryAIExamples onFill={fill} disabled={request.loading} />
        <div className="form-grid">
          <label>Department (source unavailable)<input name="department" value="Not recorded on native incidents" readOnly /></label>
          {tab === 'agentic' ? <>
            <label>Focus (optional)<input name="focus" value={officer.focus} disabled={request.loading} onChange={event => setOfficer({ ...officer, focus: event.target.value })} /></label>
            <label>Window (days, 7–365)<input name="window_days" type="number" min={7} max={365} step={1} required value={officer.windowDays} disabled={request.loading} onChange={event => setOfficer({ ...officer, windowDays: event.target.value })} /></label>
          </> : <>
            <label>Equipment focus (optional planning context)<input name="equipment_focus" value={maintenance.equipmentFocus} disabled={request.loading} onChange={event => setMaintenance({ ...maintenance, equipmentFocus: event.target.value })} /></label>
            <label>Window (days, 14–365)<input name="window_days" type="number" min={14} max={365} step={1} required value={maintenance.windowDays} disabled={request.loading} onChange={event => setMaintenance({ ...maintenance, windowDays: event.target.value })} /></label>
          </>}
        </div>
        <p>Department-specific filtering is unavailable because saved incidents have no department assignment. Planning text does not create inspection findings or asset IDs.</p>
        <button type="submit" className="btn btn-ai" disabled={request.loading}>{request.loading ? 'Generating…' : 'Generate with OpenRouter'}</button>
        {request.loading && <button type="button" className="btn btn-secondary" onClick={request.cancel}>Cancel</button>}
        <FactoryAIResponse request={request} title={tab === 'agentic' ? 'Safety intervention plan' : 'Maintenance review'} />
      </form>
    </section>
  </div>;
}

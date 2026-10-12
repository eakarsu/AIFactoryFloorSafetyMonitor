import React from 'react';
import FormattedAIReport from './FormattedAIReport';
export default function FactoryAIResponse({ request, title }) {
  return <>
    {request.error && <div role="alert" className="error-message" style={{ marginTop: 12 }}>{request.error}</div>}
    {request.status && <p role="status">{request.status}</p>}
    {request.result && !request.loading && <section className="ai-analysis-container" style={{ marginTop: 16 }}>
      <h3>{title}</h3>
      {request.result.analysis_id && <p>Saved native report #{request.result.analysis_id} · {request.result.model || 'OpenRouter'}</p>}
      {request.result.filters && <FormattedAIReport response={request.result.filters} />}
      {request.result.stats && <FormattedAIReport response={request.result.stats} />}
      {typeof request.result.incident_count === 'number' && <p>Source incidents: {request.result.incident_count}</p>}
      {typeof request.result.risk_assessment_count === 'number' && <p>Source risk assessments: {request.result.risk_assessment_count}</p>}
      {typeof request.result.ppe_item_count === 'number' && <p>Source PPE items: {request.result.ppe_item_count}</p>}
      {typeof request.result.report_count === 'number' && <p>Reports reviewed: {request.result.report_count}</p>}
      {request.result.message && <p>{request.result.message}</p>}
      <FormattedAIReport response={request.result.parsed ?? request.result.predictions ?? request.result.result} />
      <p>AI advisory report. Review actual source records and safety requirements before taking action.</p>
    </section>}
  </>;
}

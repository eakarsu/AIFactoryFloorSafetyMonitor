import React from 'react';
const labels = ['Quick review', 'Team planning', 'Detailed review'];
export default function FactoryAIExamples({ onFill, disabled = false, training = false }) {
  return <div style={{ width: '100%', marginBottom: 12 }}>
    <p>Fills all editable AI fields, including optional inputs. {training ? 'Descriptions are clearly fictional training scenarios; no incident is created.' : 'Saved source references remain genuine.'} Generate runs separately.</p>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{labels.map((label, index) =>
      <button key={label} type="button" className="btn btn-secondary" disabled={disabled} onClick={() => onFill(index)}>Demo AI · {label}</button>
    )}</div>
  </div>;
}

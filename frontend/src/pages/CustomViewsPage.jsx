import React from 'react';
import HazardZoneMap from '../components/HazardZoneMap';
import IncidentHeatmap from '../components/IncidentHeatmap';
import IncidentReportPDF from '../components/IncidentReportPDF';
import OSHA300Exporter from '../components/OSHA300Exporter';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#f8fafc', fontSize: 28 }}>Floor Analytics</h1>
        <p style={{ marginTop: 6, color: '#94a3b8', fontSize: 14 }}>
          Bespoke factory floor safety views — interactive hazard zone map, incident heatmap, incident PDF reports, and OSHA 300 export.
        </p>
      </header>

      <section style={{ marginBottom: 32 }}>
        <HazardZoneMap />
      </section>

      <section style={{ marginBottom: 32 }}>
        <IncidentHeatmap />
      </section>

      <section style={{ marginBottom: 32 }}>
        <IncidentReportPDF />
      </section>

      <section>
        <OSHA300Exporter />
      </section>
    </div>
  );
}

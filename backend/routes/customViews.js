// Custom Views routes for AI Factory Floor Safety Monitor
// Provides synthesized data for HazardZoneMap and IncidentHeatmap
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

// Authentication is optional; mount with or without an authenticated middleware
const { authenticateToken } = (() => {
  try { return require('../src/middleware/auth'); } catch (_) { return { authenticateToken: (req, _res, next) => next() }; }
})();

// Try to access Sequelize models if available
let Models = null;
try { Models = require('../src/models'); } catch (_) { Models = null; }

// Deterministic pseudo-random helper so the synthesized data is stable per request shape
function seed(n) {
  let x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

// GET /api/custom-views/hazard-zone-map
// Returns SVG-ready factory floor zones and live worker positions per zone
router.get('/hazard-zone-map', authenticateToken, (req, res) => {
  const zones = [
    { id: 'Z1', name: 'Assembly Line A',  x: 40,  y: 40,  w: 220, h: 140, status: 'safe',    description: 'Routine assembly operations, PPE compliant.' },
    { id: 'Z2', name: 'Welding Bay',      x: 280, y: 40,  w: 180, h: 140, status: 'hazard',  description: 'Active arc welding. Fire watch required.' },
    { id: 'Z3', name: 'Paint Shop',       x: 480, y: 40,  w: 180, h: 140, status: 'caution', description: 'VOC vapors present. Mandatory respirators.' },
    { id: 'Z4', name: 'Chemical Storage', x: 40,  y: 200, w: 180, h: 140, status: 'hazard',  description: 'HazMat storage. Restricted access only.' },
    { id: 'Z5', name: 'CNC Shop',         x: 240, y: 200, w: 200, h: 140, status: 'caution', description: 'Sharp tooling. Eye protection mandatory.' },
    { id: 'Z6', name: 'Warehouse',        x: 460, y: 200, w: 200, h: 140, status: 'safe',    description: 'Pallet movement; forklift corridors clear.' },
    { id: 'Z7', name: 'Quality Control',  x: 40,  y: 360, w: 200, h: 120, status: 'safe',    description: 'Lab inspection, all checks nominal.' },
    { id: 'Z8', name: 'Maintenance Bay',  x: 260, y: 360, w: 200, h: 120, status: 'caution', description: 'LOTO procedure in effect on Line B.' },
    { id: 'Z9', name: 'Shipping Dock',    x: 480, y: 360, w: 180, h: 120, status: 'hazard',  description: 'Forklift backing alarms; pedestrians clear.' },
  ];

  // Place worker dots within each zone deterministically
  const workers = [];
  let wid = 1;
  zones.forEach((z, zi) => {
    const base = z.status === 'hazard' ? 2 : z.status === 'caution' ? 4 : 5;
    const count = base + Math.floor(seed(zi + 7) * 3);
    for (let i = 0; i < count; i++) {
      const padX = 14, padY = 14;
      const px = z.x + padX + seed(zi * 11 + i * 3) * (z.w - padX * 2);
      const py = z.y + padY + seed(zi * 17 + i * 5) * (z.h - padY * 2);
      workers.push({
        id: `W-${String(wid++).padStart(3, '0')}`,
        zoneId: z.id,
        x: Math.round(px),
        y: Math.round(py),
        ppeCompliant: seed(zi + i * 2) > 0.18,
      });
    }
  });

  const summary = {
    zones: zones.length,
    workers: workers.length,
    hazardZones: zones.filter(z => z.status === 'hazard').length,
    cautionZones: zones.filter(z => z.status === 'caution').length,
    safeZones: zones.filter(z => z.status === 'safe').length,
    ppeNonCompliant: workers.filter(w => !w.ppeCompliant).length,
    floorWidth: 700,
    floorHeight: 510,
    generatedAt: new Date().toISOString(),
  };

  res.json({ success: true, summary, zones, workers });
});

// GET /api/custom-views/incident-heatmap
// Returns a zone x shift incident count matrix for the heatmap grid
router.get('/incident-heatmap', authenticateToken, (req, res) => {
  const shifts = ['Morning', 'Afternoon', 'Night'];
  const zones = [
    'Assembly Line A', 'Welding Bay', 'Paint Shop',
    'Chemical Storage', 'CNC Shop', 'Warehouse',
    'Quality Control', 'Maintenance Bay', 'Shipping Dock'
  ];

  // Generate matrix of incident counts
  const matrix = zones.map((zone, zi) =>
    shifts.map((shift, si) => {
      // Hazardous zones (welding, chemical, shipping) skew higher; night shift skews higher
      const danger = (zi === 1 || zi === 3 || zi === 8) ? 1.6 : 1.0;
      const shiftMul = si === 2 ? 1.5 : si === 1 ? 1.1 : 0.8;
      const base = Math.round(seed(zi * 13 + si * 29) * 9 * danger * shiftMul);
      return { zone, shift, count: base };
    })
  );

  // Flatten to cells (for grid rendering) and compute aggregates
  const cells = matrix.flat();
  const max = cells.reduce((m, c) => Math.max(m, c.count), 0);
  const total = cells.reduce((s, c) => s + c.count, 0);
  const byZone = zones.map((z, i) => ({ zone: z, total: matrix[i].reduce((s, c) => s + c.count, 0) }));
  const byShift = shifts.map((s, j) => ({ shift: s, total: matrix.reduce((sum, row) => sum + row[j].count, 0) }));

  res.json({
    success: true,
    shifts,
    zones,
    matrix,
    cells,
    summary: {
      total,
      max,
      mostIncidentsZone: byZone.sort((a, b) => b.total - a.total)[0],
      mostIncidentsShift: byShift.sort((a, b) => b.total - a.total)[0],
      byZone,
      byShift,
      generatedAt: new Date().toISOString(),
    }
  });
});

// ============================================================
// Helper: fetch incidents list (DB-backed, fallback to mock)
// ============================================================
async function fetchIncidents({ year } = {}) {
  if (Models && Models.Incident) {
    try {
      const all = await Models.Incident.findAll({ order: [['date', 'DESC']], limit: 500 });
      let rows = all.map(r => r.toJSON());
      if (year) {
        rows = rows.filter(r => {
          const d = r.date ? new Date(r.date) : null;
          return d && d.getUTCFullYear() === Number(year);
        });
      }
      if (rows.length > 0) return rows;
    } catch (_) { /* fall through to mock */ }
  }
  // Fallback synthesized incidents
  const types = ['injury', 'near_miss', 'property_damage', 'environmental', 'fire', 'chemical_spill'];
  const severities = ['minor', 'moderate', 'major', 'critical'];
  const locations = ['Welding Bay', 'Paint Shop', 'Chemical Storage', 'CNC Shop', 'Shipping Dock', 'Maintenance Bay', 'Assembly Line A', 'Warehouse'];
  const witnesses = ['J. Rivera', 'A. Patel', 'M. Chen', 'S. Okafor', 'L. Garcia'];
  const causes = [
    'Inadequate PPE adherence and missing fire watch protocol.',
    'Worn machine guarding leading to pinch-point exposure.',
    'Improper chemical storage labeling in violation of HCS.',
    'Failure to perform pre-shift inspection on lift equipment.',
    'Insufficient hazard communication during shift change.',
  ];
  const corrections = [
    'Retrained crew on PPE SOP; added daily PPE huddle.',
    'Replaced guarding; LOTO refresher scheduled.',
    'Relabeled containers per GHS; HazCom audit logged.',
    'Implemented mandatory pre-shift checklist with sign-off.',
    'Updated shift handover template; floor walk added.',
  ];
  const y = year ? Number(year) : new Date().getUTCFullYear();
  const list = [];
  for (let i = 1; i <= 12; i++) {
    const t = types[i % types.length];
    const sev = severities[(i + 1) % severities.length];
    const dateIso = new Date(Date.UTC(y, (i - 1) % 12, ((i * 3) % 27) + 1, 9 + (i % 6), 15)).toISOString();
    list.push({
      id: 1000 + i,
      incidentNumber: `INC-${y}-${String(i).padStart(4, '0')}`,
      title: `${t.replace('_', ' ')} at ${locations[i % locations.length]}`,
      description: `Synthesized incident #${i} of ${y} demonstrating recordable safety event reporting.`,
      type: t,
      severity: sev,
      location: locations[i % locations.length],
      reportedBy: 'Safety Officer',
      assignedTo: 'EHS Manager',
      status: i % 4 === 0 ? 'open' : 'investigating',
      date: dateIso,
      rootCause: causes[i % causes.length],
      correctiveAction: corrections[i % corrections.length],
      witnesses: [witnesses[i % witnesses.length], witnesses[(i + 2) % witnesses.length]].join(', '),
    });
  }
  return list;
}

// GET /api/custom-views/incidents — small picker list for UI (id + summary)
router.get('/incidents', authenticateToken, async (req, res) => {
  try {
    const list = await fetchIncidents({});
    const items = list.map(r => ({
      id: r.id,
      incidentNumber: r.incidentNumber || `INC-${r.id}`,
      title: r.title || '(untitled)',
      type: r.type,
      severity: r.severity,
      location: r.location,
      date: r.date,
    }));
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to load incidents' });
  }
});

// ============================================================
// POST /api/custom-views/incident-report?id=N
// Returns a PDF with date, location, type, severity, witnesses,
// root cause, and corrective actions for the requested incident.
// ============================================================
router.post('/incident-report', authenticateToken, async (req, res) => {
  try {
    const idParam = req.query.id || (req.body && req.body.id);
    const id = idParam ? Number(idParam) : null;

    const list = await fetchIncidents({});
    let incident = null;
    if (id) incident = list.find(r => Number(r.id) === id) || null;
    if (!incident) incident = list[0]; // graceful default if id not found

    if (!incident) return res.status(404).json({ success: false, error: 'No incidents available' });

    const witnesses = incident.witnesses ||
      (incident.reportedBy ? `${incident.reportedBy} (reporter)` : 'Not recorded');
    const rootCause = incident.rootCause || 'Pending investigation; root cause analysis in progress.';
    const corrective = incident.correctiveAction || 'Awaiting corrective action plan from EHS committee.';
    const dateStr = incident.date ? new Date(incident.date).toUTCString() : 'Unknown';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="incident_${incident.incidentNumber || incident.id}.pdf"`);

    const doc = new PDFDocument({ size: 'LETTER', margin: 54 });
    doc.pipe(res);

    // Header band
    doc.rect(0, 0, doc.page.width, 70).fill('#0f172a');
    doc.fillColor('#f8fafc').fontSize(20).font('Helvetica-Bold')
       .text('Factory Floor Incident Report', 54, 24);
    doc.fontSize(10).font('Helvetica').fillColor('#94a3b8')
       .text('AI Factory Floor Safety Monitor  -  OSHA Compliance Documentation', 54, 50);

    doc.moveDown(3);
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(13)
       .text(`Incident: ${incident.incidentNumber || incident.id}`, 54, 100);
    doc.font('Helvetica').fontSize(11).fillColor('#1e293b')
       .text(incident.title || 'Untitled incident', { width: 500 });

    // Two-column metadata
    const yStart = doc.y + 12;
    const rows = [
      ['Date', dateStr],
      ['Location', incident.location || 'Unknown'],
      ['Type', String(incident.type || 'N/A').replace(/_/g, ' ')],
      ['Severity', String(incident.severity || 'N/A').toUpperCase()],
      ['Status', String(incident.status || 'open').toUpperCase()],
      ['Reported By', incident.reportedBy || 'Unknown'],
      ['Assigned To', incident.assignedTo || 'Unassigned'],
      ['Witnesses', witnesses],
    ];
    let y = yStart;
    rows.forEach(([k, v]) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#475569').text(k, 54, y, { width: 110 });
      doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(String(v), 170, y, { width: 380 });
      y += 18;
    });

    doc.moveTo(54, y + 6).lineTo(558, y + 6).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
    y += 18;

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Description', 54, y);
    y = doc.y + 4;
    doc.font('Helvetica').fontSize(10).fillColor('#1e293b')
       .text(incident.description || 'No description provided.', 54, y, { width: 500 });
    y = doc.y + 14;

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#b91c1c').text('Root Cause', 54, y);
    y = doc.y + 4;
    doc.font('Helvetica').fontSize(10).fillColor('#1e293b').text(rootCause, 54, y, { width: 500 });
    y = doc.y + 14;

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#15803d').text('Corrective Actions', 54, y);
    y = doc.y + 4;
    doc.font('Helvetica').fontSize(10).fillColor('#1e293b').text(corrective, 54, y, { width: 500 });

    // Footer
    doc.fontSize(8).fillColor('#94a3b8')
       .text(`Generated ${new Date().toUTCString()} - Factory Safety Monitor`, 54, doc.page.height - 50, { width: 504, align: 'center' });

    doc.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ success: false, error: err.message || 'Failed to generate report' });
    else res.end();
  }
});

// ============================================================
// GET /api/custom-views/osha-300?year=YYYY&format=csv|pdf
// Returns an OSHA Form 300 log (CSV or PDF) listing recordable
// incidents for the year.
// ============================================================
const OSHA_RECORDABLE_TYPES = new Set(['injury', 'fire', 'chemical_spill', 'environmental']);

function buildOsha300Rows(incidents) {
  return incidents
    .filter(i => OSHA_RECORDABLE_TYPES.has(i.type))
    .map((i, idx) => {
      const sev = String(i.severity || '').toLowerCase();
      const death = sev === 'critical' ? 'X' : '';
      const daysAway = sev === 'major' || sev === 'critical' ? 'X' : '';
      const jobTransfer = sev === 'moderate' ? 'X' : '';
      const otherRecordable = sev === 'minor' ? 'X' : '';
      const d = i.date ? new Date(i.date) : new Date();
      return {
        caseNo: idx + 1,
        employeeName: i.reportedBy || 'Worker',
        jobTitle: 'Production Operator',
        dateOfInjury: d.toISOString().slice(0, 10),
        whereOccurred: i.location || 'Factory Floor',
        describeInjury: `${String(i.type || '').replace(/_/g, ' ')} - ${i.title || 'incident'}`,
        classification: { death, daysAway, jobTransfer, otherRecordable },
        daysAwayCount: sev === 'critical' ? 30 : sev === 'major' ? 14 : sev === 'moderate' ? 5 : 0,
        jobTransferDays: sev === 'moderate' ? 7 : 0,
        injuryType: i.type === 'injury' ? 'Injury' :
                    i.type === 'fire' ? 'Burn (fire)' :
                    i.type === 'chemical_spill' ? 'Skin Disorder (chemical)' :
                    i.type === 'environmental' ? 'Respiratory Condition' : 'Other',
      };
    });
}

router.get('/osha-300', authenticateToken, async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getUTCFullYear();
    const fmt = String(req.query.format || 'csv').toLowerCase();

    const incidents = await fetchIncidents({ year });
    const rows = buildOsha300Rows(incidents);

    if (fmt === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="osha300_${year}.pdf"`);

      const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margin: 36 });
      doc.pipe(res);

      doc.rect(0, 0, doc.page.width, 56).fill('#0f172a');
      doc.fillColor('#f8fafc').fontSize(16).font('Helvetica-Bold')
         .text(`OSHA Form 300 - Log of Work-Related Injuries and Illnesses (${year})`, 36, 18);
      doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
         .text('Establishment: AI Factory Floor Safety Monitor', 36, 40);

      // Table header
      const headers = ['Case', 'Employee', 'Job Title', 'Date', 'Where', 'Describe', 'D', 'DA', 'JT', 'Oth', 'Days', 'Type'];
      const widths  = [ 30,    90,         70,         60,     90,      150,       18,  20,  20,  22,  30,    66];
      let x = 36, yPos = 72;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
      headers.forEach((h, i) => { doc.text(h, x, yPos, { width: widths[i] }); x += widths[i]; });
      doc.moveTo(36, yPos + 14).lineTo(doc.page.width - 36, yPos + 14).strokeColor('#94a3b8').stroke();

      yPos += 20;
      doc.font('Helvetica').fontSize(7.5).fillColor('#1e293b');
      if (rows.length === 0) {
        doc.text(`No recordable incidents for ${year}.`, 36, yPos);
      } else {
        rows.forEach(r => {
          x = 36;
          const cells = [
            String(r.caseNo),
            r.employeeName, r.jobTitle, r.dateOfInjury, r.whereOccurred, r.describeInjury,
            r.classification.death, r.classification.daysAway, r.classification.jobTransfer, r.classification.otherRecordable,
            String(r.daysAwayCount), r.injuryType,
          ];
          cells.forEach((c, i) => { doc.text(c, x, yPos, { width: widths[i] }); x += widths[i]; });
          yPos += 22;
          if (yPos > doc.page.height - 60) { doc.addPage({ size: 'LETTER', layout: 'landscape', margin: 36 }); yPos = 60; }
        });
      }
      doc.end();
      return;
    }

    // Default: CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="osha300_${year}.csv"`);
    const header = [
      'Case No', 'Employee Name', 'Job Title', 'Date of Injury', 'Where Event Occurred',
      'Describe Injury or Illness',
      'Death (G)', 'Days Away (H)', 'Job Transfer (I)', 'Other Recordable (J)',
      'Days Away From Work (K)', 'Days on Job Transfer (L)',
      'Injury Type (M)'
    ];
    const lines = [header.join(',')];
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    if (rows.length === 0) {
      lines.push([1, 'N/A', 'N/A', `${year}-01-01`, 'N/A', `No recordable incidents for ${year}`, '', '', '', '', 0, 0, ''].map(esc).join(','));
    } else {
      rows.forEach(r => {
        lines.push([
          r.caseNo, r.employeeName, r.jobTitle, r.dateOfInjury, r.whereOccurred, r.describeInjury,
          r.classification.death, r.classification.daysAway, r.classification.jobTransfer, r.classification.otherRecordable,
          r.daysAwayCount, r.jobTransferDays, r.injuryType
        ].map(esc).join(','));
      });
    }
    res.send(lines.join('\n'));
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ success: false, error: err.message || 'Failed to export OSHA 300' });
    else res.end();
  }
});

module.exports = router;

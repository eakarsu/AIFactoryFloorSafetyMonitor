const express = require('express');
const router = express.Router();

let rows = [
  { id: 1, lotoId: 'LOTO-448', equipmentName: 'Press Line 2', department: 'Stamping', energySources: 'Electrical, pneumatic', authorizedEmployee: 'R. Gomez', verificationStatus: 'pending_verify', riskLevel: 'high', status: 'active' },
  { id: 2, lotoId: 'LOTO-451', equipmentName: 'Mixer M-14', department: 'Coatings', energySources: 'Electrical, hydraulic', authorizedEmployee: 'A. Iqbal', verificationStatus: 'verified', riskLevel: 'medium', status: 'released' },
];
const nextId = () => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

router.get('/', (req, res) => res.json({ data: rows, pagination: { page: 1, limit: rows.length, total: rows.length, totalPages: 1 } }));
router.post('/', (req, res) => {
  const row = { id: nextId(), ...req.body };
  rows.unshift(row);
  res.status(201).json(row);
});
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = rows.findIndex((row) => row.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  rows[idx] = { ...rows[idx], ...req.body, id };
  res.json(rows[idx]);
});
router.delete('/:id', (req, res) => {
  rows = rows.filter((row) => row.id !== Number(req.params.id));
  res.json({ message: 'deleted' });
});

module.exports = router;

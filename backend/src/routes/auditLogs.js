const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { AuditLog } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * GET /api/audit-logs — paginated list of audit log entries.
 * Query: ?page=1&limit=20&entity_type=Incident&action=UPDATE&q=search
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.entity_type) where.entity_type = req.query.entity_type;
    if (req.query.action) where.action = req.query.action;
    if (req.query.changed_by) where.changed_by = req.query.changed_by;
    if (req.query.q) {
      where[Op.or] = [
        { entity_type: { [Op.iLike]: `%${req.query.q}%` } },
        { action: { [Op.iLike]: `%${req.query.q}%` } },
        { changed_by: { [Op.iLike]: `%${req.query.q}%` } }
      ];
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/audit-logs/:id — single audit entry detail.
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await AuditLog.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Audit entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

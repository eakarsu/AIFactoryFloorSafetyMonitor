const models = require('../models');

/**
 * Log an audit event to the audit_logs table.
 * @param {string} entity_type - e.g. 'Incident', 'PPEDetection'
 * @param {number} entity_id - the primary key of the affected record
 * @param {string} action - e.g. 'CREATE', 'UPDATE', 'DELETE', 'ANALYZE'
 * @param {string} changed_by - identifier of the user who made the change
 * @param {object|null} previousValue - snapshot before change (optional)
 * @param {object|null} newValue - snapshot after change (optional)
 */
async function logAudit(entity_type, entity_id, action, changed_by, previousValue = null, newValue = null) {
  try {
    await models.AuditLog.create({
      entity_type,
      entity_id,
      action,
      changed_by: changed_by || 'system',
      previous_value: previousValue ? JSON.stringify(previousValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null
    });
  } catch (err) {
    // Audit failures should not break main flows — log to console only
    console.error('[AuditLog] Failed to write audit entry:', err.message);
  }
}

module.exports = { logAudit };

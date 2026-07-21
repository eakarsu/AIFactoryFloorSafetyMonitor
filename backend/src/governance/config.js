module.exports = {
  caseType: 'plant_safety_intervention', initialState: 'observed',
  states: ['observed', 'triaged', 'operator_acknowledged', 'work_ordered', 'verified', 'closed'],
  createRoles: ['operator', 'safety_officer', 'admin'],
  evidenceKinds: ['telemetry_digest', 'camera_event_digest', 'model_manifest', 'operator_note', 'maintenance_record', 'verification_record'],
  requiredSignals: ['deviceAuthenticated', 'modelVersion', 'hazardScore', 'latencyMs', 'policyVersion'],
  transitions: [
    { from: 'observed', action: 'triage', to: 'triaged', roles: ['operator', 'safety_officer'], requiresEvidence: true },
    { from: 'triaged', action: 'acknowledge', to: 'operator_acknowledged', roles: ['operator'], requiresEvidence: true },
    { from: 'operator_acknowledged', action: 'create_work_order', to: 'work_ordered', roles: ['safety_officer', 'maintenance'], requiresEvidence: true },
    { from: 'work_ordered', action: 'verify', to: 'verified', roles: ['safety_officer'], requiresEvidence: true, dualControl: true },
    { from: 'verified', action: 'close', to: 'closed', roles: ['safety_manager'], requiresEvidence: true, dualControl: true },
  ],
  assess: (x) => ({ disposition: !x.deviceAuthenticated ? 'fail_safe_manual_inspection' : Number(x.hazardScore) > 0 ? 'operator_triage' : 'no_hazard_signal', controlAction: null, modelVersion: x.modelVersion, latencyMs: x.latencyMs }),
};

# Apply Pass 5 wave-1 — AIFactoryFloorSafetyMonitor

- **Date:** 2026-05-08
- **Project:** AIFactoryFloorSafetyMonitor
- **Stack:** Node.js + Express, Sequelize, PostgreSQL, Vite + React frontend.
- **Audit source:** `_AUDIT/reports/batch_03.md` § 24.

## Verified-present (from prior passes)

- `backend/src/routes/ai.js`: global-analysis, predictive-risk-scoring, ppe-reorder-alerts, analyses, incident-predict (pass 2), osha-compliance-check (pass 4), near-miss-analyze (pass 4) — covers all four audit "missing AI counterparts".
- `backend/src/routes/integrations.js`: cameras/ingest, cameras/ppe-stub, wearables/enroll, checklists, auto-stop/advise — covers many "Custom feature suggestions" (PPE compliance via cameras, wearable integration, inspection checklists, equipment auto-stop).
- FE: IncidentPredictPage, OshaNearMissPage, AIInsightsPage, IntegrationsPage, FeaturePage with CRUD coverage of the 13 safety domains.

## Implemented this pass (2 features, MECHANICAL)

| # | Item | File | Endpoint |
|---|------|------|----------|
| 1 | Agentic safety officer (multi-phase intervention plan) | `backend/src/routes/ai.js` (appended) | `POST /api/ai/agentic-safety-officer` |
| 2 | Predictive maintenance (preemptive maintenance windows) | `backend/src/routes/ai.js` (appended) | `POST /api/ai/predictive-maintenance` |

Both:
- Reuse `authenticateToken` + `aiRateLimiter` + `callOpenRouter` + `parseAIJson` + `logAudit` + `models`.
- Return **HTTP 503** with `error: "AI not configured: OPENROUTER_API_KEY is missing"` when key absent (matches existing osha-compliance-check / near-miss-analyze pattern).
- Tolerant of missing tables / model attributes via `.catch(() => [])`.
- Persist via `AIAnalysis.create({ analysis_type: ... })`.
- Include explicit "AI planning aid only — does not replace certified inspector findings / safety officer judgment / OSHA compliance audits" disclaimers in their JSON output.

**Frontend:**
- `frontend/src/services/api.js` — added `aiAPI.agenticSafetyOfficer` and `aiAPI.predictiveMaintenance`.
- `frontend/src/pages/AgenticPredictivePage.jsx` — new tabbed page (matches `OshaNearMissPage.jsx` styling: back-btn, data-section, btn-ai, ai-analysis-container).
- `frontend/src/App.jsx` — registered `/ai/agentic-predictive` route.
- `frontend/src/components/Layout.jsx` — added sidebar entry "Agentic & Predictive" under AI-Powered Features.

## Deferred backlog

| Item | Category | Reason |
|------|----------|--------|
| Real-time auto-stop of equipment from AI signals | TOO-RISKY | Safety-critical actuation; out of scope without HIL design. |
| Camera / wearable telemetry pipelines | NEEDS-CREDS | Device drivers, storage, latency budgets undefined; stubs already shipped. |
| Inspection-checklist runtime workflow | verified-present | `integrations.js` has `/checklists` + `/checklists/:id/run` + `/checklists/summary`. |
| VR / AR hazard map | NEEDS-PRODUCT-DECISION | Requires 3D scan + headset stack. |
| Behavioral safety gamification | NEEDS-PRODUCT-DECISION | Reward / leaderboard schema undefined. |

## Files changed

- `backend/src/routes/ai.js` (+~155 lines, two new endpoints appended)
- `frontend/src/services/api.js` (+3 lines)
- `frontend/src/pages/AgenticPredictivePage.jsx` (NEW, ~140 lines)
- `frontend/src/App.jsx` (+2 lines)
- `frontend/src/components/Layout.jsx` (+1 line)

## Smoke test

- `node --check backend/src/routes/ai.js` -> OK.
- `@babel/parser` (jsx) -> OK on App.jsx, Layout.jsx, AgenticPredictivePage.jsx, api.js.
- 503-on-no-key contract preserved.

# Audit Notes — AIFactoryFloorSafetyMonitor

Audit source: `_AUDIT/reports/batch_03.md` § 24 (partial-build, 4 AI endpoints).

## Original audit recommendations

### Missing AI counterparts
- `/incident-predict` — predict likely incident types per area / shift.
- `/safety-recommendation` — facility safety improvements.
- `/osha-compliance-check` — OSHA compliance gap analysis.
- `/near-miss-analyze` — near-miss trend analysis.

### Missing non-AI features
- Incident reporting.
- Safety inspection checklists.
- Safety training tracking.
- OSHA filing.
- Worker certification profiles.
- Equipment / machinery tracking.

### Custom feature suggestions
- Agentic safety officer.
- Computer-vision PPE compliance via cameras.
- Wearable integration (fatigue / temperature alerts).
- Incident video analysis.
- Behavioral safety gamification.
- Predictive maintenance.
- VR / AR hazard map.

## Implementations applied this pass

1. **`POST /api/ai/incident-predict`** — predicts likely incident types per
   zone / shift over a 30-day horizon using `Incident` and `RiskAssessment`
   history. Reuses `callOpenRouter`, `parseAIJson`, and `logAudit`.

Existing routes already cover global-analysis, predictive-risk-scoring,
PPE reorder alerts, and `/analyses` history.

## Prioritized backlog

1. **MECHANICAL** — Add `/api/ai/osha-compliance-check` reading Incident +
   PPE rows and returning a 29 CFR 1910 mapped compliance assessment.
2. **MECHANICAL** — Add `/api/ai/near-miss-analyze` taking near-miss
   reports and returning trend analysis.
3. **NEEDS-CREDS** — Camera / wearable integrations need device drivers
   and storage architecture.
4. **NEEDS-PRODUCT-DECISION** — Inspection checklist schema and audit
   workflow.
5. **TOO-RISKY** — Real-time auto-stop of equipment from AI signals is
   safety-critical and out of scope.

## Apply pass 3 (frontend)

- **Status:** FE already wired — no changes.
- **Stack:** Vite + React.
- **Verification:** `services/api.js` exposes `globalAnalysis`, `predictiveRiskScoring`, `ppeReorderAlerts`, and `crud(...).analyze(id)`. `IncidentPredictPage.jsx` posts to `/ai/incident-predict`; `AIInsightsPage.jsx` exercises remaining global endpoints. JWT bearer header attached via the api client interceptor reading `localStorage.getItem('token')`.
- **No FE changes made** (idempotence rule).

## Apply pass 4 (mechanical backlog)

Implemented backlog items 1 and 2 (both MECHANICAL).

**Backend** (`backend/src/routes/ai.js`):
- `POST /api/ai/osha-compliance-check` — accepts `{ scope, department?, focus_areas? }`. Pulls last-12-months `Incident` rows + `PPEInventory` and prompts an LLM for a 29 CFR 1910 gap analysis returning `{ overall_compliance_score, cfr_findings[], top_priority_actions }`. Persists via `AIAnalysis` and `logAudit`. Returns 503 when `OPENROUTER_API_KEY` is unset.
- `POST /api/ai/near-miss-analyze` — accepts `{ reports?, window_days? }`. If `reports` omitted, pulls `Incident` rows of `type='near_miss'` from the lookback window (7-365 days, default 90). Returns trend analysis: `location_hotspots`, `recurring_contributing_factors`, `incident_categories`, `leading_indicators`, `preventive_recommendations`. Persists via `AIAnalysis`. Returns 503 when `OPENROUTER_API_KEY` is unset.
- Both reuse existing `callOpenRouter`, `parseAIJson`, `authenticateToken`, `aiRateLimiter`, `logAudit`, and `models`. No new deps.

**Frontend** (Vite + React):
- `frontend/src/services/api.js` — added `aiAPI.oshaComplianceCheck` and `aiAPI.nearMissAnalyze` helpers.
- `frontend/src/pages/OshaNearMissPage.jsx` — new page with two tabs (OSHA Compliance, Near-Miss Trends), per-tab form, JWT bearer via existing api interceptor, explicit 503 handling ("AI not configured…"). Matches existing `IncidentPredictPage.jsx` styling (`back-btn`, `data-section`, `btn-ai`, `data-table`, `ai-analysis-container`).
- `frontend/src/App.jsx` — registered `/ai/osha-near-miss` route.
- `frontend/src/components/Layout.jsx` — added sidebar entries (Incident Predict + OSHA & Near-Miss) under AI-Powered Features.

**Smoke test (with `OPENROUTER_API_KEY=""`):**
- pkill → start backend on 4501 → `GET /api/health` → 200.
- `POST /api/auth/login admin@factory.com` → token returned.
- `POST /api/ai/osha-compliance-check` (Bearer) → HTTP 503 with `{ error: "AI not configured: OPENROUTER_API_KEY is missing" }`.
- `POST /api/ai/near-miss-analyze` (Bearer) → HTTP 503, same body.
- Cleanup → port clear.

**Backlog still deferred:** items 3-5 (NEEDS-CREDS / NEEDS-PRODUCT-DECISION / TOO-RISKY).

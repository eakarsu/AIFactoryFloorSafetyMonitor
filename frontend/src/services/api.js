import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401/403 responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  demoLogin: () => api.post('/auth/demo-login'),
  me: () => api.get('/auth/me')
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
};

// Generic CRUD API factory
function createCrudAPI(resource) {
  return {
    getAll: (params = {}) => api.get(`/${resource}`, { params }),
    getById: (id) => api.get(`/${resource}/${id}`),
    create: (data) => api.post(`/${resource}`, data),
    update: (id, data) => api.put(`/${resource}/${id}`, data),
    delete: (id) => api.delete(`/${resource}/${id}`),
    analyze: (id) => api.post(`/${resource}/${id}/analyze`)
  };
}

export const employeesAPI = createCrudAPI('employees');
export const ppeDetectionsAPI = createCrudAPI('ppe-detections');
export const hazardZonesAPI = createCrudAPI('hazard-zones');
export const incidentsAPI = createCrudAPI('incidents');
export const safetyTrainingsAPI = createCrudAPI('safety-trainings');
export const equipmentInspectionsAPI = createCrudAPI('equipment-inspections');
export const safetyAuditsAPI = createCrudAPI('safety-audits');
export const emergencyContactsAPI = createCrudAPI('emergency-contacts');
export const ppeInventoryAPI = createCrudAPI('ppe-inventory');
export const complianceReportsAPI = createCrudAPI('compliance-reports');
export const shiftSchedulesAPI = createCrudAPI('shift-schedules');
export const riskAssessmentsAPI = createCrudAPI('risk-assessments');
export const safetyAlertsAPI = createCrudAPI('safety-alerts');
export const lockoutTagoutReviewAPI = createCrudAPI('lockout-tagout-review');

// Audit logs (read-only)
export const auditLogsAPI = {
  getAll: (params = {}) => api.get('/audit-logs', { params }),
  getById: (id) => api.get(`/audit-logs/${id}`)
};

// AI cross-entity endpoints
export const aiAPI = {
  globalAnalysis: () => api.post('/ai/global-analysis'),
  predictiveRiskScoring: () => api.post('/ai/predictive-risk-scoring'),
  ppeReorderAlerts: () => api.post('/ai/ppe-reorder-alerts'),
  analyses: (params = {}) => api.get('/ai/analyses', { params }),
  oshaComplianceCheck: (body = {}, options = {}) => api.post('/ai/osha-compliance-check', body, options),
  nearMissAnalyze: (body = {}, options = {}) => api.post('/ai/near-miss-analyze', body, options),
  // Apply pass 5 wave-1
  agenticSafetyOfficer: (body = {}, options = {}) => api.post('/ai/agentic-safety-officer', body, options),
  predictiveMaintenance: (body = {}, options = {}) => api.post('/ai/predictive-maintenance', body, options)
};

export default api;

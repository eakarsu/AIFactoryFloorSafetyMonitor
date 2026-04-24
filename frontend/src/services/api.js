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
  me: () => api.get('/auth/me')
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
};

// Generic CRUD API factory
function createCrudAPI(resource) {
  return {
    getAll: () => api.get(`/${resource}`),
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

export default api;

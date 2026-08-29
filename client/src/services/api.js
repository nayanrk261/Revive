import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Get stored token
const getAuthHeader = () => {
  const token = localStorage.getItem('revive_token');
  const demoMode = localStorage.getItem('revive_demo_mode') === 'true';

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (demoMode || !token) {
    headers['X-Demo-Mode'] = 'true';
  }
  return { headers };
};

// Auth API calls
export const loginUser = async (email, password) => {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return res.data;
};

export const signupUser = async (payload) => {
  const res = await axios.post(`${API_BASE}/auth/signup`, payload);
  return res.data;
};

export const fetchCurrentUser = async () => {
  const res = await axios.get(`${API_BASE}/auth/me`, getAuthHeader());
  return res.data;
};

export const completeOnboarding = async () => {
  const res = await axios.post(`${API_BASE}/auth/onboarding-complete`, {}, getAuthHeader());
  return res.data;
};

// Data Ingestion API
export const uploadIngestData = async (rawText) => {
  const res = await axios.post(`${API_BASE}/ingest/upload`, { rawText }, getAuthHeader());
  return res.data;
};

// Dashboard & Event APIs
export const getDashboardMetrics = async () => {
  const res = await axios.get(`${API_BASE}/dashboard`, getAuthHeader());
  return res.data;
};

export const getEvents = async (type = '', status = '') => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  const res = await axios.get(`${API_BASE}/events?${params.toString()}`, getAuthHeader());
  return res.data;
};

export const getCaseDetail = async (caseId) => {
  const res = await axios.get(`${API_BASE}/recovery/${caseId}`, getAuthHeader());
  return res.data;
};

export const analyzeCase = async (caseId) => {
  const res = await axios.post(`${API_BASE}/agent/analyze/${caseId}`, {}, getAuthHeader());
  return res.data;
};

export const executeCaseAction = async (caseId, payload = {}) => {
  const res = await axios.post(`${API_BASE}/recovery/${caseId}/execute`, payload, getAuthHeader());
  return res.data;
};

export const simulatePayment = async (caseId, payload = {}) => {
  const res = await axios.post(`${API_BASE}/recovery/${caseId}/payment`, payload, getAuthHeader());
  return res.data;
};

export const escalateCase = async (caseId, reason) => {
  const res = await axios.post(`${API_BASE}/recovery/${caseId}/escalate`, { reason }, getAuthHeader());
  return res.data;
};

export const runBatchProcess = async () => {
  const res = await axios.post(`${API_BASE}/agent/process-batch`, {}, getAuthHeader());
  return res.data;
};

export const compareBaseline = async () => {
  const res = await axios.post(`${API_BASE}/agent/compare-baseline`, {}, getAuthHeader());
  return res.data;
};

export const reseedDatabase = async () => {
  const res = await axios.post(`${API_BASE}/seed`, {}, getAuthHeader());
  return res.data;
};

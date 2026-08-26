import axios from 'axios';

const API_BASE = '/api';

export const getDashboardMetrics = async () => {
  const res = await axios.get(`${API_BASE}/dashboard`);
  return res.data;
};

export const getEvents = async (type = '', status = '') => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  const res = await axios.get(`${API_BASE}/events?${params.toString()}`);
  return res.data;
};

export const getCaseDetail = async (caseId) => {
  const res = await axios.get(`${API_BASE}/recovery/${caseId}`);
  return res.data;
};

export const analyzeCase = async (caseId) => {
  const res = await axios.post(`${API_BASE}/agent/analyze/${caseId}`);
  return res.data;
};

export const executeCaseAction = async (caseId, payload = {}) => {
  const res = await axios.post(`${API_BASE}/recovery/${caseId}/execute`, payload);
  return res.data;
};

export const simulatePayment = async (caseId, payload = {}) => {
  const res = await axios.post(`${API_BASE}/recovery/${caseId}/payment`, payload);
  return res.data;
};

export const escalateCase = async (caseId, reason) => {
  const res = await axios.post(`${API_BASE}/recovery/${caseId}/escalate`, { reason });
  return res.data;
};

export const runBatchProcess = async () => {
  const res = await axios.post(`${API_BASE}/agent/process-batch`);
  return res.data;
};

export const compareBaseline = async () => {
  const res = await axios.post(`${API_BASE}/agent/compare-baseline`);
  return res.data;
};

export const reseedDatabase = async () => {
  const res = await axios.post(`${API_BASE}/seed`);
  return res.data;
};

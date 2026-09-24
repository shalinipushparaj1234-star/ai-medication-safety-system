import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

const api = axios.create({ baseURL: API_BASE })

export const getPatients = () => api.get('/patients').then(r => r.data)
export const getPatient = (id) => api.get(`/patients/${id}`).then(r => r.data)
export const createPatient = (data) => api.post('/patients', data).then(r => r.data)

export const getPrescriptions = (patientId) =>
  api.get(`/patients/${patientId}/prescriptions`).then(r => r.data)
export const addPrescription = (patientId, data) =>
  api.post(`/patients/${patientId}/prescriptions`, data).then(r => r.data)
export const deletePrescription = (rxId) =>
  api.delete(`/prescriptions/${rxId}`).then(r => r.data)

export const checkInteractions = (patientId) =>
  api.get(`/patients/${patientId}/check-interactions`).then(r => r.data)

export const runAnalysis = (patientId) =>
  api.post(`/patients/${patientId}/analyze`).then(r => r.data)
export const getAnalyses = (patientId) =>
  api.get(`/patients/${patientId}/analyses`).then(r => r.data)
export const getAnalysis = (analysisId) =>
  api.get(`/analyses/${analysisId}`).then(r => r.data)

export const reviewAnalysis = (analysisId, decision) =>
  api.post(`/analyses/${analysisId}/review`, decision).then(r => r.data)

export const getAuditLog = () => api.get('/audit-log').then(r => r.data)
export const getPatientAuditLog = (patientId) =>
  api.get(`/patients/${patientId}/audit-log`).then(r => r.data)

export const getKnownMedicines = () =>
  api.get('/known-medicines').then(r => r.data.medicines)

export default api
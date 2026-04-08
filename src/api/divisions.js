import api from './axios';

export const getDivisions    = (competitionId)       => api.get(`/competitions/${competitionId}/divisions`);
export const getDivision     = (id)                  => api.get(`/divisions/${id}`);
export const createDivision  = (competitionId, data) => api.post(`/competitions/${competitionId}/divisions`, data);
export const updateDivision  = (id, data)            => api.put(`/divisions/${id}`, data);
export const deleteDivision  = (id)                  => api.delete(`/divisions/${id}`);

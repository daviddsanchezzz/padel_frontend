import api from './axios';

export const getCompetitions   = ()           => api.get('/competitions');
export const getOrgSummary     = ()           => api.get('/competitions/summary');
export const getPlayerCompetitions = ()       => api.get('/competitions/player');
export const getCompetition    = (id)         => api.get(`/competitions/${id}`);
export const createCompetition = (data)       => api.post('/competitions', data);
export const updateCompetition = (id, data)   => api.put(`/competitions/${id}`, data);
export const deleteCompetition = (id)         => api.delete(`/competitions/${id}`);

export const getNewSeasonPreview = (id)       => api.get(`/competitions/${id}/new-season/preview`);
export const createNewSeason     = (id, data) => api.post(`/competitions/${id}/new-season`, data);
export const updateCompetitionSeason = (competitionId, seasonId, data) =>
  api.patch(`/competitions/${competitionId}/seasons/${seasonId}`, data);

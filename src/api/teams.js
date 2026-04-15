import api from './axios';

// League teams
export const getDivisionTeams  = (divisionId)     => api.get(`/divisions/${divisionId}/teams`);
export const createDivisionTeam = (divisionId, data) => api.post(`/divisions/${divisionId}/teams`, data);

// Tournament teams
export const getCompetitionTeams  = (competitionId)      => api.get(`/competitions/${competitionId}/teams`);
export const getCompetitionTeamsDetailed = (competitionId) => api.get(`/competitions/${competitionId}/teams/detailed`);
export const createCompetitionTeam = (competitionId, data) => api.post(`/competitions/${competitionId}/teams`, data);

// Shared
export const updateTeam = (id, data) => api.put(`/teams/${id}`, data);
export const updateTeamDivision = (id, divisionId) => api.patch(`/teams/${id}/division`, { divisionId });
export const deleteTeam = (id)       => api.delete(`/teams/${id}`);
export const joinTeam   = (id, data) => api.post(`/teams/${id}/join`, data);

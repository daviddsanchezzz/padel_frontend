import api from './axios';

// League
export const getDivisionMatches    = (divisionId)   => api.get(`/divisions/${divisionId}/matches`);
export const generateLeagueMatches = (divisionId)   => api.post(`/divisions/${divisionId}/matches/generate`);

// Tournament (competition-level, legacy)
export const generateBracket = (competitionId) => api.post(`/competitions/${competitionId}/bracket/generate`);
export const getBracket      = (competitionId) => api.get(`/competitions/${competitionId}/bracket`);

// Tournament categories (division-level bracket)
export const generateDivisionBracket = (divisionId) => api.post(`/divisions/${divisionId}/bracket/generate`);
export const getDivisionBracket      = (divisionId) => api.get(`/divisions/${divisionId}/bracket`);

// Shared
export const getMatch         = (matchId)       => api.get(`/matches/${matchId}`);
export const updateMatchSchedule = (matchId, data) => api.put(`/matches/${matchId}/schedule`, data);
export const recordResult     = (matchId, data) => api.put(`/matches/${matchId}/result`, data);
export const getMatchEvents   = (matchId)       => api.get(`/matches/${matchId}/events`);
export const recordMatchEvents = (matchId, data) => api.put(`/matches/${matchId}/events`, data);
export const confirmResult    = (matchId)       => api.post(`/matches/${matchId}/confirm`);
export const disputeResult    = (matchId)       => api.post(`/matches/${matchId}/dispute`);
export const getPlayerMatches = ()              => api.get('/player/matches');
export const getCompetitionPlayerStats = (competitionId) => api.get(`/competitions/${competitionId}/player-stats`);

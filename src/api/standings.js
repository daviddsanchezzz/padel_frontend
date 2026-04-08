import api from './axios';

export const getStandings = (divisionId) => api.get(`/divisions/${divisionId}/standings`);

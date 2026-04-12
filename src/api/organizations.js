import api from './axios';

export const getMyOrganizations = () => api.get('/organizations');
export const createOrganization  = (data) => api.post('/organizations', data);
export const updateOrganization  = (id, data) => api.put(`/organizations/${id}`, data);
export const getPublicOrganization = (id) => api.get(`/organizations/${id}/public`);
export const getPublicCompetition  = (orgId, compId) => api.get(`/organizations/${orgId}/competitions/${compId}/public`);
export const getPublicDivision        = (orgId, divId)        => api.get(`/organizations/${orgId}/divisions/${divId}/public`);
export const registerForCompetition   = (orgId, compId, data) => api.post(`/organizations/${orgId}/competitions/${compId}/register`, data);

// Stripe Connect
export const getConnectStatus  = (orgId) => api.get(`/connect/status?orgId=${orgId}`);
export const startConnectOnboard = (orgId) => api.post('/connect/onboard', { orgId });

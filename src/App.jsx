import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrgProvider, useOrg } from './context/OrgContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login             from './pages/Login';
import Register          from './pages/Register';
import Onboarding             from './pages/Onboarding';
import OrganizationSettings   from './pages/OrganizationSettings';
import Dashboard         from './pages/Dashboard';
import CompetitionForm   from './pages/CompetitionForm';
import CompetitionDetail from './pages/CompetitionDetail';
import DivisionDetail    from './pages/DivisionDetail';
import NewSeason         from './pages/NewSeason';
import PlayerDashboard   from './pages/PlayerDashboard';
import MatchDetail       from './pages/MatchDetail';
import PublicOrganization        from './pages/PublicOrganization';
import PublicCompetitionDetail  from './pages/PublicCompetitionDetail';
import PublicDivisionDetail     from './pages/PublicDivisionDetail';

/** Redirects organizers without a club to onboarding. */
const RequireOrg = ({ children }) => {
  const { hasOrg, loadingOrg } = useOrg();
  if (loadingOrg) return null;
  if (!hasOrg) return <Navigate to="/onboarding" replace />;
  return children;
};

/** Root redirect based on auth + org state. */
const RootRedirect = () => {
  const { user, loading } = useAuth();
  const { hasOrg, loadingOrg } = useOrg();

  if (loading || loadingOrg) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'organizer') {
    return <Navigate to={hasOrg ? '/dashboard' : '/onboarding'} replace />;
  }
  return <Navigate to="/player" replace />;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <OrgProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/organizations/:id/public" element={<PublicOrganization />} />
          <Route path="/organizations/:orgId/competitions/:compId/public" element={<PublicCompetitionDetail />} />
          <Route path="/organizations/:orgId/divisions/:divId/public" element={<PublicDivisionDetail />} />

          {/* Onboarding — organizer without org lands here */}
          <Route path="/onboarding" element={
            <ProtectedRoute requiredRole="organizer"><Onboarding /></ProtectedRoute>
          } />

          {/* Organizer — all require a club */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="organizer">
              <RequireOrg><Dashboard /></RequireOrg>
            </ProtectedRoute>
          } />
          <Route path="/competitions/new" element={
            <ProtectedRoute requiredRole="organizer">
              <RequireOrg><CompetitionForm /></RequireOrg>
            </ProtectedRoute>
          } />
          <Route path="/competitions/:id" element={
            <ProtectedRoute><CompetitionDetail /></ProtectedRoute>
          } />
          <Route path="/divisions/:id" element={
            <ProtectedRoute><DivisionDetail /></ProtectedRoute>
          } />
          <Route path="/matches/:id" element={
            <ProtectedRoute><MatchDetail /></ProtectedRoute>
          } />
          <Route path="/competitions/:id/new-season" element={
            <ProtectedRoute requiredRole="organizer">
              <RequireOrg><NewSeason /></RequireOrg>
            </ProtectedRoute>
          } />
          <Route path="/organization/settings" element={
            <ProtectedRoute requiredRole="organizer">
              <RequireOrg><OrganizationSettings /></RequireOrg>
            </ProtectedRoute>
          } />

          {/* Player */}
          <Route path="/player/matches" element={
            <ProtectedRoute requiredRole="player"><PlayerDashboard tab="matches" /></ProtectedRoute>
          } />
          <Route path="/player/competitions" element={
            <ProtectedRoute requiredRole="player"><PlayerDashboard tab="competitions" /></ProtectedRoute>
          } />
          <Route path="/player" element={
            <ProtectedRoute requiredRole="player"><PlayerDashboard tab="matches" /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </OrgProvider>
    </BrowserRouter>
  </AuthProvider>
);

export default App;

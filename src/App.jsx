import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login              from './pages/Login';
import Register           from './pages/Register';
import Dashboard          from './pages/Dashboard';
import CompetitionForm    from './pages/CompetitionForm';
import CompetitionDetail  from './pages/CompetitionDetail';
import DivisionDetail     from './pages/DivisionDetail';
import NewSeason          from './pages/NewSeason';
import PlayerDashboard    from './pages/PlayerDashboard';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'organizer' ? '/dashboard' : '/player'} replace />;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Organizer */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="organizer"><Dashboard /></ProtectedRoute>
        } />
        <Route path="/competitions/new" element={
          <ProtectedRoute requiredRole="organizer"><CompetitionForm /></ProtectedRoute>
        } />
        <Route path="/competitions/:id" element={
          <ProtectedRoute><CompetitionDetail /></ProtectedRoute>
        } />
        <Route path="/divisions/:id" element={
          <ProtectedRoute><DivisionDetail /></ProtectedRoute>
        } />
        <Route path="/competitions/:id/new-season" element={
          <ProtectedRoute requiredRole="organizer"><NewSeason /></ProtectedRoute>
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
    </BrowserRouter>
  </AuthProvider>
);

export default App;

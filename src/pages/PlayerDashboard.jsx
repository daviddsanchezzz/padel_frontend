import React, { useEffect, useState } from 'react';
import { getPlayerMatches } from '../api/matches';
import { getPlayerCompetitions } from '../api/competitions';
import AppLayout from '../layouts/AppLayout';
import MatchCard from '../components/MatchCard';
import Icon, { sportEmoji } from '../components/Icon';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  pending:   { label: 'Pendiente', cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  played:    { label: 'Jugado',    cls: 'bg-brand-50 text-brand-700 border border-brand-200' },
  cancelled: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-400 border border-gray-200' },
};

const PlayerDashboard = ({ tab = 'matches' }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab);

  useEffect(() => {
    Promise.all([getPlayerMatches(), getPlayerCompetitions()]).then(([matchesRes, compsRes]) => {
      setMatches(matchesRes.data);
      setCompetitions(compsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const played  = matches.filter((m) => m.status === 'played').length;
  const pending = matches.filter((m) => m.status === 'pending').length;

  return (
    <AppLayout title="Panel de jugador">
      {/* Matches Tab */}
      {activeTab === 'matches' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-8">
                <div className="card p-3 md:p-5 text-center">
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{matches.length}</p>
                  <p className="text-xs md:text-sm text-gray-400 font-medium mt-0.5 md:mt-1">Total</p>
                </div>
                <div className="card p-3 md:p-5 text-center">
                  <p className="text-2xl md:text-3xl font-bold text-brand-600">{played}</p>
                  <p className="text-xs md:text-sm text-gray-400 font-medium mt-0.5 md:mt-1">Jugados</p>
                </div>
                <div className="card p-3 md:p-5 text-center">
                  <p className="text-2xl md:text-3xl font-bold text-amber-500">{pending}</p>
                  <p className="text-xs md:text-sm text-gray-400 font-medium mt-0.5 md:mt-1">Pendientes</p>
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Icon name="spinner" size={24} className="animate-spin text-brand-500" />
                </div>
              )}

              {!loading && matches.length === 0 && (
                <div className="card p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon name="sport" size={28} className="text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Sin partidos asignados</h3>
                  <p className="text-gray-400 text-sm">Cuando el organizador te asigne a un equipo verás tus partidos aquí.</p>
                </div>
              )}

              {!loading && matches.length > 0 && (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div key={match._id}>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <span className="font-semibold text-gray-500">{match.competition?.name}</span>
                        {match.division && (
                          <>
                            <span>·</span>
                            <span>{match.division.name}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{match.roundName || `Jornada ${match.round}`}</span>
                      </div>
                      <MatchCard
                        match={match}
                        scoringType={match.competition?.sport?.scoringType}
                        myTeamId={
                          match.teamA?.players?.some(p => p && p.toString() === user?.id)
                            ? match.teamA._id?.toString()
                            : match.teamB?.players?.some(p => p && p.toString() === user?.id)
                            ? match.teamB._id?.toString()
                            : null
                        }
                        forceCanRecord
                        onResultRecorded={() => getPlayerMatches().then((res) => setMatches(res.data))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Competitions Tab */}
          {activeTab === 'competitions' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Icon name="spinner" size={24} className="animate-spin text-brand-500" />
                </div>
              ) : competitions.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon name="trophy" size={28} className="text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Sin competiciones</h3>
                  <p className="text-gray-400 text-sm">Te unirás a competiciones cuando aceptes invitaciones.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {competitions.map((comp) => {
                    const statusCls = comp.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : comp.status === 'finished'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500';
                    const statusLabel = comp.status === 'active' ? 'Activa' : comp.status === 'finished' ? 'Finalizada' : 'Borrador';
                    return (
                      <div
                        key={comp._id}
                        className="card px-4 py-3.5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
                        onClick={() => window.location.href = `/competitions/${comp._id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-800 rounded-xl flex items-center justify-center text-white flex-shrink-0 text-lg">
                            {sportEmoji(comp.sport?.slug)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 group-hover:text-brand-700 transition-colors">{comp.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{comp.sport?.name} · {comp.type === 'league' ? 'Liga' : 'Torneo'}{comp.organizer?.name ? ` · ${comp.organizer.name}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusCls}`}>{statusLabel}</span>
                          <Icon name="chevronRight" size={14} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
    </AppLayout>
  );
};

export default PlayerDashboard;

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';
import { getCompetition } from '../api/competitions';
import { getCompetitionTeamsDetailed } from '../api/teams';
import { useAuth } from '../context/AuthContext';

const paymentStatusLabel = (status) => {
  if (status === 'paid') return 'Pagado';
  if (status === 'pending') return 'Pendiente';
  if (status === 'failed') return 'Fallido';
  return 'Gratis';
};

const paymentStatusClass = (status) => {
  if (status === 'paid') return 'bg-green-100 text-green-700';
  if (status === 'pending') return 'bg-amber-100 text-amber-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};

const CompetitionTeams = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [competition, setCompetition] = useState(null);
  const [teams, setTeams] = useState([]);
  const [activeSeason, setActiveSeason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [competitionRes, teamsRes] = await Promise.all([
          getCompetition(id),
          getCompetitionTeamsDetailed(id),
        ]);
        const comp = competitionRes.data;
        if (!(user?.role === 'organizer' && comp?.organizer?.toString() === user?.id)) {
          setError('Solo el organizador puede ver esta pagina');
          setLoading(false);
          return;
        }

        setCompetition(comp);
        setTeams(teamsRes.data?.teams || []);
        setActiveSeason(teamsRes.data?.activeSeason || '');
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar el listado de equipos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user?.id, user?.role]);

  const isLeague = useMemo(() => competition?.type === 'league', [competition?.type]);

  return (
    <AppLayout title="Todos los equipos">
      <button
        onClick={() => navigate(`/competitions/${id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
      >
        <Icon name="chevronLeft" size={14} /> Volver a competicion
      </button>

      {competition && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="badge bg-gray-100 text-gray-600">{competition.name}</span>
          {competition.sport?.name && <span className="badge bg-gray-100 text-gray-500">{competition.sport.name}</span>}
          {activeSeason && <span className="badge bg-gray-100 text-gray-500">Temporada: {activeSeason}</span>}
          <span className="badge bg-gray-100 text-gray-500">{teams.length} equipos</span>
        </div>
      )}

      {loading ? (
        <div className="card p-10 text-center">
          <Icon name="spinner" size={20} className="animate-spin text-brand-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Cargando equipos...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center border-red-100 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-gray-800 mb-1">Sin equipos registrados</p>
          <p className="text-sm text-gray-400">Aun no hay equipos en esta competicion.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
          {teams.map((team) => (
            <div key={team._id} className="px-4 py-4 hover:bg-gray-50/70 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="team" size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{team.name}</p>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${paymentStatusClass(team.paymentStatus)}`}>
                      {paymentStatusLabel(team.paymentStatus)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-md">
                      {isLeague ? 'Division' : 'Categoria'}: {team.division?.name || 'General'}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-md">
                      {team.playerCount} jugador{team.playerCount === 1 ? '' : 'es'}
                    </span>
                    {team.group && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Grupo {team.group}</span>}
                    {team.contactEmail && <span className="px-2 py-0.5 bg-gray-100 rounded-md truncate max-w-[240px]">{team.contactEmail}</span>}
                  </div>

                  {Array.isArray(team.players) && team.players.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {team.players.map((player, idx) => (
                        <span key={`${team._id}-${idx}`} className="text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg">
                          {player.name}{player.dorsal ? ` #${player.dorsal}` : ''}{player.userId ? ' (usuario)' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap mt-1">
                  {new Date(team.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default CompetitionTeams;

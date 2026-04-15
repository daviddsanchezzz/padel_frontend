import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';
import { getCompetition } from '../api/competitions';
import { getCompetitionTeamsDetailed, updateTeamDivision } from '../api/teams';
import { getDivisions } from '../api/divisions';
import { useAuth } from '../context/AuthContext';

const paymentStatusLabel = (status) => {
  if (status === 'paid') return 'Pagado';
  if (status === 'pending') return 'Pendiente';
  if (status === 'failed') return 'Fallido';
  return '';
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
  const [divisions, setDivisions] = useState([]);
  const [activeSeason, setActiveSeason] = useState('');
  const [search, setSearch] = useState('');
  const [savingTeamId, setSavingTeamId] = useState('');
  const [editingTeamId, setEditingTeamId] = useState('');
  const [pendingDivisionId, setPendingDivisionId] = useState('');
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

        try {
          const divisionsRes = await getDivisions(id);
          setDivisions(divisionsRes.data || []);
        } catch {
          setDivisions([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar el listado de equipos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user?.id, user?.role]);

  const isLeague = useMemo(() => competition?.type === 'league', [competition?.type]);
  const isPadelSport = useMemo(() => {
    const sportName = (competition?.sport?.name || '').toLowerCase();
    return sportName.includes('padel') || sportName.includes('pádel');
  }, [competition?.sport?.name]);

  const filteredTeams = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return teams;
    return teams.filter((team) => {
      const nameMatch = (team.name || '').toLowerCase().includes(term);
      const divisionMatch = (team.division?.name || '').toLowerCase().includes(term);
      const emailMatch = (team.contactEmail || '').toLowerCase().includes(term);
      return nameMatch || divisionMatch || emailMatch;
    });
  }, [teams, search]);

  const startDivisionEdit = (team) => {
    setEditingTeamId(team._id);
    setPendingDivisionId(team.division?._id || '');
  };

  const cancelDivisionEdit = () => {
    setEditingTeamId('');
    setPendingDivisionId('');
  };

  const saveDivisionChange = async (team) => {
    const nextDivisionId = pendingDivisionId;
    const nextDivision = divisions.find((d) => d._id === nextDivisionId);
    const currentDivisionId = team.division?._id || '';
    if (currentDivisionId === nextDivisionId) {
      cancelDivisionEdit();
      return;
    }

    const label = isLeague ? 'división' : 'categoría';
    const nextLabel = nextDivision?.name || 'General';
    const confirmed = window.confirm(`¿Estas seguro de mover este equipo a ${label} "${nextLabel}"?`);
    if (!confirmed) return;

    setSavingTeamId(team._id);
    try {
      await updateTeamDivision(team._id, nextDivisionId || null);
      setTeams((prev) => prev.map((t) => (
        t._id === team._id
          ? {
              ...t,
              division: nextDivision
                ? { _id: nextDivision._id, name: nextDivision.name, order: nextDivision.order }
                : null,
            }
          : t
      )));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo actualizar la división/categoría');
    } finally {
      setSavingTeamId('');
      cancelDivisionEdit();
    }
  };

  return (
    <AppLayout title="Todos los equipos">
      <button
        onClick={() => navigate(`/competitions/${id}`)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-5"
      >
        <Icon name="chevronLeft" size={14} /> Volver a competicion
      </button>

      {competition && (
        <div className="mb-5 flex items-center gap-2 flex-wrap">
          <span className="badge bg-white border border-gray-200 text-gray-700">{competition.name}</span>
          {competition.sport?.name && <span className="badge bg-white border border-gray-200 text-gray-500">{competition.sport.name}</span>}
          {activeSeason && <span className="badge bg-white border border-gray-200 text-gray-500">Temporada: {activeSeason}</span>}
          <span className="badge bg-white border border-gray-200 text-gray-500">{teams.length} equipos</span>
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-xl">
          <Icon name="search" size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar equipo, división/categoría o email..."
            className="w-full bg-white border border-gray-200 rounded-2xl px-11 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center">
          <Icon name="spinner" size={20} className="animate-spin text-brand-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Cargando equipos...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center border-red-100 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-gray-800 mb-1">Sin resultados</p>
          <p className="text-sm text-gray-400">No hay equipos que coincidan con tu busqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeams.map((team) => (
            <div key={team._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4 transition-all hover:shadow-md">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="team" size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{team.name}</p>
                    {paymentStatusLabel(team.paymentStatus) && (
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${paymentStatusClass(team.paymentStatus)}`}>
                        {paymentStatusLabel(team.paymentStatus)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-gray-500">
                    {!isPadelSport && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md">
                        {team.playerCount} jugador{team.playerCount === 1 ? '' : 'es'}
                      </span>
                    )}
                    {team.group && <span className="px-2 py-0.5 bg-gray-100 rounded-md">Grupo {team.group}</span>}
                    {team.contactEmail && <span className="px-2 py-0.5 bg-gray-100 rounded-md truncate max-w-[240px]">{team.contactEmail}</span>}
                  </div>

                  {!isPadelSport && Array.isArray(team.players) && team.players.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {team.players.map((player, idx) => (
                        <span key={`${team._id}-${idx}`} className="text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg">
                          {player.name}{player.dorsal ? ` #${player.dorsal}` : ''}{player.userId ? ' (usuario)' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:border-l md:border-gray-100 md:pl-4 flex flex-col items-start md:items-end gap-2 min-w-[200px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {isLeague ? 'División' : 'Categoría'}
                  </label>
                  {editingTeamId === team._id ? (
                    <>
                      <select
                        value={pendingDivisionId}
                        onChange={(e) => setPendingDivisionId(e.target.value)}
                        disabled={savingTeamId === team._id}
                        className="text-xs border border-brand-200 bg-brand-50 text-brand-800 rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                      >
                        <option value="">General</option>
                        {divisions.map((division) => (
                          <option key={division._id} value={division._id}>{division.name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => saveDivisionChange(team)}
                          disabled={savingTeamId === team._id}
                          className="text-xs px-2.5 py-1 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelDivisionEdit}
                          disabled={savingTeamId === team._id}
                          className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-60"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs border border-brand-200 bg-brand-50 text-brand-800 rounded-lg px-2.5 py-1 font-semibold">
                        {team.division?.name || 'General'}
                      </span>
                      <button
                        onClick={() => startDivisionEdit(team)}
                        className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        Mover
                      </button>
                    </div>
                  )}
                  <span className="text-[11px] text-gray-300 whitespace-nowrap">
                    {new Date(team.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default CompetitionTeams;

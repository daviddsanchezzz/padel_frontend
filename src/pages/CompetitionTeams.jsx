import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';
import { getCompetition } from '../api/competitions';
import { deleteTeam, getCompetitionTeamsDetailed, updateTeam, updateTeamDivision } from '../api/teams';
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

const normalizeNamesFromTeam = (team, teamSize) => {
  const fromPlayers = Array.isArray(team.players) ? team.players.map((p) => (p?.name || '').trim()).filter(Boolean) : [];
  if (fromPlayers.length >= teamSize) return fromPlayers.slice(0, teamSize);

  const fromTeamName = String(team.name || '')
    .split('/')
    .map((n) => n.trim())
    .filter(Boolean);

  const source = fromPlayers.length > 0 ? fromPlayers : fromTeamName;
  return Array.from({ length: teamSize }, (_, i) => source[i] || '');
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [menuTeamId, setMenuTeamId] = useState('');

  const [editingTeam, setEditingTeam] = useState(null);
  const [editingDivisionId, setEditingDivisionId] = useState('');
  const [editingPlayerNames, setEditingPlayerNames] = useState([]);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!menuTeamId) return undefined;
    const closeMenu = () => setMenuTeamId('');
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [menuTeamId]);

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
  const teamSize = useMemo(
    () => Number(competition?.settings?.teamSize ?? competition?.sport?.teamSize ?? 2),
    [competition?.settings?.teamSize, competition?.sport?.teamSize]
  );

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

  const openEditTeam = (team) => {
    setMenuTeamId('');
    setEditingTeam(team);
    setEditingDivisionId(team.division?._id || '');

    if (teamSize <= 2) {
      setEditingPlayerNames(normalizeNamesFromTeam(team, teamSize));
      setEditingTeamName('');
    } else {
      setEditingTeamName(team.name || '');
      setEditingPlayerNames([]);
    }
  };

  const closeEditTeam = () => {
    setEditingTeam(null);
    setEditingDivisionId('');
    setEditingPlayerNames([]);
    setEditingTeamName('');
    setSavingEdit(false);
  };

  const handleDeleteTeam = async (team) => {
    setMenuTeamId('');
    const confirmed = window.confirm('¿Seguro que quieres eliminar este equipo?');
    if (!confirmed) return;

    try {
      await deleteTeam(team._id);
      setTeams((prev) => prev.filter((t) => t._id !== team._id));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo eliminar el equipo');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTeam) return;

    const payload = {};
    if (teamSize <= 2) {
      const names = editingPlayerNames.map((n) => n.trim()).filter(Boolean);
      if (names.length !== teamSize) {
        alert(`Debes indicar exactamente ${teamSize} ${teamSize === 1 ? 'jugador' : 'jugadores'}`);
        return;
      }
      payload.playerNames = names;
    } else {
      const cleanName = editingTeamName.trim();
      if (!cleanName) {
        alert('El nombre del equipo es obligatorio');
        return;
      }
      payload.name = cleanName;
    }

    if (isLeague && !editingDivisionId) {
      alert('Debes seleccionar una división');
      return;
    }

    setSavingEdit(true);
    try {
      await updateTeam(editingTeam._id, payload);

      const currentDivisionId = editingTeam.division?._id || '';
      if (currentDivisionId !== editingDivisionId) {
        await updateTeamDivision(editingTeam._id, editingDivisionId || null);
      }

      const detailRes = await getCompetitionTeamsDetailed(id);
      setTeams(detailRes.data?.teams || []);
      closeEditTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo guardar el equipo');
      setSavingEdit(false);
    }
  };

  return (
    <AppLayout title="Todos los equipos">
      <button
        onClick={() => navigate(`/competitions/${id}`)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
      >
        <Icon name="chevronLeft" size={14} /> Volver a competicion
      </button>

      {competition && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="badge bg-white border border-gray-200 text-gray-800 font-semibold">{competition.name}</span>
          {competition.sport?.name && <span className="badge bg-white border border-gray-200 text-gray-500">{competition.sport.name}</span>}
          {activeSeason && <span className="badge bg-white border border-gray-200 text-gray-500">Temporada: {activeSeason}</span>}
          <span className="badge bg-gray-100/90 border border-gray-200 text-gray-600">{teams.length} equipos</span>
        </div>
      )}

      <div className="mb-4">
        <div className="relative w-full">
          <Icon name="search" size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar equipo o email..."
            className="w-full h-10 bg-white border border-gray-200 rounded-xl px-10 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
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
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_180px_64px] px-5 py-2 bg-gray-50/90 border-b border-gray-200 rounded-t-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Equipo</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{isLeague ? 'División' : 'Categoría'}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-center">...</p>
          </div>

          {filteredTeams.map((team) => (
            <div key={team._id} className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_180px_64px] items-center px-5 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70 transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{team.name}</p>
                  {paymentStatusLabel(team.paymentStatus) && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${paymentStatusClass(team.paymentStatus)}`}>
                      {paymentStatusLabel(team.paymentStatus)}
                    </span>
                  )}
                </div>
                {(!isPadelSport || team.group || team.contactEmail) && (
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-gray-500">
                    {!isPadelSport && (
                      <span>{team.playerCount} jugador{team.playerCount === 1 ? '' : 'es'}</span>
                    )}
                    {team.group && <span>Grupo {team.group}</span>}
                    {team.contactEmail && <span className="truncate max-w-[260px]">{team.contactEmail}</span>}
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center">
                <span className="text-xs border border-brand-200 bg-brand-50 text-brand-800 rounded-md px-2 py-1 font-semibold">
                  {team.division?.name || (isLeague ? '-' : 'General')}
                </span>
              </div>

              <div className="relative flex justify-end md:justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuTeamId((prev) => (prev === team._id ? '' : team._id));
                  }}
                  className="w-8 h-8 rounded-lg border border-transparent hover:border-gray-200 hover:bg-white text-gray-500 hover:text-gray-700 flex items-center justify-center"
                >
                  <Icon name="more" size={16} />
                </button>
                {menuTeamId === team._id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 top-9 z-30 w-36 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
                  >
                    <button onClick={() => openEditTeam(team)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Editar</button>
                    <button onClick={() => handleDeleteTeam(team)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                  </div>
                )}
              </div>

              <div className="md:hidden mt-2 col-span-2">
                <span className="text-xs border border-brand-200 bg-brand-50 text-brand-800 rounded-md px-2 py-1 font-semibold">
                  {team.division?.name || (isLeague ? '-' : 'General')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={closeEditTeam} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Editar equipo</h3>
              <button onClick={closeEditTeam} className="w-8 h-8 rounded-md hover:bg-gray-100 text-gray-500 flex items-center justify-center">×</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {teamSize <= 2 ? (
                <div className="space-y-2">
                  {Array.from({ length: teamSize }, (_, idx) => (
                    <div key={idx}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Jugador {idx + 1}</label>
                      <input
                        value={editingPlayerNames[idx] || ''}
                        onChange={(e) => {
                          const next = [...editingPlayerNames];
                          next[idx] = e.target.value;
                          setEditingPlayerNames(next);
                        }}
                        className="input text-sm"
                        placeholder={`Nombre del jugador ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del equipo</label>
                  <input
                    value={editingTeamName}
                    onChange={(e) => setEditingTeamName(e.target.value)}
                    className="input text-sm"
                    placeholder="Nombre del equipo"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{isLeague ? 'División' : 'Categoría'}</label>
                <select
                  value={editingDivisionId}
                  onChange={(e) => setEditingDivisionId(e.target.value)}
                  className="input text-sm"
                >
                  {!isLeague && <option value="">General</option>}
                  {divisions.map((division) => (
                    <option key={division._id} value={division._id}>{division.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={closeEditTeam} disabled={savingEdit} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="btn-primary text-xs">
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default CompetitionTeams;

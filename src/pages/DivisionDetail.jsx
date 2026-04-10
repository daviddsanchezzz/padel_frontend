import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDivision, getDivisions } from '../api/divisions';
import { getDivisionTeams, createDivisionTeam, deleteTeam, joinTeam, updateTeam } from '../api/teams';
import { getDivisionMatches, generateLeagueMatches, generateDivisionBracket, getDivisionBracket } from '../api/matches';
import { getStandings } from '../api/standings';
import AppLayout from '../layouts/AppLayout';
import MatchCard from '../components/MatchCard';
import StandingsTable from '../components/StandingsTable';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

const LEAGUE_TABS = [
  { key: 'teams', label: 'Equipos', icon: 'team' },
  { key: 'matches', label: 'Partidos', icon: 'match' },
  { key: 'standings', label: 'Clasificacion', icon: 'standings' },
];

const TOURNAMENT_TABS = [
  { key: 'teams', label: 'Equipos', icon: 'team' },
  { key: 'bracket', label: 'Bracket', icon: 'bracket' },
];

const BracketView = ({ bracket, teams, generating, onGenerate, onResultRecorded, scoringType }) => {
  const rounds = Object.keys(bracket).map(Number).sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1] || 1;
  const hasMatches = rounds.length > 0;
  const champion = (bracket[maxRound] || [])[0]?.winner;
  const pending = Object.values(bracket).flat().filter((m) => m.status === 'pending' && m.teamA && m.teamB).length;

  if (!hasMatches) {
    return (
      <div className="card p-10 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
          <Icon name="bracket" size={22} />
        </div>
        <p className="font-semibold text-gray-800 mb-1">Bracket no generado</p>
        <p className="text-gray-400 text-sm mb-4">{teams.length < 2 ? 'Anade al menos 2 equipos.' : 'Genera el bracket para empezar.'}</p>
        {teams.length >= 2 && (
          <button onClick={onGenerate} disabled={generating} className="btn-primary mx-auto text-sm">
            <Icon name="bracket" size={13} /> {generating ? 'Generando...' : 'Generar bracket'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {champion && (
        <div className="card p-4 mb-5 border-amber-200 bg-amber-50 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Icon name="trophy" size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Campeon</p>
            <p className="text-lg font-bold text-gray-900">{champion.name}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{pending} partido(s) pendiente(s)</span>
        <button onClick={onGenerate} disabled={generating} className="btn-secondary text-xs py-1.5">
          <Icon name="bracket" size={13} /> {generating ? 'Generando...' : 'Regenerar bracket'}
        </button>
      </div>

      <div className="space-y-8">
        {rounds.map((round) => {
          const roundMatches = bracket[round] || [];
          const roundName = roundMatches[0]?.roundName || `Ronda ${round}`;
          const isFinal = round === maxRound;

          return (
            <div key={round}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isFinal ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isFinal && <Icon name="trophy" size={11} />}
                  {roundName}
                </div>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300">{roundMatches.filter((m) => m.status === 'played').length}/{roundMatches.length}</span>
              </div>
              <div className="space-y-2">
                {roundMatches.map((match) => (
                  match.status === 'bye' ? (
                    <div key={match._id} className="card px-5 py-3 flex items-center gap-3 text-sm text-gray-400">
                      <Icon name="skip" size={15} />
                      <span>{match.teamA?.name || match.teamB?.name || '-'} - pasa automaticamente</span>
                    </div>
                  ) : (
                    <MatchCard key={match._id} match={match} scoringType={scoringType} onResultRecorded={onResultRecorded} />
                  )
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DivisionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [division, setDivision] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [bracket, setBracket] = useState({});
  const [standings, setStandings] = useState([]);
  const [allDivisions, setAllDivisions] = useState([]);

  const [tab, setTab] = useState('teams');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [playerNames, setPlayerNames] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [teamPlayersDraft, setTeamPlayersDraft] = useState([]);

  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [editingPlayerNames, setEditingPlayerNames] = useState([]);
  const [editingNewPlayerName, setEditingNewPlayerName] = useState('');
  const [expandedTeams, setExpandedTeams] = useState({});
  const [teamActionsTarget, setTeamActionsTarget] = useState(null);

  const isTournament = division?.competition?.type === 'tournament';
  const scoringType = division?.competition?.sport?.scoringType || 'sets';
  const tabs = isTournament ? TOURNAMENT_TABS : LEAGUE_TABS;
  const isOrganizer = user?.role === 'organizer' && division?.competition?.organizer?.toString() === user?.id;

  const settings = division?.competition?.settings || {};
  const promotionSpots = settings.promotionSpots || 0;
  const relegationSpots = settings.relegationSpots || 0;
  const maxTeamsPerDivision = settings.maxTeamsPerDivision || 0;

  const sportTeamSize = Number(division?.competition?.sport?.teamSize || 1);
  const teamSize = Number(division?.teamSize ?? settings.teamSize ?? sportTeamSize);

  const currentDivisionIndex = allDivisions.findIndex((d) => d._id === id);
  const isTopDivision = currentDivisionIndex === 0;
  const isBottomDivision = currentDivisionIndex === allDivisions.length - 1;

  useEffect(() => {
    if (teamSize <= 2) {
      setPlayerNames(new Array(teamSize).fill(''));
      setTeamPlayersDraft([]);
      setNewPlayerName('');
    } else {
      setPlayerNames([]);
      setTeamPlayersDraft([]);
      setNewPlayerName('');
    }
  }, [teamSize]);

  useEffect(() => {
    const init = async () => {
      const div = await getDivision(id);
      setDivision(div.data);

      const competitionId = div.data.competition?._id;
      if (competitionId) {
        const allDivs = await getDivisions(competitionId);
        setAllDivisions(allDivs.data);
      }

      if (div.data?.competition?.type === 'tournament') {
        const [t, b] = await Promise.all([getDivisionTeams(id), getDivisionBracket(id)]);
        setTeams(t.data);
        setBracket(b.data);
      } else {
        const [t, m, s] = await Promise.all([getDivisionTeams(id), getDivisionMatches(id), getStandings(id)]);
        setTeams(t.data);
        setMatches(m.data);
        setStandings(s.data);
      }
    };

    init().finally(() => setLoading(false));
  }, [id]);

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setError('');

    if (maxTeamsPerDivision > 0 && teams.length >= maxTeamsPerDivision) {
      setError(`Maximo ${maxTeamsPerDivision} equipos por division alcanzado`);
      return;
    }

    try {
      const payload = {};
      if (teamSize <= 2) {
        const names = playerNames.map((name) => name.trim()).filter(Boolean);
        if (names.length !== teamSize) {
          setError(`Debe proporcionar exactamente ${teamSize} ${teamSize === 1 ? 'nombre de jugador' : 'nombres de jugadores'}`);
          return;
        }
        payload.playerNames = names;
      } else {
        if (!teamName.trim()) {
          setError('Nombre del equipo es requerido');
          return;
        }
        payload.name = teamName.trim();
        payload.playerNames = teamPlayersDraft.map((name) => name.trim()).filter(Boolean);
      }

      const res = await createDivisionTeam(id, payload);
      setTeams((prev) => [...prev, res.data]);
      setTeamName('');
      setPlayerNames(teamSize <= 2 ? new Array(teamSize).fill('') : []);
      setTeamPlayersDraft([]);
      setNewPlayerName('');
      setShowTeamForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al anadir equipo');
    }
  };

  const startEditTeam = (team) => {
    setError('');
    setEditingTeamId(team._id);
    setEditingTeamName(team.name || '');
    if (teamSize <= 2) {
      // Priority: playerNames array → player user name → parse team.name (e.g. "Carlos / María")
      const nameParts = (team.name || '').split('/').map((s) => s.trim());
      setEditingPlayerNames(
        Array.from({ length: teamSize }, (_, idx) =>
          team.playerNames?.[idx] ||
          team.players?.[idx]?.name ||
          nameParts[idx] ||
          ''
        )
      );
    } else {
      setEditingPlayerNames(team.playerNames?.length ? [...team.playerNames] : []);
    }
    setEditingNewPlayerName('');
  };

  const cancelEditTeam = () => {
    setEditingTeamId(null);
    setEditingTeamName('');
    setEditingPlayerNames([]);
    setEditingNewPlayerName('');
  };

  const addPlayerToDraft = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    if (teamPlayersDraft.length >= teamSize) {
      setError(`No puede haber mas de ${teamSize} jugadores`);
      return;
    }
    setTeamPlayersDraft((prev) => [...prev, name]);
    setNewPlayerName('');
  };

  const removePlayerFromDraft = (idx) => {
    setTeamPlayersDraft((prev) => prev.filter((_, i) => i !== idx));
  };

  const addPlayerToEdit = () => {
    const name = editingNewPlayerName.trim();
    if (!name) return;
    if (editingPlayerNames.length >= teamSize) {
      setError(`No puede haber mas de ${teamSize} jugadores`);
      return;
    }
    setEditingPlayerNames((prev) => [...prev, name]);
    setEditingNewPlayerName('');
  };

  const removePlayerFromEdit = (idx) => {
    setEditingPlayerNames((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTeamExpanded = (teamId) => {
    setExpandedTeams((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const openTeamActions = (teamId) => {
    setTeamActionsTarget((prev) => (prev === teamId ? null : teamId));
  };

  const closeTeamActions = () => {
    setTeamActionsTarget(null);
  };

  const chooseEditTeam = () => {
    if (!teamActionsTarget) return;
    const team = teams.find((t) => t._id === teamActionsTarget);
    if (!team) return;
    startEditTeam(team);
    setExpandedTeams((prev) => ({ ...prev, [team._id]: true }));
    closeTeamActions();
  };

  const chooseDeleteTeam = async () => {
    if (!teamActionsTarget) return;
    const teamId = teamActionsTarget;
    closeTeamActions();
    await handleDeleteTeam(teamId);
  };

  const saveTeamEdit = async (teamId) => {
    try {
      const payload = {};

      if (teamSize <= 2) {
        const names = editingPlayerNames.map((name) => name.trim());
        if (names.some((name) => !name)) {
          setError(`Debe proporcionar exactamente ${teamSize} ${teamSize === 1 ? 'nombre de jugador' : 'nombres de jugadores'}`);
          return;
        }
        payload.playerNames = names;
      } else {
        if (!editingTeamName.trim()) {
          setError('El nombre del equipo no puede estar vacio');
          return;
        }
        payload.name = editingTeamName.trim();
        payload.playerNames = editingPlayerNames.map((name) => name.trim()).filter(Boolean);
      }

      const res = await updateTeam(teamId, payload);
      setTeams((prev) => prev.map((team) => (team._id === teamId ? res.data : team)));
      cancelEditTeam();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar equipo');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    await deleteTeam(teamId);
    setTeams((prev) => prev.filter((team) => team._id !== teamId));
    setExpandedTeams((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
  };

  const handleJoinTeam = async (teamId, position) => {
    try {
      await joinTeam(teamId, { position });
      const t = await getDivisionTeams(id);
      setTeams(t.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al unirse al equipo');
    }
  };

  const handleGenerateMatches = async () => {
    if (!confirm('Generar partidos round-robin? Los pendientes seran reemplazados.')) return;
    setGenerating(true);
    setError('');
    try {
      await generateLeagueMatches(id);
      const [m, s] = await Promise.all([getDivisionMatches(id), getStandings(id)]);
      setMatches(m.data);
      setStandings(s.data);
      setTab('matches');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar partidos');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateBracket = async () => {
    if (!confirm(`Generar bracket con ${teams.length} equipos? Se eliminara el bracket actual.`)) return;
    setGenerating(true);
    setError('');
    try {
      await generateDivisionBracket(id);
      const b = await getDivisionBracket(id);
      setBracket(b.data);
      setTab('bracket');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar bracket');
    } finally {
      setGenerating(false);
    }
  };

  const onResultRecorded = async () => {
    if (isTournament) {
      const b = await getDivisionBracket(id);
      setBracket(b.data);
    } else {
      const [m, s] = await Promise.all([getDivisionMatches(id), getStandings(id)]);
      setMatches(m.data);
      setStandings(s.data);
    }
  };

  const myTeamId = user?.id
    ? teams.find((team) => team.players.some((p) => p && p._id === user.id))?._id?.toString()
    : null;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Icon name="spinner" size={20} className="animate-spin text-brand-500" />
        </div>
      </AppLayout>
    );
  }

  const compId = division?.competition?._id;
  const played = isTournament
    ? Object.values(bracket).flat().filter((m) => m.status === 'played').length
    : matches.filter((m) => m.status === 'played').length;
  const pending = isTournament
    ? Object.values(bracket).flat().filter((m) => m.status === 'pending' && m.teamA && m.teamB).length
    : matches.filter((m) => m.status === 'pending').length;

  return (
    <AppLayout title={division?.name}>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/competitions/${compId}`, { state: { noRedirect: true } })}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="chevronLeft" size={14} /> {division?.competition?.name}
        </button>
        {!isOrganizer && (
          <button
            onClick={() => navigate('/player/matches')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors ml-auto"
          >
            <Icon name="match" size={14} /> Mis partidos
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="card p-3 md:p-4 text-center">
          <p className="text-xl md:text-xl font-bold text-gray-900">{teams.length}</p>
          <p className="text-xs text-gray-400">Equipos</p>
        </div>
        <div className="card p-3 md:p-4 text-center">
          <p className="text-xl font-bold text-brand-600">{played}</p>
          <p className="text-xs text-gray-400">Jugados</p>
        </div>
        <div className="card p-3 md:p-4 text-center">
          <p className="text-xl font-bold text-amber-500">{pending}</p>
          <p className="text-xs text-gray-400">Pendientes</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
          <Icon name="alert" size={14} /> {error}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 mb-4 md:mb-6 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <Icon name={t.icon} size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'teams' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{teams.length} equipo(s)</p>
            {isOrganizer && (
              <div className="flex gap-2">
                {!isTournament && teams.length >= 2 && (
                  <button onClick={handleGenerateMatches} disabled={generating} className="btn-secondary text-xs py-1.5">
                    <Icon name="match" size={13} /> {generating ? 'Generando...' : 'Generar calendario'}
                  </button>
                )}
                {isTournament && teams.length >= 2 && (
                  <button onClick={handleGenerateBracket} disabled={generating} className="btn-secondary text-xs py-1.5">
                    <Icon name="bracket" size={13} /> {generating ? 'Generando...' : 'Generar bracket'}
                  </button>
                )}
                <button
                  onClick={() => setShowTeamForm((v) => !v)}
                  disabled={maxTeamsPerDivision > 0 && teams.length >= maxTeamsPerDivision}
                  className="btn-primary text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="plus" size={13} /> Anadir {teamSize === 1 ? 'jugador' : teamSize === 2 ? 'pareja' : 'equipo'}
                </button>
              </div>
            )}
          </div>

          {isOrganizer && showTeamForm && (
            <form onSubmit={handleAddTeam} className="card p-4 mb-4">
              <div className="space-y-3">
                {teamSize <= 2 ? (
                  Array.from({ length: teamSize }, (_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      className="input"
                      placeholder={teamSize === 1 ? 'Nombre del jugador' : `Jugador ${idx + 1}`}
                      value={playerNames[idx] || ''}
                      onChange={(e) => {
                        const names = [...playerNames];
                        names[idx] = e.target.value;
                        setPlayerNames(names);
                      }}
                      required
                      autoFocus={idx === 0}
                    />
                  ))
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="input"
                      placeholder="Nombre del equipo"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                      autoFocus
                    />
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-700">Jugadores del equipo</p>
                        <p className="text-xs text-gray-500">{teamPlayersDraft.length}/{teamSize}</p>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="input h-9 text-sm"
                          placeholder="Nombre del jugador"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addPlayerToDraft();
                            }
                          }}
                          disabled={teamPlayersDraft.length >= teamSize}
                        />
                        <button
                          type="button"
                          onClick={addPlayerToDraft}
                          disabled={teamPlayersDraft.length >= teamSize}
                          className="btn-secondary text-xs px-3 py-1.5 whitespace-nowrap disabled:opacity-50"
                        >
                          Anadir
                        </button>
                      </div>
                      {teamPlayersDraft.length === 0 ? (
                        <p className="text-xs text-gray-400">Opcional al crear. Puedes anadirlos despues al editar.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {teamPlayersDraft.map((name, idx) => (
                            <span key={`${name}-${idx}`} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 text-xs text-gray-700">
                              {name}
                              <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => removePlayerFromDraft(idx)}>
                                x
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTeamForm(false)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary text-xs py-1.5 px-3">
                    Guardar {teamSize === 1 ? 'jugador' : teamSize === 2 ? 'pareja' : 'equipo'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {teams.length === 0 && !showTeamForm ? (
            <div className="card p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Icon name="team" size={22} />
              </div>
              <p className="font-semibold text-gray-800 mb-1">Sin equipos</p>
              <p className="text-gray-400 text-sm mb-4">Anade equipos para {isTournament ? 'generar el bracket.' : 'generar el calendario.'}</p>
              {isOrganizer && (
                <button onClick={() => setShowTeamForm(true)} className="btn-primary mx-auto text-sm">
                  <Icon name="plus" size={13} /> Anadir primer equipo
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50">
              {teams.map((team) => {
                const isMyTeam = myTeamId && team._id?.toString() === myTeamId;
                const isEditing = editingTeamId === team._id;

                // Padel / individual (teamSize <= 2): flat display, no expand dropdown
                if (teamSize <= 2) {
                  return (
                    <div key={team._id} className={`px-4 py-3 ${isMyTeam ? 'bg-brand-50' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate flex-1">{team.name}</p>

                        {isOrganizer && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => openTeamActions(team._id)}
                              className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                            >
                              <Icon name="more" size={16} />
                            </button>
                            {teamActionsTarget === team._id && (
                              <div className="absolute z-50 right-0 bottom-full mb-1 w-36 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                                <button type="button" onClick={chooseEditTeam} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Editar</button>
                                <button type="button" onClick={chooseDeleteTeam} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inline edit form */}
                      {isEditing && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          {Array.from({ length: teamSize }, (_, idx) => (
                            <div key={idx}>
                              <label className="label">{teamSize === 1 ? 'Jugador' : `Jugador ${idx + 1}`}</label>
                              <input
                                type="text"
                                className="input text-sm"
                                value={editingPlayerNames[idx] || ''}
                                onChange={(e) => {
                                  const names = [...editingPlayerNames];
                                  names[idx] = e.target.value;
                                  setEditingPlayerNames(names);
                                }}
                                placeholder={`Nombre del jugador ${idx + 1}`}
                                autoFocus={idx === 0}
                              />
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-1">
                            <button type="button" onClick={() => saveTeamEdit(team._id)} className="btn-primary text-xs py-1">Guardar</button>
                            <button type="button" onClick={cancelEditTeam} className="btn-secondary text-xs py-1">Cancelar</button>
                          </div>
                        </div>
                      )}

                      {/* Join buttons for players */}
                      {!isEditing && !isOrganizer && (() => {
                        const userInThisTeam = team.players.some((p) => p && p._id === user?.id);
                        const userInOtherTeam = teams.some((t) => t.players.some((p) => p && p._id === user?.id) && t._id !== team._id);
                        if (userInThisTeam) return (
                          <span className="inline-flex mt-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded font-medium items-center gap-1">
                            <Icon name="check" size={12} /> Confirmado
                          </span>
                        );
                        if (userInOtherTeam) return null;
                        return team.playerNames?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {team.playerNames.map((name, idx) => {
                              const isPositionFilled = !!team.players[idx];
                              return isPositionFilled ? (
                                <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{team.players[idx]?.name}</span>
                              ) : (
                                <button key={idx} onClick={() => handleJoinTeam(team._id, idx)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                                  Soy {name}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                }

                // Football / multi-player (teamSize > 2): keep expand/collapse behavior
                return (
                  <div key={team._id} className={`px-4 py-3 ${isMyTeam ? 'bg-brand-50' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleTeamExpanded(team._id)}
                        className="flex items-center gap-2 text-left min-w-0 flex-1"
                      >
                        <Icon name={expandedTeams[team._id] ? 'chevronUp' : 'chevronDown'} size={14} className="text-gray-400" />
                        <p className="font-semibold text-gray-900 text-sm truncate">{team.name}</p>
                      </button>
                      {isOrganizer && (
                        <div className="relative">
                          <button type="button" onClick={() => openTeamActions(team._id)} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                            <Icon name="more" size={16} />
                          </button>
                          {teamActionsTarget === team._id && (
                            <div className="absolute z-50 right-0 bottom-full mb-1 w-36 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                              <button type="button" onClick={chooseEditTeam} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Editar</button>
                              <button type="button" onClick={chooseDeleteTeam} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {expandedTeams[team._id] && (
                      <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input type="text" className="input text-sm h-8" value={editingTeamName} onChange={(e) => setEditingTeamName(e.target.value)} placeholder="Nombre del equipo" autoFocus />
                            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-700">Jugadores</p>
                                <p className="text-xs text-gray-500">{editingPlayerNames.length}/{teamSize}</p>
                              </div>
                              <div className="flex gap-2 mb-2">
                                <input type="text" className="input h-8 text-sm" placeholder="Nombre del jugador" value={editingNewPlayerName}
                                  onChange={(e) => setEditingNewPlayerName(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPlayerToEdit(); } }}
                                  disabled={editingPlayerNames.length >= teamSize}
                                />
                                <button type="button" onClick={addPlayerToEdit} disabled={editingPlayerNames.length >= teamSize} className="btn-secondary text-xs px-3 py-1 whitespace-nowrap disabled:opacity-50">Añadir</button>
                              </div>
                              {editingPlayerNames.length === 0
                                ? <p className="text-xs text-gray-400">Sin jugadores.</p>
                                : <div className="flex flex-wrap gap-1.5">
                                    {editingPlayerNames.map((name, idx) => (
                                      <span key={`${name}-${idx}`} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 text-xs text-gray-700">
                                        {name}
                                        <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => removePlayerFromEdit(idx)}>×</button>
                                      </span>
                                    ))}
                                  </div>
                              }
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => saveTeamEdit(team._id)} className="btn-primary text-xs py-1">Guardar</button>
                              <button type="button" onClick={cancelEditTeam} className="btn-secondary text-xs py-1">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {team.playerNames?.length > 0 ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                {team.playerNames.map((name, idx) => {
                                  const isMe = team.players[idx] && team.players[idx]._id === user?.id;
                                  return (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span className="text-gray-300 text-xs">/</span>}
                                      <span className={`text-xs font-medium ${isMe ? 'text-brand-700' : 'text-gray-600'}`}>{name}</span>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            ) : <p className="text-xs text-gray-500">Sin jugadores definidos</p>}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'matches' && !isTournament && (
        <div>
          {matches.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Icon name="match" size={22} />
              </div>
              <p className="font-semibold text-gray-800 mb-1">Sin partidos</p>
              <p className="text-gray-400 text-sm mb-4">{teams.length < 2 ? 'Anade al menos 2 equipos.' : 'Genera el calendario round-robin.'}</p>
              {isOrganizer && teams.length >= 2 && (
                <button onClick={handleGenerateMatches} disabled={generating} className="btn-primary mx-auto text-sm">
                  <Icon name="match" size={13} /> {generating ? 'Generando...' : 'Generar calendario'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b).map((round) => {
                const roundMatches = matches.filter((m) => m.round === round);
                return (
                  <div key={round}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jornada {round}</span>
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-300">{roundMatches.filter((m) => m.status === 'played').length}/{roundMatches.length}</span>
                    </div>
                    <div className="space-y-2">
                      {roundMatches.map((match) => (
                        <MatchCard key={match._id} match={match} scoringType={scoringType} onResultRecorded={onResultRecorded} myTeamId={myTeamId} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'bracket' && isTournament && (
        <BracketView
          bracket={bracket}
          teams={teams}
          generating={generating}
          onGenerate={handleGenerateBracket}
          onResultRecorded={onResultRecorded}
          scoringType={scoringType}
        />
      )}

      {tab === 'standings' && !isTournament && (
        <div className="card p-5">
          <StandingsTable
            standings={standings}
            promotionSpots={promotionSpots}
            relegationSpots={relegationSpots}
            isTopDivision={isTopDivision}
            isBottomDivision={isBottomDivision}
            currentUserId={user?.id}
          />
        </div>
      )}
    </AppLayout>
  );
};

export default DivisionDetail;

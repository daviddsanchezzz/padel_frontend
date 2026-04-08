import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDivision, getDivisions, updateDivision } from '../api/divisions';
import { getDivisionTeams, createDivisionTeam, deleteTeam, joinTeam, updateTeam } from '../api/teams';
import { getDivisionMatches, generateLeagueMatches, generateDivisionBracket, getDivisionBracket } from '../api/matches';
import { getStandings } from '../api/standings';
import AppLayout from '../layouts/AppLayout';
import MatchCard from '../components/MatchCard';
import StandingsTable from '../components/StandingsTable';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

// ── League tabs ───────────────────────────────────────────────────────────────
const LEAGUE_TABS = [
  { key: 'teams',     label: 'Equipos',       icon: 'team' },
  { key: 'matches',   label: 'Partidos',      icon: 'match' },
  { key: 'standings', label: 'Clasificación', icon: 'standings' },
];

// ── Tournament tabs ───────────────────────────────────────────────────────────
const TOURNAMENT_TABS = [
  { key: 'teams',   label: 'Equipos', icon: 'team' },
  { key: 'bracket', label: 'Bracket', icon: 'bracket' },
];

// ── Bracket view ──────────────────────────────────────────────────────────────
const BracketView = ({ bracket, teams, generating, onGenerate, onResultRecorded, scoringType }) => {
  const rounds     = Object.keys(bracket).map(Number).sort((a, b) => a - b);
  const maxRound   = rounds[rounds.length - 1] || 1;
  const hasMatches = rounds.length > 0;
  const champion   = (bracket[maxRound] || [])[0]?.winner;
  const pending    = Object.values(bracket).flat().filter((m) => m.status === 'pending' && m.teamA && m.teamB).length;

  if (!hasMatches) return (
    <div className="card p-10 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
        <Icon name="bracket" size={22} />
      </div>
      <p className="font-semibold text-gray-800 mb-1">Bracket no generado</p>
      <p className="text-gray-400 text-sm mb-4">
        {teams.length < 2 ? 'Añade al menos 2 equipos.' : 'Genera el bracket para empezar.'}
      </p>
      {teams.length >= 2 && (
        <button onClick={onGenerate} disabled={generating} className="btn-primary mx-auto text-sm">
          <Icon name="bracket" size={13} /> {generating ? 'Generando...' : 'Generar bracket'}
        </button>
      )}
    </div>
  );

  return (
    <div>
      {champion && (
        <div className="card p-4 mb-5 border-amber-200 bg-amber-50 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Icon name="trophy" size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Campeón</p>
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
          const roundName    = roundMatches[0]?.roundName || `Ronda ${round}`;
          const isFinal      = round === maxRound;
          return (
            <div key={round}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                  isFinal ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isFinal && <Icon name="trophy" size={11} />}
                  {roundName}
                </div>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300">
                  {roundMatches.filter((m) => m.status === 'played').length}/{roundMatches.length}
                </span>
              </div>
              <div className="space-y-2">
                {roundMatches.map((match) =>
                  match.status === 'bye' ? (
                    <div key={match._id} className="card px-5 py-3 flex items-center gap-3 text-sm text-gray-400">
                      <Icon name="skip" size={15} />
                      <span>{match.teamA?.name || match.teamB?.name || '—'} — pasa automáticamente</span>
                    </div>
                  ) : (
                    <MatchCard key={match._id} match={match} scoringType={scoringType} onResultRecorded={onResultRecorded} />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const DivisionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [division, setDivision]     = useState(null);
  const [teams, setTeams]           = useState([]);
  const [matches, setMatches]       = useState([]);
  const [bracket, setBracket]       = useState({});
  const [standings, setStandings]   = useState([]);
  const [tab, setTab]               = useState('teams');
  const [loading, setLoading]       = useState(true);
  const [playerNames, setPlayerNames] = useState([]);
  const [teamName, setTeamName]     = useState('');
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');
  const [allDivisions, setAllDivisions] = useState([]);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [selectedTeamSize, setSelectedTeamSize] = useState(null);

  const isTournament  = division?.competition?.type === 'tournament';
  const scoringType   = division?.competition?.sport?.scoringType || 'sets';
  const TABS          = isTournament ? TOURNAMENT_TABS : LEAGUE_TABS;
  const isOrganizer   = user?.role === 'organizer' && division?.competition?.organizer?.toString() === user?.id;
  
  // Determine division position and promotion/relegation settings
  const currentDivisionIndex = allDivisions.findIndex(d => d._id === id);
  const isTopDivision = currentDivisionIndex === 0;
  const isBottomDivision = currentDivisionIndex === allDivisions.length - 1;
  const settings = division?.competition?.settings || {};
  const promotionSpots = settings.promotionSpots || 0;
  const relegationSpots = settings.relegationSpots || 0;
  const maxTeamsPerDivision = settings.maxTeamsPerDivision || 0;
  
  // Use division's teamSize override if set, otherwise use sport's teamSize
  const sportTeamSize = division?.competition?.sport?.teamSize || 1;
  const teamSize = division?.teamSize ?? sportTeamSize;
  
  // For sports that allow size selection (e.g., football with 5/7/11)
  const teamSizeOptions = division?.competition?.sport?.name?.toLowerCase().includes('futbol') ? [5, 7, 11] : [];
  const effectiveTeamSize = selectedTeamSize || teamSize;

  useEffect(() => {
    if (effectiveTeamSize <= 2) {
      setPlayerNames(new Array(effectiveTeamSize).fill(''));
      setTeamName('');
    } else {
      setPlayerNames([]);
      setTeamName('');
    }
  }, [effectiveTeamSize]);

  useEffect(() => {
    setError('');
  }, [effectiveTeamSize]);

  const reload = async () => {
    if (!division) return;
    if (isTournament) {
      const [t, b] = await Promise.all([getDivisionTeams(id), getDivisionBracket(id)]);
      setTeams(t.data); setBracket(b.data);
    } else {
      const [t, m, s] = await Promise.all([getDivisionTeams(id), getDivisionMatches(id), getStandings(id)]);
      setTeams(t.data); setMatches(m.data); setStandings(s.data);
    }
  };

  useEffect(() => {
    const init = async () => {
      const div = await getDivision(id);
      setDivision(div.data);
      const competitionId = div.data.competition?._id;
      
      // Fetch all divisions to determine position
      if (competitionId) {
        const allDivs = await getDivisions(competitionId);
        setAllDivisions(allDivs.data);
      }
      
      const isT = div.data?.competition?.type === 'tournament';
      if (isT) {
        const [t, b] = await Promise.all([getDivisionTeams(id), getDivisionBracket(id)]);
        setTeams(t.data); setBracket(b.data);
      } else {
        const [t, m, s] = await Promise.all([getDivisionTeams(id), getDivisionMatches(id), getStandings(id)]);
        setTeams(t.data); setMatches(m.data); setStandings(s.data);
      }
    };
    init().finally(() => setLoading(false));
  }, [id]);

  const handleAddTeam = async (e) => {
    e.preventDefault(); 
    setError('');
    
    // Enforce max teams per division
    if (maxTeamsPerDivision > 0 && teams.length >= maxTeamsPerDivision) {
      setError(`Máximo ${maxTeamsPerDivision} equipos por división alcanzado`);
      return;
    }
    
    try {
      const teamData = {};
      const size = effectiveTeamSize;
      
      if (size <= 2) {
        // For small teams, use player names
        const filledNames = playerNames.filter(n => n.trim());
        if (filledNames.length !== size) {
          setError(`Debe proporcionar exactamente ${size} ${size === 1 ? 'nombre de jugador' : 'nombres de jugadores'}`);
          return;
        }
        teamData.playerNames = filledNames;
      } else {
        // For larger teams, use team name
        if (!teamName.trim()) {
          setError('Nombre del equipo es requerido');
          return;
        }
        teamData.name = teamName.trim();
      }
      
      const res = await createDivisionTeam(id, teamData);
      setTeams([...teams, res.data]);
      
      // Reset form
      setPlayerNames(new Array(size).fill(''));
      setTeamName('');
      setSelectedTeamSize(null);
      setShowTeamForm(false);
    } catch (err) { 
      setError(err.response?.data?.message || 'Error al añadir equipo'); 
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('¿Eliminar este equipo?')) return;
    await deleteTeam(teamId);
    setTeams(teams.filter((t) => t._id !== teamId));
  };

  const handleEditTeam = async (teamId, newName) => {
    if (!newName.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }
    try {
      const res = await updateTeam(teamId, { name: newName.trim() });
      setTeams(teams.map(t => t._id === teamId ? res.data : t));
      setEditingTeamId(null);
      setEditingTeamName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar equipo');
    }
  };

  const handleJoinTeam = async (teamId, position) => {
    try {
      await joinTeam(teamId, { position });
      // Refresh teams to show updated player list
      const t = await getDivisionTeams(id);
      setTeams(t.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al unirse al equipo');
    }
  };

  const handleGenerateMatches = async () => {
    if (!confirm('¿Generar partidos round-robin? Los partidos pendientes existentes serán reemplazados.')) return;
    setGenerating(true); setError('');
    try {
      await generateLeagueMatches(id);
      const [m, s] = await Promise.all([getDivisionMatches(id), getStandings(id)]);
      setMatches(m.data); setStandings(s.data); setTab('matches');
    } catch (err) { setError(err.response?.data?.message || 'Error al generar partidos'); }
    finally { setGenerating(false); }
  };

  const handleGenerateBracket = async () => {
    if (!confirm(`¿Generar bracket con ${teams.length} equipos? Se eliminará el bracket actual.`)) return;
    setGenerating(true); setError('');
    try {
      await generateDivisionBracket(id);
      const b = await getDivisionBracket(id);
      setBracket(b.data); setTab('bracket');
    } catch (err) { setError(err.response?.data?.message || 'Error al generar bracket'); }
    finally { setGenerating(false); }
  };

  const onResultRecorded = async () => {
    if (isTournament) {
      const b = await getDivisionBracket(id);
      setBracket(b.data);
    } else {
      const [m, s] = await Promise.all([getDivisionMatches(id), getStandings(id)]);
      setMatches(m.data); setStandings(s.data);
    }
  };

  const myTeamId = user?.id
    ? teams.find(t => t.players.some(p => p && p._id === user.id))?._id?.toString()
    : null;

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center py-20">
        <Icon name="spinner" size={20} className="animate-spin text-brand-500" />
      </div>
    </AppLayout>
  );

  const compId  = division?.competition?._id;
  const played  = isTournament
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="card p-3 md:p-4 text-center md:flex md:items-center md:gap-3 md:text-left">
          <div className="hidden md:flex w-8 h-8 bg-gray-100 rounded-lg items-center justify-center text-gray-400 flex-shrink-0">
            <Icon name="team" size={15} />
          </div>
          <div>
            <p className="text-xl md:text-xl font-bold text-gray-900">{teams.length}</p>
            <p className="text-xs text-gray-400">Equipos</p>
          </div>
        </div>
        <div className="card p-3 md:p-4 text-center md:flex md:items-center md:gap-3 md:text-left">
          <div className="hidden md:flex w-8 h-8 bg-brand-50 rounded-lg items-center justify-center text-brand-600 flex-shrink-0">
            <Icon name="check" size={15} />
          </div>
          <div>
            <p className="text-xl font-bold text-brand-600">{played}</p>
            <p className="text-xs text-gray-400">Jugados</p>
          </div>
        </div>
        <div className="card p-3 md:p-4 text-center md:flex md:items-center md:gap-3 md:text-left">
          <div className="hidden md:flex w-8 h-8 bg-amber-50 rounded-lg items-center justify-center text-amber-500 flex-shrink-0">
            <Icon name="calendar" size={15} />
          </div>
          <div>
            <p className="text-xl font-bold text-amber-500">{pending}</p>
            <p className="text-xs text-gray-400">Pendientes</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
          <Icon name="alert" size={14} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4 md:mb-6 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon name={t.icon} size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Teams tab */}
      {tab === 'teams' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{teams.length} equipo(s)</p>
            {isOrganizer && (
              <div className="flex gap-2">
                {!isTournament && teams.length >= 2 && (
                  <button onClick={handleGenerateMatches} disabled={generating} className="btn-secondary text-xs py-1.5">
                    <Icon name="match" size={13} /> <span className="hidden sm:inline">{generating ? 'Generando...' : 'Generar calendario'}</span><span className="sm:hidden">{generating ? '...' : 'Calendario'}</span>
                  </button>
                )}
                {isTournament && teams.length >= 2 && (
                  <button onClick={handleGenerateBracket} disabled={generating} className="btn-secondary text-xs py-1.5">
                    <Icon name="bracket" size={13} /> <span className="hidden sm:inline">{generating ? 'Generando...' : 'Generar bracket'}</span><span className="sm:hidden">{generating ? '...' : 'Bracket'}</span>
                  </button>
                )}
            <button
                  onClick={() => setShowTeamForm(!showTeamForm)}
                  disabled={maxTeamsPerDivision > 0 && teams.length >= maxTeamsPerDivision}
                  className="btn-primary text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="plus" size={13} /> <span className="hidden sm:inline">Añadir {effectiveTeamSize === 1 ? 'equipo' : effectiveTeamSize === 2 ? 'pareja' : `equipo de ${effectiveTeamSize} jugadores`}</span><span className="sm:hidden">Añadir</span>
                </button>
              </div>
            )}
          </div>

          {isOrganizer && showTeamForm && (
            <form onSubmit={handleAddTeam} className="card p-4 mb-4">
              <div className="space-y-3">
                {/* Team size selector for sports with options */}
                {teamSizeOptions.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Tamaño del Equipo</label>
                    <div className="flex gap-2">
                      {teamSizeOptions.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedTeamSize(size)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedTeamSize === size || (!selectedTeamSize && size === teamSize)
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Fútbol {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input fields based on team size */}
                {effectiveTeamSize <= 2 ? (
                  // Player name inputs for small teams
                  Array.from({ length: effectiveTeamSize }, (_, i) => (
                    <input 
                      key={i} 
                      type="text" 
                      className="input"
                      placeholder={effectiveTeamSize === 1 ? 'Nombre del jugador' : `Jugador ${i + 1} · Ej: García`}
                      value={playerNames[i] || ''} 
                      onChange={(e) => {
                        const newNames = [...playerNames];
                        newNames[i] = e.target.value;
                        setPlayerNames(newNames);
                      }}
                      required 
                      autoFocus={i === 0} 
                    />
                  ))
                ) : (
                  // Team name input for larger teams
                  <input
                    type="text"
                    className="input"
                    placeholder="Nombre del equipo · Ej: FC Barcelona"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    autoFocus
                  />
                )}

                <button type="submit" className="btn-primary w-full">Añadir {effectiveTeamSize === 1 ? 'jugador' : effectiveTeamSize === 2 ? 'pareja' : `equipo`}</button>
                <button type="button" onClick={() => {
                  setShowTeamForm(false);
                  setSelectedTeamSize(null);
                }} className="btn-secondary w-full">Cancelar</button>
              </div>
            </form>
          )}

          {teams.length === 0 && !showTeamForm ? (
            <div className="card p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Icon name="team" size={22} />
              </div>
              <p className="font-semibold text-gray-800 mb-1">Sin equipos</p>
              <p className="text-gray-400 text-sm mb-4">Añade {effectiveTeamSize === 1 ? 'jugadores' : effectiveTeamSize === 2 ? 'parejas' : `equipos de ${effectiveTeamSize} jugadores`} para {isTournament ? 'generar el bracket.' : 'generar el calendario.'}</p>
              {isOrganizer && (
                <button onClick={() => setShowTeamForm(true)} className="btn-primary mx-auto text-sm">
                  <Icon name="plus" size={13} /> Añadir {effectiveTeamSize === 1 ? 'primer jugador' : effectiveTeamSize === 2 ? 'primera pareja' : `primer equipo de ${effectiveTeamSize} jugadores`}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((team, i) => (
                <div key={team._id} className={`card px-4 py-3 flex items-center justify-between gap-2 ${myTeamId && team._id?.toString() === myTeamId ? 'border-brand-300 bg-brand-50' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      {editingTeamId === team._id ? (
                        <input
                          type="text"
                          className="input text-sm h-8"
                          value={editingTeamName}
                          onChange={(e) => setEditingTeamName(e.target.value)}
                          onBlur={() => {
                            if (editingTeamName.trim()) {
                              handleEditTeam(team._id, editingTeamName);
                            } else {
                              setEditingTeamId(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditTeam(team._id, editingTeamName);
                            } else if (e.key === 'Escape') {
                              setEditingTeamId(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          {team.playerNames && team.playerNames.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {team.playerNames.map((name, idx) => {
                                const isMe = team.players[idx] && team.players[idx]._id === user?.id;
                                return (
                                  <React.Fragment key={idx}>
                                    {idx > 0 && <span className="text-gray-300 text-sm">/</span>}
                                    <span className={`text-sm font-semibold ${isMe ? 'text-brand-700' : 'text-gray-900'}`}>{name}</span>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="font-semibold text-gray-900 text-sm truncate">{team.name}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {isOrganizer ? (
                      <>
                        {!team.playerNames || team.playerNames.length === 0 ? (
                          <button
                            onClick={() => {
                              setEditingTeamId(team._id);
                              setEditingTeamName(team.name);
                            }}
                            className="text-gray-300 hover:text-brand-400 transition-colors"
                            title="Editar equipo"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        ) : null}
                        <button onClick={() => handleDeleteTeam(team._id)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <Icon name="trash" size={14} />
                        </button>
                      </>
                    ) : (
                      (() => {
                        const userInThisTeam = team.players.some(p => p && p._id === user?.id);
                        const userInOtherTeam = teams.some(t => t.players.some(p => p && p._id === user?.id) && t._id !== team._id);
                        
                        if (userInThisTeam) {
                          // User is in this team - show confirmed
                          return (
                            <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded font-medium flex items-center gap-1">
                              <Icon name="check" size={12} /> Confirmado
                            </span>
                          );
                        } else if (userInOtherTeam) {
                          // User is in another team - don't show anything
                          return null;
                        } else {
                          // User is not in any team - show join buttons
                          return (
                            team.playerNames && team.playerNames.length > 0 && (
                              <div className="flex gap-1">
                                {team.playerNames.map((name, idx) => {
                                  const isPositionFilled = !!team.players[idx];
                                  const filledPlayerName = isPositionFilled ? team.players[idx]?.name : null;
                                  
                                  return isPositionFilled ? (
                                    <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                      {filledPlayerName}
                                    </span>
                                  ) : (
                                    <button 
                                      key={idx}
                                      onClick={() => handleJoinTeam(team._id, idx)}
                                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                    >
                                      Soy {name}
                                    </button>
                                  );
                                })}
                              </div>
                            )
                          );
                        }
                      })()
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Matches tab (league only) */}
      {tab === 'matches' && !isTournament && (
        <div>
          {matches.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Icon name="match" size={22} />
              </div>
              <p className="font-semibold text-gray-800 mb-1">Sin partidos</p>
              <p className="text-gray-400 text-sm mb-4">
                {teams.length < 2 ? 'Añade al menos 2 equipos.' : 'Genera el calendario round-robin.'}
              </p>
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
                      <span className="text-xs text-gray-300">
                        {roundMatches.filter((m) => m.status === 'played').length}/{roundMatches.length}
                      </span>
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

      {/* Bracket tab (tournament only) */}
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

      {/* Standings tab (league only) */}
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

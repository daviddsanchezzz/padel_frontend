import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompetition } from '../api/competitions';
import { getCompetitionTeams, createCompetitionTeam, deleteTeam } from '../api/teams';
import { generateBracket, getBracket } from '../api/matches';
import AppLayout from '../layouts/AppLayout';
import MatchCard from '../components/MatchCard';
import Icon from '../components/Icon';

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [teams, setTeams]             = useState([]);
  const [bracket, setBracket]         = useState({});
  const [tab, setTab]                 = useState('teams');
  const [loading, setLoading]         = useState(true);
  const [teamName, setTeamName]       = useState('');
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState('');

  const scoringType = competition?.sport?.scoringType || 'sets';

  const reload = async () => {
    const [c, t, b] = await Promise.all([getCompetition(id), getCompetitionTeams(id), getBracket(id)]);
    setCompetition(c.data); setTeams(t.data); setBracket(b.data);
  };

  useEffect(() => { reload().finally(() => setLoading(false)); }, [id]);

  const handleAddTeam = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await createCompetitionTeam(id, { name: teamName });
      setTeams([...teams, res.data]);
      setTeamName(''); setShowTeamForm(false);
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('¿Eliminar este equipo?')) return;
    await deleteTeam(teamId);
    setTeams(teams.filter((t) => t._id !== teamId));
  };

  const handleGenerateBracket = async () => {
    if (!confirm(`¿Generar bracket con ${teams.length} equipos?`)) return;
    setGenerating(true); setError('');
    try {
      await generateBracket(id);
      const b = await getBracket(id);
      setBracket(b.data); setTab('bracket');
    } catch (err) { setError(err.response?.data?.message || 'Error al generar la eliminatoria'); }
    finally { setGenerating(false); }
  };

  const onResultRecorded = async () => {
    const b = await getBracket(id);
    setBracket(b.data);
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center py-20">
        <Icon name="spinner" size={20} className="animate-spin text-brand-500" />
      </div>
    </AppLayout>
  );

  const rounds     = Object.keys(bracket).map(Number).sort((a, b) => a - b);
  const maxRound   = rounds[rounds.length - 1] || 1;
  const hasMatches = rounds.length > 0;
  const champion   = (bracket[maxRound] || [])[0]?.winner;
  const pending    = Object.values(bracket).flat().filter((m) => m.status === 'pending' && m.teamA && m.teamB).length;

  return (
    <AppLayout title={competition?.name}>
      <button
        onClick={() => navigate(`/competitions/${id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
      >
        <Icon name="chevronLeft" size={14} /> Volver
      </button>

      {/* Champion banner */}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            <Icon name="team" size={15} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{teams.length}</p>
            <p className="text-xs text-gray-400">Equipos</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
            <Icon name="bracket" size={15} />
          </div>
          <div>
            <p className="text-xl font-bold text-brand-600">{rounds.length}</p>
            <p className="text-xs text-gray-400">Rondas</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
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
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {[
          { key: 'teams',   label: 'Equipos',      icon: 'team' },
          { key: 'bracket', label: 'Eliminatoria', icon: 'bracket' },
        ].map((t) => (
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

      {/* Teams */}
      {tab === 'teams' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{teams.length} equipo(s)</p>
            <div className="flex gap-2">
              {teams.length >= 2 && (
                <button onClick={handleGenerateBracket} disabled={generating} className="btn-secondary text-xs py-1.5">
                  <Icon name="bracket" size={13} /> {generating ? 'Generando...' : 'Generar eliminatoria'}
                </button>
              )}
              <button onClick={() => setShowTeamForm(!showTeamForm)} className="btn-primary text-xs py-1.5">
                <Icon name="plus" size={13} /> Añadir equipo
              </button>
            </div>
          </div>
          {showTeamForm && (
            <form onSubmit={handleAddTeam} className="card p-4 mb-4 flex gap-2">
              <input type="text" className="input flex-1"
                placeholder="Nombre del equipo / pareja"
                value={teamName} onChange={(e) => setTeamName(e.target.value)} required autoFocus />
              <button type="submit" className="btn-primary whitespace-nowrap">Añadir</button>
              <button type="button" onClick={() => setShowTeamForm(false)} className="btn-secondary">Cancelar</button>
            </form>
          )}
          <div className="space-y-2">
            {teams.length === 0 && !showTeamForm && (
              <div className="card p-10 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                  <Icon name="team" size={22} />
                </div>
                <p className="font-semibold text-gray-800 mb-1">Sin equipos</p>
                <p className="text-gray-400 text-sm mb-4">Añade equipos para generar la eliminatoria.</p>
                <button onClick={() => setShowTeamForm(true)} className="btn-primary mx-auto text-sm">
                  <Icon name="plus" size={13} /> Añadir primer equipo
                </button>
              </div>
            )}
            {teams.map((team, i) => (
              <div key={team._id} className="card px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-brand-50 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold">
                    {team.seed || i + 1}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{team.name}</p>
                </div>
                <button onClick={() => handleDeleteTeam(team._id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bracket */}
      {tab === 'bracket' && (
        <div>
          {!hasMatches ? (
            <div className="card p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Icon name="bracket" size={22} />
              </div>
              <p className="font-semibold text-gray-800 mb-1">Eliminatoria no generada</p>
              <p className="text-gray-400 text-sm mb-4">
                {teams.length < 2 ? 'Añade al menos 2 equipos.' : 'Genera la eliminatoria para empezar.'}
              </p>
              {teams.length >= 2 && (
                <button onClick={handleGenerateBracket} disabled={generating} className="btn-primary mx-auto text-sm">
                  <Icon name="bracket" size={13} /> {generating ? 'Generando...' : 'Generar eliminatoria'}
                </button>
              )}
            </div>
          ) : (
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
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default TournamentDetail;

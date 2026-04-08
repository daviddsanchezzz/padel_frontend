import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { getPublicDivision } from '../api/organizations';
import PublicLayout from '../layouts/PublicLayout';
import Icon from '../components/Icon';
import StandingsTable from '../components/StandingsTable';

const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

const ScoreDisplay = ({ result, scoringType }) => {
  if (!result) return <span className="text-xs font-semibold text-gray-300 tracking-widest">VS</span>;
  if (scoringType === 'sets' && result.sets) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {result.sets.map((s, i) => (
          <div key={i} className="flex items-center gap-0.5 text-sm">
            <span className={s.a > s.b ? 'font-bold text-gray-900' : 'text-gray-400'}>{s.a}</span>
            <span className="text-gray-200">-</span>
            <span className={s.b > s.a ? 'font-bold text-gray-900' : 'text-gray-400'}>{s.b}</span>
          </div>
        ))}
      </div>
    );
  }
  if (scoringType === 'goals' && result.goals) {
    const { a, b } = result.goals;
    return (
      <span className="text-base font-bold">
        <span className={a > b ? 'text-gray-900' : 'text-gray-400'}>{a}</span>
        <span className="text-gray-300 mx-1">-</span>
        <span className={b > a ? 'text-gray-900' : 'text-gray-400'}>{b}</span>
      </span>
    );
  }
  return null;
};

const PublicMatchRow = ({ match, scoringType }) => {
  const teamAName = match.teamA?.name || 'TBD';
  const teamBName = match.teamB?.name || 'TBD';
  const displayResult = match.status === 'awaiting_confirmation' ? match.pendingResult : match.result;
  const winnerId = match.winner?._id || match.winner;
  const teamAId  = match.teamA?._id || match.teamA;
  const teamBId  = match.teamB?._id || match.teamB;
  const winnerSide = winnerId
    ? winnerId.toString() === teamAId?.toString() ? 'A'
      : winnerId.toString() === teamBId?.toString() ? 'B' : null
    : null;

  const dateParts = [
    match.location,
    match.matchDate ? match.matchDate.split('-').reverse().join('/') + (match.matchTime ? ' ' + match.matchTime : '') : '',
  ].filter(Boolean);

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 md:px-5 py-3 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <div className={`flex-1 text-right text-xs md:text-sm font-medium truncate ${winnerSide === 'A' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
          {teamAName}
        </div>
        <div className="flex-shrink-0 flex flex-col items-center w-[80px] md:w-[100px]">
          <ScoreDisplay result={displayResult} scoringType={scoringType} />
          {match.status === 'pending' && !displayResult && (
            <span className="text-[10px] text-gray-300 font-medium">Pendiente</span>
          )}
        </div>
        <div className={`flex-1 text-xs md:text-sm font-medium truncate ${winnerSide === 'B' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
          {teamBName}
        </div>
      </div>
      {dateParts.length > 0 && (
        <p className="text-xs text-gray-400 mt-1.5 text-center">{dateParts.join(' · ')}</p>
      )}
    </div>
  );
};

const PublicBracket = ({ bracket, scoringType }) => {
  const rounds = Object.keys(bracket).map(Number).sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1] || 1;
  const champion = (bracket[maxRound] || [])[0]?.winner;

  if (rounds.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
        <p className="font-semibold text-gray-800">Bracket no generado</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {champion && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Trophy size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Campeon</p>
            <p className="text-lg font-bold text-gray-900">{champion.name}</p>
          </div>
        </div>
      )}
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
              <span className="text-xs text-gray-300">
                {roundMatches.filter((m) => m.status === 'played').length}/{roundMatches.length}
              </span>
            </div>
            <div className="space-y-2">
              {roundMatches.map((match) =>
                match.status === 'bye' ? (
                  <div key={match._id} className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-3 text-sm text-gray-400 shadow-sm">
                    <Icon name="skip" size={15} />
                    <span>{match.teamA?.name || match.teamB?.name || '-'} — pasa automaticamente</span>
                  </div>
                ) : (
                  <PublicMatchRow key={match._id} match={match} scoringType={scoringType} />
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PublicDivisionDetail = () => {
  const { orgId, divId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateOrg = location.state?.org;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('teams');

  useEffect(() => {
    setLoading(true);
    getPublicDivision(orgId, divId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar la division'))
      .finally(() => setLoading(false));
  }, [orgId, divId]);

  const org = data?.org || stateOrg || { name: '' };
  const color = org.primaryColor || '#0b1d12';

  const division     = data?.division;
  const competition  = division?.competition;
  const allDivisions = data?.allDivisions || [];
  const teams        = data?.teams || [];
  const matches      = data?.matches || [];
  const standings    = data?.standings || [];
  const bracket      = data?.bracket || {};

  const isTournament = competition?.type === 'tournament';
  const scoringType  = competition?.sport?.scoringType || 'sets';
  const settings     = competition?.settings || {};
  const promotionSpots  = settings.promotionSpots || 0;
  const relegationSpots = settings.relegationSpots || 0;

  const currentDivisionIndex = allDivisions.findIndex((d) => d._id === divId);
  const isTopDivision    = currentDivisionIndex === 0;
  const isBottomDivision = currentDivisionIndex === allDivisions.length - 1;

  const played = isTournament
    ? Object.values(bracket).flat().filter((m) => m.status === 'played').length
    : matches.filter((m) => m.status === 'played').length;
  const pending = isTournament
    ? Object.values(bracket).flat().filter((m) => m.status === 'pending' && m.teamA && m.teamB).length
    : matches.filter((m) => m.status === 'pending').length;

  const TABS = isTournament
    ? [
        { key: 'teams',   label: 'Equipos',  icon: 'team' },
        { key: 'bracket', label: 'Bracket',  icon: 'bracket' },
      ]
    : [
        { key: 'teams',     label: 'Equipos',      icon: 'team' },
        { key: 'matches',   label: 'Partidos',      icon: 'match' },
        { key: 'standings', label: 'Clasificacion', icon: 'standings' },
      ];

  const compId = competition?._id;

  if (error && !loading && !data) {
    return (
      <PublicLayout orgId={orgId} orgName={org.name} orgLogo={org.logo} orgColor={color}>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="font-bold text-gray-900 mb-1">No disponible</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      orgId={orgId}
      orgName={org.name}
      orgLogo={org.logo}
      orgColor={color}
      title={loading ? undefined : `${competition?.name} · ${division?.name}`}
    >
      {/* Breadcrumb + division switcher */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={() => navigate(`/organizations/${orgId}/competitions/${compId}/public`, { state: { org } })}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="chevronLeft" size={14} />
          {loading ? '...' : competition?.name}
        </button>
        {allDivisions.length > 1 && (
          <div className="ml-auto flex items-center gap-1 flex-wrap">
            {allDivisions.map((d) => (
              <button
                key={d._id}
                onClick={() => navigate(`/organizations/${orgId}/divisions/${d._id}/public`, { state: { org } })}
                className="text-xs px-3 py-1 rounded-full font-medium transition-colors border"
                style={d._id === divId
                  ? { backgroundColor: color, color: '#fff', borderColor: color }
                  : { backgroundColor: '#fff', color: '#64748b', borderColor: '#e2e8f0' }
                }
              >
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-4 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-900">{teams.length}</p>
            <p className="text-xs text-gray-400">Equipos</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-4 text-center shadow-sm">
            <p className="text-xl font-bold" style={{ color }}>{played}</p>
            <p className="text-xs text-gray-400">Jugados</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-4 text-center shadow-sm">
            <p className="text-xl font-bold text-amber-500">{pending}</p>
            <p className="text-xs text-gray-400">Pendientes</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap"
            style={tab === t.key
              ? { borderBottomColor: color, color: 'inherit' }
              : { borderColor: 'transparent', color: '#9ca3af' }
            }
          >
            <Icon name={t.icon} size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Teams */}
      {tab === 'teams' && (
        loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : teams.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <p className="font-semibold text-gray-800">Sin equipos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teams.map((team, i) => {
              const playerNames = team.players?.map((p) => p.name).filter(Boolean) || [];
              const displayName = playerNames.length > 0 ? playerNames.join(' / ') : team.name;
              return (
                <div key={team._id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {i + 1}
                  </div>
                  <p className="font-semibold text-gray-800">{displayName}</p>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tab: Matches */}
      {tab === 'matches' && !isTournament && (
        loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : matches.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <p className="font-semibold text-gray-800">Sin partidos</p>
            <p className="text-sm text-gray-400 mt-1">El calendario aun no ha sido generado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => (
              <PublicMatchRow key={match._id} match={match} scoringType={scoringType} />
            ))}
          </div>
        )
      )}

      {/* Tab: Standings */}
      {tab === 'standings' && !isTournament && (
        loading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <StandingsTable
              standings={standings}
              promotionSpots={promotionSpots}
              relegationSpots={relegationSpots}
              isTopDivision={isTopDivision}
              isBottomDivision={isBottomDivision}
            />
          </div>
        )
      )}

      {/* Tab: Bracket */}
      {tab === 'bracket' && isTournament && (
        loading
          ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          : <PublicBracket bracket={bracket} scoringType={scoringType} />
      )}
    </PublicLayout>
  );
};

export default PublicDivisionDetail;

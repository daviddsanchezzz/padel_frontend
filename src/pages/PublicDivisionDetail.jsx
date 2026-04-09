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

/* ── Score renderer ─────────────────────────────────────────── */
const ScoreDisplay = ({ result, scoringType }) => {
  if (!result) return <span className="text-xs font-semibold text-gray-300 tracking-widest">VS</span>;

  if (scoringType === 'sets' && result.sets) {
    return (
      <div className="flex items-center gap-1 flex-wrap justify-center">
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

/* ── Single match row — vertical (Sofascore style) ─────────── */
const MatchRow = ({ match, scoringType }) => {
  const teamAName = match.teamA?.name || 'TBD';
  const teamBName = match.teamB?.name || 'TBD';
  const displayResult = match.status === 'awaiting_confirmation' ? match.pendingResult : match.result;
  const winnerId  = match.winner?._id || match.winner;
  const teamAId   = match.teamA?._id  || match.teamA;
  const teamBId   = match.teamB?._id  || match.teamB;
  const winnerSide = winnerId
    ? winnerId.toString() === teamAId?.toString() ? 'A'
      : winnerId.toString() === teamBId?.toString() ? 'B' : null
    : null;

  const isPending = match.status === 'pending' && !displayResult;
  const sets  = scoringType === 'sets'  && displayResult?.sets  ? displayResult.sets  : null;
  const goals = scoringType === 'goals' && displayResult?.goals ? displayResult.goals : null;

  const nameClass = (side) => {
    if (!winnerSide) return 'text-gray-800';
    return winnerSide === side ? 'font-bold text-gray-900' : 'text-gray-400';
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        {/* Team names stacked */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className={`text-xs font-semibold truncate ${nameClass('A')}`}>{teamAName}</p>
          <p className={`text-xs font-semibold truncate ${nameClass('B')}`}>{teamBName}</p>
        </div>

        {/* Scores — fixed columns, stacked per set */}
        <div className="flex-shrink-0 flex gap-2 items-start">
          {isPending ? (
            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide mt-1">PDTE</span>
          ) : sets ? (
            sets.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`text-xs w-4 text-center leading-none ${s.a > s.b ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{s.a}</span>
                <span className={`text-xs w-4 text-center leading-none ${s.b > s.a ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{s.b}</span>
              </div>
            ))
          ) : goals ? (
            <div className="flex flex-col items-center gap-1">
              <span className={`text-xs w-4 text-center leading-none ${goals.a > goals.b ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{goals.a}</span>
              <span className={`text-xs w-4 text-center leading-none ${goals.b > goals.a ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{goals.b}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* ── Bracket view (tournament) ──────────────────────────────── */
const PublicBracket = ({ bracket, scoringType, color }) => {
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
    <div className="space-y-6">
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
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isFinal ? 'text-amber-500' : 'text-gray-400'}`}>
                {roundName}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300">
                {roundMatches.filter((m) => m.status === 'played').length}/{roundMatches.length}
              </span>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
              {roundMatches.map((match) =>
                match.status === 'bye' ? (
                  <div key={match._id} className="px-4 py-2.5 flex items-center gap-3 text-sm text-gray-400">
                    <Icon name="skip" size={14} />
                    <span>{match.teamA?.name || match.teamB?.name || '-'} — pasa automaticamente</span>
                  </div>
                ) : (
                  <MatchRow key={match._id} match={match} scoringType={scoringType} />
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────── */
const PublicDivisionDetail = () => {
  const { orgId, divId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateOrg = location.state?.org;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(null); // null = auto-select after load

  useEffect(() => {
    setLoading(true);
    getPublicDivision(orgId, divId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar la division'))
      .finally(() => setLoading(false));
  }, [orgId, divId]);

  const org        = data?.org || stateOrg || { name: '' };
  const color      = org.primaryColor || '#0b1d12';

  const division     = data?.division;
  const competition  = division?.competition;
  const allDivisions = data?.allDivisions || [];
  const teams        = data?.teams || [];
  const matches      = data?.matches || [];
  const standings    = data?.standings || [];
  const bracket      = data?.bracket || {};

  const isTournament = competition?.type === 'tournament';
  const scoringType  = competition?.sport?.scoringType || 'sets';

  // Form map: teamId -> ['W','L',...] ordered oldest→newest, last 5 played matches
  const formMap = (() => {
    if (isTournament || !standings.length || !matches.length) return {};
    const map = {};
    standings.forEach(({ team }) => {
      const tid = team._id?.toString();
      if (!tid) return;
      map[tid] = matches
        .filter(m =>
          m.status === 'played' &&
          (m.teamA?._id?.toString() === tid || m.teamB?._id?.toString() === tid)
        )
        .sort((a, b) => (b.round ?? 0) - (a.round ?? 0))
        .slice(0, 3)
        .reverse()
        .map(m => {
          const w = m.winner?._id?.toString() || m.winner?.toString();
          return w === tid ? 'W' : 'L';
        });
    });
    return map;
  })();
  const settings     = competition?.settings || {};
  const promotionSpots  = settings.promotionSpots || 0;
  const relegationSpots = settings.relegationSpots || 0;

  const currentDivisionIndex = allDivisions.findIndex((d) => d._id === divId);
  const isTopDivision    = currentDivisionIndex === 0;
  const isBottomDivision = currentDivisionIndex === allDivisions.length - 1;

  // Auto-select first tab when data arrives
  const TABS = isTournament
    ? [
        { key: 'bracket', label: 'Bracket',      icon: 'bracket' },
        { key: 'teams',   label: 'Equipos',       icon: 'team' },
      ]
    : [
        { key: 'standings', label: 'Clasificacion', icon: 'standings' },
        { key: 'matches',   label: 'Jornadas',      icon: 'match' },
        { key: 'teams',     label: 'Equipos',       icon: 'team' },
      ];

  const activeTab = tab ?? TABS[0].key;

  // Group league matches by round
  const matchesByRound = matches.reduce((acc, m) => {
    const r = m.round ?? 0;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

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
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={() => navigate(`/organizations/${orgId}/competitions/${compId}/public`, { state: { org } })}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="chevronLeft" size={13} />
          {loading ? '...' : competition?.name}
        </button>

        {/* Division switcher */}
        {allDivisions.length > 1 && (
          <div className="ml-auto flex items-center gap-1 flex-wrap">
            {allDivisions.map((d) => (
              <button
                key={d._id}
                onClick={() => navigate(`/organizations/${orgId}/divisions/${d._id}/public`, { state: { org } })}
                className="text-xs px-3 py-1 rounded-full font-semibold transition-colors border"
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

      {/* Division title */}
      {!loading && division && (
        <h1 className="text-base font-bold text-gray-900 tracking-tight mb-4">{division.name}</h1>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-5 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap"
            style={activeTab === t.key
              ? { borderBottomColor: color, color: '#111' }
              : { borderColor: 'transparent', color: '#9ca3af' }
            }
          >
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Standings ── */}
      {activeTab === 'standings' && !isTournament && (
        loading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 pt-4 pb-1">
              <StandingsTable
                standings={standings}
                promotionSpots={promotionSpots}
                relegationSpots={relegationSpots}
                isTopDivision={isTopDivision}
                isBottomDivision={isBottomDivision}
                formMap={formMap}
              />
            </div>
          </div>
        )
      )}

      {/* ── Matches / Jornadas ── */}
      {activeTab === 'matches' && !isTournament && (
        loading ? (
          <div className="space-y-4">
            {[1,2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <p className="font-semibold text-gray-800">Sin partidos</p>
            <p className="text-sm text-gray-400 mt-1">El calendario aun no ha sido generado.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {rounds.map((round) => {
              const rMatches = matchesByRound[round];
              return (
                <div key={round}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      Jornada {round}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-300">
                      {rMatches.filter((m) => m.status === 'played').length}/{rMatches.length}
                    </span>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                    {rMatches.map((match) => (
                      <MatchRow key={match._id} match={match} scoringType={scoringType} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Teams ── */}
      {activeTab === 'teams' && (
        loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {[1,2,3,4].map(i => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <p className="font-semibold text-gray-800">Sin equipos</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {teams.map((team, i) => {
              const playerNames = team.players?.map((p) => p.name).filter(Boolean) || [];
              const displayName = playerNames.length > 0 ? playerNames.join(' / ') : team.name;
              return (
                <div key={team._id} className="px-4 py-3 flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{displayName}</p>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Bracket ── */}
      {activeTab === 'bracket' && isTournament && (
        loading
          ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          : <PublicBracket bracket={bracket} scoringType={scoringType} color={color} />
      )}
    </PublicLayout>
  );
};

export default PublicDivisionDetail;

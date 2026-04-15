import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { getPublicDivision } from '../api/organizations';
import PublicLayout from '../layouts/PublicLayout';
import Icon from '../components/Icon';
import StandingsTable from '../components/StandingsTable';
import VisualBracket from '../components/VisualBracket';

const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

const formatDateLabel = (value) => {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
};

const formatDateTimeLabel = (match) => {
  if (match?.matchDate && match?.matchTime) return `${formatDateLabel(match.matchDate)} ${match.matchTime}`;
  if (match?.matchDate) return formatDateLabel(match.matchDate);
  if (match?.matchTime) return match.matchTime;
  if (match?.scheduledDate) {
    const date = new Date(match.scheduledDate);
    if (!Number.isNaN(date.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
  }
  return '';
};

/* ── Single match row ───────────────────────────────────────── */
const MatchRow = ({ match, scoringType, eventModeEnabled = false, onOpenDetail }) => {
  const teamAName  = match.teamA?.name || 'TBD';
  const teamBName  = match.teamB?.name || 'TBD';
  const displayResult = match.status === 'awaiting_confirmation' ? match.pendingResult : match.result;
  const winnerId   = match.winner?._id || match.winner;
  const teamAId    = match.teamA?._id  || match.teamA;
  const teamBId    = match.teamB?._id  || match.teamB;
  const winnerSide = winnerId
    ? winnerId.toString() === teamAId?.toString() ? 'A'
      : winnerId.toString() === teamBId?.toString() ? 'B' : null
    : null;

  const isPending = match.status === 'pending' && !displayResult;
  const schedulePieces = [match.location, formatDateTimeLabel(match)].filter(Boolean);
  const sets  = scoringType === 'sets' && displayResult?.sets ? displayResult.sets : null;
  const goals = scoringType === 'goals' && displayResult?.goals ? displayResult.goals : null;
  const openDetail = () => {
    if (eventModeEnabled && onOpenDetail) onOpenDetail(match._id);
  };

  return (
    <div onClick={openDetail} className={`px-4 py-3 ${eventModeEnabled ? 'cursor-pointer' : ''}`}>
      {scoringType === 'goals' ? (
        <div className="space-y-1.5">
          <div className="md:hidden space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <p className={`min-w-0 text-[13px] font-semibold text-right truncate ${winnerSide === 'A' ? 'text-gray-900' : winnerSide === 'B' ? 'text-gray-400' : 'text-gray-800'}`}>
                {teamAName}
              </p>
              <div className="flex items-center justify-center gap-1 px-1">
                {goals != null ? (
                  <>
                    <span className={`text-xl font-bold leading-none tabular-nums ${winnerSide === 'A' ? 'text-gray-900' : 'text-gray-400'}`}>{goals.a}</span>
                    <span className="text-xs text-gray-300 font-medium">-</span>
                    <span className={`text-xl font-bold leading-none tabular-nums ${winnerSide === 'B' ? 'text-gray-900' : 'text-gray-400'}`}>{goals.b}</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-gray-300 tracking-widest">- -</span>
                )}
              </div>
              <p className={`min-w-0 text-[13px] font-semibold text-left truncate ${winnerSide === 'B' ? 'text-gray-900' : winnerSide === 'A' ? 'text-gray-400' : 'text-gray-800'}`}>
                {teamBName}
              </p>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="mx-auto max-w-[560px] grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <p className={`min-w-0 text-sm font-semibold text-right truncate ${winnerSide === 'A' ? 'text-gray-900' : winnerSide === 'B' ? 'text-gray-400' : 'text-gray-800'}`}>{teamAName}</p>
              <div className="flex items-center justify-center gap-1.5 px-2">
                {goals != null ? (
                  <>
                    <span className={`text-base font-bold leading-none tabular-nums ${winnerSide === 'A' ? 'text-gray-900' : 'text-gray-400'}`}>{goals.a}</span>
                    <span className="text-xs text-gray-300 font-medium">-</span>
                    <span className={`text-base font-bold leading-none tabular-nums ${winnerSide === 'B' ? 'text-gray-900' : 'text-gray-400'}`}>{goals.b}</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-gray-300 tracking-widest">- -</span>
                )}
              </div>
              <p className={`min-w-0 text-sm font-semibold text-left truncate ${winnerSide === 'B' ? 'text-gray-900' : winnerSide === 'A' ? 'text-gray-400' : 'text-gray-800'}`}>{teamBName}</p>
            </div>
          </div>

          {schedulePieces.length > 0 && (
            <p className="text-xs text-gray-400 text-center">{schedulePieces.join(' · ')}</p>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <p className={`text-xs font-semibold truncate ${winnerSide === 'A' ? 'font-bold text-gray-900' : winnerSide === 'B' ? 'text-gray-400' : 'text-gray-800'}`}>{teamAName}</p>
            <p className={`text-xs font-semibold truncate ${winnerSide === 'B' ? 'font-bold text-gray-900' : winnerSide === 'A' ? 'text-gray-400' : 'text-gray-800'}`}>{teamBName}</p>
          </div>
          <div className="flex-shrink-0 flex gap-2 items-start">
            {isPending
              ? null
              : sets
                ? sets.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className={`text-xs w-4 text-center leading-none ${s.a > s.b ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{s.a}</span>
                      <span className={`text-xs w-4 text-center leading-none ${s.b > s.a ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{s.b}</span>
                    </div>
                  ))
                : (
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs w-4 text-center leading-none ${goals?.a > goals?.b ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{goals?.a ?? '-'}</span>
                      <span className={`text-xs w-4 text-center leading-none ${goals?.b > goals?.a ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{goals?.b ?? '-'}</span>
                    </div>
                  )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Public bracket (list + visual toggle) ──────────────────── */
const PublicBracket = ({ bracket, scoringType, eventModeEnabled, onOpenDetail }) => {
  const [viewMode, setViewMode] = useState('list');
  const rounds = Object.keys(bracket).map(Number).sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1] || 1;
  const champion = (bracket[maxRound] || [])[0]?.winner;

  if (rounds.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
        <p className="font-semibold text-gray-800">Eliminatoria no generada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Vista toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 self-start w-fit">
        <button onClick={() => setViewMode('list')} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Lista</button>
        <button onClick={() => setViewMode('visual')} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${viewMode === 'visual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Cuadro</button>
      </div>

      {viewMode === 'visual' ? (
        <div className="pt-6">
          <VisualBracket bracket={bracket} scoringType={scoringType} />
        </div>
      ) : (
        <div className="space-y-5">
          {rounds.map((round) => {
            const roundMatches = bracket[round] || [];
            const roundName = roundMatches[0]?.roundName || `Ronda ${round}`;
            const isFinal = round === maxRound;
            return (
              <div key={round}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${isFinal ? 'text-amber-500' : 'text-gray-400'}`}>{roundName}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-300">{roundMatches.filter((m) => m.status === 'played').length}/{roundMatches.length}</span>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                  {roundMatches.map((match) =>
                    match.status === 'bye' ? (
                      <div key={match._id} className="px-4 py-2.5 flex items-center gap-3 text-sm text-gray-400">
                        <Icon name="skip" size={14} />
                        <span>{match.teamA?.name || match.teamB?.name || '-'} — pasa automaticamente</span>
                      </div>
                    ) : (
                      <MatchRow
                        key={match._id}
                        match={match}
                        scoringType={scoringType}
                        eventModeEnabled={eventModeEnabled}
                        onOpenDetail={(matchId) => onOpenDetail(matchId, { tab: 'bracket' })}
                      />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Public groups view ─────────────────────────────────────── */
const PublicGroups = ({ groups, scoringType, teamsAdvancing, eventModeEnabled, onOpenDetail, initialSubTab = 'standings' }) => {
  const [subTab, setSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab === 'standings' || initialSubTab === 'matches') {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  if (!groups.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
        <p className="font-semibold text-gray-800">Grupos no generados</p>
        <p className="text-sm text-gray-400 mt-1">El sorteo de grupos aún no se ha realizado.</p>
      </div>
    );
  }

  const allRounds = [...new Set(groups.flatMap((g) => g.matches.map((m) => m.round)))].sort((a, b) => a - b);
  const totalPlayed  = groups.reduce((s, g) => s + g.matches.filter((m) => m.status === 'played').length, 0);
  const totalMatches = groups.reduce((s, g) => s + g.matches.length, 0);

  return (
    <div className="space-y-4">
      {/* Sub-tab toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 self-start w-fit">
        <button onClick={() => setSubTab('standings')} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${subTab === 'standings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Clasificación
        </button>
        <button onClick={() => setSubTab('matches')} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${subTab === 'matches' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Partidos <span className="ml-1 text-gray-400">{totalPlayed}/{totalMatches}</span>
        </button>
      </div>

      {/* Clasificación — grid 2 cols */}
      {subTab === 'standings' && (
        <div className={`grid grid-cols-1 gap-4 ${groups.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {groups.map((group) => (
            <div key={group.name} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-brand-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {group.name}
                </div>
                <span className="text-sm font-semibold text-gray-800">Grupo {group.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {group.matches.filter((m) => m.status === 'played').length}/{group.matches.length} jugados
                </span>
              </div>
              <StandingsTable
                standings={group.standings}
                promotionSpots={teamsAdvancing}
                relegationSpots={0}
                isTopDivision={false}
                isBottomDivision={true}
                promotionLabel="pasan"
              />
            </div>
          ))}
        </div>
      )}

      {/* Partidos — por jornada */}
      {subTab === 'matches' && (
        <div className="space-y-5">
          {allRounds.map((round) => {
            const roundMatches = groups.flatMap((g) =>
              g.matches.filter((m) => m.round === round).map((m) => ({ ...m, _groupName: g.name }))
            );
            return (
              <div key={round}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Jornada {round}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-300">{roundMatches.filter((m) => m.status === 'played').length}/{roundMatches.length}</span>
                </div>
                <div className="space-y-2">
                  {roundMatches.map((match) => (
                    <div key={match._id} className="flex items-start gap-2">
                      <div className="w-6 h-6 sm:w-5 sm:h-5 mt-0 sm:mt-3 bg-brand-100 text-brand-700 rounded-md sm:rounded flex items-center justify-center text-[11px] sm:text-[10px] font-bold flex-shrink-0">
                        {match._groupName}
                      </div>
                      <div className="flex-1 min-w-0 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <MatchRow
                          match={match}
                          scoringType={scoringType}
                          eventModeEnabled={eventModeEnabled}
                          onOpenDetail={(matchId) => onOpenDetail(matchId, { tab: 'groups', groupsSubTab: 'matches' })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────── */
const PublicDivisionDetail = () => {
  const { orgId, orgSlug, compId, competitionSlug, divId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateOrg = location.state?.org;

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState(() => location.state?.tab || null);

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.state]);

  const routeOrgRef = orgId || orgSlug;

  useEffect(() => {
    if (!routeOrgRef || !divId) return;
    setLoading(true);
    getPublicDivision(routeOrgRef, divId)
      .then((res) => {
        setData(res.data);
        if (!competitionSlug && res.data?.org?.slug && res.data?.division?.competition?.publicSlug) {
          const canonicalPath = `/${res.data.org.slug}/${res.data.division.competition.publicSlug}/divisiones/${divId}`;
          if (location.pathname !== canonicalPath) {
            navigate(canonicalPath, { replace: true, state: { org: res.data.org } });
          }
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar la division'))
      .finally(() => setLoading(false));
  }, [routeOrgRef, divId, competitionSlug, navigate, location.pathname]);

  const org        = data?.org || stateOrg || { name: '' };
  const orgRef = org.slug || routeOrgRef;
  const compRef = competitionSlug || data?.division?.competition?.publicSlug || compId;
  const color      = org.primaryColor || '#0b1d12';
  const division   = data?.division;
  const competition = division?.competition;
  const allDivisions = data?.allDivisions || [];
  const teams      = data?.teams || [];
  const matches    = data?.matches || [];
  const standings  = data?.standings || [];
  const bracket    = data?.bracket || {};
  const groups     = data?.groups || [];
  const tournamentFormat = data?.tournamentFormat || 'elimination';

  const isTournament  = competition?.type === 'tournament';
  const isGroupFormat = isTournament && tournamentFormat === 'groups_and_elimination';
  const scoringType   = competition?.sport?.scoringType || 'sets';
  const settings      = competition?.settings || {};
  const eventModeEnabled = scoringType === 'goals' && settings?.resultConfig?.mode === 'events';
  const teamsAdvancing = Number(settings.teamsAdvancing) || 2;

  const formMap = (() => {
    if (isTournament || !standings.length || !matches.length) return {};
    const map = {};
    standings.forEach(({ team }) => {
      const tid = team._id?.toString();
      if (!tid) return;
      map[tid] = matches
        .filter(m => m.status === 'played' && (m.teamA?._id?.toString() === tid || m.teamB?._id?.toString() === tid))
        .sort((a, b) => (b.round ?? 0) - (a.round ?? 0))
        .slice(0, 3).reverse()
        .map(m => { const w = m.winner?._id?.toString() || m.winner?.toString(); return w === tid ? 'W' : 'L'; });
    });
    return map;
  })();

  const promotionSpots  = settings.promotionSpots || 0;
  const relegationSpots = settings.relegationSpots || 0;
  const currentDivisionIndex = allDivisions.findIndex((d) => d._id === divId);
  const isTopDivision    = currentDivisionIndex === 0;
  const isBottomDivision = currentDivisionIndex === allDivisions.length - 1;

  const TABS = isTournament
    ? isGroupFormat
      ? [
          { key: 'groups',  label: 'Grupos',       icon: 'standings' },
          { key: 'bracket', label: 'Eliminatoria',  icon: 'bracket' },
          { key: 'teams',   label: 'Equipos',       icon: 'team' },
        ]
      : [
          { key: 'bracket', label: 'Eliminatoria',  icon: 'bracket' },
          { key: 'teams',   label: 'Equipos',       icon: 'team' },
        ]
    : [
        { key: 'standings', label: 'Clasificacion', icon: 'standings' },
        { key: 'matches',   label: 'Jornadas',      icon: 'match' },
        { key: 'teams',     label: 'Equipos',       icon: 'team' },
      ];

  const activeTab = tab ?? TABS[0].key;

  const matchesByRound = matches.reduce((acc, m) => {
    const r = m.round ?? 0;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const competitionId = competition?._id;

  const openPublicMatchDetail = (id, state = {}) => {
    const nextPath = compRef
      ? `/${orgRef}/${compRef}/partidos/${id}`
      : `/organizations/${orgRef}/matches/${id}/public`;
    const backPath = compRef
      ? `/${orgRef}/${compRef}/divisiones/${divId}`
      : `/organizations/${orgRef}/divisions/${divId}/public`;
    navigate(nextPath, {
      state: {
        org,
        backTo: {
          pathname: backPath,
          state,
        },
      },
    });
  };

  if (error && !loading && !data) {
    return (
      <PublicLayout orgId={routeOrgRef} orgSlug={org.slug} orgName={org.name} orgLogo={org.logo} orgColor={color}>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="font-bold text-gray-900 mb-1">No disponible</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout orgId={routeOrgRef} orgSlug={org.slug} orgName={org.name} orgLogo={org.logo} orgColor={color}
      title={loading ? undefined : `${competition?.name} · ${division?.name}`}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={() => navigate(compRef ? `/${orgRef}/${compRef}` : `/organizations/${orgRef}/competitions/${competitionId || compId}/public`, { state: { org } })}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="chevronLeft" size={13} />
          {loading ? '...' : competition?.name}
        </button>

        {allDivisions.length > 1 && (
          <div className="ml-auto flex items-center gap-1 flex-wrap">
            {allDivisions.map((d) => (
              <button
                key={d._id}
                onClick={() => navigate(
                  compRef ? `/${orgRef}/${compRef}/divisiones/${d._id}` : `/organizations/${orgRef}/divisions/${d._id}/public`,
                  { state: { org } }
                )}
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

      {/* ── Grupos ── */}
      {activeTab === 'groups' && isGroupFormat && (
        loading
          ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
          : <PublicGroups
              groups={groups}
              scoringType={scoringType}
              teamsAdvancing={teamsAdvancing}
              eventModeEnabled={eventModeEnabled}
              onOpenDetail={openPublicMatchDetail}
              initialSubTab={location.state?.groupsSubTab || 'standings'}
            />
      )}

      {/* ── Bracket ── */}
      {activeTab === 'bracket' && isTournament && (
        loading
          ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          : <PublicBracket bracket={bracket} scoringType={scoringType} eventModeEnabled={eventModeEnabled} onOpenDetail={openPublicMatchDetail} />
      )}

      {/* ── Standings ── */}
      {activeTab === 'standings' && !isTournament && (
        loading ? <Skeleton className="h-64 rounded-2xl" /> : (
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

      {/* ── Jornadas ── */}
      {activeTab === 'matches' && !isTournament && (
        loading ? (
          <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        ) : matches.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <p className="font-semibold text-gray-800">Sin partidos</p>
            <p className="text-sm text-gray-400 mt-1">El calendario aún no ha sido generado.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {rounds.map((round) => {
              const rMatches = matchesByRound[round];
              return (
                <div key={round}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Jornada {round}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-300">{rMatches.filter((m) => m.status === 'played').length}/{rMatches.length}</span>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                    {rMatches.map((match) => (
                      <MatchRow
                        key={match._id}
                        match={match}
                        scoringType={scoringType}
                        eventModeEnabled={eventModeEnabled}
                        onOpenDetail={(matchId) => openPublicMatchDetail(matchId, { tab: 'matches' })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Equipos ── */}
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
              const displayName = team.players?.map((p) => p.name).filter(Boolean).join(' / ') || team.name;
              const groupBadge = isGroupFormat && team.group;
              return (
                <div key={team._id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                    {i + 1}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 flex-1">{displayName}</p>
                  {groupBadge && (
                    <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">
                      Gr. {team.group}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </PublicLayout>
  );
};

export default PublicDivisionDetail;

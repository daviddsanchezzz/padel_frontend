import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import Icon from '../components/Icon';
import { getPublicMatchDetail } from '../api/organizations';

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

const EVENT_FEED_META = {
  goal: { icon: '⚽' },
  assist: { icon: '🦶' },
  yellow_card: { icon: '🟨' },
  red_card: { icon: '🟥' },
};

const PublicMatchDetail = () => {
  const { orgId, matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [org, setOrg] = useState(location.state?.org || null);
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getPublicMatchDetail(orgId, matchId)
      .then((res) => {
        setOrg(res.data?.org || null);
        setMatch(res.data?.match || null);
        setEvents(Array.isArray(res.data?.events) ? res.data.events : []);
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar el partido'))
      .finally(() => setLoading(false));
  }, [orgId, matchId]);

  const teamAId = match?.teamA?._id?.toString() || match?.teamA?.toString();
  const orgRef = org?.slug || orgId;
  const winnerSide = match?.winner ? (match.winner.toString() === teamAId ? 'A' : 'B') : null;
  const goals = match?.result?.goals;
  const schedulePieces = [match?.location, formatDateTimeLabel(match)].filter(Boolean);

  const resultConfig = match?.competition?.settings?.resultConfig || {};
  const eventModeEnabled = match?.competition?.sport?.scoringType === 'goals' && resultConfig.mode === 'events';
  const assistEnabled = (resultConfig.enabledEventTypes || []).includes('assist');

  const sortedEvents = useMemo(
    () =>
      events
        .map((ev, sourceIdx) => ({ ...ev, sourceIdx }))
        .sort((a, b) => {
          const d = Number(a.minute || 0) - Number(b.minute || 0);
          return d !== 0 ? d : new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }),
    [events],
  );

  const rowsForActa = useMemo(() => {
    if (!assistEnabled) return sortedEvents.map((ev) => ({ ...ev, assistEv: null }));
    const usedAssist = new Set();
    const rows = [];
    for (const ev of sortedEvents) {
      if (ev.type === 'assist') {
        if (!usedAssist.has(ev.sourceIdx)) rows.push({ ...ev, assistEv: null });
        continue;
      }
      if (ev.type === 'goal') {
        const assistEv = sortedEvents.find(
          (cand) =>
            cand.type === 'assist' &&
            !usedAssist.has(cand.sourceIdx) &&
            Number(cand.minute) === Number(ev.minute) &&
            cand.team?.toString() === ev.team?.toString(),
        );
        if (assistEv) usedAssist.add(assistEv.sourceIdx);
        rows.push({ ...ev, assistEv: assistEv || null });
        continue;
      }
      rows.push({ ...ev, assistEv: null });
    }
    return rows;
  }, [assistEnabled, sortedEvents]);

  const handleBack = () => {
    const backTo = location.state?.backTo;
    if (backTo?.pathname) {
      navigate(backTo.pathname, { state: backTo.state });
      return;
    }
    const divId = match?.division?._id || match?.division;
    if (divId) {
      navigate(`/organizations/${orgRef}/divisions/${divId}/public`, { state: { org } });
      return;
    }
    navigate(org?.slug ? `/${org.slug}` : `/organizations/${orgId}/public`, { state: { org } });
  };

  return (
    <PublicLayout orgId={orgId} orgSlug={org?.slug} orgName={org?.name} orgLogo={org?.logo} orgColor={org?.primaryColor} title="Detalle del partido">
      <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
        <Icon name="chevronLeft" size={14} /> Volver
      </button>

      {loading && (
        <div className="flex items-center justify-center py-14">
          <Icon name="spinner" size={20} className="animate-spin text-brand-500" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-white border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && match && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <p className={`text-sm md:text-base font-bold text-right truncate ${winnerSide === 'A' ? 'text-gray-900' : winnerSide === 'B' ? 'text-gray-400' : 'text-gray-800'}`}>
                {match.teamA?.name || 'Equipo A'}
              </p>
              <div className="flex items-center justify-center gap-2 px-2">
                {goals != null ? (
                  <>
                    <span className={`text-2xl font-bold tabular-nums leading-none ${winnerSide === 'A' ? 'text-gray-900' : 'text-gray-400'}`}>{goals.a}</span>
                    <span className="text-sm text-gray-300 font-medium">-</span>
                    <span className={`text-2xl font-bold tabular-nums leading-none ${winnerSide === 'B' ? 'text-gray-900' : 'text-gray-400'}`}>{goals.b}</span>
                  </>
                ) : (
                  <span className="text-lg font-semibold text-gray-300 tracking-widest">- -</span>
                )}
              </div>
              <p className={`text-sm md:text-base font-bold text-left truncate ${winnerSide === 'B' ? 'text-gray-900' : winnerSide === 'A' ? 'text-gray-400' : 'text-gray-800'}`}>
                {match.teamB?.name || 'Equipo B'}
              </p>
            </div>
            {schedulePieces.length > 0 && <p className="text-xs text-gray-400 text-center mt-2.5">{schedulePieces.join(' · ')}</p>}
          </div>

          {!eventModeEnabled && <div className="card p-4 text-sm text-gray-500 text-center">Este partido no usa eventos detallados.</div>}

          {eventModeEnabled && (
            <div className="card overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acta del partido</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">Eventos oficiales</p>
              </div>

              <div className="px-3 sm:px-5 py-4">
                {rowsForActa.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Sin eventos registrados.</p>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                    <div className="grid grid-cols-[minmax(0,1fr)_54px_minmax(0,1fr)] sm:grid-cols-[1fr_58px_1fr] items-center px-3 py-2 border-b border-gray-200 bg-gray-50">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-gray-600 uppercase tracking-wide truncate">{match.teamA?.name}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-center">Min</p>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-gray-600 uppercase tracking-wide text-right truncate">{match.teamB?.name}</p>
                    </div>

                    {rowsForActa.map((ev, idx) => {
                      const isTeamA = ev.team?.toString() === teamAId;
                      const meta = EVENT_FEED_META[ev.type] || { icon: '•' };
                      return (
                        <div
                          key={ev._id || `${ev.minute}-${idx}`}
                          className={`grid grid-cols-[minmax(0,1fr)_54px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_58px_minmax(0,1fr)] items-stretch min-h-[60px] sm:min-h-[56px] px-1.5 sm:px-2 ${idx !== rowsForActa.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <div className="pr-1.5 sm:pr-2 flex justify-end items-center">
                            {isTeamA ? (
                              <div className="inline-flex items-center gap-1.5 px-1.5 py-2 rounded-md max-w-full text-right flex-row-reverse">
                                <span className="text-[12px] sm:text-base leading-none">{meta.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-[11px] sm:text-xs font-semibold text-gray-900 truncate">{ev.playerName || 'Jugador'}</p>
                                  {ev.assistEv && <p className="text-[10px] text-gray-500 truncate">Asist. {ev.assistEv.playerName}</p>}
                                </div>
                              </div>
                            ) : (
                              <div className="h-8" />
                            )}
                          </div>
                          <div className="h-full flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-900 tabular-nums leading-none">{ev.minute}'</span>
                          </div>
                          <div className="pl-1.5 sm:pl-2 flex justify-start items-center">
                            {!isTeamA ? (
                              <div className="inline-flex items-center gap-1.5 px-1.5 py-2 rounded-md max-w-full text-right">
                                <span className="text-[12px] sm:text-base leading-none">{meta.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-[11px] sm:text-xs font-semibold text-gray-900 truncate">{ev.playerName || 'Jugador'}</p>
                                  {ev.assistEv && <p className="text-[10px] text-gray-500 truncate">Asist. {ev.assistEv.playerName}</p>}
                                </div>
                              </div>
                            ) : (
                              <div className="h-8" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </PublicLayout>
  );
};

export default PublicMatchDetail;

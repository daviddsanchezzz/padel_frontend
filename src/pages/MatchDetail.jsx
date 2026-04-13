import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { X, Pencil } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { getMatch, getMatchEvents, recordMatchEvents } from '../api/matches';

const DEFAULT_EVENT_TYPES = ['goal', 'assist', 'yellow_card', 'red_card'];

const EVENT_META = {
  goal: { label: 'Gol', tone: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  assist: { label: 'Asistencia', tone: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500' },
  yellow_card: { label: 'T. Amarilla', tone: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  red_card: { label: 'T. Roja', tone: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
};

const EVENT_FEED_META = {
  goal: { label: 'Gol', icon: '⚽', accent: 'text-emerald-400' },
  assist: { label: 'Asistencia', icon: '🦶', accent: 'text-sky-300' },
  yellow_card: { label: 'Tarjeta amarilla', icon: '🟨', accent: 'text-amber-300' },
  red_card: { label: 'Tarjeta roja', icon: '🟥', accent: 'text-red-300' },
};

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

const TOTAL_STEPS = 3;

const AddEventModal = ({
  match,
  enabledEventTypes,
  playersByTeam,
  onConfirm,
  onClose,
  saving,
  initialEvent,
  title = 'Anadir evento',
}) => {
  const [step, setStep] = useState(1);
  const [ev, setEv] = useState(initialEvent || { type: enabledEventTypes[0] || 'goal', teamSide: 'A', minute: '', playerName: '' });

  useEffect(() => {
    setStep(1);
    setEv(initialEvent || { type: enabledEventTypes[0] || 'goal', teamSide: 'A', minute: '', playerName: '' });
  }, [initialEvent, enabledEventTypes]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const players = playersByTeam[ev.teamSide] || [];
  const canNext1 = !!ev.type;
  const canNext2 = !!ev.teamSide && ev.minute !== '';
  const canConfirm = !!ev.playerName || players.length === 0;

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const teamName = (side) => (side === 'A' ? match.teamA?.name || 'Equipo A' : match.teamB?.name || 'Equipo B');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {step > 1 && (
              <button type="button" onClick={back} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <Icon name="chevronLeft" size={16} />
              </button>
            )}
            <div>
              <p className="text-sm font-bold text-gray-900">{title}</p>
              <p className="text-xs text-gray-400">Paso {step} de {TOTAL_STEPS}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-brand-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="px-5 py-5 space-y-3">
          {step === 1 && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo de evento</p>
              <div className="grid grid-cols-2 gap-2.5">
                {enabledEventTypes.map((type) => {
                  const meta = EVENT_META[type] || { label: type, tone: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' };
                  const selected = ev.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEv((e) => ({ ...e, type }))}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                        selected ? `${meta.bg} ${meta.border} ring-2 ring-offset-1 ring-brand-300` : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${meta.dot}`} />
                      <span className={`text-sm font-semibold ${selected ? meta.tone : 'text-gray-700'}`}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={next} disabled={!canNext1} className="btn-primary w-full justify-center mt-1 disabled:opacity-50">
                Siguiente
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Equipo</p>
              <div className="grid grid-cols-2 gap-2.5">
                {['A', 'B'].map((side) => {
                  const selected = ev.teamSide === side;
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setEv((e) => ({ ...e, teamSide: side, playerName: '' }))}
                      className={`px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all truncate ${
                        selected
                          ? 'bg-brand-50 border-brand-500 text-brand-700 ring-2 ring-offset-1 ring-brand-200'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {teamName(side)}
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="label">Minuto</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input text-center text-lg font-bold"
                  placeholder="0"
                  value={ev.minute}
                  onChange={(e) =>
                    setEv((cur) => ({
                      ...cur,
                      minute: e.target.value.replace(/\D/g, '').slice(0, 3),
                    }))
                  }
                  autoFocus
                />
              </div>
              <button type="button" onClick={next} disabled={!canNext2} className="btn-primary w-full justify-center mt-1 disabled:opacity-50">
                Siguiente
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Jugador - <span className="text-gray-400 font-normal normal-case">{teamName(ev.teamSide)}</span>
              </p>
              {players.length === 0 ? (
                <div>
                  <label className="label">Nombre del jugador</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nombre"
                    value={ev.playerName}
                    onChange={(e) => setEv((cur) => ({ ...cur, playerName: e.target.value }))}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {players.map((p) => {
                    const selected = ev.playerName === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setEv((cur) => ({ ...cur, playerName: p.name }))}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          selected ? 'bg-brand-50 border-brand-500 ring-2 ring-offset-1 ring-brand-200' : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {p.dorsal != null && (
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {p.dorsal}
                          </span>
                        )}
                        <span className={`text-sm font-semibold ${selected ? 'text-brand-700' : 'text-gray-800'}`}>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <button type="button" onClick={() => onConfirm(ev)} disabled={!canConfirm || saving} className="btn-primary w-full justify-center mt-1 disabled:opacity-50">
                {saving ? (
                  <>
                    <Icon name="spinner" size={14} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEventIdx, setEditingEventIdx] = useState(null);
  const [addSaving, setAddSaving] = useState(false);

  const teamAId = match?.teamA?._id?.toString() || match?.teamA?.toString();
  const teamBId = match?.teamB?._id?.toString() || match?.teamB?.toString();

  const resultConfig = match?.competition?.settings?.resultConfig || {};
  const eventModeEnabled = match?.competition?.sport?.scoringType === 'goals' && resultConfig.mode === 'events';
  const enabledEventTypes =
    Array.isArray(resultConfig.enabledEventTypes) && resultConfig.enabledEventTypes.length > 0
      ? resultConfig.enabledEventTypes.filter((t) => DEFAULT_EVENT_TYPES.includes(t))
      : DEFAULT_EVENT_TYPES;

  const isOrganizer = user?.role === 'organizer' && match?.competition?.organizer?.toString() === user?.id;

  const playersByTeam = useMemo(
    () => ({
      A: Array.isArray(match?.teamA?.players) ? match.teamA.players : [],
      B: Array.isArray(match?.teamB?.players) ? match.teamB.players : [],
    }),
    [match?.teamA?.players, match?.teamB?.players],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [mRes, eRes] = await Promise.all([getMatch(id), getMatchEvents(id)]);
      setMatch(mRes.data);
      setEvents(eRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error cargando detalle del partido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSaveEvent = async (newEv) => {
    setAddSaving(true);
    try {
      const baseEvents = events.map((ev) => ({
        type: ev.type,
        minute: Number(ev.minute),
        team: ev.team?.toString() === teamAId ? teamAId : teamBId,
        playerName: ev.playerName,
      }));

      const mappedNewEvent = {
        type: newEv.type,
        minute: Number(newEv.minute) || 0,
        team: newEv.teamSide === 'A' ? teamAId : teamBId,
        playerName: newEv.playerName,
      };

      const payload = editingEventIdx == null ? [...baseEvents, mappedNewEvent] : baseEvents.map((ev, idx) => (idx === editingEventIdx ? mappedNewEvent : ev));

      await recordMatchEvents(id, { events: payload });
      setShowAddModal(false);
      setEditingEventIdx(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar evento');
    } finally {
      setAddSaving(false);
    }
  };

  const handleDeleteEvent = async (sourceIdx) => {
    const payload = events
      .filter((_, i) => i !== sourceIdx)
      .map((ev) => ({
        type: ev.type,
        minute: Number(ev.minute),
        team: ev.team?.toString() === teamAId ? teamAId : teamBId,
        playerName: ev.playerName,
      }));

    try {
      await recordMatchEvents(id, { events: payload });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar evento');
    }
  };

  const openCreateEventModal = () => {
    setEditingEventIdx(null);
    setShowAddModal(true);
  };

  const openEditEventModal = (sourceIdx) => {
    setEditingEventIdx(sourceIdx);
    setShowAddModal(true);
  };

  const editingInitialEvent = useMemo(() => {
    if (editingEventIdx == null || !events[editingEventIdx]) return null;
    const ev = events[editingEventIdx];
    return {
      type: ev.type || enabledEventTypes[0] || 'goal',
      teamSide: ev.team?.toString() === teamAId ? 'A' : 'B',
      minute: String(ev.minute ?? ''),
      playerName: ev.playerName || '',
    };
  }, [editingEventIdx, events, enabledEventTypes, teamAId]);

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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Icon name="spinner" size={20} className="animate-spin text-brand-500" />
        </div>
      </AppLayout>
    );
  }

  if (!match) {
    return (
      <AppLayout>
        <p className="text-red-500">Partido no encontrado</p>
      </AppLayout>
    );
  }

  const goals = match.result?.goals;
  const schedulePieces = [match.location, formatDateTimeLabel(match)].filter(Boolean);
  const winnerSide = match.winner ? (match.winner.toString() === teamAId ? 'A' : 'B') : null;
  const divisionId = match?.division?._id || match?.division;

  const handleBack = () => {
    const backTo = location.state?.backTo;
    if (backTo?.pathname) {
      navigate(backTo.pathname, {
        state: backTo.tab ? { tab: backTo.tab } : undefined,
      });
      return;
    }
    if (divisionId) {
      navigate(`/divisions/${divisionId}`, { state: { tab: 'matches' } });
      return;
    }
    navigate(-1);
  };

  return (
    <AppLayout title="Detalle del partido">
      <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
        <Icon name="chevronLeft" size={14} /> Volver
      </button>

      <div className="card p-5 mb-4">
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

      {!eventModeEnabled && <div className="card p-4 text-sm text-gray-500 text-center">Esta competicion no usa modo de eventos detallados.</div>}

      {eventModeEnabled && (
        <>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <Icon name="alert" size={14} /> {error}
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acta del partido</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">Eventos oficiales</p>
              </div>
              {isOrganizer && (
                <button type="button" onClick={openCreateEventModal} className="btn-primary text-xs py-1.5">
                  <Icon name="plus" size={13} /> Anadir evento
                </button>
              )}
            </div>

            <div className="px-4 md:px-5 py-4">
              {sortedEvents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin eventos registrados.</p>
              ) : (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <div className="grid grid-cols-[1fr_58px_1fr] items-center px-3 py-2 border-b border-gray-200 bg-gray-50">
                    <p className="text-[11px] font-semibold text-gray-800 uppercase tracking-wide truncate">{match.teamA?.name}</p>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-center">Min</p>
                    <p className="text-[11px] font-semibold text-gray-800 uppercase tracking-wide text-right truncate">{match.teamB?.name}</p>
                  </div>

                  <div>
                    {sortedEvents.map((ev, idx) => {
                      const isTeamA = ev.team?.toString() === teamAId;
                      const meta = EVENT_FEED_META[ev.type] || { label: ev.type, icon: '•', accent: 'text-gray-500' };
                      const eventPlayers = isTeamA ? playersByTeam.A : playersByTeam.B;
                      const player = (eventPlayers || []).find((p) => p?.name === ev.playerName);
                      const dorsal = player?.dorsal;

                      const eventRow = (
                        <div className={`group relative inline-flex items-center gap-2 px-2.5 py-2 rounded-md max-w-[320px] ${isTeamA ? '' : 'text-right'}`}>
                          <span className="text-[15px] leading-none">{meta.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {dorsal != null && <span className="text-gray-500 font-mono mr-1">#{dorsal}</span>}
                              {ev.playerName || 'Jugador'}
                            </p>
                            <p className={`text-[10px] uppercase tracking-wider ${meta.accent}`}>{meta.label}</p>
                          </div>
                          {isOrganizer && (
                            <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all ${isTeamA ? 'right-1' : 'left-1'}`}>
                              <button
                                type="button"
                                onClick={() => openEditEventModal(ev.sourceIdx)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white border border-gray-300 text-gray-400 hover:text-brand-600 hover:border-brand-200 transition-all"
                                title="Editar evento"
                              >
                                <Pencil size={10} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvent(ev.sourceIdx)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white border border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                                title="Eliminar evento"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          )}
                        </div>
                      );

                      return (
                        <div
                          key={ev._id || `${ev.minute}-${idx}`}
                          className={`grid grid-cols-[1fr_58px_1fr] items-center min-h-[56px] px-2 ${
                            idx !== sortedEvents.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="pr-2">{isTeamA ? eventRow : <div className="h-8" />}</div>
                          <div className="flex items-center justify-center">
                            <span className="relative z-10 text-xl font-extrabold text-emerald-500 tabular-nums leading-none">{ev.minute}'</span>
                          </div>
                          <div className="pl-2 flex justify-end">{!isTeamA ? eventRow : <div className="h-8" />}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {showAddModal && (
            <AddEventModal
              match={match}
              enabledEventTypes={enabledEventTypes}
              playersByTeam={playersByTeam}
              initialEvent={editingInitialEvent}
              title={editingEventIdx == null ? 'Anadir evento' : 'Editar evento'}
              onConfirm={handleSaveEvent}
              onClose={() => {
                setShowAddModal(false);
                setEditingEventIdx(null);
              }}
              saving={addSaving}
            />
          )}
        </>
      )}
    </AppLayout>
  );
};

export default MatchDetail;

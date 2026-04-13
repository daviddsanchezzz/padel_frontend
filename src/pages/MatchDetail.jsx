import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { getMatch, getMatchEvents, recordMatchEvents } from '../api/matches';

const EVENT_TYPE_LABEL = {
  goal: 'Gol',
  assist: 'Asistencia',
  yellow_card: 'Tarjeta amarilla',
  red_card: 'Tarjeta roja',
};

const DEFAULT_EVENT_TYPES = ['goal', 'assist', 'yellow_card', 'red_card'];

const EVENT_TYPE_STYLE = {
  goal: {
    label: 'Gol',
    cls: 'bg-white border-gray-200 text-gray-800',
    tone: 'text-emerald-600',
    emoji: '\u26BD',
  },
  assist: {
    label: 'Asistencia',
    cls: 'bg-white border-gray-200 text-gray-800',
    tone: 'text-sky-600',
    emoji: '\u{1F3AF}',
  },
  yellow_card: {
    label: 'Tarjeta amarilla',
    cls: 'bg-white border-gray-200 text-gray-800',
    tone: 'text-amber-600',
    emoji: '\u{1F7E8}',
  },
  red_card: {
    label: 'Tarjeta roja',
    cls: 'bg-white border-gray-200 text-gray-800',
    tone: 'text-red-600',
    emoji: '\u{1F7E5}',
  },
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

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [draftEvents, setDraftEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const teamAId = match?.teamA?._id?.toString() || match?.teamA?.toString();
  const teamBId = match?.teamB?._id?.toString() || match?.teamB?.toString();

  const resultConfig = match?.competition?.settings?.resultConfig || {};
  const eventModeEnabled = match?.competition?.sport?.scoringType === 'goals' && resultConfig.mode === 'events';
  const enabledEventTypes = Array.isArray(resultConfig.enabledEventTypes) && resultConfig.enabledEventTypes.length > 0
    ? resultConfig.enabledEventTypes.filter((t) => DEFAULT_EVENT_TYPES.includes(t))
    : DEFAULT_EVENT_TYPES;

  const isOrganizer = user?.role === 'organizer' && match?.competition?.organizer?.toString() === user?.id;

  const playersByTeam = useMemo(() => ({
    A: Array.isArray(match?.teamA?.players) ? match.teamA.players.map((p) => p.name) : [],
    B: Array.isArray(match?.teamB?.players) ? match.teamB.players.map((p) => p.name) : [],
  }), [match?.teamA?.players, match?.teamB?.players]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [mRes, eRes] = await Promise.all([getMatch(id), getMatchEvents(id)]);
      setMatch(mRes.data);
      setEvents(eRes.data || []);
      setDraftEvents((eRes.data || []).map((ev) => ({
        type: ev.type,
        minute: ev.minute,
        teamSide: ev.team?.toString() === (mRes.data.teamA?._id?.toString() || mRes.data.teamA?.toString()) ? 'A' : 'B',
        playerName: ev.playerName || '',
      })));
    } catch (err) {
      setError(err.response?.data?.message || 'Error cargando detalle del partido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const addEvent = () => {
    const firstType = enabledEventTypes[0] || 'goal';
    setDraftEvents((prev) => [...prev, { type: firstType, minute: 1, teamSide: 'A', playerName: '' }]);
  };

  const updateEvent = (idx, patch) => {
    setDraftEvents((prev) => prev.map((ev, i) => (i === idx ? { ...ev, ...patch } : ev)));
  };

  const removeEvent = (idx) => {
    setDraftEvents((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveEvents = async (e) => {
    e.preventDefault();
    setError('');

    if (draftEvents.some((ev) => !ev.playerName || !ev.playerName.trim())) {
      setError('Debes seleccionar jugador en todos los eventos');
      return;
    }

    const payload = draftEvents.map((ev) => ({
      type: ev.type,
      minute: Number(ev.minute),
      team: ev.teamSide === 'A' ? teamAId : teamBId,
      playerName: ev.playerName,
    }));

    setSaving(true);
    try {
      await recordMatchEvents(id, { events: payload });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error guardando eventos');
    } finally {
      setSaving(false);
    }
  };

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
    return <AppLayout><p className="text-red-500">Partido no encontrado</p></AppLayout>;
  }

  const goals = match.result?.goals || { a: 0, b: 0 };
  const schedulePieces = [match.location, formatDateTimeLabel(match)].filter(Boolean);
  const sortedEvents = [...events].sort((a, b) => {
    const minuteDiff = Number(a.minute || 0) - Number(b.minute || 0);
    if (minuteDiff !== 0) return minuteDiff;
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });

  return (
    <AppLayout title="Detalle del partido">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
        <Icon name="chevronLeft" size={14} /> Volver
      </button>

      {/* Match header */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-gray-900">{match.teamA?.name} vs {match.teamB?.name}</p>
          <p className="text-lg font-bold text-gray-900">{goals.a} - {goals.b}</p>
        </div>
        {schedulePieces.length > 0 && <p className="text-xs text-gray-500 mt-1.5">{schedulePieces.join(' · ')}</p>}
      </div>

      {!eventModeEnabled && (
        <div className="card p-4 text-sm text-gray-600">
          Esta competicion no usa modo de eventos detallados.
        </div>
      )}

      {eventModeEnabled && (
        <>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <Icon name="alert" size={14} /> {error}
            </div>
          )}

          {isOrganizer ? (
            /* Edit mode — organizer only */
            <form onSubmit={saveEvents} className="card p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Editar eventos</p>

              {draftEvents.length === 0 && <p className="text-xs text-gray-500">Sin eventos. Guarda para mantener 0-0 o añade eventos.</p>}

              {draftEvents.map((ev, idx) => {
                const playerOptions = ev.teamSide === 'A' ? playersByTeam.A : playersByTeam.B;
                return (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gray-500">Evento {idx + 1}</p>
                      <button type="button" className="text-xs font-semibold text-red-600 hover:text-red-700" onClick={() => removeEvent(idx)}>
                        Eliminar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-4">
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.06em]">Tipo</label>
                        <select className="input mt-1 w-full" value={ev.type} onChange={(e) => updateEvent(idx, { type: e.target.value })} required>
                          {enabledEventTypes.map((type) => <option key={type} value={type}>{EVENT_TYPE_LABEL[type] || type}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:col-span-4">
                        <div>
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.06em]">Minuto</label>
                          <input className="input mt-1 w-full" type="number" min="0" max="130" value={ev.minute} onChange={(e) => updateEvent(idx, { minute: e.target.value })} required />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.06em]">Equipo</label>
                          <select className="input mt-1 w-full" value={ev.teamSide} onChange={(e) => updateEvent(idx, { teamSide: e.target.value, playerName: '' })}>
                            <option value="A">{match.teamA?.name || 'Equipo A'}</option>
                            <option value="B">{match.teamB?.name || 'Equipo B'}</option>
                          </select>
                        </div>
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.06em]">Jugador</label>
                        <select className="input mt-1 w-full" value={ev.playerName} onChange={(e) => updateEvent(idx, { playerName: e.target.value })} required disabled={playerOptions.length === 0}>
                          <option value="">{playerOptions.length === 0 ? 'Sin jugadores en equipo' : 'Selecciona jugador'}</option>
                          {playerOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <button type="button" onClick={addEvent}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 w-full sm:w-auto">
                  <Icon name="plus" size={12} /> Añadir evento
                </button>
                <button type="button" onClick={() => setDraftEvents(events.map((ev) => ({
                  type: ev.type, minute: ev.minute,
                  teamSide: ev.team?.toString() === teamAId ? 'A' : 'B',
                  playerName: ev.playerName || '',
                })))} className="btn-secondary w-full sm:w-auto">
                  Restaurar
                </button>
                <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
                  {saving ? 'Guardando...' : 'Guardar eventos'}
                </button>
              </div>
            </form>
          ) : (
            /* Read-only acta — non-organizer */
            <div className="card p-4 md:p-5">
              <div className="border-b border-gray-200 pb-3 mb-4">
                <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-gray-500">Acta del partido</p>
                <p className="text-base font-bold text-gray-900 mt-1">Eventos oficiales</p>
              </div>
              {events.length === 0 ? (
                <p className="text-sm text-gray-500">Sin eventos registrados.</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-2 pb-2 border-b border-gray-100">
                    <p className="text-sm md:text-base font-bold text-gray-900 text-left truncate">{match.teamA?.name || 'Equipo A'}</p>
                    <p className="text-[11px] tracking-[0.08em] uppercase font-semibold text-gray-500 text-center">Min</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 text-right truncate">{match.teamB?.name || 'Equipo B'}</p>
                  </div>
                  {sortedEvents.map((ev, idx) => {
                    const isTeamA = ev.team?.toString() === teamAId;
                    const style = EVENT_TYPE_STYLE[ev.type] || { cls: 'bg-white border-gray-200 text-gray-800', tone: 'text-gray-600', emoji: '\u{1F4CC}', label: ev.type };
                    const eventNode = (
                      <div className={`rounded-xl border px-3 py-2 shadow-sm ${style.cls}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{style.emoji}</span>
                          <p className={`text-sm font-semibold ${style.tone || 'text-gray-700'}`}>{EVENT_TYPE_LABEL[ev.type] || style.label}</p>
                        </div>
                        <p className="text-xs mt-1 text-gray-600">{ev.playerName}</p>
                      </div>
                    );
                    return (
                      <div key={ev._id || `${ev.minute}-${idx}`} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                        <div>{isTeamA ? eventNode : <div />}</div>
                        <div className="px-2 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 min-w-[52px] text-center">{ev.minute}'</div>
                        <div>{!isTeamA ? eventNode : <div />}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default MatchDetail;



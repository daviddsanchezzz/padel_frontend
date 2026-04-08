import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleDot, Handshake, AlertTriangle, ShieldAlert, Timer, User2 } from 'lucide-react';
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
    cls: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    iconCls: 'text-emerald-600',
    IconComp: CircleDot,
  },
  assist: {
    label: 'Asistencia',
    cls: 'bg-sky-50 border-sky-200 text-sky-700',
    iconCls: 'text-sky-600',
    IconComp: Handshake,
  },
  yellow_card: {
    label: 'Tarjeta amarilla',
    cls: 'bg-amber-50 border-amber-200 text-amber-700',
    iconCls: 'text-amber-600',
    IconComp: AlertTriangle,
  },
  red_card: {
    label: 'Tarjeta roja',
    cls: 'bg-red-50 border-red-200 text-red-700',
    iconCls: 'text-red-600',
    IconComp: ShieldAlert,
  },
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
    A: Array.isArray(match?.teamA?.playerNames) ? match.teamA.playerNames : [],
    B: Array.isArray(match?.teamB?.playerNames) ? match.teamB.playerNames : [],
  }), [match?.teamA?.playerNames, match?.teamB?.playerNames]);

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
  const totalGoals = events.filter((e) => e.type === 'goal').length;
  const totalAssists = events.filter((e) => e.type === 'assist').length;
  const totalCards = events.filter((e) => e.type === 'yellow_card' || e.type === 'red_card').length;

  return (
    <AppLayout title="Detalle del partido">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
        <Icon name="chevronLeft" size={14} /> Volver
      </button>

      <div className="card p-4 mb-4">
        <p className="text-sm text-gray-500 mb-1">{match.competition?.name}</p>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-gray-900">{match.teamA?.name} vs {match.teamB?.name}</p>
          <p className="text-lg font-bold text-gray-900">{goals.a} - {goals.b}</p>
        </div>
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
            <form onSubmit={saveEvents} className="card p-4 space-y-3 mb-4">
              <p className="text-sm font-semibold text-gray-900">Editar eventos</p>

              {draftEvents.length === 0 && <p className="text-xs text-gray-500">Sin eventos. Guarda para mantener 0-0 o anade eventos.</p>}

              {draftEvents.map((ev, idx) => {
                const playerOptions = ev.teamSide === 'A' ? playersByTeam.A : playersByTeam.B;
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <select className="input col-span-12 md:col-span-3" value={ev.type} onChange={(e) => updateEvent(idx, { type: e.target.value })} required>
                      {enabledEventTypes.map((type) => <option key={type} value={type}>{EVENT_TYPE_LABEL[type] || type}</option>)}
                    </select>
                    <input className="input col-span-4 md:col-span-2" type="number" min="0" max="130" value={ev.minute} onChange={(e) => updateEvent(idx, { minute: e.target.value })} required />
                    <select className="input col-span-8 md:col-span-2" value={ev.teamSide} onChange={(e) => updateEvent(idx, { teamSide: e.target.value, playerName: '' })}>
                      <option value="A">{match.teamA?.name || 'Equipo A'}</option>
                      <option value="B">{match.teamB?.name || 'Equipo B'}</option>
                    </select>
                    <select className="input col-span-10 md:col-span-4" value={ev.playerName} onChange={(e) => updateEvent(idx, { playerName: e.target.value })} required disabled={playerOptions.length === 0}>
                      <option value="">{playerOptions.length === 0 ? 'Sin jugadores en equipo' : 'Jugador'}</option>
                      {playerOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <button type="button" className="col-span-2 md:col-span-1 text-red-500 text-xs" onClick={() => removeEvent(idx)}>X</button>
                  </div>
                );
              })}

              <button type="button" className="text-xs text-brand-600 hover:underline font-medium" onClick={addEvent}>
                + Anadir evento
              </button>

              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setDraftEvents(events.map((ev) => ({
                  type: ev.type,
                  minute: ev.minute,
                  teamSide: ev.team?.toString() === teamAId ? 'A' : 'B',
                  playerName: ev.playerName || '',
                })))} className="btn-secondary">
                  Restaurar
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Guardando...' : 'Guardar eventos'}
                </button>
              </div>
            </form>
          ) : (
            <div className="card p-4 mb-4 text-sm text-gray-600">
              Solo el organizador puede editar eventos. Tu vista es de solo lectura.
            </div>
          )}

          <div className="card p-4 md:p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Eventos del partido</p>
                <p className="text-xs text-gray-500 mt-0.5">Cronologia oficial registrada</p>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">{totalGoals} goles</span>
                <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold">{totalAssists} asistencias</span>
                <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">{totalCards} tarjetas</span>
              </div>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">Sin eventos registrados.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev, idx) => (
                  <div key={ev._id || idx} className="relative pl-6">
                    <span className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
                    <span className="absolute left-[5px] top-5 w-3 h-3 rounded-full border-2 border-white bg-brand-500 shadow-sm" />
                    <div className="border border-gray-100 rounded-xl px-3 py-3 bg-white shadow-sm">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${EVENT_TYPE_STYLE[ev.type]?.cls || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                            {(() => {
                              const Cmp = EVENT_TYPE_STYLE[ev.type]?.IconComp || CircleDot;
                              return <Cmp size={15} className={EVENT_TYPE_STYLE[ev.type]?.iconCls || 'text-gray-500'} />;
                            })()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{EVENT_TYPE_LABEL[ev.type] || ev.type}</p>
                            <p className="text-[11px] text-gray-400">Evento #{idx + 1}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-700 font-semibold">
                          <Timer size={12} className="text-gray-500" />
                          {ev.minute}'
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                          {(ev.team?.toString() === teamAId ? match.teamA?.name : match.teamB?.name) || 'Equipo'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                          <User2 size={12} className="text-gray-500" />
                          {ev.playerName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default MatchDetail;

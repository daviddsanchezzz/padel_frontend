import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordResult, confirmResult, disputeResult, updateMatchSchedule } from '../api/matches';
import { useAuth } from '../context/AuthContext';

const EMPTY_SET = { a: '', b: '' };

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

const toDateTimeLocalValue = (match) => {
  if (match?.matchDate && match?.matchTime) return `${match.matchDate}T${match.matchTime}`;
  if (match?.scheduledDate) {
    const date = new Date(match.scheduledDate);
    if (!Number.isNaN(date.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
  }
  return '';
};

// Stacked score: per-team rows on the right, matching the public view
const StackedScore = ({ result, scoringType, isPending }) => {
  if (isPending) {
    return (
      <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide mt-0.5">PDTE</span>
    );
  }
  if (!result) return null;

  if (scoringType === 'sets' && result.sets) {
    return (
      <div className="flex gap-1.5 items-start">
        {result.sets.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className={`text-xs w-4 text-center leading-none ${s.a > s.b ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{s.a}</span>
            <span className={`text-xs w-4 text-center leading-none ${s.b > s.a ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{s.b}</span>
          </div>
        ))}
      </div>
    );
  }

  if (scoringType === 'goals' && result.goals) {
    const { a, b } = result.goals;
    return (
      <div className="flex flex-col items-center gap-1.5">
        <span className={`text-xs w-5 text-center leading-none ${a > b ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{a}</span>
        <span className={`text-xs w-5 text-center leading-none ${b > a ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{b}</span>
      </div>
    );
  }

  return null;
};

const ResultForm = ({ scoringType, teamAName, teamBName, onSubmit, onCancel, saving, error }) => {
  const [sets, setSets] = useState([{ ...EMPTY_SET }, { ...EMPTY_SET }]);
  const [goals, setGoals] = useState({ a: '', b: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (scoringType === 'sets') {
      onSubmit({ sets: sets.map((s) => ({ a: Number(s.a), b: Number(s.b) })) });
    } else if (scoringType === 'goals') {
      onSubmit({ goals: { a: Number(goals.a), b: Number(goals.b) } });
    }
  };

  if (scoringType === 'goals') {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">{teamAName}</p>
            <input type="number" min="0" required className="input h-10 text-center text-base font-semibold" value={goals.a} onChange={(e) => setGoals({ ...goals, a: e.target.value })} placeholder="0" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">{teamBName}</p>
            <input type="number" min="0" required className="input h-10 text-center text-base font-semibold" value={goals.b} onChange={(e) => setGoals({ ...goals, b: e.target.value })} placeholder="0" />
          </div>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Guardando...' : 'Guardar resultado'}</button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-[1fr_80px_1fr] gap-2 text-xs text-gray-400 font-medium text-center">
        <span>{teamAName}</span><span></span><span>{teamBName}</span>
      </div>
      {sets.map((set, i) => (
        <div key={i} className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center">
          <input type="number" min="0" max="99" required className="input text-center font-semibold text-lg" placeholder="0" value={set.a} onChange={(e) => { const s = [...sets]; s[i] = { ...s[i], a: e.target.value }; setSets(s); }} />
          <p className="text-center text-xs text-gray-400 font-semibold">Set {i + 1}</p>
          <input type="number" min="0" max="99" required className="input text-center font-semibold text-lg" placeholder="0" value={set.b} onChange={(e) => { const s = [...sets]; s[i] = { ...s[i], b: e.target.value }; setSets(s); }} />
        </div>
      ))}
      {sets.length < 3 && (
        <button type="button" onClick={() => setSets([...sets, { ...EMPTY_SET }])} className="text-xs text-brand-600 hover:underline font-medium">
          + Anadir 3er set
        </button>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex items-center justify-end gap-2 mt-1">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Guardando...' : 'Guardar resultado'}</button>
      </div>
    </form>
  );
};

const MatchCard = ({ match, scoringType = 'sets', onResultRecorded, myTeamId = null, forceCanRecord = false }) => {
  const [showForm, setShowForm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    location: match?.location || '',
    dateTime: toDateTimeLocalValue(match),
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const winnerId = match.winner?._id || match.winner;
  const teamAId = match.teamA?._id || match.teamA;
  const teamBId = match.teamB?._id || match.teamB;
  const winnerSide = winnerId
    ? winnerId.toString() === teamAId?.toString() ? 'A'
      : winnerId.toString() === teamBId?.toString() ? 'B' : null
    : null;

  const isMyTeamA = myTeamId && teamAId?.toString() === myTeamId;
  const isMyTeamB = myTeamId && teamBId?.toString() === myTeamId;
  const isMyTeam = isMyTeamA || isMyTeamB;
  const canRecordResult = user && (user.role === 'organizer' || forceCanRecord || isMyTeam);

  const proposedByStr = match.proposedBy?._id?.toString() || match.proposedBy?.toString();
  const isProposingTeam = myTeamId && proposedByStr === myTeamId;
  const isConfirmingTeam = myTeamId && proposedByStr && proposedByStr !== myTeamId;
  const isOrganizer = user?.role === 'organizer';
  const canConfirm = match.status === 'awaiting_confirmation' && (isOrganizer || isConfirmingTeam);
  const canDispute = match.status === 'awaiting_confirmation' && isConfirmingTeam;
  const canSchedule = isOrganizer;

  const resultConfig = match.competition?.settings?.resultConfig || {};
  const eventModeEnabled = scoringType === 'goals' && resultConfig.mode === 'events';
  const isPadelStyleSchedule = scoringType === 'sets';

  const handleSubmit = async (result) => {
    setError('');
    setSaving(true);
    try {
      await recordResult(match._id, { result });
      setShowForm(false);
      onResultRecorded && onResultRecorded();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar resultado');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError('');
    try {
      await confirmResult(match._id);
      onResultRecorded && onResultRecorded();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al confirmar');
    } finally {
      setSaving(false);
    }
  };

  const handleDispute = async () => {
    setSaving(true);
    setError('');
    try {
      await disputeResult(match._id);
      onResultRecorded && onResultRecorded();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al rechazar');
    } finally {
      setSaving(false);
    }
  };

  const handleCardClick = (e) => {
    if (window.innerWidth >= 768) return;
    if (e.target.closest('button, a, input, select, textarea, form')) return;
    navigate(`/matches/${match._id}`);
  };

  const openSchedule = () => {
    if (isPadelStyleSchedule) {
      setScheduleError('');
      setScheduleForm({
        location: match?.location || '',
        dateTime: toDateTimeLocalValue(match),
      });
      setShowScheduleModal(true);
      return;
    }
    navigate(`/matches/${match._id}`);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setScheduleError('');
    setScheduleSaving(true);
    try {
      await updateMatchSchedule(match._id, {
        location: scheduleForm.location,
        dateTime: scheduleForm.dateTime,
      });
      setShowScheduleModal(false);
      onResultRecorded && onResultRecorded();
    } catch (err) {
      setScheduleError(err.response?.data?.message || 'Error al guardar programacion');
    } finally {
      setScheduleSaving(false);
    }
  };

  const teamAName = match.teamA?.name || 'TBD';
  const teamBName = match.teamB?.name || 'TBD';
  const displayResult = match.status === 'awaiting_confirmation' ? match.pendingResult : match.result;
  const schedulePieces = [match.location, formatDateTimeLabel(match)].filter(Boolean);

  const isPending = !displayResult && match.status === 'pending';

  return (
    <div onClick={handleCardClick} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden cursor-pointer md:cursor-default">
      <div className="px-3 md:px-5 py-3 md:py-4">
        <div className="flex items-start gap-3">

          {/* Teams + scores — stacked left/right like public view */}
          <div className="flex-1 min-w-0 flex items-start gap-2">
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className={`text-xs md:text-sm font-semibold truncate ${winnerSide === 'A' ? 'text-gray-900' : 'text-gray-500'} ${isMyTeamA ? 'text-brand-700' : ''} ${!match.teamA ? 'italic text-gray-300' : ''}`}>
                {teamAName}
              </p>
              <p className={`text-xs md:text-sm font-semibold truncate ${winnerSide === 'B' ? 'text-gray-900' : 'text-gray-500'} ${isMyTeamB ? 'text-brand-700' : ''} ${!match.teamB ? 'italic text-gray-300' : ''}`}>
                {teamBName}
              </p>
            </div>
            <div className={`flex-shrink-0 flex items-start pt-0.5 ${match.status === 'awaiting_confirmation' ? 'opacity-60' : ''}`}>
              <StackedScore result={displayResult} scoringType={scoringType} isPending={isPending} />
            </div>
          </div>

          {/* Action buttons */}
          {(match.status === 'pending' || match.status === 'awaiting_confirmation' || eventModeEnabled || canSchedule) && (
            <div className="flex-shrink-0 flex items-center self-center">
              {eventModeEnabled ? (
                <div className="hidden md:flex items-center gap-1.5">
                  {canSchedule && (
                    <button
                      onClick={openSchedule}
                      className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      {schedulePieces.length > 0 ? 'Editar' : 'Programar'}
                    </button>
                  )}
                  <button onClick={() => navigate(`/matches/${match._id}`)} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                    Ver detalle
                  </button>
                </div>
              ) : (
                <>
                  {canSchedule && (
                    <button
                      onClick={openSchedule}
                      className="hidden md:inline-flex text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors mr-1.5"
                    >
                      {schedulePieces.length > 0 ? 'Editar' : 'Programar'}
                    </button>
                  )}
                  {match.status === 'pending' && match.teamA && match.teamB && canRecordResult && (
                    <button onClick={() => setShowForm(!showForm)} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                      + Resultado
                    </button>
                  )}
                  {match.status === 'awaiting_confirmation' && isProposingTeam && (
                    <span className="text-xs text-orange-500 font-medium">Esperando...</span>
                  )}
                  {match.status === 'awaiting_confirmation' && (canConfirm || canDispute) && (
                    <div className="flex gap-1.5">
                      {canConfirm && <button onClick={handleConfirm} disabled={saving} className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50">Confirmar</button>}
                      {canDispute && <button onClick={handleDispute} disabled={saving} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">Rechazar</button>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        {schedulePieces.length > 0 && <div className="mt-2 text-xs text-gray-400">{schedulePieces.join(' · ')}</div>}
      </div>

      {!eventModeEnabled && showForm && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 md:px-5 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Anadir resultado</p>
          <ResultForm
            scoringType={scoringType}
            teamAName={teamAName}
            teamBName={teamBName}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            saving={saving}
            error={error}
          />
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowScheduleModal(false)} />
          <form onSubmit={handleSaveSchedule} className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Programar partido</p>
            <div>
              <label className="label">Ubicacion</label>
              <input
                type="text"
                className="input h-10 text-sm"
                value={scheduleForm.location}
                maxLength={140}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Ej: Pista 2"
              />
            </div>
            <div>
              <label className="label">Fecha y hora</label>
              <input
                type="datetime-local"
                className="input h-10 text-sm"
                value={scheduleForm.dateTime}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, dateTime: e.target.value }))}
              />
            </div>
            {scheduleError && <p className="text-xs text-red-500">{scheduleError}</p>}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowScheduleModal(false)} className="btn-secondary text-sm">Cancelar</button>
              <button type="submit" disabled={scheduleSaving} className="btn-primary text-sm">
                {scheduleSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MatchCard;

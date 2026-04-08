import React, { useEffect, useState } from 'react';
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

const toDateTimeLocalValue = (match) => {
  if (match?.scheduledDate) {
    const date = new Date(match.scheduledDate);
    if (!Number.isNaN(date.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
  }
  if (match?.matchDate && match?.matchTime) return `${match.matchDate}T${match.matchTime}`;
  return '';
};

const formatDateTimeLabel = (match) => {
  if (match?.scheduledDate) {
    const date = new Date(match.scheduledDate);
    if (!Number.isNaN(date.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
  }
  if (match?.matchDate && match?.matchTime) return `${formatDateLabel(match.matchDate)} ${match.matchTime}`;
  if (match?.matchDate) return formatDateLabel(match.matchDate);
  if (match?.matchTime) return match.matchTime;
  return '';
};

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
      <span className="text-base font-bold text-gray-900">
        <span className={a > b ? 'text-gray-900' : 'text-gray-400'}>{a}</span>
        <span className="text-gray-300 mx-1">-</span>
        <span className={b > a ? 'text-gray-900' : 'text-gray-400'}>{b}</span>
      </span>
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
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    location: match.location || '',
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
  const organizerId = match.competition?.organizer?._id?.toString() || match.competition?.organizer?.toString();
  const isProposingTeam = myTeamId && proposedByStr === myTeamId;
  const isConfirmingTeam = myTeamId && proposedByStr && proposedByStr !== myTeamId;
  const isOrganizer = user?.role === 'organizer';
  const canConfirm = match.status === 'awaiting_confirmation' && (isOrganizer || isConfirmingTeam);
  const canDispute = match.status === 'awaiting_confirmation' && isConfirmingTeam;
  const canManageSchedule = user?.role === 'organizer' && organizerId === user?.id;

  const resultConfig = match.competition?.settings?.resultConfig || {};
  const eventModeEnabled = scoringType === 'goals' && resultConfig.mode === 'events';

  useEffect(() => {
    setScheduleForm({
      location: match.location || '',
      dateTime: toDateTimeLocalValue(match),
    });
  }, [match.location, match.matchDate, match.matchTime, match.scheduledDate]);

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

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduleError('');
    setScheduleSaving(true);
    try {
      await updateMatchSchedule(match._id, {
        location: scheduleForm.location,
        dateTime: scheduleForm.dateTime,
      });
      setShowScheduleForm(false);
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

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-3 md:px-5 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className={`flex-1 text-right text-xs md:text-sm font-medium truncate ${winnerSide === 'A' ? 'font-bold text-gray-900' : 'text-gray-600'} ${isMyTeamA ? 'text-brand-700 font-bold' : ''} ${!match.teamA ? 'italic text-gray-300' : ''}`}>{teamAName}</div>
            <div className={`flex-shrink-0 flex flex-col items-center w-[80px] md:w-[100px] gap-1 ${match.status === 'awaiting_confirmation' ? 'opacity-60' : ''}`}>
              <ScoreDisplay result={displayResult} scoringType={scoringType} />
            </div>
            <div className={`flex-1 text-xs md:text-sm font-medium truncate ${winnerSide === 'B' ? 'font-bold text-gray-900' : 'text-gray-600'} ${isMyTeamB ? 'text-brand-700 font-bold' : ''} ${!match.teamB ? 'italic text-gray-300' : ''}`}>{teamBName}</div>
          </div>

          {(match.status === 'pending' || match.status === 'awaiting_confirmation' || eventModeEnabled) && (
            <div className="flex items-center justify-end flex-shrink-0">
              {eventModeEnabled ? (
                <div className="flex items-center gap-2">
                  {canManageSchedule && (
                    <button
                      onClick={() => setShowScheduleForm((v) => !v)}
                      className="text-xs bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Programar
                    </button>
                  )}
                  <button onClick={() => navigate(`/matches/${match._id}`)} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                    Ver detalle
                  </button>
                </div>
              ) : (
                <>
                  {canManageSchedule && (
                    <button
                      onClick={() => setShowScheduleForm((v) => !v)}
                      className="text-xs bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors mr-2"
                    >
                      Programar
                    </button>
                  )}
                  {match.status === 'pending' && match.teamA && match.teamB && canRecordResult && (
                    <button onClick={() => setShowForm(!showForm)} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                      + Resultado
                    </button>
                  )}
                  {match.status === 'awaiting_confirmation' && isProposingTeam && <span className="text-xs text-orange-500 font-medium">Esperando confirmacion...</span>}
                  {match.status === 'awaiting_confirmation' && (canConfirm || canDispute) && (
                    <div className="flex gap-2">
                      {canConfirm && <button onClick={handleConfirm} disabled={saving} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50">Confirmar</button>}
                      {canDispute && <button onClick={handleDispute} disabled={saving} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">Rechazar</button>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
        <div className="mt-2 text-xs text-gray-500">
          {schedulePieces.length > 0 ? schedulePieces.join(' · ') : 'Sin programacion'}
        </div>
      </div>

      {showScheduleForm && canManageSchedule && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 md:px-5 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Programacion del partido</p>
          <form onSubmit={handleScheduleSubmit} className="space-y-2.5">
            <input
              type="text"
              className="input h-10 text-sm"
              placeholder="Ubicacion"
              value={scheduleForm.location}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, location: e.target.value }))}
              maxLength={140}
            />
            <input
              type="datetime-local"
              className="input h-10 text-sm"
              value={scheduleForm.dateTime}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, dateTime: e.target.value }))}
            />
            {scheduleError && <p className="text-red-500 text-xs">{scheduleError}</p>}
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowScheduleForm(false)} className="btn-secondary text-sm">Cancelar</button>
              <button type="submit" disabled={scheduleSaving} className="btn-primary text-sm">
                {scheduleSaving ? 'Guardando...' : 'Guardar programacion'}
              </button>
            </div>
          </form>
        </div>
      )}

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
    </div>
  );
};

export default MatchCard;

import React, { useState } from 'react';
import { recordResult, confirmResult, disputeResult } from '../api/matches';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  pending:                { label: 'Pendiente',            cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  awaiting_confirmation:  { label: 'Pend. confirmación',   cls: 'bg-orange-50 text-orange-600 border border-orange-200' },
  played:                 { label: 'Jugado',               cls: 'bg-brand-50 text-brand-700 border border-brand-200' },
  cancelled:              { label: 'Cancelado',            cls: 'bg-gray-100 text-gray-400 border border-gray-200' },
};

const EMPTY_SET = { a: '', b: '' };

// ── Score display ─────────────────────────────────────────────────────────────
const ScoreDisplay = ({ result, scoringType, winnerSide }) => {
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

// ── Result form by scoring type ───────────────────────────────────────────────
const ResultForm = ({ scoringType, teamAName, teamBName, onSubmit, onCancel, saving, error }) => {
  const [sets, setSets]       = useState([{ ...EMPTY_SET }, { ...EMPTY_SET }]);
  const [goals, setGoals]     = useState({ a: '', b: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (scoringType === 'sets') {
      const parsed = sets.map((s) => ({ a: Number(s.a), b: Number(s.b) }));
      onSubmit({ sets: parsed });
    } else if (scoringType === 'goals') {
      onSubmit({ goals: { a: Number(goals.a), b: Number(goals.b) } });
    }
  };

  if (scoringType === 'goals') {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-[1fr_60px_1fr] gap-2 items-center">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium mb-1">{teamAName}</p>
            <input type="number" min="0" required className="input text-center text-xl font-bold"
              value={goals.a} onChange={(e) => setGoals({ ...goals, a: e.target.value })} placeholder="0" />
          </div>
          <p className="text-center text-gray-400 font-bold text-sm pt-5">-</p>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">{teamBName}</p>
            <input type="number" min="0" required className="input text-center text-xl font-bold"
              value={goals.b} onChange={(e) => setGoals({ ...goals, b: e.target.value })} placeholder="0" />
          </div>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center text-sm">
            {saving ? 'Guardando...' : 'Confirmar resultado'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancelar</button>
        </div>
      </form>
    );
  }

  // Default: sets
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-[1fr_80px_1fr] gap-2 text-xs text-gray-400 font-medium text-center">
        <span>{teamAName}</span><span></span><span>{teamBName}</span>
      </div>
      {sets.map((set, i) => (
        <div key={i} className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center">
          <input type="number" min="0" max="99" required
            className="input text-center font-semibold text-lg"
            placeholder="0" value={set.a}
            onChange={(e) => { const s=[...sets]; s[i]={...s[i],a:e.target.value}; setSets(s); }} />
          <p className="text-center text-xs text-gray-400 font-semibold">Set {i+1}</p>
          <input type="number" min="0" max="99" required
            className="input text-center font-semibold text-lg"
            placeholder="0" value={set.b}
            onChange={(e) => { const s=[...sets]; s[i]={...s[i],b:e.target.value}; setSets(s); }} />
        </div>
      ))}
      {sets.length < 3 && (
        <button type="button" onClick={() => setSets([...sets, { ...EMPTY_SET }])}
          className="text-xs text-brand-600 hover:underline font-medium">
          + Añadir 3er set
        </button>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2 mt-1">
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center text-sm">
          {saving ? 'Guardando...' : 'Confirmar resultado'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancelar</button>
      </div>
    </form>
  );
};

// ── Main MatchCard ────────────────────────────────────────────────────────────
const MatchCard = ({ match, scoringType = 'sets', onResultRecorded, myTeamId = null, forceCanRecord = false }) => {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const { user } = useAuth();

  const st = statusConfig[match.status] || statusConfig.pending;

  // Determine which side won for highlighting
  const winnerId = match.winner?._id || match.winner;
  const teamAId  = match.teamA?._id  || match.teamA;
  const teamBId  = match.teamB?._id  || match.teamB;
  const winnerSide = winnerId
    ? winnerId.toString() === teamAId?.toString() ? 'A'
    : winnerId.toString() === teamBId?.toString() ? 'B' : null
    : null;

  const isMyTeamA = myTeamId && teamAId?.toString() === myTeamId;
  const isMyTeamB = myTeamId && teamBId?.toString() === myTeamId;
  const isMyTeam  = isMyTeamA || isMyTeamB;
  const canRecordResult = user && (forceCanRecord || isMyTeam);

  const proposedByStr     = match.proposedBy?._id?.toString() || match.proposedBy?.toString();
  const isProposingTeam   = myTeamId && proposedByStr === myTeamId;
  const isConfirmingTeam  = myTeamId && proposedByStr && proposedByStr !== myTeamId;
  const isOrganizer       = user?.role === 'organizer';
  const canConfirm        = match.status === 'awaiting_confirmation' && (isOrganizer || isConfirmingTeam);
  const canDispute        = match.status === 'awaiting_confirmation' && isConfirmingTeam;

  const handleSubmit = async (result) => {
    setError(''); setSaving(true);
    try {
      await recordResult(match._id, { result });
      setShowForm(false);
      onResultRecorded && onResultRecorded();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar resultado');
    } finally { setSaving(false); }
  };

  const handleConfirm = async () => {
    setSaving(true); setError('');
    try {
      await confirmResult(match._id);
      onResultRecorded && onResultRecorded();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al confirmar');
    } finally { setSaving(false); }
  };

  const handleDispute = async () => {
    setSaving(true); setError('');
    try {
      await disputeResult(match._id);
      onResultRecorded && onResultRecorded();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al rechazar');
    } finally { setSaving(false); }
  };

  const teamAName = match.teamA?.name || 'TBD';
  const teamBName = match.teamB?.name || 'TBD';
  const displayResult = match.status === 'awaiting_confirmation' ? match.pendingResult : match.result;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-3 md:px-5 py-3 md:py-4">
        {/* Teams + Score row */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className={`flex-1 text-right text-xs md:text-sm font-medium truncate ${
            winnerSide === 'A' ? 'font-bold text-gray-900' : 'text-gray-600'
          } ${isMyTeamA ? 'text-brand-700 font-bold' : ''} ${!match.teamA ? 'italic text-gray-300' : ''}`}>
            {teamAName}
          </div>
          <div className={`flex-shrink-0 flex flex-col items-center w-[80px] md:w-[100px] gap-1 ${match.status === 'awaiting_confirmation' ? 'opacity-60' : ''}`}>
            <ScoreDisplay result={displayResult} scoringType={scoringType} winnerSide={winnerSide} />
          </div>
          <div className={`flex-1 text-xs md:text-sm font-medium truncate ${
            winnerSide === 'B' ? 'font-bold text-gray-900' : 'text-gray-600'
          } ${isMyTeamB ? 'text-brand-700 font-bold' : ''} ${!match.teamB ? 'italic text-gray-300' : ''}`}>
            {teamBName}
          </div>
        </div>

        {/* Action row */}
        {(match.status === 'pending' || match.status === 'awaiting_confirmation') && (
          <div className="flex justify-center mt-2.5">
            {match.status === 'pending' && match.teamA && match.teamB && canRecordResult && (
              <button onClick={() => setShowForm(!showForm)}
                className="text-xs bg-brand-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-brand-700 transition-colors w-full md:w-auto">
                + Resultado
              </button>
            )}
            {match.status === 'awaiting_confirmation' && isProposingTeam && (
              <span className="text-xs text-orange-500 font-medium">Esperando confirmación del rival…</span>
            )}
            {match.status === 'awaiting_confirmation' && (canConfirm || canDispute) && (
              <div className="flex gap-2 w-full md:w-auto">
                {canConfirm && (
                  <button onClick={handleConfirm} disabled={saving}
                    className="flex-1 md:flex-none text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
                    ✓ Confirmar
                  </button>
                )}
                {canDispute && (
                  <button onClick={handleDispute} disabled={saving}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
                    ✗ Rechazar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
      </div>

      {/* Result form */}
      {showForm && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 md:px-5 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Proponer resultado</p>
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

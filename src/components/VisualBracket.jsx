import React from 'react';

const MATCH_H  = 88;   // height of each match card (px)
const MATCH_W  = 220;  // width of each match card
const MATCH_GAP = 16;  // vertical gap between cards in same round
const ROUND_GAP = 52;  // horizontal gap between rounds (connector space)
const LABEL_H  = 32;   // height reserved above for round labels

/* ── Score for one team row ─────────────────────────────────── */
const TeamRow = ({ name, score, isWinner, isLoser, isEmpty, scoringType, side }) => {
  const bg = isWinner ? 'bg-brand-50' : '';
  const nameColor = isWinner
    ? 'font-bold text-gray-900'
    : isLoser
    ? 'text-gray-400'
    : isEmpty
    ? 'italic text-gray-300'
    : 'text-gray-700';

  const renderScore = () => {
    if (!score) return null;
    if (scoringType === 'sets' && score.sets) {
      return score.sets.map((s, i) => {
        const myVal  = side === 'a' ? s.a : s.b;
        const oppVal = side === 'a' ? s.b : s.a;
        return (
          <span
            key={i}
            className={`text-[11px] w-4 text-center tabular-nums ${
              myVal > oppVal ? 'font-bold text-gray-900' : 'text-gray-400'
            }`}
          >
            {myVal}
          </span>
        );
      });
    }
    if (scoringType === 'goals' && score.goals != null) {
      const myVal  = side === 'a' ? score.goals.a : score.goals.b;
      const oppVal = side === 'a' ? score.goals.b : score.goals.a;
      return (
        <span className={`text-[11px] w-5 text-center tabular-nums ${myVal > oppVal ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
          {myVal}
        </span>
      );
    }
    return null;
  };

  return (
    <div className={`flex items-center gap-2 px-3 ${bg} h-[44px]`}>
      {isWinner && (
        <div className="w-1 h-5 rounded-full bg-brand-500 flex-shrink-0 -ml-1 mr-0.5" />
      )}
      {!isWinner && <div className="w-1 h-5 flex-shrink-0 -ml-1 mr-0.5" />}
      <p className={`text-[11px] truncate flex-1 ${nameColor}`}>{name}</p>
      {score && (
        <div className="flex gap-1 items-center flex-shrink-0">{renderScore()}</div>
      )}
    </div>
  );
};

/* ── Compact match card ─────────────────────────────────────── */
const BracketCard = ({ match, scoringType }) => {
  const winnerId = match.winner?._id || match.winner;
  const teamAId  = match.teamA?._id  || match.teamA;
  const teamBId  = match.teamB?._id  || match.teamB;
  const aWon = !!winnerId && winnerId.toString() === teamAId?.toString();
  const bWon = !!winnerId && winnerId.toString() === teamBId?.toString();
  const hasResult = !!winnerId;

  const isBye = match.status === 'bye';
  const score  = hasResult ? (match.result || null) : null;

  if (isBye) {
    return (
      <div className="h-full bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center px-4">
        <span className="text-[11px] text-gray-400 italic">
          {match.teamA?.name || match.teamB?.name || '—'} · bye
        </span>
      </div>
    );
  }

  return (
    <div
      className="h-full bg-white rounded-xl overflow-hidden flex flex-col"
      style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* Team A */}
      <TeamRow name={match.teamA?.name || 'TBD'} score={score} isWinner={aWon} isLoser={bWon} isEmpty={!match.teamA} scoringType={scoringType} side="a" />
      {/* Divider */}
      <div className="mx-3 h-px bg-gray-100 flex-shrink-0" />
      {/* Team B */}
      <TeamRow name={match.teamB?.name || 'TBD'} score={score} isWinner={bWon} isLoser={aWon} isEmpty={!match.teamB} scoringType={scoringType} side="b" />
    </div>
  );
};

/* ── Main bracket ───────────────────────────────────────────── */
const VisualBracket = ({ bracket, scoringType }) => {
  const rounds = Object.keys(bracket).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return null;

  const firstRoundCount = (bracket[rounds[0]] || []).length;
  const slotH  = MATCH_H + MATCH_GAP;
  const totalH = firstRoundCount * slotH - MATCH_GAP;
  const totalW = rounds.length * (MATCH_W + ROUND_GAP) - ROUND_GAP;

  // Compute Y positions (recursive centering)
  const posY = {};
  const getY = (ri, pos) => {
    const key = `${ri}_${pos}`;
    if (posY[key] !== undefined) return posY[key];
    if (ri === 0) {
      posY[key] = pos * slotH;
    } else {
      const y0 = getY(ri - 1, pos * 2)     + MATCH_H / 2;
      const y1 = getY(ri - 1, pos * 2 + 1) + MATCH_H / 2;
      posY[key] = (y0 + y1) / 2 - MATCH_H / 2;
    }
    return posY[key];
  };
  rounds.forEach((_, ri) => {
    (bracket[rounds[ri]] || []).forEach((_, pos) => getY(ri, pos));
  });

  return (
    <div className="overflow-x-auto pb-4">
        <div
          className="relative"
          style={{ width: totalW, height: totalH + LABEL_H + MATCH_H, minHeight: 200 }}
        >
          {/* Round labels row */}
          {rounds.map((round, ri) => {
            const roundMatches = bracket[round] || [];
            const label = roundMatches[0]?.roundName || `Ronda ${round}`;
            const played = roundMatches.filter((m) => m.status === 'played').length;
            const isFinal = ri === rounds.length - 1;
            return (
              <div
                key={`label_${round}`}
                style={{ position: 'absolute', top: 0, left: ri * (MATCH_W + ROUND_GAP), width: MATCH_W }}
                className="flex flex-col items-center"
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    isFinal ? 'text-amber-500' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
                <span className="text-[9px] text-gray-300 mt-0.5">{played}/{roundMatches.length}</span>
              </div>
            );
          })}

          {/* SVG connectors */}
          <svg
            style={{ position: 'absolute', top: LABEL_H, left: 0, overflow: 'visible', pointerEvents: 'none' }}
            width={totalW}
            height={totalH + MATCH_H}
          >
            {rounds.slice(0, -1).map((_, ri) => {
              const nextRi = ri + 1;
              const nextRound = rounds[nextRi];
              return (bracket[nextRound] || []).map((_, pos) => {
                const x1   = ri * (MATCH_W + ROUND_GAP) + MATCH_W;
                const x2   = nextRi * (MATCH_W + ROUND_GAP);
                const xMid = x1 + ROUND_GAP * 0.5;

                const y0 = (posY[`${ri}_${pos * 2}`]     ?? 0) + MATCH_H / 2;
                const y1 = (posY[`${ri}_${pos * 2 + 1}`] ?? 0) + MATCH_H / 2;
                const yP = (posY[`${nextRi}_${pos}`]     ?? 0) + MATCH_H / 2;

                return (
                  <g key={`conn_${ri}_${pos}`}>
                    {/* top child → midpoint */}
                    <path
                      d={`M${x1},${y0} C${xMid},${y0} ${xMid},${yP} ${x2},${yP}`}
                      fill="none" stroke="#d1d5db" strokeWidth="1.5"
                    />
                    {/* bottom child → midpoint */}
                    <path
                      d={`M${x1},${y1} C${xMid},${y1} ${xMid},${yP} ${x2},${yP}`}
                      fill="none" stroke="#d1d5db" strokeWidth="1.5"
                    />
                  </g>
                );
              });
            })}
          </svg>

          {/* Match cards */}
          {rounds.map((round, ri) =>
            (bracket[round] || []).map((match, pos) => (
              <div
                key={match._id}
                style={{
                  position: 'absolute',
                  top: LABEL_H + (posY[`${ri}_${pos}`] ?? 0),
                  left: ri * (MATCH_W + ROUND_GAP),
                  width: MATCH_W,
                  height: MATCH_H,
                }}
              >
                <BracketCard match={match} scoringType={scoringType} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualBracket;

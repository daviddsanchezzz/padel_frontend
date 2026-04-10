import React from 'react';
import Icon from './Icon';

const MATCH_H = 80;   // height of each compact match card (px)
const MATCH_W = 210;  // width of each match card
const MATCH_GAP = 12; // vertical gap between matches in same round
const ROUND_GAP = 44; // horizontal gap between rounds (for connectors)

// Minimal match card for the visual bracket
const BracketCard = ({ match, scoringType }) => {
  const winnerId = match.winner?._id || match.winner;
  const teamAId  = match.teamA?._id  || match.teamA;
  const teamBId  = match.teamB?._id  || match.teamB;
  const aWon = winnerId && winnerId.toString() === teamAId?.toString();
  const bWon = winnerId && winnerId.toString() === teamBId?.toString();

  const isBye    = match.status === 'bye';
  const isPending = !match.result && match.status === 'pending';

  const renderScore = () => {
    if (isBye || isPending || !match.result) return null;
    const res = match.result;
    if (scoringType === 'sets' && res.sets) {
      return (
        <div className="flex gap-1 items-start">
          {res.sets.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className={`text-[10px] w-3.5 text-center leading-none ${s.a > s.b ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{s.a}</span>
              <span className={`text-[10px] w-3.5 text-center leading-none ${s.b > s.a ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{s.b}</span>
            </div>
          ))}
        </div>
      );
    }
    if (scoringType === 'goals' && res.goals) {
      const { a, b } = res.goals;
      return (
        <div className="flex flex-col items-center gap-0.5">
          <span className={`text-[10px] w-4 text-center leading-none ${a > b ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{a}</span>
          <span className={`text-[10px] w-4 text-center leading-none ${b > a ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{b}</span>
        </div>
      );
    }
    return null;
  };

  if (isBye) {
    return (
      <div className="h-full bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 flex items-center">
        <span className="text-xs text-gray-300 italic">{match.teamA?.name || match.teamB?.name || '—'} · bye</span>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between gap-1 px-2.5 pt-2.5 pb-1">
        <p className={`text-xs truncate flex-1 ${aWon ? 'font-bold text-gray-900' : 'text-gray-500'} ${!match.teamA ? 'italic text-gray-300' : ''}`}>
          {match.teamA?.name || 'TBD'}
        </p>
        {renderScore() && <div className="flex-shrink-0">{React.cloneElement(renderScore(), { key: 'score-a' })}</div>}
      </div>
      <div className="mx-2.5 h-px bg-gray-100" />
      <div className="flex items-center justify-between gap-1 px-2.5 pt-1 pb-2.5">
        <p className={`text-xs truncate flex-1 ${bWon ? 'font-bold text-gray-900' : 'text-gray-500'} ${!match.teamB ? 'italic text-gray-300' : ''}`}>
          {match.teamB?.name || 'TBD'}
        </p>
      </div>
    </div>
  );
};

const VisualBracket = ({ bracket, scoringType }) => {
  const rounds = Object.keys(bracket).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return null;

  const firstRoundCount = (bracket[rounds[0]] || []).length;
  const slotH = MATCH_H + MATCH_GAP;
  const totalH = firstRoundCount * slotH - MATCH_GAP;

  // Compute Y top position for each match (recursive centering)
  const posY = {};
  const getY = (roundIdx, pos) => {
    const key = `${roundIdx}_${pos}`;
    if (posY[key] !== undefined) return posY[key];
    if (roundIdx === 0) {
      posY[key] = pos * slotH;
    } else {
      const y0 = getY(roundIdx - 1, pos * 2)     + MATCH_H / 2;
      const y1 = getY(roundIdx - 1, pos * 2 + 1) + MATCH_H / 2;
      posY[key] = (y0 + y1) / 2 - MATCH_H / 2;
    }
    return posY[key];
  };
  rounds.forEach((_, ri) => {
    (bracket[rounds[ri]] || []).forEach((_, pos) => getY(ri, pos));
  });

  const totalW = rounds.length * (MATCH_W + ROUND_GAP) - ROUND_GAP;

  return (
    <div className="overflow-x-auto pb-4 -mx-1">
      <div className="relative" style={{ width: totalW, height: totalH + MATCH_H, minHeight: 200 }}>
        {/* SVG connectors */}
        <svg
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          width={totalW}
          height={totalH + MATCH_H}
        >
          {rounds.slice(0, -1).map((_, ri) => {
            const nextRi = ri + 1;
            const nextRound = rounds[nextRi];
            return (bracket[nextRound] || []).map((_, pos) => {
              const x1   = ri * (MATCH_W + ROUND_GAP) + MATCH_W;
              const x2   = nextRi * (MATCH_W + ROUND_GAP);
              const xMid = (x1 + x2) / 2;

              const y0 = (posY[`${ri}_${pos * 2}`]     ?? 0) + MATCH_H / 2;
              const y1 = (posY[`${ri}_${pos * 2 + 1}`] ?? 0) + MATCH_H / 2;
              const yP = (posY[`${nextRi}_${pos}`]     ?? 0) + MATCH_H / 2;

              return (
                <g key={`conn_${ri}_${pos}`}>
                  <path d={`M${x1},${y0} H${xMid} V${yP} H${x2}`} fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
                  <path d={`M${x1},${y1} H${xMid}`}               fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
                </g>
              );
            });
          })}
        </svg>

        {/* Match cards */}
        {rounds.map((round, ri) => (
          (bracket[round] || []).map((match, pos) => (
            <div
              key={match._id}
              style={{
                position: 'absolute',
                top: posY[`${ri}_${pos}`] ?? 0,
                left: ri * (MATCH_W + ROUND_GAP),
                width: MATCH_W,
                height: MATCH_H,
              }}
            >
              <BracketCard match={match} scoringType={scoringType} />
            </div>
          ))
        ))}

        {/* Round labels */}
        {rounds.map((round, ri) => {
          const matches = bracket[round] || [];
          const label = matches[0]?.roundName || `Ronda ${round}`;
          const x = ri * (MATCH_W + ROUND_GAP);
          return (
            <div
              key={`label_${round}`}
              style={{ position: 'absolute', top: -24, left: x, width: MATCH_W }}
              className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider"
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VisualBracket;

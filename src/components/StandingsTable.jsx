import React, { useState } from 'react';

/* ── Form pill: V (victoria) / D (derrota) ───────────────────── */
const FormPill = ({ result }) => {
  if (!result) return <span className="inline-block w-[17px] h-[17px] rounded bg-gray-100" />;
  const isWin = result === 'W';
  return (
    <span className={`inline-flex items-center justify-center w-[17px] h-[17px] rounded text-[9px] font-bold leading-none ${
      isWin ? 'bg-green-500 text-white' : 'bg-red-400 text-white'
    }`}>
      {isWin ? 'V' : 'D'}
    </span>
  );
};

const FORM_LEN = 3;

const StandingsTable = ({
  standings,
  promotionSpots = 0,
  relegationSpots = 0,
  isTopDivision = false,
  isBottomDivision = false,
  currentUserId = null,
  formMap = {},
}) => {
  const [expanded, setExpanded] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const hasForm = Object.keys(formMap).length > 0;

  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="font-semibold text-gray-700 mb-1">Sin clasificacion</p>
        <p className="text-sm">Registra resultados para ver la tabla.</p>
      </div>
    );
  }

  const positionStyle = (index) => {
    if (!isTopDivision && index < promotionSpots) return 'promotion';
    if (!isBottomDivision && index >= standings.length - relegationSpots) return 'relegation';
    return 'normal';
  };

  const positionCircleClass = (zone) => ({
    promotion: 'bg-green-100 text-green-800',
    relegation: 'bg-red-100 text-red-800',
    normal:     'bg-gray-100 text-gray-400',
  }[zone]);

  const ptsBadgeClass = (zone) => ({
    promotion: 'bg-green-600 text-white',
    relegation: 'bg-red-500 text-white',
    normal:     'bg-gray-100 text-gray-700',
  }[zone]);

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-0.5"
        >
          {expanded ? 'Vista compacta ↑' : 'Estadísticas ↓'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center w-7">#</th>
              <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Equipo</th>
              <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">PJ</th>
              <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">PG</th>
              <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">PP</th>
              {expanded && (
                <>
                  <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">SF</th>
                  <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">SC</th>
                  <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">+/-</th>
                  {hasForm && (
                    <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Forma</th>
                  )}
                </>
              )}
              <th className="pb-2.5 text-[10px] font-bold text-gray-700 uppercase tracking-wider text-center">PTS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {standings.map((row, index) => {
              const zone = positionStyle(index);
              const isMyTeam = currentUserId && row.team.players?.some(p => p && p.toString() === currentUserId);
              const teamId = row.team._id?.toString();
              const form = formMap[teamId] || [];
              const teamName = row.team.playerNames?.length > 0
                ? row.team.playerNames.join(' / ')
                : row.team.name;

              return (
                <tr key={row.team._id} className={isMyTeam ? 'bg-brand-50' : ''}>
                  <td className="py-2.5 pr-1 w-7">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${positionCircleClass(zone)}`}>
                      {row.position}
                    </div>
                  </td>
                  <td className="py-2.5 max-w-0 w-full">
                    <span className={`font-semibold block truncate text-sm ${isMyTeam ? 'text-brand-700' : 'text-gray-800'}`}>
                      {teamName}
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-gray-500 text-sm">{row.played}</td>
                  <td className="py-2.5 text-center text-green-600 font-semibold text-sm">{row.won}</td>
                  <td className="py-2.5 text-center text-red-400 text-sm">{row.lost}</td>
                  {expanded && (
                    <>
                      <td className="py-2.5 text-center text-gray-400 text-sm">{row.setsWon}</td>
                      <td className="py-2.5 text-center text-gray-400 text-sm">{row.setsLost}</td>
                      <td className={`py-2.5 text-center font-semibold text-sm ${
                        row.setDiff > 0 ? 'text-green-600' : row.setDiff < 0 ? 'text-red-400' : 'text-gray-300'
                      }`}>
                        {row.setDiff > 0 ? `+${row.setDiff}` : row.setDiff}
                      </td>
                      {hasForm && (
                        <td className="py-2.5">
                          <div className="flex items-center gap-0.5 justify-center">
                            {form.slice(0, FORM_LEN).map((r, i) => (
                              <FormPill key={i} result={r} />
                            ))}
                          </div>
                        </td>
                      )}
                    </>
                  )}
                  <td className="py-2.5 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-6 rounded-md text-sm font-bold ${ptsBadgeClass(zone)}`}>
                      {row.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {(promotionSpots > 0 || relegationSpots > 0) && (
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          {!isTopDivision && promotionSpots > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <span className="w-2.5 h-2.5 rounded-full bg-green-200 inline-block" />
              {promotionSpots} ascienden
            </span>
          )}
          {!isBottomDivision && relegationSpots > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <span className="w-2.5 h-2.5 rounded-full bg-red-200 inline-block" />
              {relegationSpots} descienden
            </span>
          )}
        </div>
      )}

      {expanded && (
        <p className="text-[10px] text-gray-300 mt-3 text-center">
          PJ Jugados · PG Ganados · PP Perdidos · SF Sets favor · SC Sets contra
        </p>
      )}
    </div>
  );
};

export default StandingsTable;

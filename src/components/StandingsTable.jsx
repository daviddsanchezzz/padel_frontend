import React from 'react';

const StandingsTable = ({ standings, promotionSpots = 0, relegationSpots = 0, isTopDivision = false, isBottomDivision = false, currentUserId = null }) => {
  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="font-semibold text-gray-700 mb-1">Sin clasificación</p>
        <p className="text-sm">Registra resultados de partidos para ver la tabla.</p>
      </div>
    );
  }

  const getPositionStyle = (index) => {
    // Green for promotion spots (if not top division)
    if (!isTopDivision && index < promotionSpots) {
      return 'bg-green-100 text-green-800';
    }
    // Red for relegation spots (if not bottom division)
    if (!isBottomDivision && index >= standings.length - relegationSpots) {
      return 'bg-red-100 text-red-800';
    }
    // Default gray
    return 'bg-gray-100 text-gray-400';
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">#</th>
              <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-left">Equipo</th>
              <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">PJ</th>
              <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">PG</th>
              <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">PP</th>
              <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center hidden sm:table-cell">SF</th>
              <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center hidden sm:table-cell">SC</th>
              <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center hidden sm:table-cell">+/-</th>
              <th className="pb-3 text-[11px] font-bold text-gray-700 uppercase tracking-wider text-center">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {standings.map((row, index) => {
              const positionStyle = getPositionStyle(index);
              const isMyTeam = currentUserId && row.team.players?.some(p => p && p.toString() === currentUserId);
              return (
                <tr key={row.team._id} className={`transition-colors ${isMyTeam ? 'bg-brand-50' : ''}`}>
                  <td className="py-3 pr-2 w-8">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${positionStyle}`}>
                      {row.position}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`font-semibold ${isMyTeam ? 'text-brand-700' : 'text-gray-800'}`}>
                      {row.team.playerNames?.length > 0 ? row.team.playerNames.join(' / ') : row.team.name}
                    </span>
                  </td>
                  <td className="py-3 text-center text-gray-500">{row.played}</td>
                  <td className="py-3 text-center text-brand-600 font-semibold">{row.won}</td>
                  <td className="py-3 text-center text-red-400">{row.lost}</td>
                  <td className="py-3 text-center text-gray-500 hidden sm:table-cell">{row.setsWon}</td>
                  <td className="py-3 text-center text-gray-500 hidden sm:table-cell">{row.setsLost}</td>
                  <td className={`py-3 text-center font-semibold text-sm hidden sm:table-cell ${
                    row.setDiff > 0 ? 'text-brand-600' : row.setDiff < 0 ? 'text-red-400' : 'text-gray-300'
                  }`}>
                    {row.setDiff > 0 ? `+${row.setDiff}` : row.setDiff}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-9 h-7 rounded-lg text-sm font-bold ${
                      positionStyle.includes('green') ? 'bg-green-600 text-white' :
                      positionStyle.includes('red') ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {row.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(promotionSpots > 0 || relegationSpots > 0) && (
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          {!isTopDivision && promotionSpots > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <div className="w-3 h-3 bg-green-100 rounded-full"></div>
              {promotionSpots} ascienden
            </span>
          )}
          {!isBottomDivision && relegationSpots > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <div className="w-3 h-3 bg-red-100 rounded-full"></div>
              {relegationSpots} descienden
            </span>
          )}
        </div>
      )}
      <p className="text-[11px] text-gray-300 mt-3 text-center">
        PJ · Jugados · PG · Ganados · PP · Perdidos · SF · Sets favor · SC · Sets contra · PTS · Puntos
      </p>
    </div>
  );
};

export default StandingsTable;

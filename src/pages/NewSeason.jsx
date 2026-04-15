import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNewSeasonPreview, createNewSeason } from '../api/competitions';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';

const NewSeason = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [season, setSeason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getNewSeasonPreview(id)
      .then((res) => {
        setPreview(res.data);
        setSeason(res.data.nextSeason || '');
      })
      .catch(() => setError('No se puede generar la vista previa. ¿Hay clasificaciones disponibles?'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreate = async () => {
    if (!season.trim()) {
      setError('El nombre de la temporada es obligatorio');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError('La fecha fin no puede ser menor que la fecha inicio');
      return;
    }

    const confirmed = window.confirm(
      `¿Crear la temporada "${season.trim()}"? Se generará una nueva temporada con los equipos redistribuidos.`
    );
    if (!confirmed) return;

    setCreating(true);
    setError('');
    try {
      const res = await createNewSeason(id, {
        season: season.trim(),
        startDate,
        endDate,
      });
      navigate(`/competitions/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la temporada');
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Nueva temporada">
        <div className="flex items-center justify-center py-20">
          <Icon name="spinner" size={20} className="animate-spin text-brand-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Nueva temporada">
      <button
        onClick={() => navigate(`/competitions/${id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
      >
        <Icon name="chevronLeft" size={14} /> Volver
      </button>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
          <Icon name="alert" size={14} /> {error}
        </div>
      )}

      {preview && (
        <>
          <div className="card p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-1">Redistribución de equipos</h2>
            <p className="text-sm text-gray-400 mb-4">
              Los ascensos y descensos se calculan según la clasificación final de cada división.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" />
                <span className="text-gray-500">Asciende</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                <span className="text-gray-500">Desciende</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
                <span className="text-gray-500">Se mantiene</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {preview.divisions.map((div, i) => {
              const isTop = i === 0;
              const isBottom = i === preview.divisions.length - 1;
              const allTeams = [
                ...div.promoted.map((t) => ({ ...t, status: 'promoted' })),
                ...div.staying.map((t) => ({ ...t, status: 'staying' })),
                ...div.relegated.map((t) => ({ ...t, status: 'relegated' })),
              ];

              return (
                <div key={div.division._id} className="card overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs font-bold">
                        {i + 1}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{div.division.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {!isTop && div.relegated.length > 0 && (
                        <span className="text-red-500 font-medium">↓ {div.relegated.length} bajan</span>
                      )}
                      {!isBottom && div.promoted.length > 0 && (
                        <span className="text-brand-600 font-medium">↑ {div.promoted.length} suben</span>
                      )}
                    </div>
                  </div>

                  {allTeams.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-gray-400">Sin clasificación disponible</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {allTeams.map((team) => {
                        const isPromoted = team.status === 'promoted';
                        const isRelegated = team.status === 'relegated';
                        return (
                          <div
                            key={team._id}
                            className={`px-5 py-2.5 flex items-center justify-between ${
                              isPromoted ? 'bg-brand-50' : isRelegated ? 'bg-red-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs text-gray-400 w-4 text-right">{team.position}</span>
                              <span
                                className={`text-sm font-medium ${
                                  isPromoted ? 'text-brand-700' : isRelegated ? 'text-red-600' : 'text-gray-700'
                                }`}
                              >
                                {team.name}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-bold ${
                                isPromoted ? 'text-brand-600' : isRelegated ? 'text-red-500' : 'text-gray-400'
                              }`}
                            >
                              {isPromoted ? '↑ Sube' : isRelegated ? '↓ Baja' : '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card p-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nombre de la nueva temporada</label>
              <input
                type="text"
                className="input w-full sm:w-80"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="Ej: 2026-27"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Inicio de temporada</label>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Fin de temporada</label>
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                onClick={handleCreate}
                disabled={creating || !season.trim()}
                className="btn-primary whitespace-nowrap"
              >
                <Icon name="plus" size={14} />
                {creating ? 'Creando...' : 'Crear nueva temporada'}
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default NewSeason;

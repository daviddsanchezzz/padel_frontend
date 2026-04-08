import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompetition } from '../api/competitions';
import { getSports } from '../api/sports';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';

const normalizeSportName = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const CompetitionForm = () => {
  const navigate = useNavigate();
  const [sports, setSports] = useState([]);
  const [form, setForm] = useState({
    name: '', type: 'league', sportId: '', season: '', description: '',
  });
  const [footballMaxPlayers, setFootballMaxPlayers] = useState(11);
  const [tennisMode, setTennisMode] = useState('singles');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSports().then((res) => {
      setSports(res.data);
      if (res.data.length > 0) setForm((f) => ({ ...f, sportId: res.data[0]._id }));
    });
  }, []);

  const selectedSport = useMemo(
    () => sports.find((sport) => sport._id === form.sportId) || null,
    [sports, form.sportId]
  );

  const normalizedSport = normalizeSportName(selectedSport?.name || '');
  const sportSlug = (selectedSport?.slug || '').toLowerCase();
  const isFootball = sportSlug === 'football' || normalizedSport.includes('futbol') || normalizedSport.includes('football');
  const isTennis = sportSlug === 'tennis' || normalizedSport.includes('tenis') || normalizedSport.includes('tennis');

  const isLeague = form.type === 'league';

  useEffect(() => {
    if (!selectedSport) return;

    const defaultTeamSize = Number(selectedSport.teamSize || 1);
    if (isFootball) {
      setFootballMaxPlayers(defaultTeamSize >= 3 ? defaultTeamSize : 11);
    }

    if (isTennis) {
      setTennisMode(defaultTeamSize === 2 ? 'doubles' : 'singles');
    }
  }, [selectedSport?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const settings = {};

      if (isFootball) {
        settings.teamSize = Number(footballMaxPlayers);
      } else if (isTennis) {
        settings.teamSize = tennisMode === 'doubles' ? 2 : 1;
      }

      const payload = {
        ...form,
        settings,
      };

      const res = await createCompetition(payload);
      navigate(`/competitions/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la competicion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Nueva competicion">
      <div className="w-full">
        <div className="mb-6 flex flex-col gap-1">
          <p className="text-xl font-bold text-gray-900">Configura tu competicion</p>
          <p className="text-sm text-gray-500">
            Define formato, deporte y reglas base. Luego podras ajustar detalles dentro de la competicion.
          </p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
            <Icon name="alert" size={15} />
            {error}
          </div>
        )}

        <div className="card p-5 md:p-7">
          <form onSubmit={handleSubmit} className="space-y-7">
            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Tipo de competicion</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { value: 'league', label: 'Liga', icon: 'league', desc: 'Jornadas round-robin y clasificacion' },
                  { value: 'tournament', label: 'Torneo', icon: 'tournament', desc: 'Eliminacion directa con bracket' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.type === t.value
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.type === t.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon name={t.icon} size={16} />
                      </div>
                      <p className={`text-sm font-semibold ${form.type === t.value ? 'text-brand-700' : 'text-gray-800'}`}>{t.label}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            <div className="h-px bg-gray-100" />

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Deporte *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <Icon name="sport" size={15} />
                  </div>
                  <select
                    className="input pl-9"
                    value={form.sportId}
                    onChange={(e) => setForm({ ...form, sportId: e.target.value })}
                    required
                  >
                    <option value="">Selecciona deporte</option>
                    {sports.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  required
                  placeholder={isLeague ? 'Ej: Liga de verano 2026' : 'Ej: Torneo de primavera'}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {isLeague && (
                <div>
                  <label className="label">Temporada</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                      <Icon name="calendar" size={15} />
                    </div>
                    <input
                      type="text"
                      className="input pl-9"
                      value={form.season}
                      placeholder="Ej: 2026-27 o Apertura 2026"
                      onChange={(e) => setForm({ ...form, season: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {isFootball && (
                <div>
                  <label className="label">Maximo jugadores/equipo *</label>
                  <input
                    type="number"
                    className="input"
                    min={3}
                    max={30}
                    value={footballMaxPlayers}
                    onChange={(e) => setFootballMaxPlayers(e.target.value)}
                    required
                  />
                </div>
              )}

              {isTennis && (
                <div className="lg:col-span-2">
                  <label className="label">Modalidad de tenis *</label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <button
                      type="button"
                      onClick={() => setTennisMode('singles')}
                      className={`p-3 rounded-xl border text-sm font-semibold transition-colors ${
                        tennisMode === 'singles'
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setTennisMode('doubles')}
                      className={`p-3 rounded-xl border text-sm font-semibold transition-colors ${
                        tennisMode === 'doubles'
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Dobles
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section>
              <label className="label">Descripcion</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={form.description}
                placeholder="Descripcion opcional"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </section>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creando...' : 'Crear competicion'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CompetitionForm;

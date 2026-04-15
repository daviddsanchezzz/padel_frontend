import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompetition } from '../api/competitions';
import { getSports } from '../api/sports';
import { useOrg } from '../context/OrgContext';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';

const normalizeSportName = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const CompetitionForm = () => {
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const [sports, setSports] = useState([]);
  const [form, setForm] = useState({
    name: '', type: 'league', sportId: '', season: '', description: '', location: '', startDate: '', endDate: '',
  });
  const [footballMaxPlayers, setFootballMaxPlayers] = useState(11);
  const [tennisMode, setTennisMode] = useState('singles');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSports().then((res) => {
      setSports(res.data);
    });
  }, []);

  // Filter out sports disabled for this org. Empty disabledSports = all enabled.
  const enabledSports = useMemo(() => {
    const disabled = new Set((activeOrg?.disabledSports || []).map(String));
    return sports.filter((s) => !disabled.has(String(s._id)));
  }, [sports, activeOrg]);

  // Keep sportId in sync: if current selection gets filtered out, reset to first enabled.
  useEffect(() => {
    if (enabledSports.length === 0) return;
    const valid = enabledSports.some((s) => s._id === form.sportId);
    if (!valid) setForm((f) => ({ ...f, sportId: enabledSports[0]._id }));
  }, [enabledSports]);

  const selectedSport = useMemo(
    () => enabledSports.find((sport) => sport._id === form.sportId) || null,
    [enabledSports, form.sportId]
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
        organizationId: activeOrg?.authOrgId ?? null,
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
      <div className="w-full max-w-none pb-24">
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-5 py-5 md:px-7">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
              <Icon name="tournament" size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">Crear competicion</p>
              <p className="text-sm text-gray-500 mt-1">
                Configura los datos base y reglas iniciales. Luego podras ajustar todo desde configuracion.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
            <Icon name="alert" size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Formato</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">Tipo de competicion</p>
            </div>
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
                  <div className="flex items-center gap-2 mb-1.5">
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

          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Datos principales</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">Identidad de la competicion</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    {enabledSports.map((s) => (
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
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
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Calendario y sede</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {isLeague ? 'Ubicacion y fechas de la temporada inicial' : 'Ubicacion y rango de fechas de la competicion'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="label">Ubicacion</label>
                <input
                  type="text"
                  className="input"
                  value={form.location}
                  placeholder="Ej: Ecija, Sevilla"
                  maxLength={140}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="label">{isLeague ? 'Inicio de temporada' : 'Fecha inicio'}</label>
                  <input
                    type="date"
                    className="input"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{isLeague ? 'Fin de temporada' : 'Fecha fin'}</label>
                  <input
                    type="date"
                    className="input"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Descripcion</p>
            </div>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              placeholder="Descripcion opcional"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </section>

          <div className="fixed left-0 right-0 bottom-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200">
            <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-end gap-2">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creando...' : 'Crear competicion'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default CompetitionForm;

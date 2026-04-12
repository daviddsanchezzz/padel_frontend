import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { createCompetition } from '../api/competitions';
import { getSports } from '../api/sports';
import { useOrg } from '../context/OrgContext';
import Icon from './Icon';

const normalizeSportName = (value = '') =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const CompetitionModal = ({ onClose, onCreated }) => {
  const { activeOrg } = useOrg();
  const [sports, setSports] = useState([]);
  const [form, setForm] = useState({
    name: '',
    type: 'league',
    sportId: '',
    season: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
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

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const selectedSport = useMemo(() => sports.find((s) => s._id === form.sportId) || null, [sports, form.sportId]);
  const normalizedSport = normalizeSportName(selectedSport?.name || '');
  const sportSlug = (selectedSport?.slug || '').toLowerCase();
  const isFootball = sportSlug === 'football' || normalizedSport.includes('futbol');
  const isTennis   = sportSlug === 'tennis'   || normalizedSport.includes('tenis');
  const isLeague   = form.type === 'league';

  useEffect(() => {
    if (!selectedSport) return;
    const size = Number(selectedSport.teamSize || 1);
    if (isFootball) setFootballMaxPlayers(size >= 3 ? size : 11);
    if (isTennis)   setTennisMode(size === 2 ? 'doubles' : 'singles');
  }, [selectedSport?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const settings = {};
      if (isFootball) settings.teamSize = Number(footballMaxPlayers);
      else if (isTennis) settings.teamSize = tennisMode === 'doubles' ? 2 : 1;

      const res = await createCompetition({
        ...form,
        settings,
        organizationId: activeOrg?.authOrgId ?? null,
      });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la competicion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 my-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Nueva competicion</h2>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <Icon name="alert" size={14} /> {error}
            </div>
          )}

          {/* Type */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tipo</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'league',     label: 'Liga',   icon: 'league',     desc: 'Jornadas round-robin y clasificacion' },
                { value: 'tournament', label: 'Torneo', icon: 'tournament', desc: 'Eliminacion directa con bracket' },
              ].map((t) => (
                <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    form.type === t.value
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${form.type === t.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon name={t.icon} size={14} />
                    </div>
                    <p className={`text-sm font-semibold ${form.type === t.value ? 'text-brand-700' : 'text-gray-800'}`}>{t.label}</p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sport + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Deporte *</label>
              <div className="relative">
                <Icon name="sport" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select className="input pl-8" value={form.sportId}
                  onChange={(e) => setForm({ ...form, sportId: e.target.value })} required>
                  <option value="">Selecciona</option>
                  {sports.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input type="text" className="input" value={form.name} required
                placeholder={isLeague ? 'Liga de verano' : 'Torneo de primavera'}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>

          {/* Season / Football / Tennis */}
          {(isLeague || isFootball || isTennis) && (
            <div className="grid grid-cols-2 gap-3">
              {isLeague && (
                <div>
                  <label className="label">Temporada</label>
                  <input type="text" className="input" value={form.season}
                    placeholder="Ej: 2026-27" onChange={(e) => setForm({ ...form, season: e.target.value })} />
                </div>
              )}
              {isFootball && (
                <div>
                  <label className="label">Max jugadores/equipo</label>
                  <input type="number" className="input" min={3} max={30}
                    value={footballMaxPlayers} onChange={(e) => setFootballMaxPlayers(e.target.value)} required />
                </div>
              )}
              {isTennis && (
                <div>
                  <label className="label">Modalidad</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['singles', 'doubles'].map((m) => (
                      <button key={m} type="button" onClick={() => setTennisMode(m)}
                        className={`py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                          tennisMode === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {m === 'singles' ? 'Individual' : 'Dobles'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location + Date range */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="label">Ubicacion</label>
              <input
                type="text"
                className="input"
                value={form.location}
                maxLength={140}
                placeholder="Ej: Ecija, Sevilla"
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fecha inicio</label>
                <input
                  type="date"
                  className="input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Fecha fin</label>
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

          {/* Description */}
          <div>
            <label className="label">Descripcion</label>
            <textarea className="input resize-none" rows={2} value={form.description}
              placeholder="Descripcion opcional"
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Icon name="spinner" size={14} className="animate-spin" /> : <Icon name="plus" size={14} />}
              {loading ? 'Creando...' : 'Crear competicion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompetitionModal;

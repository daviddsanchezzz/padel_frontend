import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompetition } from '../api/competitions';
import { getSports } from '../api/sports';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';

const CompetitionForm = () => {
  const navigate = useNavigate();
  const [sports, setSports] = useState([]);
  const [form, setForm] = useState({
    name: '', type: 'league', sportId: '', season: '', description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSports().then((res) => {
      setSports(res.data);
      if (res.data.length > 0) setForm((f) => ({ ...f, sportId: res.data[0]._id }));
    });
  }, []);

  const isLeague     = form.type === 'league';
  const isTournament = form.type === 'tournament';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createCompetition(form);
      navigate(`/competitions/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la competición');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Nueva competición">
      <div className="max-w-xl">
        <p className="text-gray-500 text-sm mb-6">
          Crea una liga con clasificación automática o un torneo con bracket eliminatorio.
          Podrás configurar los puntos y reglas desde el detalle de la competición.
        </p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
            <Icon name="alert" size={15} />
            {error}
          </div>
        )}

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Type */}
            <div>
              <label className="label">Tipo de competición *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'league',     label: 'Liga',    icon: 'league',     desc: 'Jornadas round-robin + clasificación' },
                  { value: 'tournament', label: 'Torneo',  icon: 'tournament', desc: 'Bracket eliminatorio directo' },
                ].map((t) => (
                  <button
                    key={t.value} type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.type === t.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                      form.type === t.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon name={t.icon} size={16} />
                    </div>
                    <p className={`text-sm font-semibold ${form.type === t.value ? 'text-brand-700' : 'text-gray-800'}`}>
                      {t.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Sport */}
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

            {/* Name */}
            <div>
              <label className="label">Nombre *</label>
              <input
                type="text" className="input"
                value={form.name} required
                placeholder={isLeague ? 'Ej: Liga de verano 2025' : 'Ej: Torneo de primavera'}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Season — only for leagues */}
            {isLeague && (
              <div>
                <label className="label">Temporada</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <Icon name="calendar" size={15} />
                  </div>
                  <input
                    type="text" className="input pl-9"
                    value={form.season}
                    placeholder="Ej: 2025, Primavera 2025…"
                    onChange={(e) => setForm({ ...form, season: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="label">Descripción</label>
              <textarea
                className="input resize-none" rows={3}
                value={form.description}
                placeholder="Descripción opcional"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? 'Creando...' : 'Crear competición'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CompetitionForm;

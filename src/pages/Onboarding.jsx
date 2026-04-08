import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2, MapPin, FileText } from 'lucide-react';
import { createOrganization } from '../api/organizations';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';

const Onboarding = () => {
  const navigate = useNavigate();
  const { orgCreated } = useOrg();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    country: 'España',
    type: 'club',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createOrganization({
        name: form.name,
        description: form.description,
        location: { city: form.city, country: form.country },
        type: form.type,
      });
      orgCreated(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crea tu club</h1>
          <p className="text-gray-500 text-sm mt-1">
            Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Antes de empezar, dinos cómo se llama tu club.
          </p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre del club */}
            <div>
              <label className="label">Nombre del club *</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="Club Pádel Norte"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="label">Tipo de entidad</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'club',      label: 'Club' },
                  { value: 'organizer', label: 'Organizadora' },
                  { value: 'federation',label: 'Federación' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                      form.type === t.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ciudad */}
            <div>
              <label className="label">Ciudad</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="Madrid"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="label">Descripción</label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  className="input pl-9 resize-none"
                  rows={3}
                  placeholder="Cuéntanos sobre tu club..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-base mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Creando club...' : 'Crear club y continuar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Podrás editar estos datos en cualquier momento desde tu perfil.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;

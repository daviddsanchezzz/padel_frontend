import React, { useState, useEffect } from 'react';
import { Building2, MapPin, FileText, Globe, Save, Loader2, CheckCircle } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { useOrg } from '../context/OrgContext';
import { updateOrganization } from '../api/organizations';

const OrganizationSettings = () => {
  const { activeOrg, orgCreated } = useOrg();

  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    country: '',
    type: 'club',
    isPublic: true,
  });
  const [loading, setLoading]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  // Populate form when org loads
  useEffect(() => {
    if (!activeOrg) return;
    setForm({
      name:        activeOrg.name        ?? '',
      description: activeOrg.description ?? '',
      city:        activeOrg.location?.city    ?? '',
      country:     activeOrg.location?.country ?? '',
      type:        activeOrg.type        ?? 'club',
      isPublic:    activeOrg.isPublic    ?? true,
    });
  }, [activeOrg?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const res = await updateOrganization(activeOrg._id, {
        description: form.description,
        location: { city: form.city, country: form.country },
        type: form.type,
        isPublic: form.isPublic,
      });
      orgCreated(res.data); // update context so sidebar / other pages reflect changes
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  if (!activeOrg) return null;

  return (
    <AppLayout title="Configuración">
      <div className="max-w-2xl space-y-6">

        {/* Club identity — read-only header */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Building2 size={24} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-lg leading-tight truncate">{activeOrg.name}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              ID interno: <span className="font-mono text-xs text-gray-500">{activeOrg.authOrgId}</span>
            </p>
          </div>
        </div>

        {/* Edit form */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-5 uppercase tracking-wider">Información del club</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tipo */}
            <div>
              <label className="label">Tipo de entidad</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'club',       label: 'Club' },
                  { value: 'organizer',  label: 'Organizadora' },
                  { value: 'federation', label: 'Federación' },
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

            {/* Ubicación */}
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="label">País</label>
                <div className="relative">
                  <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input pl-9"
                    placeholder="España"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Visibilidad pública */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-800">Página pública</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Permite que cualquiera vea el perfil público de tu club y sus competiciones
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  form.isPublic ? 'bg-brand-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle size={15} /> Guardado
                </span>
              )}
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Public URL info */}
        {form.isPublic && (
          <div className="card p-4 flex items-start gap-3">
            <Globe size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">URL pública de tu club</p>
              <p className="text-xs text-gray-400 font-mono mt-1">
                /api/organizations/{activeOrg._id}/public
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default OrganizationSettings;

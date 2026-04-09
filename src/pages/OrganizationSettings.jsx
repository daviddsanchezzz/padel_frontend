import React, { useState, useEffect, useRef } from 'react';
import { Building2, MapPin, FileText, Globe, Save, Loader2, CheckCircle, Upload, X, ExternalLink, Copy } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { useOrg } from '../context/OrgContext';
import { updateOrganization } from '../api/organizations';

const OrganizationSettings = () => {
  const { activeOrg, orgCreated } = useOrg();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    country: '',
    type: 'club',
    isPublic: true,
    logo: '',
    primaryColor: '#16a34a',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    if (!activeOrg) return;
    setForm({
      name: activeOrg.name ?? '',
      description: activeOrg.description ?? '',
      city: activeOrg.location?.city ?? '',
      country: activeOrg.location?.country ?? '',
      type: activeOrg.type ?? 'club',
      isPublic: activeOrg.isPublic ?? true,
      logo: activeOrg.logo ?? '',
      primaryColor: activeOrg.primaryColor ?? '#16a34a',
    });
    setLogoPreview(activeOrg.logo ?? '');
  }, [activeOrg?._id]);

  const handleLogoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setForm((f) => ({ ...f, logo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoPreview('');
    setForm((f) => ({ ...f, logo: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const res = await updateOrganization(activeOrg._id, {
        name: form.name,
        description: form.description,
        location: { city: form.city, country: form.country },
        type: form.type,
        isPublic: form.isPublic,
        logo: form.logo || null,
        primaryColor: form.primaryColor,
      });
      orgCreated(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  if (!activeOrg) return null;

  const publicPageUrl = `${window.location.origin}/organizations/${activeOrg._id}/public`;

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicPageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AppLayout title="Configuracion">
      <div className="space-y-5">

        {/* Club header */}
        <div className="card overflow-hidden">
          {/* Color band */}
          <div className="h-2" style={{ backgroundColor: form.primaryColor || '#16a34a' }} />
          <div className="p-5 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm"
              style={{ backgroundColor: form.primaryColor || '#16a34a' }}
            >
              {logoPreview
                ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                : <Building2 size={22} className="text-white" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-lg leading-tight truncate">{form.name || activeOrg.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{activeOrg.authOrgId}</p>
            </div>
            {form.isPublic && (
              <a
                href={publicPageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-brand-600 font-medium hover:text-brand-800 transition-colors flex-shrink-0"
              >
                <ExternalLink size={13} /> Ver pagina
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identity */}
          <div className="card divide-y divide-gray-100">
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identidad visual</p>
            </div>

            {/* Logo row */}
            <div className="px-5 py-4 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: form.primaryColor || '#16a34a' }}
              >
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                  : <Building2 size={20} className="text-white" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">Logo del club</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG o SVG · Max 2 MB</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {logoPreview && (
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Upload size={13} /> Subir
                </button>
              </div>
            </div>

            {/* Color row */}
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: form.primaryColor || '#16a34a' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">Color del club</p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{form.primaryColor || '#16a34a'}</p>
              </div>
              <label className="flex-shrink-0 cursor-pointer">
                <input
                  type="color"
                  value={form.primaryColor || '#16a34a'}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  className="sr-only"
                />
                <div
                  className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-1 ring-gray-200 transition-transform hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: form.primaryColor || '#16a34a' }}
                />
              </label>
            </div>
          </div>

          {/* Info */}
          <div className="card divide-y divide-gray-100">
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Informacion del club</p>
            </div>

            {/* Name */}
            <div className="px-5 py-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Nombre del club</p>
              <input
                type="text"
                className="input text-sm"
                placeholder="Nombre del club"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            {/* Type */}
            <div className="px-5 py-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Tipo de entidad</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'club', label: 'Club' },
                  { value: 'organizer', label: 'Organizadora' },
                  { value: 'federation', label: 'Federacion' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('type', t.value)}
                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                      form.type === t.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="px-5 py-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Descripcion</p>
              <textarea
                className="input resize-none text-sm"
                rows={3}
                placeholder="Cuentanos sobre tu club..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>

            {/* Location */}
            <div className="px-5 py-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Ubicacion</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input pl-9 text-sm"
                    placeholder="Ciudad"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input pl-9 text-sm"
                    placeholder="Pais"
                    value={form.country}
                    onChange={(e) => set('country', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Public toggle */}
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">Pagina publica</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cualquiera puede ver el perfil de tu club y sus competiciones activas
                </p>
              </div>
              <button
                type="button"
                onClick={() => set('isPublic', !form.isPublic)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  form.isPublic ? 'bg-brand-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3">
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

        {/* Public URL */}
        {form.isPublic && (
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">URL publica</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{publicPageUrl}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={copyPublicUrl}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Copiar enlace"
              >
                {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
              <a
                href={publicPageUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-xs py-1.5 px-3"
              >
                <ExternalLink size={13} /> Ver
              </a>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default OrganizationSettings;

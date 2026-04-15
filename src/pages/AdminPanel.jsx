import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CreditCard, Search } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { getAdminOrganizationsOverview, patchOrgSports } from '../api/organizations';

const typeLabel = (type) => {
  if (type === 'club') return 'Club';
  if (type === 'organizer') return 'Organizadora';
  if (type === 'federation') return 'Federación';
  return type || '-';
};

const AdminPanel = () => {
  const [items, setItems] = useState([]);
  const [allSports, setAllSports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Track in-flight toggles per org+sport to avoid double clicks
  const [toggling, setToggling] = useState({});

  useEffect(() => {
    setLoading(true);
    getAdminOrganizationsOverview()
      .then((res) => {
        setItems(res.data?.organizations || []);
        setAllSports(res.data?.allSports || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar el panel'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((org) =>
      [org.name, org.slug, org.subscription]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [items, search]);

  const stats = useMemo(() => ({
    total: items.length,
    allEnabled: items.filter((org) => (org.disabledSports || []).length === 0).length,
    withSubscription: items.filter(
      (org) => org.subscription && org.subscription !== 'Sin suscripción'
    ).length,
  }), [items]);

  const handleToggleSport = async (org, sportId) => {
    const key = `${org.id}-${sportId}`;
    if (toggling[key]) return;

    const currentDisabled = org.disabledSports || [];
    const isDisabled = currentDisabled.includes(sportId);
    const newDisabled = isDisabled
      ? currentDisabled.filter((id) => id !== sportId)
      : [...currentDisabled, sportId];

    // Optimistic update
    setItems((prev) =>
      prev.map((o) => o.id === org.id ? { ...o, disabledSports: newDisabled } : o)
    );
    setToggling((prev) => ({ ...prev, [key]: true }));

    try {
      await patchOrgSports(org.id, newDisabled);
    } catch {
      // Revert on error
      setItems((prev) =>
        prev.map((o) => o.id === org.id ? { ...o, disabledSports: currentDisabled } : o)
      );
    } finally {
      setToggling((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  return (
    <AppLayout title="Panel de administración">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Organizaciones</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Todos los deportes activos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.allEnabled}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Con suscripción</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.withSubscription}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative w-full md:max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar organización..."
            className="w-full h-10 bg-white border border-gray-200 rounded-xl pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center">
          <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Cargando organizaciones...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center border-red-100 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-gray-800 mb-1">Sin resultados</p>
          <p className="text-sm text-gray-400">No hay organizaciones que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(0,1.1fr)_130px_160px_minmax(0,1fr)] px-4 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Organización</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tipo</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Suscripción</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Deportes</p>
          </div>

          {filtered.map((org) => {
            const disabledSet = new Set(org.disabledSports || []);
            return (
              <div
                key={org.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_130px_160px_minmax(0,1fr)] gap-2 md:gap-3 items-start px-4 py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                    <p className="font-semibold text-[15px] text-gray-900 truncate">{org.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate ml-6">/{org.slug}</p>
                </div>

                <div className="text-sm text-gray-700">{typeLabel(org.type)}</div>

                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                    <CreditCard size={12} />
                    {org.subscription}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {allSports.length === 0 ? (
                    <span className="text-xs text-gray-400">Sin deportes en la app</span>
                  ) : (
                    allSports.map((sport) => {
                      const sportId = String(sport._id);
                      const enabled = !disabledSet.has(sportId);
                      const key = `${org.id}-${sportId}`;
                      const busy = !!toggling[key];
                      return (
                        <button
                          key={sportId}
                          onClick={() => handleToggleSport(org, sportId)}
                          disabled={busy}
                          title={enabled ? 'Clic para deshabilitar' : 'Clic para habilitar'}
                          className={[
                            'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border transition-all duration-150',
                            busy ? 'opacity-50 cursor-wait' : 'cursor-pointer',
                            enabled
                              ? 'border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100'
                              : 'border-gray-200 bg-gray-50 text-gray-400 line-through hover:bg-gray-100',
                          ].join(' ')}
                        >
                          {sport.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default AdminPanel;

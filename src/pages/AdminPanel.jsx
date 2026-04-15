import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CreditCard, Search, Users, Shield, UserCheck } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { getAdminOrganizationsOverview, patchOrgSports } from '../api/organizations';
import { getAdminUsers } from '../api/users';

const typeLabel = (type) => {
  if (type === 'club') return 'Club';
  if (type === 'organizer') return 'Organizadora';
  if (type === 'federation') return 'Federación';
  return type || '-';
};

const roleLabel = (role) => {
  if (role === 'admin') return 'Admin';
  if (role === 'organizer') return 'Organizador';
  return 'Jugador';
};

const roleBadgeClass = (role) => {
  if (role === 'admin') return 'bg-red-50 text-red-700 border-red-200';
  if (role === 'organizer') return 'bg-brand-50 text-brand-800 border-brand-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

// ── Organisations tab ────────────────────────────────────────────────────────

const OrgsTab = () => {
  const [items, setItems] = useState([]);
  const [allSports, setAllSports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState({});

  useEffect(() => {
    setLoading(true);
    getAdminOrganizationsOverview()
      .then((res) => {
        setItems(res.data?.organizations || []);
        setAllSports(res.data?.allSports || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar'))
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
    allEnabled: items.filter((o) => (o.disabledSports || []).length === 0).length,
    withSubscription: items.filter(
      (o) => o.subscription && o.subscription !== 'Sin suscripción'
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
    setItems((prev) => prev.map((o) => o.id === org.id ? { ...o, disabledSports: newDisabled } : o));
    setToggling((prev) => ({ ...prev, [key]: true }));
    try {
      await patchOrgSports(org.id, newDisabled);
    } catch {
      setItems((prev) => prev.map((o) => o.id === org.id ? { ...o, disabledSports: currentDisabled } : o));
    } finally {
      setToggling((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <StatCard label="Organizaciones" value={stats.total} />
        <StatCard label="Todos los deportes activos" value={stats.allEnabled} />
        <StatCard label="Con suscripción" value={stats.withSubscription} />
      </div>

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar organización..." />
      </div>

      {loading ? <Spinner text="Cargando organizaciones..." /> : error ? <ErrorBox message={error} /> : filtered.length === 0 ? <Empty /> : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(0,1.1fr)_130px_160px_minmax(0,1fr)] px-4 py-2 bg-gray-50 border-b border-gray-200">
            {['Organización', 'Tipo', 'Suscripción', 'Deportes'].map((h) => (
              <p key={h} className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{h}</p>
            ))}
          </div>
          {filtered.map((org) => {
            const disabledSet = new Set(org.disabledSports || []);
            return (
              <div key={org.id} className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_130px_160px_minmax(0,1fr)] gap-2 md:gap-3 items-start px-4 py-3 border-b border-gray-100 last:border-b-0">
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
                    <CreditCard size={12} />{org.subscription}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allSports.length === 0 ? (
                    <span className="text-xs text-gray-400">Sin deportes en la app</span>
                  ) : allSports.map((sport) => {
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
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ── Users tab ────────────────────────────────────────────────────────────────

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getAdminUsers()
      .then((res) => setUsers(res.data?.users || []))
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [users, search]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    organizers: users.filter((u) => u.role === 'organizer').length,
    players: users.filter((u) => !u.role || u.role === 'player').length,
  }), [users]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Usuarios" value={stats.total} />
        <StatCard label="Admins" value={stats.admins} />
        <StatCard label="Organizadores" value={stats.organizers} />
        <StatCard label="Jugadores" value={stats.players} />
      </div>

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar usuario..." />
      </div>

      {loading ? <Spinner text="Cargando usuarios..." /> : error ? <ErrorBox message={error} /> : filtered.length === 0 ? <Empty /> : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_140px] px-4 py-2 bg-gray-50 border-b border-gray-200">
            {['Usuario', 'Email', 'Rol', 'Registro'].map((h) => (
              <p key={h} className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{h}</p>
            ))}
          </div>
          {filtered.map((u) => (
            <div key={u._id || u.id} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_140px] gap-2 md:gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {initials(u.name)}
                </div>
                <p className="font-medium text-sm text-gray-900 truncate">{u.name || '—'}</p>
              </div>
              <p className="text-sm text-gray-500 truncate">{u.email}</p>
              <div>
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border ${roleBadgeClass(u.role)}`}>
                  {roleLabel(u.role)}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// ── Shared micro-components ──────────────────────────────────────────────────

const StatCard = ({ label, value }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative w-full md:max-w-lg">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 bg-white border border-gray-200 rounded-xl pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
    />
  </div>
);

const Spinner = ({ text }) => (
  <div className="card p-10 text-center">
    <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
    <p className="text-sm text-gray-500">{text}</p>
  </div>
);

const ErrorBox = ({ message }) => (
  <div className="card p-6 text-center border-red-100 bg-red-50">
    <p className="text-sm text-red-600">{message}</p>
  </div>
);

const Empty = () => (
  <div className="card p-10 text-center">
    <p className="font-semibold text-gray-800 mb-1">Sin resultados</p>
    <p className="text-sm text-gray-400">No hay elementos que coincidan con tu búsqueda.</p>
  </div>
);

// ── Main panel ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'orgs', label: 'Organizaciones', icon: Building2 },
  { id: 'users', label: 'Usuarios', icon: Users },
];

const AdminPanel = () => {
  const [tab, setTab] = useState('orgs');

  return (
    <AppLayout title="Panel de administración">
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              tab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'orgs' ? <OrgsTab /> : <UsersTab />}
    </AppLayout>
  );
};

export default AdminPanel;

import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { getAdminUsers } from '../api/users';

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

const AdminUsers = () => {
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
    <AppLayout title="Usuarios">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total usuarios', value: stats.total },
          { label: 'Admins', value: stats.admins },
          { label: 'Organizadores', value: stats.organizers },
          { label: 'Jugadores', value: stats.players },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="relative w-full md:max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o rol..."
            className="w-full h-10 bg-white border border-gray-200 rounded-xl pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center">
          <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Cargando usuarios...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center border-red-100 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-gray-800 mb-1">Sin resultados</p>
          <p className="text-sm text-gray-400">No hay usuarios que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_140px] px-4 py-2 bg-gray-50 border-b border-gray-200">
            {['Usuario', 'Email', 'Rol', 'Registro'].map((h) => (
              <p key={h} className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{h}</p>
            ))}
          </div>
          {filtered.map((u) => (
            <div
              key={u._id || u.id}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_140px] gap-2 md:gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-b-0"
            >
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
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default AdminUsers;

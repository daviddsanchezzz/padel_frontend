import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCompetitions, deleteCompetition } from '../api/competitions';
import AppLayout from '../layouts/AppLayout';
import Icon, { sportEmoji } from '../components/Icon';

const typeConfig = {
  league:     { label: 'Liga',   icon: 'league',     cls: 'bg-brand-100 text-brand-700' },
  tournament: { label: 'Torneo', icon: 'tournament', cls: 'bg-amber-100 text-amber-700' },
};
const statusConfig = {
  draft:    { label: 'Borrador',   cls: 'bg-gray-100 text-gray-500' },
  active:   { label: 'Activa',     cls: 'bg-brand-100 text-brand-700' },
  finished: { label: 'Finalizada', cls: 'bg-blue-100 text-blue-700' },
};

const StatCard = ({ value, label, iconName, colorClass = 'text-brand-600' }) => (
  <div className="card p-3 md:p-5 text-center md:text-left md:flex md:items-center md:gap-4">
    <div className={`hidden md:flex w-10 h-10 rounded-xl items-center justify-center bg-gray-50 flex-shrink-0 ${colorClass}`}>
      <Icon name={iconName} size={18} />
    </div>
    <div>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get('type'); // 'league' | 'tournament' | null

  useEffect(() => {
    getCompetitions().then((res) => setCompetitions(res.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta competición y todos sus datos?')) return;
    await deleteCompetition(id);
    setCompetitions(competitions.filter((c) => c._id !== id));
  };

  const leagues     = competitions.filter((c) => c.type === 'league').length;
  const tournaments = competitions.filter((c) => c.type === 'tournament').length;
  const active      = competitions.filter((c) => c.status === 'active').length;

  const filtered = typeFilter
    ? competitions.filter((c) => c.type === typeFilter)
    : competitions;

  // Group by sport name (or 'Sin deporte' if none)
  const bySport = filtered.reduce((acc, comp) => {
    const key = comp.sport?.name || 'Sin deporte';
    if (!acc[key]) acc[key] = [];
    acc[key].push(comp);
    return acc;
  }, {});
  const sportGroups = Object.entries(bySport).sort(([a], [b]) => a.localeCompare(b));

  const actions = (
    <button onClick={() => navigate('/competitions/new')} className="btn-primary">
      <Icon name="plus" size={15} />
      <span className="hidden sm:inline">Nueva competición</span>
    </button>
  );

  return (
    <AppLayout title="Dashboard" actions={actions}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard value={competitions.length} label="Total"       iconName="trophy"      colorClass="text-gray-600" />
        <StatCard value={active}              label="Activas"     iconName="check"       colorClass="text-brand-600" />
        <StatCard value={leagues}             label="Ligas"       iconName="league"      colorClass="text-brand-600" />
        <StatCard value={tournaments}         label="Torneos"     iconName="tournament"  colorClass="text-amber-600" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          {typeFilter === 'league' ? 'Ligas' : typeFilter === 'tournament' ? 'Torneos' : 'Competiciones'}
        </h2>
        <span className="text-xs text-gray-400 font-medium">{filtered.length} total</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Icon name="spinner" size={20} className="animate-spin text-brand-500" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Icon name="trophy" size={24} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Sin competiciones</h3>
          <p className="text-gray-400 text-sm mb-5">Crea una liga o un torneo para empezar.</p>
          <button onClick={() => navigate('/competitions/new')} className="btn-primary mx-auto">
            <Icon name="plus" size={14} /> Crear competición
          </button>
        </div>
      )}

      {!loading && sportGroups.map(([sport, comps]) => (
        <div key={sport} className="mb-6">
          {sportGroups.length > 1 && (
            <div className="flex items-center gap-2 mb-3">
              <Icon name="sport" size={13} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{sport}</span>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300">{comps.length}</span>
            </div>
          )}
          <div className="space-y-2">
            {comps.map((comp) => {
              const type   = typeConfig[comp.type]   || typeConfig.league;
              const status = statusConfig[comp.status] || statusConfig.draft;
              return (
                <div
                  key={comp._id}
                  onClick={() => navigate(`/competitions/${comp._id}`)}
                  className="card px-4 py-3.5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-800 rounded-xl flex items-center justify-center text-white flex-shrink-0 text-lg">
                      {sportEmoji(comp.sport?.slug)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 group-hover:text-brand-700 transition-colors truncate">{comp.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{comp.sport?.name || '—'} · {type.label}{comp.season ? ` · T.${comp.season}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                    <button
                      onClick={(e) => handleDelete(e, comp._id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                    <Icon name="chevronRight" size={14} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </AppLayout>
  );
};

export default Dashboard;

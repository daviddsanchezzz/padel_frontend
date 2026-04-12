import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCompetitions, deleteCompetition } from '../api/competitions';
import AppLayout from '../layouts/AppLayout';
import Icon, { SportIcon } from '../components/Icon';
import CompetitionModal from '../components/CompetitionModal';

const typeConfig = {
  league:     { label: 'Liga',   icon: 'league',     cls: 'bg-brand-100 text-brand-700' },
  tournament: { label: 'Torneo', icon: 'tournament', cls: 'bg-amber-100 text-amber-700' },
};
const statusConfig = {
  draft:    { label: 'Borrador',   cls: 'bg-gray-100 text-gray-500' },
  active:   { label: 'Activa',     cls: 'bg-brand-100 text-brand-700' },
  finished: { label: 'Finalizada', cls: 'bg-blue-100 text-blue-700' },
};


const Dashboard = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  const active = competitions.filter((c) => c.status === 'active').length;

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
    <button onClick={() => setShowModal(true)} className="btn-primary">
      <Icon name="plus" size={15} />
      <span className="hidden sm:inline">Nueva competicion</span>
    </button>
  );

  return (
    <AppLayout title="Dashboard" actions={actions}>
      {showModal && (
        <CompetitionModal
          onClose={() => setShowModal(false)}
          onCreated={(comp) => {
            setShowModal(false);
            navigate(`/competitions/${comp._id}`);
          }}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">
          {typeFilter === 'league' ? 'Ligas' : typeFilter === 'tournament' ? 'Torneos' : 'Competiciones'}
        </h2>
        <span className="text-xs text-gray-400">{filtered.length} · {active} activa{active !== 1 ? 's' : ''}</span>
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
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {comps.map((comp) => {
              const type   = typeConfig[comp.type]   || typeConfig.league;
              const status = statusConfig[comp.status] || statusConfig.draft;
              return (
                <div
                  key={comp._id}
                  onClick={() => navigate(`/competitions/${comp._id}`)}
                  className="px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SportIcon slug={comp.sport?.slug} size={20} color="#158055" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors truncate">{comp.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{comp.sport?.name || '—'} · {type.label}{comp.season ? ` · T.${comp.season}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                    <button
                      onClick={(e) => handleDelete(e, comp._id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                    <Icon name="chevronRight" size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
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

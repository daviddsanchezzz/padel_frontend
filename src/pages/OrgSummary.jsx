import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Medal, Trophy, Users, Calendar, ChevronRight, Plus } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { getOrgSummary } from '../api/competitions';
import { SportIcon } from '../components/Icon';
import CompetitionModal from '../components/CompetitionModal';

const statusConfig = {
  draft:    { label: 'Borrador',   cls: 'bg-gray-100 text-gray-500' },
  active:   { label: 'Activa',     cls: 'bg-brand-100 text-brand-700' },
  finished: { label: 'Finalizada', cls: 'bg-blue-100 text-blue-700' },
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'brand' }) => {
  const colorMap = {
    brand:  { bg: 'bg-brand-50',  icon: 'text-brand-600',  value: 'text-brand-700'  },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500',  value: 'text-amber-700'  },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   value: 'text-blue-700'   },
    gray:   { bg: 'bg-gray-100',  icon: 'text-gray-500',   value: 'text-gray-700'   },
  };
  const c = colorMap[color] || colorMap.brand;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
        <Icon size={16} className={c.icon} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.value}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const OrgSummary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrg } = useOrg();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getOrgSummary()
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Organizador';

  const actions = (
    <button onClick={() => setShowModal(true)} className="btn-primary">
      <Plus size={15} />
      <span className="hidden sm:inline">Nueva competición</span>
    </button>
  );

  return (
    <AppLayout title="Resumen" actions={actions}>
      {showModal && (
        <CompetitionModal
          onClose={() => setShowModal(false)}
          onCreated={(comp) => {
            setShowModal(false);
            navigate(`/competitions/${comp._id}`);
          }}
        />
      )}

      {/* Greeting */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Hola, {firstName}</h2>
        {activeOrg && (
          <p className="text-sm text-gray-400 mt-0.5">{activeOrg.name}</p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={Medal}
              label="Ligas activas"
              value={summary.activeLeagues}
              sub={summary.draftCount > 0 ? `${summary.draftCount} en borrador` : null}
              color="brand"
            />
            <StatCard
              icon={Trophy}
              label="Torneos activos"
              value={summary.activeTournaments}
              color="amber"
            />
            <StatCard
              icon={Users}
              label="Equipos inscritos"
              value={summary.totalTeams}
              color="blue"
            />
            <StatCard
              icon={Calendar}
              label="Partidos pendientes"
              value={summary.pendingMatches}
              color="gray"
            />
          </div>

          {/* Recent competitions */}
          {summary.recentCompetitions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Competiciones recientes</p>
                <button
                  onClick={() => navigate('/dashboard?type=league')}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Ver todas
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                {summary.recentCompetitions.map((comp) => {
                  const status = statusConfig[comp.status] || statusConfig.draft;
                  return (
                    <div
                      key={comp._id}
                      onClick={() => navigate(`/competitions/${comp._id}`)}
                      className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <SportIcon slug={comp.sport?.slug} size={16} color="#158055" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate group-hover:text-gray-900">{comp.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {comp.sport?.name || '—'} · {comp.type === 'league' ? 'Liga' : 'Torneo'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge ${status.cls}`}>{status.label}</span>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {summary.recentCompetitions.length === 0 && (
            <div className="card p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Trophy size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Sin competiciones</h3>
              <p className="text-gray-400 text-sm mb-5">Crea tu primera liga o torneo para empezar.</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
                <Plus size={14} /> Crear competición
              </button>
            </div>
          )}
        </>
      ) : null}
    </AppLayout>
  );
};

export default OrgSummary;

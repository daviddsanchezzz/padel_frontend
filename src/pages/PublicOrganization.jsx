import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Building2, Medal, Trophy, Loader2 } from 'lucide-react';
import { getPublicOrganization } from '../api/organizations';
import { sportEmoji } from '../components/Icon';

const typeConfig = {
  league:     { label: 'Liga',   cls: 'bg-brand-100 text-brand-700' },
  tournament: { label: 'Torneo', cls: 'bg-amber-100 text-amber-700' },
};

const TYPE_TABS = [
  { key: null,         label: 'Todas' },
  { key: 'league',    label: 'Ligas' },
  { key: 'tournament', label: 'Torneos' },
];

const StatCard = ({ value, label, color = 'text-brand-600' }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
  </div>
);

const PublicOrganization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    getPublicOrganization(id)
      .then((res) => setOrg(res.data))
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar la pagina'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={22} className="text-gray-400" />
          </div>
          <p className="font-bold text-gray-900 mb-1">Pagina no disponible</p>
          <p className="text-sm text-gray-500">{error || 'No se encontro la organizacion'}</p>
        </div>
      </div>
    );
  }

  const comps = org.activeCompetitions || [];
  const leagues     = comps.filter((c) => c.type === 'league').length;
  const tournaments = comps.filter((c) => c.type === 'tournament').length;

  const filtered = typeFilter ? comps.filter((c) => c.type === typeFilter) : comps;

  // Group by sport
  const bySport = filtered.reduce((acc, comp) => {
    const key = comp.sport?.name || 'Sin deporte';
    if (!acc[key]) acc[key] = [];
    acc[key].push(comp);
    return acc;
  }, {});
  const sportGroups = Object.entries(bySport).sort(([a], [b]) => a.localeCompare(b));

  const location = [org.location?.city, org.location?.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <header className="bg-[#0b1d12]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy size={15} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-none">{org.name}</p>
            {location && (
              <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1">
                <MapPin size={10} /> {location}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Description */}
        {org.description && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-600 leading-relaxed">{org.description}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={comps.length}  label="Competiciones" color="text-gray-700" />
          <StatCard value={leagues}        label="Ligas"          color="text-brand-600" />
          <StatCard value={tournaments}    label="Torneos"        color="text-amber-600" />
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {TYPE_TABS.map((tab) => (
            <button
              key={String(tab.key)}
              onClick={() => setTypeFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                typeFilter === tab.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.key === 'league' && <Medal size={13} />}
              {tab.key === 'tournament' && <Trophy size={13} />}
              {tab.label}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-gray-400 pr-1">{filtered.length} total</span>
        </div>

        {/* Competition list */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Trophy size={24} />
            </div>
            <p className="font-semibold text-gray-800">Sin competiciones activas</p>
            <p className="text-sm text-gray-400 mt-1">No hay competiciones publicas en este momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sportGroups.map(([sport, group]) => (
              <div key={sport}>
                {sportGroups.length > 1 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{sportEmoji(group[0]?.sport?.slug)}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{sport}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-300">{group.length}</span>
                  </div>
                )}
                <div className="space-y-2">
                  {group.map((comp) => {
                    const type = typeConfig[comp.type] || typeConfig.league;
                    return (
                      <div
                        key={comp._id}
                        onClick={() => navigate(`/organizations/${id}/competitions/${comp._id}/public`)}
                        className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-800 rounded-xl flex items-center justify-center text-white flex-shrink-0 text-lg">
                            {sportEmoji(comp.sport?.slug)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 group-hover:text-brand-700 transition-colors truncate">
                              {comp.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {comp.sport?.name || '—'} · {type.label}
                              {comp.seasons?.find(s => s.isActive)?.name ? ` · ${comp.seasons.find(s => s.isActive).name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${type.cls}`}>
                            {type.label}
                          </span>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicOrganization;

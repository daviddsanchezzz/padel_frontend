import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Building2, Medal, Trophy, Loader2 } from 'lucide-react';
import { getPublicOrganization } from '../api/organizations';
import { sportEmoji } from '../components/Icon';

const typeConfig = {
  league:     { label: 'Liga',   cls: 'bg-white/20 text-white' },
  tournament: { label: 'Torneo', cls: 'bg-white/20 text-white' },
};

const TYPE_TABS = [
  { key: null,          label: 'Todas' },
  { key: 'league',     label: 'Ligas' },
  { key: 'tournament', label: 'Torneos' },
];

// Returns white or dark text color depending on background luminance
const getContrastColor = (hex) => {
  if (!hex) return '#ffffff';
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!rgb) return '#ffffff';
  const luminance = (0.299 * parseInt(rgb[1], 16) + 0.587 * parseInt(rgb[2], 16) + 0.114 * parseInt(rgb[3], 16)) / 255;
  return luminance > 0.55 ? '#1a1a1a' : '#ffffff';
};

const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
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

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={22} className="text-gray-400" />
          </div>
          <p className="font-bold text-gray-900 mb-1">Pagina no disponible</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const color = org?.primaryColor || '#0b1d12';
  const textColor = getContrastColor(color);
  const isDark = textColor === '#ffffff';

  const comps = org?.activeCompetitions || [];
  const leagues     = comps.filter((c) => c.type === 'league').length;
  const tournaments = comps.filter((c) => c.type === 'tournament').length;
  const filtered = typeFilter ? comps.filter((c) => c.type === typeFilter) : comps;

  const bySport = filtered.reduce((acc, comp) => {
    const key = comp.sport?.name || 'Sin deporte';
    if (!acc[key]) acc[key] = [];
    acc[key].push(comp);
    return acc;
  }, {});
  const sportGroups = Object.entries(bySport).sort(([a], [b]) => a.localeCompare(b));

  const location = org ? [org.location?.city, org.location?.country].filter(Boolean).join(', ') : '';

  const navigateToComp = (compId) => {
    navigate(`/organizations/${id}/competitions/${compId}/public`, {
      state: { org: { name: org.name, logo: org.logo, primaryColor: org.primaryColor } },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ backgroundColor: color }}>
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-8">
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
              >
                {org.logo
                  ? <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                  : <Building2 size={26} style={{ color: textColor }} />
                }
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: textColor }}>{org.name}</h1>
                {location && (
                  <p className="flex items-center gap-1 mt-1 text-sm" style={{ color: textColor, opacity: 0.65 }}>
                    <MapPin size={12} /> {location}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Description */}
        {org?.description && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-600 leading-relaxed">{org.description}</p>
          </div>
        )}

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: comps.length,  label: 'Competiciones', color: '#64748b' },
              { value: leagues,        label: 'Ligas',          color: color },
              { value: tournaments,    label: 'Torneos',        color: color },
            ].map(({ value, label, color: c }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-2xl font-bold" style={{ color: c }}>{value}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Type tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {TYPE_TABS.map((tab) => (
            <button
              key={String(tab.key)}
              onClick={() => setTypeFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                typeFilter === tab.key ? 'text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              style={typeFilter === tab.key ? { borderBottomColor: color, color: 'inherit' } : {}}
            >
              {tab.key === 'league' && <Medal size={13} />}
              {tab.key === 'tournament' && <Trophy size={13} />}
              {tab.label}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-gray-400 pr-1">{filtered.length} total</span>
        </div>

        {/* Competition list */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
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
                  {group.map((comp) => (
                    <div
                      key={comp._id}
                      onClick={() => navigateToComp(comp._id)}
                      className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 text-lg"
                          style={{ backgroundColor: color }}
                        >
                          {sportEmoji(comp.sport?.slug)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate group-hover:text-gray-900 transition-colors">
                            {comp.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {comp.sport?.name || '—'} · {comp.type === 'league' ? 'Liga' : 'Torneo'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span
                          className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {comp.type === 'league' ? 'Liga' : 'Torneo'}
                        </span>
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
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

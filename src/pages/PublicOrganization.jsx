import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Building2, ChevronRight } from 'lucide-react';
import { getPublicOrganization } from '../api/organizations';
import { SportIcon } from '../components/Icon';

const TYPE_TABS = [
  { key: null,          label: 'Todas' },
  { key: 'league',     label: 'Ligas' },
  { key: 'tournament', label: 'Torneos' },
];

const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

const PublicOrganization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateOrg = location.state?.org || null;
  const [org, setOrg] = useState(stateOrg);
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

  const color = org?.primaryColor || stateOrg?.primaryColor || '#0b1d12';
  const comps = org?.activeCompetitions || [];
  const filtered = typeFilter ? comps.filter((c) => c.type === typeFilter) : comps;
  const locationStr = org ? [org.location?.city, org.location?.country].filter(Boolean).join(', ') : '';

  const bySport = filtered.reduce((acc, comp) => {
    const key = comp.sport?.name || 'Sin deporte';
    if (!acc[key]) acc[key] = [];
    acc[key].push(comp);
    return acc;
  }, {});
  const sportGroups = Object.entries(bySport).sort(([a], [b]) => a.localeCompare(b));

  const navigateToComp = (compId) => {
    navigate(`/organizations/${id}/competitions/${compId}/public`, {
      state: { org: { name: org.name, logo: org.logo, primaryColor: org.primaryColor } },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 4px accent strip */}
      <div className="h-1" style={{ backgroundColor: color }} />

      {/* Org header — white, clean */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-4">
          {loading ? (
            <>
              <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </>
          ) : (
            <>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: `${color}18` }}
              >
                {org.logo
                  ? <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                  : <Building2 size={24} style={{ color }} />
                }
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">{org.name}</h1>
                {locationStr && (
                  <p className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                    <MapPin size={11} /> {locationStr}
                  </p>
                )}
                {org.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{org.description}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Type filter tabs */}
        <div className="flex items-center gap-0 border-b border-gray-200">
          {TYPE_TABS.map((tab) => (
            <button
              key={String(tab.key)}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                typeFilter === tab.key
                  ? 'text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              style={typeFilter === tab.key ? { borderBottomColor: color } : {}}
            >
              {tab.label}
            </button>
          ))}
          {!loading && (
            <span className="ml-auto text-xs text-gray-400 pr-1 self-center pb-1">{filtered.length}</span>
          )}
        </div>

        {/* Competition list */}
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 shadow-sm overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
            <p className="font-semibold text-gray-800">Sin competiciones activas</p>
            <p className="text-sm text-gray-400 mt-1">No hay competiciones publicas en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sportGroups.map(([sport, group]) => (
              <div key={sport}>
                {sportGroups.length > 1 && (
                  <div className="flex items-center gap-2 mb-2">
                    <SportIcon slug={group[0]?.sport?.slug} size={14} color={color} />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{sport}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                )}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                  {group.map((comp) => (
                    <button
                      key={comp._id}
                      onClick={() => navigateToComp(comp._id)}
                      className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors group"
                    >
                      {/* Sport icon badge */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <SportIcon slug={comp.sport?.slug} size={20} color={color} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {comp.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {comp.type === 'league' ? 'Liga' : 'Torneo'}
                          {comp.sport?.name ? ` · ${comp.sport.name}` : ''}
                        </p>
                      </div>

                      <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                    </button>
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

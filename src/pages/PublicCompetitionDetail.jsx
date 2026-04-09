import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getPublicCompetition } from '../api/organizations';
import PublicLayout from '../layouts/PublicLayout';
import Icon, { SportIcon } from '../components/Icon';

const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

const PublicCompetitionDetail = () => {
  const { orgId, compId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateOrg = location.state?.org;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getPublicCompetition(orgId, compId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar la competicion'))
      .finally(() => setLoading(false));
  }, [orgId, compId]);

  const org = data?.org || stateOrg || { name: '' };
  const competition = data?.competition;
  const divisions = data?.divisions || [];

  const isLeague = competition?.type === 'league';
  const settings = competition?.settings || {};
  const color = org.primaryColor || '#0b1d12';

  const navigateToDiv = (divId) => {
    navigate(`/organizations/${orgId}/divisions/${divId}/public`, {
      state: { org },
    });
  };

  if (error && !loading && !data) {
    return (
      <PublicLayout orgId={orgId} orgName={org.name} orgLogo={org.logo} orgColor={color}>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="font-bold text-gray-900 mb-1">No disponible</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      orgId={orgId}
      orgName={org.name}
      orgLogo={org.logo}
      orgColor={color}
      title={competition?.name}
    >
      {/* Back */}
      <button
        onClick={() => navigate(`/organizations/${orgId}/public`)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors mb-5"
      >
        <Icon name="chevronLeft" size={13} /> {org.name || '...'}
      </button>

      {/* Competition header */}
      {loading ? (
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-36" />
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <SportIcon slug={competition.sport?.slug} size={22} color={color} />
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">{competition.name}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {isLeague ? 'Liga' : 'Torneo'}
            </span>
            {competition.sport && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
                {competition.sport.name}
              </span>
            )}
            {isLeague && settings.promotionSpots > 0 && (
              <span className="text-[10px] font-semibold text-green-600">↑ {settings.promotionSpots} ascienden</span>
            )}
            {isLeague && settings.relegationSpots > 0 && (
              <span className="text-[10px] font-semibold text-red-500">↓ {settings.relegationSpots} descienden</span>
            )}
          </div>
          {competition.description && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{competition.description}</p>
          )}
        </div>
      )}

      {/* Section label */}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        {loading ? '\u00a0' : isLeague ? `${divisions.length} divisiones` : `${divisions.length} categorias`}
      </p>

      {/* Division list */}
      {loading ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {[1,2,3].map(i => (
            <div key={i} className="px-4 py-3.5 flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-lg flex-shrink-0" />
              <Skeleton className="h-4 w-36 flex-1" />
            </div>
          ))}
        </div>
      ) : divisions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="font-semibold text-gray-800">Sin {isLeague ? 'divisiones' : 'categorias'}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {divisions.map((div, i) => (
            <button
              key={div._id}
              onClick={() => navigateToDiv(div._id)}
              className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors group"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {i + 1}
              </div>
              <span className="flex-1 font-semibold text-gray-800 text-sm group-hover:text-gray-900 transition-colors">
                {div.name}
              </span>
              <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </PublicLayout>
  );
};

export default PublicCompetitionDetail;

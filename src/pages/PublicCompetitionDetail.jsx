import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPublicCompetition } from '../api/organizations';
import PublicLayout from '../layouts/PublicLayout';
import Icon, { sportEmoji } from '../components/Icon';

const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

const PublicCompetitionDetail = () => {
  const { orgId, compId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Use state passed from previous page to avoid flash
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
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
      >
        <Icon name="chevronLeft" size={14} /> {org.name}
      </button>

      {/* Competition info card */}
      {loading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 mb-5 shadow-sm">
          <div className="flex items-start gap-3 md:gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 text-xl"
              style={{ backgroundColor: color }}
            >
              {sportEmoji(competition.sport?.slug)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-gray-900 text-lg leading-none">{competition.name}</h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold text-white" style={{ backgroundColor: color }}>
                  Activa
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">
                  {isLeague ? 'Liga' : 'Torneo'}
                </span>
                {competition.sport && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">
                    {competition.sport.name}
                  </span>
                )}
              </div>
              {competition.description && (
                <p className="text-sm text-gray-500 mt-1">{competition.description}</p>
              )}
              {isLeague && (settings.promotionSpots > 0 || settings.relegationSpots > 0) && (
                <div className="flex items-center gap-3 mt-2">
                  {settings.promotionSpots > 0 && (
                    <span className="text-[11px] font-semibold" style={{ color }}>↑ {settings.promotionSpots} ascienden</span>
                  )}
                  {settings.relegationSpots > 0 && (
                    <span className="text-[11px] text-red-500 font-semibold">↓ {settings.relegationSpots} descienden</span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0 text-xs text-gray-400">
              <p className="font-semibold text-gray-700 text-base">{divisions.length}</p>
              <p>{isLeague ? 'divisiones' : 'categorias'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Divisions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Icon name="division" size={14} className="text-gray-400" />
          {isLeague ? 'Divisiones' : 'Categorias'}
        </h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-2xl" />)}
        </div>
      ) : divisions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="font-semibold text-gray-800">Sin {isLeague ? 'divisiones' : 'categorias'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {divisions.map((div, i) => (
            <div
              key={div._id}
              onClick={() => navigateToDiv(div._id)}
              className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {i + 1}
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  {div.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color }}>
                Ver <Icon name="chevronRight" size={13} />
              </div>
            </div>
          ))}
        </div>
      )}
    </PublicLayout>
  );
};

export default PublicCompetitionDetail;

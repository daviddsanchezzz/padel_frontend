import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getPublicCompetition } from '../api/organizations';
import PublicLayout from '../layouts/PublicLayout';
import Icon, { sportEmoji } from '../components/Icon';

const statusConfig = {
  active:   { label: 'Activa',     cls: 'bg-brand-100 text-brand-700' },
  finished: { label: 'Finalizada', cls: 'bg-blue-100 text-blue-700' },
};

const PublicCompetitionDetail = () => {
  const { orgId, compId } = useParams();
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="font-bold text-gray-900 mb-1">No disponible</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { org, competition, divisions } = data;
  const isLeague = competition.type === 'league';
  const entityName = isLeague ? 'División' : 'Categoría';
  const st = statusConfig[competition.status] || statusConfig.active;
  const settings = competition.settings || {};

  return (
    <PublicLayout orgId={orgId} orgName={org.name} title={competition.name}>
      {/* Back */}
      <button
        onClick={() => navigate(`/organizations/${orgId}/public`)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
      >
        <Icon name="chevronLeft" size={14} /> {org.name}
      </button>

      {/* Competition info card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 mb-5 shadow-sm">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-brand-800 rounded-xl flex items-center justify-center text-white flex-shrink-0 text-xl">
            {sportEmoji(competition.sport?.slug)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-gray-900 text-lg leading-none">{competition.name}</h1>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
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
                  <span className="text-[11px] text-brand-600 font-semibold">↑ {settings.promotionSpots} ascienden</span>
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

      {/* Divisions list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Icon name="division" size={14} className="text-gray-400" />
          {isLeague ? 'Divisiones' : 'Categorias'}
        </h2>
      </div>

      {divisions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
            <Icon name={isLeague ? 'division' : 'bracket'} size={22} />
          </div>
          <p className="font-semibold text-gray-800">Sin {isLeague ? 'divisiones' : 'categorias'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {divisions.map((div, i) => (
            <div
              key={div._id}
              onClick={() => navigate(`/organizations/${orgId}/divisions/${div._id}/public`)}
              className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-brand-700 transition-colors">
                  {div.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-brand-600 font-semibold">
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

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicOrganization } from '../api/organizations';
import Icon, { sportEmoji } from '../components/Icon';

const PublicOrganization = () => {
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getPublicOrganization(id)
      .then((res) => setOrg(res.data))
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar la pagina publica'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Icon name="spinner" size={22} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-lg font-bold text-gray-900 mb-2">Pagina no disponible</p>
          <p className="text-sm text-gray-500">{error || 'No se encontro la organizacion'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <p className="text-xs uppercase tracking-[0.12em] text-gray-400 font-semibold">Club</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{org.name}</h1>
          {org.description && <p className="text-sm text-gray-600 mt-3">{org.description}</p>}
          {(org.location?.city || org.location?.country) && (
            <p className="text-sm text-gray-500 mt-3">{[org.location?.city, org.location?.country].filter(Boolean).join(', ')}</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="font-bold text-gray-900">Competiciones activas</p>
            <span className="text-xs text-gray-500">{org.activeCompetitions?.length || 0}</span>
          </div>

          {!org.activeCompetitions || org.activeCompetitions.length === 0 ? (
            <p className="text-sm text-gray-500">No hay competiciones publicas en este momento.</p>
          ) : (
            <div className="space-y-2">
              {org.activeCompetitions.map((comp) => (
                <div key={comp._id} className="border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{comp.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sportEmoji(comp.sport?.slug)} {comp.sport?.name || 'Deporte'} - {comp.type === 'league' ? 'Liga' : 'Torneo'}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    comp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {comp.status === 'active' ? 'Activa' : 'Borrador'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicOrganization;

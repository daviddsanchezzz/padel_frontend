import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { getPublicCompetition, registerForCompetition } from '../api/organizations';
import PublicLayout from '../layouts/PublicLayout';

const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

const PublicRegistration = () => {
  const { orgId, compId } = useParams();
  const navigate = useNavigate();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');

  const [divisionId, setDivisionId] = useState('');
  const [players, setPlayers]       = useState([]);
  const [email, setEmail]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    getPublicCompetition(orgId, compId)
      .then((res) => {
        setData(res.data);
        // Auto-select if only one division
        if (res.data.divisions?.length === 1) {
          setDivisionId(res.data.divisions[0]._id);
        }
      })
      .catch(() => setLoadError('No se pudo cargar la competición'))
      .finally(() => setLoading(false));
  }, [orgId, compId]);

  const org         = data?.org || {};
  const competition = data?.competition;
  const divisions   = data?.divisions || [];
  const color       = org.primaryColor || '#0b1d12';

  const selectedDiv = divisions.find((d) => d._id === divisionId);
  const teamSize    = selectedDiv?.teamSize || competition?.sport?.teamSize || 2;

  // Reset player fields when division / teamSize changes
  useEffect(() => {
    setPlayers(Array(teamSize).fill(''));
  }, [divisionId, teamSize]);

  const setPlayer = (idx, value) => {
    setPlayers((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!divisionId) { setSubmitError('Selecciona una categoría'); return; }
    if (players.some((p) => !p.trim())) { setSubmitError('Rellena el nombre de todos los jugadores'); return; }

    setSubmitting(true);
    try {
      await registerForCompetition(orgId, compId, {
        divisionId,
        players: players.map((name) => ({ name: name.trim() })),
        contactEmail: email.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Error al inscribirse. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <PublicLayout orgId={orgId} orgName={org.name} orgLogo={org.logo} orgColor={color}>
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="font-bold text-gray-900 mb-1">No disponible</p>
          <p className="text-sm text-gray-500">{loadError}</p>
        </div>
      </PublicLayout>
    );
  }

  if (success) {
    return (
      <PublicLayout orgId={orgId} orgName={org.name} orgLogo={org.logo} orgColor={color}>
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-brand-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">¡Inscripción completada!</h2>
            <p className="text-sm text-gray-500 mb-2">
              <span className="font-semibold text-gray-700">{players.join(' / ')}</span>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Estás inscrito en <span className="font-semibold text-gray-700">{selectedDiv?.name}</span>.
              El organizador se pondrá en contacto cuando haya novedades.
            </p>
            <button
              onClick={() => navigate(`/organizations/${orgId}/competitions/${compId}/public`)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Ver la competición →
            </button>
          </div>
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
      title={loading ? undefined : `Inscripción · ${competition?.name}`}
    >
      <div className="max-w-md mx-auto">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : (
          <>
            <h1 className="text-base font-bold text-gray-900 mb-1">{competition?.name}</h1>
            <p className="text-sm text-gray-400 mb-1">
              {competition?.type === 'tournament' ? 'Inscripción al torneo' : 'Inscripción a la competición'}
              {competition?.season ? ` · T. ${competition.season}` : ''}
            </p>
            {competition?.description && (
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">{competition.description}</p>
            )}
            {!competition?.description && <div className="mb-6" />}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Categoría */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Categoría
                </label>
                {divisions.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay categorías disponibles.</p>
                ) : divisions.length === 1 ? (
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800">
                    {divisions[0].name}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={divisionId}
                      onChange={(e) => setDivisionId(e.target.value)}
                      required
                      className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 pr-10"
                    >
                      <option value="">Selecciona una categoría…</option>
                      {divisions.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Jugadores */}
              {divisionId && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    {teamSize === 1 ? 'Jugador' : teamSize === 2 ? 'Pareja' : 'Jugadores'}
                  </label>
                  <div className="space-y-2">
                    {Array.from({ length: teamSize }, (_, idx) => (
                      <input
                        key={idx}
                        type="text"
                        required
                        placeholder={
                          teamSize === 1
                            ? 'Nombre completo'
                            : `Jugador ${idx + 1}`
                        }
                        value={players[idx] || ''}
                        onChange={(e) => setPlayer(idx, e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Email */}
              {divisionId && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Email de contacto <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {/* Error */}
              {submitError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  {submitError}
                </div>
              )}

              {/* Submit */}
              {divisionId && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: color }}
                >
                  {submitting ? 'Inscribiendo…' : 'Inscribirse'}
                </button>
              )}
            </form>
          </>
        )}
      </div>
    </PublicLayout>
  );
};

export default PublicRegistration;

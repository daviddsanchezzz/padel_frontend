import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ChevronDown, MapPin, Calendar } from 'lucide-react';
import { getPublicCompetition, getPublicCompetitionBySlugs, registerForCompetition } from '../api/organizations';
import PublicLayout from '../layouts/PublicLayout';

const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

const PublicRegistration = () => {
  const { orgId, compId, orgSlug, competitionSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isLegacyRoute = Boolean(orgId && compId);
  const routeOrgRef = orgId || orgSlug;
  const routeCompRef = compId || competitionSlug;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [divisionId, setDivisionId] = useState('');
  const [players, setPlayers] = useState([]);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!routeOrgRef || !routeCompRef) return;
    const request = isLegacyRoute
      ? getPublicCompetition(routeOrgRef, routeCompRef)
      : getPublicCompetitionBySlugs(routeOrgRef, routeCompRef);

    request
      .then((res) => {
        setData(res.data);
        if (isLegacyRoute && res.data?.org?.slug && res.data?.competition?.publicSlug) {
          const canonicalPath = `/${res.data.org.slug}/${res.data.competition.publicSlug}/inscripcion`;
          if (location.pathname !== canonicalPath) {
            navigate(canonicalPath, { replace: true, state: { org: res.data.org } });
          }
        }
        if (res.data.divisions?.length === 1) {
          setDivisionId(res.data.divisions[0]._id);
        }
      })
      .catch(() => setLoadError('No se pudo cargar la competicion'))
      .finally(() => setLoading(false));
  }, [routeOrgRef, routeCompRef, isLegacyRoute, navigate, location.pathname]);

  const org = data?.org || {};
  const orgRef = org.slug || routeOrgRef;
  const competition = data?.competition;
  const compRef = competition?.publicSlug || routeCompRef;
  const divisions = data?.divisions || [];
  const color = org.primaryColor || '#0b1d12';

  const selectedDiv = divisions.find((d) => d._id === divisionId);
  const teamSize = selectedDiv?.teamSize || competition?.sport?.teamSize || 2;

  useEffect(() => {
    setPlayers(Array(teamSize).fill(''));
  }, [divisionId, teamSize]);

  const setPlayer = (idx, value) => {
    setPlayers((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!divisionId) {
      setSubmitError('Selecciona una categoria');
      return;
    }
    if (players.some((p) => !p.trim())) {
      setSubmitError('Rellena el nombre de todos los jugadores');
      return;
    }

    setSubmitting(true);
    try {
      const organizationId = org.id || routeOrgRef;
      const competitionId = competition?._id || compId;
      const res = await registerForCompetition(organizationId, competitionId, {
        divisionId,
        players: players.map((name) => ({ name: name.trim() })),
        contactEmail: email.trim() || undefined,
      });

      if (res.data.requiresPayment && res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Error al inscribirse. Intentalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <PublicLayout orgId={routeOrgRef} orgSlug={org.slug} orgName={org.name} orgLogo={org.logo} orgColor={color}>
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="font-bold text-gray-900 mb-1">No disponible</p>
          <p className="text-sm text-gray-500">{loadError}</p>
        </div>
      </PublicLayout>
    );
  }

  if (success) {
    return (
      <PublicLayout orgId={routeOrgRef} orgSlug={org.slug} orgName={org.name} orgLogo={org.logo} orgColor={color}>
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-brand-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Inscripcion completada</h2>
            <p className="text-sm text-gray-500 mb-2">
              <span className="font-semibold text-gray-700">{players.join(' / ')}</span>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Estas inscrito en <span className="font-semibold text-gray-700">{selectedDiv?.name}</span>.
              El organizador se pondra en contacto cuando haya novedades.
            </p>
            <button
              onClick={() => navigate(compRef ? `/${orgRef}/${compRef}` : `/organizations/${orgRef}/competitions/${compId}/public`)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Ver la competicion -&gt;
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      orgId={routeOrgRef}
      orgSlug={org.slug}
      orgName={org.name}
      orgLogo={org.logo}
      orgColor={color}
      title={loading ? undefined : `Inscripcion · ${competition?.name}`}
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
              {competition?.type === 'tournament' ? 'Inscripcion al torneo' : 'Inscripcion a la competicion'}
              {competition?.season ? ` · T. ${competition.season}` : ''}
            </p>
            {(competition?.location || competition?.startDate || competition?.endDate) && (
              <div className="flex flex-wrap gap-3 mt-2 mb-1">
                {competition?.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={12} className="text-gray-400" /> {competition.location}
                  </span>
                )}
                {(competition?.startDate || competition?.endDate) && (() => {
                  const fmt = (v) => {
                    if (!v) return '';
                    const [y, m, d] = v.split('-');
                    return `${d}/${m}/${y}`;
                  };
                  const from = fmt(competition.startDate);
                  const to = fmt(competition.endDate);
                  const label = from && to ? `${from} - ${to}` : from || to;
                  return label ? (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} className="text-gray-400" /> {label}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
            {competition?.description && (
              <p className="text-sm text-gray-600 mb-6 mt-2 leading-relaxed">{competition.description}</p>
            )}
            {!competition?.description && <div className="mb-6" />}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Categoria</label>
                {divisions.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay categorias disponibles.</p>
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
                      <option value="">Selecciona una categoria...</option>
                      {divisions.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

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
                        placeholder={teamSize === 1 ? 'Nombre completo' : `Jugador ${idx + 1}`}
                        value={players[idx] || ''}
                        onChange={(e) => setPlayer(idx, e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    ))}
                  </div>
                </div>
              )}

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

              {submitError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  {submitError}
                </div>
              )}

              {divisionId && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: color }}
                >
                  {submitting ? 'Inscribiendo...' : 'Inscribirse'}
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

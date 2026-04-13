import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCompetition, updateCompetition } from '../api/competitions';
import { getDivisions, createDivision, deleteDivision, updateDivision } from '../api/divisions';
import { getDivisionTeams } from '../api/teams';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';
import { X, Copy, Check, QrCode, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';

// ── Invite modal ──────────────────────────────────────────────────────────────
const QR_ID = 'invite-qr-svg';

const InviteModal = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById(QR_ID);
    if (!svg) return;
    const SIZE = 512;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(svgUrl);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'qr-inscripcion.png';
      a.click();
    };
    img.src = svgUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <QrCode size={15} className="text-brand-600" />
            </div>
            <h2 className="font-bold text-gray-900 text-base leading-none">Invitar jugadores</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">

          {/* QR */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-gray-400 font-medium">Escanea para inscribirse</p>
            <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <QRCode id={QR_ID} value={url} size={180} fgColor="#0b1d12" />
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Download size={13} /> Descargar QR
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">o copia el enlace</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Link + copy */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-500 flex-1 truncate">{url}</p>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                copied
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const statusOptions = ['draft', 'active', 'finished'];
const statusConfig = {
  draft:    { label: 'Borrador',   cls: 'bg-gray-100 text-gray-600' },
  active:   { label: 'Activa',     cls: 'bg-brand-100 text-brand-700' },
  finished: { label: 'Finalizada', cls: 'bg-blue-100 text-blue-700' },
};

const formatDateLabel = (value) => {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
};

const formatDateRange = (startDate, endDate) => {
  const from = formatDateLabel(startDate);
  const to = formatDateLabel(endDate);
  if (from && to) return `${from} - ${to}`;
  return from || to || '';
};

// ── Stepper input ─────────────────────────────────────────────────────────────
const Stepper = ({ value, onChange, min = 0, max = 99 }) => (
  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-fit">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="px-3 py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default transition-colors text-base leading-none font-medium"
    >−</button>
    <span className="w-10 text-center text-sm font-semibold text-gray-800 select-none">{value}</span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="px-3 py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default transition-colors text-base leading-none font-medium"
    >+</button>
  </div>
);

// ── Settings modal ────────────────────────────────────────────────────────────
const SettingsModal = ({ competition, onSave, onClose }) => {
  const defaults = competition.settings || {};
  const isSets   = competition.sport?.scoringType === 'sets';
  const isGoals  = competition.sport?.scoringType === 'goals';
  const isLeague = competition.type === 'league';
  const defaultResultConfig = defaults.resultConfig || {};

  const isTournament = competition.type === 'tournament';

  const [status, setStatus] = useState(competition.status);
  const [name, setName] = useState(competition.name || '');
  const [description, setDescription] = useState(competition.description || '');
  const [location, setLocation] = useState(competition.location || '');
  const [startDate, setStartDate] = useState(competition.startDate || '');
  const [endDate, setEndDate] = useState(competition.endDate || '');
  const [s, setS] = useState({
    pointsPerWin:        defaults.pointsPerWin        ?? 3,
    pointsPerLoss:       defaults.pointsPerLoss       ?? 0,
    pointsPerDraw:       defaults.pointsPerDraw       ?? 1,
    setsPerMatch:        defaults.setsPerMatch         ?? 3,
    maxTeamsPerDivision: defaults.maxTeamsPerDivision  ?? 0,
    promotionSpots:      defaults.promotionSpots       ?? 1,
    relegationSpots:     defaults.relegationSpots      ?? 1,
    resultMode:          defaultResultConfig.mode      ?? 'manual',
    enabledEventTypes:   defaultResultConfig.enabledEventTypes ?? ['goal', 'assist', 'yellow_card', 'red_card'],
    tournamentFormat:    defaults.tournamentFormat     ?? 'elimination',
    teamsPerGroup:       defaults.teamsPerGroup        ?? 4,
    teamsAdvancing:      defaults.teamsAdvancing       ?? 2,
    registrationFee:     defaults.registrationFee      ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setS((prev) => ({ ...prev, [k]: v }));

  const toggleEventType = (type) => {
    setS((prev) => {
      const current = Array.isArray(prev.enabledEventTypes) ? prev.enabledEventTypes : [];
      const exists = current.includes(type);
      const next = exists ? current.filter((t) => t !== type) : [...current, type];
      return { ...prev, enabledEventTypes: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name,
      description,
      status,
      location,
      startDate,
      endDate,
      settings: {
        ...defaults,
        ...s,
        resultConfig: {
          mode: s.resultMode,
          enabledEventTypes: s.enabledEventTypes,
        },
        tournamentFormat: s.tournamentFormat,
        teamsPerGroup: s.teamsPerGroup,
        teamsAdvancing: s.teamsAdvancing,
        registrationFee: Number(s.registrationFee) || 0,
      },
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Icon name="settings" size={15} className="text-gray-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base leading-none">Configuración</h2>
              <p className="text-xs text-gray-400 mt-0.5">{competition.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 max-h-[70dvh] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* Estado */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Estado</p>
            <div className="flex gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    status === opt
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {statusConfig[opt].label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos de competicion</p>
            <div className="space-y-3">
              <div>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre de la competición"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción opcional (visible en la página pública)"
                  maxLength={400}
                />
              </div>
              <div>
                <label className="label">Ubicacion</label>
                <input
                  type="text"
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Ecija, Sevilla"
                  maxLength={140}
                />
              </div>
              <div>
                <label className="label">Rango de fechas</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="date"
                    className="input flex-1"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    type="date"
                    className="input flex-1"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Puntuación */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Puntuación</p>
            <div className="space-y-2">
              {[
                { label: 'Puntos por victoria', k: 'pointsPerWin',  color: 'text-brand-600', bg: 'bg-gray-50' },
                { label: 'Puntos por derrota',  k: 'pointsPerLoss', color: 'text-red-500',   bg: 'bg-gray-50' },
                { label: 'Puntos por empate',   k: 'pointsPerDraw', color: 'text-amber-500', bg: 'bg-gray-50' },
              ].map(({ label, k, color, bg }) => (
                <div key={k} className={`${bg} rounded-xl px-4 py-3 flex items-center justify-between`}>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className={`text-xs font-bold ${color} mt-0.5`}>{s[k]} punto{s[k] !== 1 ? 's' : ''}</p>
                  </div>
                  <Stepper value={s[k]} onChange={(v) => set(k, v)} max={20} />
                </div>
              ))}
            </div>
          </section>

          {/* Formato de partido */}
          {isSets && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Formato de partido</p>
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Sets por partido</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.setsPerMatch === 1 ? 'Un set único' :
                     s.setsPerMatch === 3 ? 'Mejor de 3 sets' :
                     s.setsPerMatch === 5 ? 'Mejor de 5 sets' :
                     `${s.setsPerMatch} sets`}
                  </p>
                </div>
                <Stepper value={s.setsPerMatch} onChange={(v) => set('setsPerMatch', v)} min={1} max={5} />
              </div>
            </section>
          )}

          {isGoals && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Registro de partido</p>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Modo de carga de resultado</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => set('resultMode', 'manual')}
                      className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        s.resultMode === 'manual'
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Resultado simple
                    </button>
                    <button
                      type="button"
                      onClick={() => set('resultMode', 'events')}
                      className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        s.resultMode === 'events'
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Eventos detallados
                    </button>
                  </div>
                </div>

                {s.resultMode === 'events' && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Eventos permitidos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'goal', label: 'Gol' },
                        { key: 'assist', label: 'Asistencia' },
                        { key: 'yellow_card', label: 'Tarjeta amarilla' },
                        { key: 'red_card', label: 'Tarjeta roja' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => toggleEventType(item.key)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                            s.enabledEventTypes.includes(item.key)
                              ? 'bg-white text-blue-800 border-blue-300'
                              : 'bg-blue-100 text-blue-500 border-blue-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Formato del torneo */}
          {isTournament && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Formato del torneo</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {[
                    { value: 'elimination', label: 'Eliminación directa' },
                    { value: 'groups_and_elimination', label: 'Grupos + Eliminatoria' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('tournamentFormat', opt.value)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        s.tournamentFormat === opt.value
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {s.tournamentFormat === 'groups_and_elimination' && (
                  <div className="space-y-2">
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Equipos por grupo</p>
                        <p className="text-xs text-gray-400 mt-0.5">Máximo de equipos en cada grupo</p>
                      </div>
                      <Stepper value={s.teamsPerGroup} onChange={(v) => set('teamsPerGroup', v)} min={3} max={8} />
                    </div>
                    <div className="bg-brand-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-brand-800">Clasifican por grupo</p>
                        <p className="text-xs text-brand-500 mt-0.5">Equipos que pasan a eliminatoria</p>
                      </div>
                      <Stepper value={s.teamsAdvancing} onChange={(v) => set('teamsAdvancing', v)} min={1} max={4} />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Capacidad */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Capacidad</p>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Equipos max. por division/categoria</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.maxTeamsPerDivision === 0 ? 'Sin limite' : `${s.maxTeamsPerDivision} equipos`}</p>
              </div>
              <Stepper value={s.maxTeamsPerDivision} onChange={(v) => set('maxTeamsPerDivision', v)} max={128} />
            </div>
          </section>

          {/* Divisiones (liga) */}
          {isLeague && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Divisiones</p>
              <div className="space-y-3">


                <div className="bg-brand-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-800">↑ Equipos que ascienden</p>
                    <p className="text-xs text-brand-500 mt-0.5">
                      {s.promotionSpots === 0 ? 'Sin ascensos' : `${s.promotionSpots} equipo${s.promotionSpots > 1 ? 's' : ''} por división`}
                    </p>
                  </div>
                  <Stepper value={s.promotionSpots} onChange={(v) => set('promotionSpots', v)} max={10} />
                </div>

                <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-800">↓ Equipos que descienden</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      {s.relegationSpots === 0 ? 'Sin descensos' : `${s.relegationSpots} equipo${s.relegationSpots > 1 ? 's' : ''} por división`}
                    </p>
                  </div>
                  <Stepper value={s.relegationSpots} onChange={(v) => set('relegationSpots', v)} max={10} />
                </div>

              </div>
            </section>
          )}

          {/* Inscripción — precio */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Inscripción</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Precio de inscripción</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {Number(s.registrationFee) === 0 ? 'Gratuita — no se requiere pago' : `${Number(s.registrationFee).toFixed(2)} € por equipo`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-sm text-gray-400">€</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={s.registrationFee}
                  onChange={(e) => set('registrationFee', e.target.value)}
                  className="w-20 text-center text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            {Number(s.registrationFee) > 0 && (
              <p className="text-[11px] text-amber-600 mt-2 px-1">
                Los jugadores serán redirigidos a Stripe Checkout al inscribirse. Asegúrate de tener configuradas las variables de Stripe en el servidor.
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <><Icon name="spinner" size={14} className="animate-spin" /> Guardando…</> : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const CompetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [competition, setCompetition] = useState(null);
  const [divisions, setDivisions]     = useState([]);
  const [divisionName, setDivisionName] = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [playerDivisionId, setPlayerDivisionId] = useState(null);

  const isOrganizer = user?.role === 'organizer' && competition?.organizer?.toString() === user?.id;
  const { activeOrg } = useOrg();

  useEffect(() => {
    const fetch = async () => {
      const [c, d] = await Promise.all([getCompetition(id), getDivisions(id)]);
      setCompetition(c.data);
      setDivisions(d.data);
      
      if (user?.role === 'player' && d.data.length > 0) {
        await loadPlayerDivision(d.data, !location.state?.noRedirect);
      }
      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const loadPlayerDivision = async (divisionsData, shouldRedirect = false) => {
    for (const division of divisionsData) {
      try {
        const teams = await getDivisionTeams(division._id);
        const playerTeam = teams.data?.find(t => t.players?.some(p => p && p._id === user.id));
        if (playerTeam) {
          setPlayerDivisionId(division._id);
          if (shouldRedirect) navigate(`/divisions/${division._id}`);
          return;
        }
      } catch (err) {
        // Continuar si hay error
      }
    }
  };

  const handleSaveSettings = async (patch) => {
    const res = await updateCompetition(id, patch);
    setCompetition(res.data);
  };

  const handleAddDivision = async (e) => {
    e.preventDefault();
    if (!divisionName.trim()) return;
    const res = await createDivision(id, { name: divisionName });
    setDivisions([...divisions, res.data]);
    setDivisionName(''); setShowForm(false);
  };

  const handleDeleteDivision = async (divId) => {
    if (!confirm('¿Eliminar esta división/categoría y todos sus datos?')) return;
    await deleteDivision(divId);
    setDivisions(divisions.filter((d) => d._id !== divId));
  };


  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center py-20">
        <Icon name="spinner" size={20} className="animate-spin text-brand-500" />
      </div>
    </AppLayout>
  );
  if (!competition) return <AppLayout><p className="text-red-500">Competición no encontrada</p></AppLayout>;

  const isLeague   = competition.type === 'league';
  const entityName = isLeague ? 'División' : 'Categoría';
  const st         = statusConfig[competition.status] || statusConfig.draft;
  const settings   = competition.settings || {};
  const showNewSeason = isLeague && divisions.length > 0;

  const organizerActions = isOrganizer ? (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <button
        onClick={() => setShowInvite(true)}
        className="btn-secondary text-xs py-1.5 flex-1 md:flex-none justify-center"
      >
        <Icon name="share" size={13} /> Invitar
      </button>
      {showNewSeason && (
        <button
          onClick={() => navigate(`/competitions/${id}/new-season`)}
          className="btn-secondary text-xs py-1.5 flex-1 md:flex-none justify-center"
        >
          <Icon name="calendar" size={13} /> Temporada
        </button>
      )}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`btn-secondary text-xs py-1.5 flex-1 md:flex-none justify-center ${showSettings ? 'bg-gray-100' : ''}`}
      >
        <Icon name="settings" size={13} /> Config.
      </button>
    </div>
  ) : null;

  return (
    <AppLayout title={competition.name} actions={<div className="hidden md:flex">{organizerActions}</div>}>
      {/* Back */}
      <button
        onClick={() => navigate(isOrganizer ? '/dashboard' : '/player')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3"
      >
        <Icon name="chevronLeft" size={14} /> {isOrganizer ? 'Mis competiciones' : 'Mi panel'}
      </button>

      {/* Mobile actions */}
      {isOrganizer && <div className="md:hidden mb-4">{organizerActions}</div>}

      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <span className={`badge ${st.cls}`}>{st.label}</span>
        {competition.sport && (
          <span className="badge bg-gray-100 text-gray-500">{competition.sport.name}</span>
        )}
        {competition.season && (
          <span className="badge bg-gray-100 text-gray-500">T. {competition.season}</span>
        )}
        {competition.location && (
          <span className="badge bg-gray-100 text-gray-500">{competition.location}</span>
        )}
        {formatDateRange(competition.startDate, competition.endDate) && (
          <span className="badge bg-gray-100 text-gray-500">{formatDateRange(competition.startDate, competition.endDate)}</span>
        )}
      </div>

      {!isOrganizer && !playerDivisionId && (
        <div className="card p-4 mb-4 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
              <Icon name="user" size={16} />
            </div>
            <div>
              <p className="font-semibold text-blue-900">¡Bienvenido a {competition.name}!</p>
              <p className="text-sm text-blue-700">Explora las divisiones y únete a un equipo haciendo clic en "Soy [Tu Nombre]" cuando encuentres tu pareja.</p>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          url={`${window.location.origin}/organizations/${activeOrg?._id}/competitions/${id}/register`}
          onClose={() => setShowInvite(false)}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          competition={competition}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Divisions / Categories */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Icon name="division" size={14} className="text-gray-400" />
            {isLeague ? 'Divisiones' : 'Categorías'}
          </h3>
          {isLeague && competition.seasons && competition.seasons.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Temporada:</span>
              <select 
                value={competition.seasons.find(s => s.isActive)?.name || ''}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {competition.seasons.map((season) => (
                  <option key={season.name} value={season.name}>{season.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {isOrganizer && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs py-1.5">
            <Icon name="plus" size={13} /> Añadir {entityName.toLowerCase()}
          </button>
        )}
      </div>

      {showForm && isOrganizer && (
        <form onSubmit={handleAddDivision} className="card p-4 mb-4 flex gap-2">
          <input
            type="text" className="input flex-1"
            placeholder={isLeague ? 'Ej: Primera, Segunda, División A…' : 'Ej: Masculino A, Femenino, Mixto…'}
            value={divisionName}
            onChange={(e) => setDivisionName(e.target.value)}
            required autoFocus
          />
          <button type="submit" className="btn-primary whitespace-nowrap">Crear</button>
          <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
        </form>
      )}

      {divisions.length === 0 && !showForm ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
            <Icon name={isLeague ? 'division' : 'bracket'} size={22} />
          </div>
          <p className="font-semibold text-gray-800 mb-1">Sin {isLeague ? 'divisiones' : 'categorías'}</p>
          <p className="text-gray-400 text-sm mb-4">
            {isLeague
              ? 'Añade divisiones en orden jerárquico (primera = más alta).'
              : 'Añade categorías para organizar el torneo por niveles o géneros.'}
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto text-sm" disabled={!isOrganizer}>
            <Icon name="plus" size={13} /> Crear {entityName.toLowerCase()}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {divisions.map((div, i) => (
            <div
              key={div._id}
              className="px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors group"
              onClick={() => navigate(`/divisions/${div._id}`)}
            >
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <span className="flex-1 font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                {div.name}
              </span>
              <div className="flex items-center gap-3">
                {isOrganizer && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDivision(div._id); }}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                )}
                <Icon name="chevronRight" size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default CompetitionDetail;

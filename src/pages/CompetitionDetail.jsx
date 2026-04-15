import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCompetition, updateCompetition } from '../api/competitions';
import { getDivisions, createDivision, deleteDivision, updateDivision } from '../api/divisions';
import { getDivisionTeams, getCompetitionTeamsDetailed } from '../api/teams';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';
import { X, Copy, Check, QrCode, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';

// â”€â”€ Scroll lock (prevents iOS background scroll when modal is open) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const useLockBodyScroll = () => {
  useEffect(() => {
    const y = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, y);
    };
  }, []);
};

// â”€â”€ Invite modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const QR_ID = 'invite-qr-svg';

const InviteModal = ({ url, onClose }) => {
  useLockBodyScroll();
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

const paymentStatusLabel = (status) => {
  if (status === 'paid') return 'Pagado';
  if (status === 'pending') return 'Pendiente';
  if (status === 'failed') return 'Fallido';
  return 'Gratis';
};

const paymentStatusClass = (status) => {
  if (status === 'paid') return 'bg-green-100 text-green-700';
  if (status === 'pending') return 'bg-amber-100 text-amber-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};

// â”€â”€ Stepper input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Stepper = ({ value, onChange, min = 0, max = 99 }) => (
  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-fit">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="px-3 py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default transition-colors text-base leading-none font-medium"
    >âˆ’</button>
    <span className="w-10 text-center text-sm font-semibold text-gray-800 select-none">{value}</span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="px-3 py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default transition-colors text-base leading-none font-medium"
    >+</button>
  </div>
);

// â”€â”€ Settings modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SettingsModal = ({ competition, onSave, onClose }) => {
  useLockBodyScroll();
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
    teamSize:            defaults.teamSize              ?? competition.sport?.teamSize ?? 11,
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
              <h2 className="font-bold text-gray-900 text-base leading-none">ConfiguraciÃ³n</h2>
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
                  placeholder="Nombre de la competiciÃ³n"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="label">DescripciÃ³n</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="DescripciÃ³n opcional (visible en la pÃ¡gina pÃºblica)"
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
                <label className="label">{isLeague ? 'Rango de fechas (temporada activa)' : 'Rango de fechas'}</label>
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

          {/* Formato del torneo â€” primero porque define la estructura */}
          {isTournament && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Formato del torneo</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {[
                    { value: 'elimination', label: 'EliminaciÃ³n directa' },
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
                        <p className="text-xs text-gray-400 mt-0.5">MÃ¡ximo de equipos en cada grupo</p>
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

          {/* Equipos â€” jugadores + capacidad juntos */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Equipos</p>
            <div className="space-y-2">
              {isGoals && (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Jugadores por equipo</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.teamSize === 1 ? '1 jugador' : `${s.teamSize} jugadores`}
                    </p>
                  </div>
                  <Stepper value={s.teamSize} onChange={(v) => set('teamSize', v)} min={1} max={30} />
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">MÃ¡x. equipos por {isLeague ? 'divisiÃ³n' : 'categorÃ­a'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.maxTeamsPerDivision === 0 ? 'Sin lÃ­mite' : `${s.maxTeamsPerDivision} equipos`}</p>
                </div>
                <Stepper value={s.maxTeamsPerDivision} onChange={(v) => set('maxTeamsPerDivision', v)} max={128} />
              </div>
            </div>
          </section>

          {/* Divisiones (liga) */}
          {isLeague && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Divisiones</p>
              <div className="space-y-2">
                <div className="bg-brand-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-800">â†‘ Equipos que ascienden</p>
                    <p className="text-xs text-brand-500 mt-0.5">
                      {s.promotionSpots === 0 ? 'Sin ascensos' : `${s.promotionSpots} equipo${s.promotionSpots > 1 ? 's' : ''} por divisiÃ³n`}
                    </p>
                  </div>
                  <Stepper value={s.promotionSpots} onChange={(v) => set('promotionSpots', v)} max={10} />
                </div>
                <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-800">â†“ Equipos que descienden</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      {s.relegationSpots === 0 ? 'Sin descensos' : `${s.relegationSpots} equipo${s.relegationSpots > 1 ? 's' : ''} por divisiÃ³n`}
                    </p>
                  </div>
                  <Stepper value={s.relegationSpots} onChange={(v) => set('relegationSpots', v)} max={10} />
                </div>
              </div>
            </section>
          )}

          {/* PuntuaciÃ³n */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">PuntuaciÃ³n</p>
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

          {/* Formato de partido (sets) */}
          {isSets && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Formato de partido</p>
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Sets por partido</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.setsPerMatch === 1 ? 'Un set Ãºnico' :
                     s.setsPerMatch === 3 ? 'Mejor de 3 sets' :
                     s.setsPerMatch === 5 ? 'Mejor de 5 sets' :
                     `${s.setsPerMatch} sets`}
                  </p>
                </div>
                <Stepper value={s.setsPerMatch} onChange={(v) => set('setsPerMatch', v)} min={1} max={5} />
              </div>
            </section>
          )}

          {/* Registro de partido (goles/eventos) */}
          {isGoals && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Registro de partido</p>
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

          {/* InscripciÃ³n â€” precio */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">InscripciÃ³n</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Precio de inscripciÃ³n</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {Number(s.registrationFee) === 0 ? 'Gratuita â€” no se requiere pago' : `${Number(s.registrationFee).toFixed(2)} â‚¬ por equipo`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-sm text-gray-400">â‚¬</span>
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
                Los jugadores serÃ¡n redirigidos a Stripe Checkout al inscribirse. AsegÃºrate de tener configuradas las variables de Stripe en el servidor.
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <><Icon name="spinner" size={14} className="animate-spin" /> Guardandoâ€¦</> : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const [editingDivId, setEditingDivId]   = useState(null);
  const [editingDivName, setEditingDivName] = useState('');
  const [teamsDetail, setTeamsDetail] = useState([]);
  const [teamsDetailLoading, setTeamsDetailLoading] = useState(false);
  const [teamsDetailError, setTeamsDetailError] = useState('');
  const [activeSeasonLabel, setActiveSeasonLabel] = useState('');

  const isOrganizer = user?.role === 'organizer' && competition?.organizer?.toString() === user?.id;
  const { activeOrg } = useOrg();

  useEffect(() => {
    const fetch = async () => {
      const [c, d] = await Promise.all([getCompetition(id), getDivisions(id)]);
      setCompetition(c.data);
      setDivisions(d.data);

      const isOwnerOrganizer = user?.role === 'organizer' && c.data?.organizer?.toString() === user?.id;
      if (isOwnerOrganizer) {
        setTeamsDetailLoading(true);
        setTeamsDetailError('');
        try {
          const detailRes = await getCompetitionTeamsDetailed(id);
          setTeamsDetail(detailRes.data?.teams || []);
          setActiveSeasonLabel(detailRes.data?.activeSeason || '');
        } catch (err) {
          setTeamsDetail([]);
          setTeamsDetailError(err.response?.data?.message || 'No se pudo cargar el listado de equipos');
        } finally {
          setTeamsDetailLoading(false);
        }
      } else {
        setTeamsDetail([]);
        setActiveSeasonLabel('');
      }

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

  const reloadTeamsDetail = async () => {
    if (!(user?.role === 'organizer' && competition?.organizer?.toString() === user?.id)) return;
    setTeamsDetailLoading(true);
    setTeamsDetailError('');
    try {
      const detailRes = await getCompetitionTeamsDetailed(id);
      setTeamsDetail(detailRes.data?.teams || []);
      setActiveSeasonLabel(detailRes.data?.activeSeason || '');
    } catch (err) {
      setTeamsDetailError(err.response?.data?.message || 'No se pudo cargar el listado de equipos');
    } finally {
      setTeamsDetailLoading(false);
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
    await reloadTeamsDetail();
  };

  const handleDeleteDivision = async (divId) => {
    if (!confirm('Â¿Eliminar esta divisiÃ³n/categorÃ­a y todos sus datos?')) return;
    await deleteDivision(divId);
    setDivisions(divisions.filter((d) => d._id !== divId));
    await reloadTeamsDetail();
  };

  const handleRenameDivision = async (divId) => {
    const trimmed = editingDivName.trim();
    if (!trimmed) return;
    const res = await updateDivision(divId, { name: trimmed });
    setDivisions(divisions.map((d) => d._id === divId ? { ...d, name: res.data.name } : d));
    setEditingDivId(null);
    await reloadTeamsDetail();
  };


  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center py-20">
        <Icon name="spinner" size={20} className="animate-spin text-brand-500" />
      </div>
    </AppLayout>
  );
  if (!competition) return <AppLayout><p className="text-red-500">CompeticiÃ³n no encontrada</p></AppLayout>;

  const isLeague   = competition.type === 'league';
  const entityName = isLeague ? 'DivisiÃ³n' : 'CategorÃ­a';
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
              <p className="font-semibold text-blue-900">Â¡Bienvenido a {competition.name}!</p>
              <p className="text-sm text-blue-700">Explora las divisiones y Ãºnete a un equipo haciendo clic en "Soy [Tu Nombre]" cuando encuentres tu pareja.</p>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          url={`${window.location.origin}/${activeOrg?.slug || activeOrg?._id}/${competition?.publicSlug || id}/inscripcion`}
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
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Icon name="division" size={14} className="text-gray-400" />
            {isLeague ? 'Divisiones' : 'CategorÃ­as'}
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
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate(`/competitions/${id}/teams`)}
              className="btn-secondary text-xs py-1.5"
            >
              <Icon name="team" size={13} /> Ver todos los equipos
            </button>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs py-1.5">
              <Icon name="plus" size={13} /> AÃ±adir {entityName.toLowerCase()}
            </button>
          </div>
        )}
        </div>
        {isOrganizer && (
          <div className="mt-3 grid grid-cols-2 gap-2 md:hidden">
            <button
              onClick={() => navigate(`/competitions/${id}/teams`)}
              className="btn-secondary text-xs py-1.5 justify-center"
            >
              <Icon name="team" size={13} /> Ver todos los equipos
            </button>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs py-1.5 justify-center">
              <Icon name="plus" size={13} /> Añadir {entityName.toLowerCase()}
            </button>
          </div>
        )}
      </div>

      {showForm && isOrganizer && (
        <form onSubmit={handleAddDivision} className="card p-4 mb-4 flex gap-2">
          <input
            type="text" className="input flex-1"
            placeholder={isLeague ? 'Ej: Primera, Segunda, DivisiÃ³n Aâ€¦' : 'Ej: Masculino A, Femenino, Mixtoâ€¦'}
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
          <p className="font-semibold text-gray-800 mb-1">Sin {isLeague ? 'divisiones' : 'categorÃ­as'}</p>
          <p className="text-gray-400 text-sm mb-4">
            {isLeague
              ? 'AÃ±ade divisiones en orden jerÃ¡rquico (primera = mÃ¡s alta).'
              : 'AÃ±ade categorÃ­as para organizar el torneo por niveles o gÃ©neros.'}
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto text-sm" disabled={!isOrganizer}>
            <Icon name="plus" size={13} /> Crear {entityName.toLowerCase()}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {divisions.map((div, i) => {
            const isEditing = editingDivId === div._id;
            return (
              <div key={div._id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>

                {isEditing ? (
                  <>
                    <input
                      autoFocus
                      className="input flex-1 py-1.5 text-sm"
                      value={editingDivName}
                      onChange={(e) => setEditingDivName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameDivision(div._id);
                        if (e.key === 'Escape') setEditingDivId(null);
                      }}
                    />
                    <button
                      onClick={() => handleRenameDivision(div._id)}
                      className="text-brand-600 hover:text-brand-700 transition-colors p-1"
                    >
                      <Icon name="check" size={15} />
                    </button>
                    <button
                      onClick={() => setEditingDivId(null)}
                      className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                    >
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="flex-1 font-semibold text-gray-800 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => navigate(`/divisions/${div._id}`)}
                    >
                      {div.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {isOrganizer && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingDivName(div.name); setEditingDivId(div._id); }}
                            className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDivision(div._id); }}
                            className="text-gray-300 hover:text-red-400 transition-colors p-1"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </>
                      )}
                      <Icon name="chevronRight" size={14} className="text-gray-300 cursor-pointer" onClick={() => navigate(`/divisions/${div._id}`)} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {false && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Equipos de la competicion</h3>
              <p className="text-xs text-gray-400 mt-1">
                {activeSeasonLabel ? `Temporada activa: ${activeSeasonLabel}` : 'Temporada activa'}
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {teamsDetail.length} equipos
            </span>
          </div>

          {teamsDetailError && (
            <div className="mb-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {teamsDetailError}
            </div>
          )}

          {teamsDetailLoading ? (
            <div className="card p-8 text-center">
              <Icon name="spinner" size={18} className="animate-spin text-brand-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Cargando equipos...</p>
            </div>
          ) : teamsDetail.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="font-semibold text-gray-800 mb-1">Sin equipos registrados</p>
              <p className="text-sm text-gray-400">
                Cuando haya inscripciones o equipos creados apareceran aqui con su detalle.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
              {teamsDetail.map((team) => (
                <div key={team._id} className="px-4 py-4 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="team" size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 truncate">{team.name}</p>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${paymentStatusClass(team.paymentStatus)}`}>
                          {paymentStatusLabel(team.paymentStatus)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md">
                          {isLeague ? 'DivisiÃ³n' : 'CategorÃ­a'}: {team.division?.name || 'General'}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md">
                          {team.playerCount} jugador{team.playerCount === 1 ? '' : 'es'}
                        </span>
                        {team.group && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-md">Grupo {team.group}</span>
                        )}
                        {team.contactEmail && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-md truncate max-w-[220px]">{team.contactEmail}</span>
                        )}
                      </div>
                      {Array.isArray(team.players) && team.players.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {team.players.map((player, idx) => (
                            <span key={`${team._id}-${idx}`} className="text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg">
                              {player.name}{player.dorsal ? ` #${player.dorsal}` : ''}{player.userId ? ' (usuario)' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap mt-1">
                      {new Date(team.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default CompetitionDetail;

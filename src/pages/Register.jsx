import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, Trophy, Dumbbell, TrendingUp, User, Medal, Eye, EyeOff } from 'lucide-react';
import { authClient } from '../lib/auth-client';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('competition');

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'player' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await authClient.signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
      role: competitionId ? 'player' : form.role,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message || 'Error al crear la cuenta');
      return;
    }

    // Better Auth sets the session cookie automatically
    if (competitionId) {
      navigate(`/competitions/${competitionId}`);
    } else {
      navigate(data.user.role === 'organizer' ? '/resumen' : '/player');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] bg-[#0b1d12] flex-col justify-between p-10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">PádelLeague</span>
        </div>
        <div className="space-y-8">
          {[
            { icon: Trophy,    title: 'Crea tu liga', desc: 'Define temporadas, divisiones y categorías en minutos.' },
            { icon: Dumbbell,  title: 'Gestiona parejas', desc: 'Añade equipos y genera el calendario automáticamente.' },
            { icon: TrendingUp, title: 'Clasificación en vivo', desc: 'Los resultados actualizan la tabla al instante.' },
          ].map((f) => (
            <div key={f.title} className="flex gap-4">
              <f.icon size={22} className="text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-slate-400 text-sm mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs">© 2025 PádelLeague · Tu liga, tu app.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">PádelLeague</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h2>
          <p className="text-gray-500 text-sm mb-8">Empieza a gestionar tu liga hoy mismo</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Nombre completo</label>
              <input type="text" className="input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Carlos García" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tu@email.com" required />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!competitionId && (
              <div>
                <label className="label">Tipo de cuenta</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'player',    label: 'Jugador',     desc: 'Ver partidos y clasificación',    icon: User },
                    { value: 'organizer', label: 'Organizador', desc: 'Gestionar ligas y resultados',    icon: Medal },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.role === r.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <r.icon size={20} className={form.role === r.value ? 'text-brand-600' : 'text-gray-400'} />
                      <p className={`text-sm font-semibold mt-1 ${form.role === r.value ? 'text-brand-700' : 'text-gray-800'}`}>
                        {r.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-base">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

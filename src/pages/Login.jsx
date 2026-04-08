import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      navigate(res.data.user.role === 'organizer' ? '/dashboard' : '/player');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
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
        <div>
          <blockquote className="text-slate-300 text-xl font-light leading-relaxed mb-6">
            "Deja de gestionar tu liga con Excel y WhatsApp.<br />
            <span className="text-white font-semibold">Hazlo como un profesional.</span>"
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
              JM
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Juan Martínez</p>
              <p className="text-slate-400 text-xs">Organizador · Club Pádel Norte</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-500 opacity-70" />
          ))}
        </div>
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

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido de nuevo</h2>
          <p className="text-gray-500 text-sm mb-8">Introduce tus credenciales para continuar</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-base">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

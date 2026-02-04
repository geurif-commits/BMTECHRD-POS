import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../stores/api';
import { useStore } from '../stores/useStore';
import { Building2, User as UserIcon, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessId, setBusinessId] = useState(() => localStorage.getItem('lastBusinessId') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only run once on mount to load saved businessId
  useEffect(() => {
    const savedId = localStorage.getItem('lastBusinessId');
    if (savedId) {
      setBusinessId(savedId);
    }
  }, []); // Empty dependency array - only runs on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar campos requeridos
    if (!businessId.trim()) {
      setError('ID del negocio es requerido');
      return;
    }
    if (!email.trim()) {
      setError('Usuario es requerido');
      return;
    }
    if (!password.trim()) {
      setError('Contraseña es requerida');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password, businessId: businessId.trim() });
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('lastBusinessId', businessId);
      setUser({ ...user, token });
      const role = user.role as string;
      const routes: Record<string, string> = {
        CAMARERO: '/waiter',
        COCINERO: '/kitchen',
        BARTENDER: '/bar',
        CAJERO: '/cashier',
        OWNER: '/dashboard',
        ADMIN: '/dashboard',
        SUPERVISOR: '/waiter'
      };
      navigate(routes[role] || '/waiter');
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Error al iniciar sesión';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden relative selection:bg-primary-500/30 selection:text-primary-200">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 px-4"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              BMTECHRD
            </h1>
            <p className="text-slate-400 mt-2 font-medium tracking-wide text-sm">SISTEMA POS PROFESIONAL</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">ID Negocio</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-400 transition-colors">
                  <Building2 size={20} />
                </div>
                <input
                  type="text"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-12 py-3.5 text-white placeholder-slate-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                  placeholder="UUID del negocio"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Usuario</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-400 transition-colors">
                  <UserIcon size={20} />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-12 py-3.5 text-white placeholder-slate-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                  placeholder="admin o email@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-400 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-12 py-3.5 text-white placeholder-slate-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm"
              >
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              )}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <CheckCircle2 size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          &copy; {new Date().getFullYear()} BMTECHRD POS. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, LogIn } from 'lucide-react';
import api from '../stores/api';

export function LandingPage() {
  const [settings, setSettings] = useState<{
    landingBackgroundUrl?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactWhatsapp?: string;
  }>({});

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/activation/landing-settings');
        setSettings(data.data || {});
      } catch {
        // silent fallback to defaults
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (settings.landingBackgroundUrl) {
      document.documentElement.style.setProperty('--landing-bg', `url(${settings.landingBackgroundUrl})`);
    } else {
      document.documentElement.style.setProperty('--landing-bg', '');
    }
  }, [settings.landingBackgroundUrl]);

  return (
    <div className="landing-bg relative min-h-screen text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-800/90" />
      <div className="relative max-w-4xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 md:p-14 shadow-2xl">
        <div className="flex items-center gap-3 text-emerald-300 mb-6">
          <ShieldCheck size={28} />
          <span className="text-xs font-black uppercase tracking-[0.3em]">BMTECHRD POS</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black leading-tight">
          Gestiona tu negocio con control total
        </h1>
        <p className="mt-4 text-slate-300 text-lg">
          Activa tu prueba gratuita de 7 días y configura tu restaurante, tienda o negocio en minutos.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            to="/registro"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-emerald-400 text-slate-950 font-black uppercase tracking-widest text-xs hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-400/20"
          >
            Registrarme (7 días)
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all"
          >
            <LogIn size={16} />
            Iniciar sesión
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-200">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="font-black text-emerald-300">Prueba inmediata</p>
            <p className="text-slate-300">Acceso completo durante 7 días.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="font-black text-emerald-300">Licencias flexibles</p>
            <p className="text-slate-300">Activa planes desde el panel SuperAdmin.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="font-black text-emerald-300">Personalización automática</p>
            <p className="text-slate-300">El sistema adopta el nombre del negocio.</p>
          </div>
        </div>

        <div className="mt-10 bg-white/5 rounded-2xl p-5 border border-white/10 text-sm text-slate-200">
          <p className="text-xs font-black uppercase tracking-widest text-slate-300 mb-2">Contacto</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div><span className="text-slate-400">Nombre:</span> {settings.contactName || 'BMTECHRD'}</div>
            <div><span className="text-slate-400">Email:</span> {settings.contactEmail || 'ventas@bmtechrd.com'}</div>
            <div><span className="text-slate-400">Teléfono:</span> {settings.contactPhone || '+1 (809) 000-0000'}</div>
            <div><span className="text-slate-400">WhatsApp:</span> {settings.contactWhatsapp || '+1 (809) 000-0000'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

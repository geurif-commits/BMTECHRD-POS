import { motion } from 'framer-motion';
import { AlertTriangle, Mail, Phone, User } from 'lucide-react';

export function LicenseExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl p-12 text-center relative z-10"
      >
        <div className="inline-flex p-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-[2rem] mb-8 border border-red-500/30">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-bounce" />
        </div>

        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">ACCESO RESTRINGIDO</h1>
        <p className="text-slate-400 text-lg mb-10 font-medium leading-relaxed">
          La licencia de su sistema <span className="text-primary-400 font-bold">BMT-POS</span> ha expirado o no es válida.
          Por favor, póngase en contacto con administración para renovar sus servicios.
        </p>

        <div className="grid grid-cols-1 gap-4 mb-10">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 group transition-all"
          >
            <div className="p-4 bg-primary-500/10 rounded-2xl group-hover:bg-primary-500/20 transition-colors">
              <User className="w-6 h-6 text-primary-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Director Comercial</p>
              <p className="text-lg font-bold text-white">Geuri Garcia</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 group transition-all"
          >
            <div className="p-4 bg-primary-500/10 rounded-2xl group-hover:bg-primary-500/20 transition-colors">
              <Mail className="w-6 h-6 text-primary-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Correo Electrónico</p>
              <p className="text-lg font-bold text-white tracking-tight">geurig@yahoo.com</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 group transition-all"
          >
            <div className="p-4 bg-green-500/10 rounded-2xl group-hover:bg-green-500/20 transition-colors">
              <Phone className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">WhatsApp / Soporte Directo</p>
              <p className="text-lg font-bold text-white tracking-widest font-mono">+1 (829) 969-8604</p>
            </div>
          </motion.div>
        </div>

        <button
          onClick={() => window.location.href = '/login'}
          className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-slate-200 transition-all shadow-xl shadow-white/10 active:scale-[0.98]"
        >
          Volver al Inicio de Sesión
        </button>

        <p className="mt-8 text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
          Powered by BMTECHRD Technical Solutions
        </p>
      </motion.div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../stores/api';
import { toast } from 'react-hot-toast';
import { Building2, Mail, Phone, MapPin, ClipboardList, Hash } from 'lucide-react';

export function ActivationPage() {
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [trialAccess, setTrialAccess] = useState<null | {
    businessId: string;
    businessCode?: number;
    businessName: string;
    email: string;
    password: string;
    pin: string;
    licenseKey: string;
  }>(null);
  const [form, setForm] = useState({
    businessCode: '',
    businessName: '',
    rnc: '',
    businessType: 'restaurante',
    adminName: '',
    adminEmail: '',
    phone: '',
    city: '',
    country: 'República Dominicana',
    plan: 'TRIAL_7_DAYS'
  });

  const loadNextBusinessCode = async () => {
    try {
      const { data } = await api.get('/activation/next-business-code');
      const nextCode = data?.data?.nextBusinessCode;
      if (nextCode) {
        setForm((prev) => ({ ...prev, businessCode: String(nextCode) }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo generar el ID de negocio');
    }
  };

  useEffect(() => {
    loadNextBusinessCode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        businessCode: form.businessCode ? Number(form.businessCode) : undefined,
        plan: 'TRIAL_7_DAYS'
      };
      const { data } = await api.post('/activation/request', payload);
      setRequestId(data.data?.id || data.data?.requestId || null);
      if (data.data?.autoApproved) {
        setTrialAccess({
          businessId: data.data.business?.id,
          businessCode: data.data.business?.businessCode,
          businessName: data.data.business?.name,
          email: data.data.credentials?.email,
          password: data.data.credentials?.password,
          pin: data.data.credentials?.pin,
          licenseKey: data.data.licenseKey
        });
        toast.success('Prueba activada. Credenciales generadas.');
      } else {
        setTrialAccess(null);
        toast.success('Solicitud enviada. Te contactaremos con tu clave.');
      }
      setForm({
        businessCode: '',
        businessName: '',
        rnc: '',
        businessType: 'restaurante',
        adminName: '',
        adminEmail: '',
        phone: '',
        city: '',
        country: 'República Dominicana',
        plan: 'TRIAL_7_DAYS'
      });
      loadNextBusinessCode();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8"
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Registro de Prueba — 7 Días</h1>
        <p className="text-slate-500 mb-6">Registra tu negocio y obtén acceso inmediato a la prueba del sistema.</p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-2">Contacto comercial</h2>
          <div className="text-sm text-slate-600 space-y-1">
            <div><strong>Email:</strong> ventas@bmtechrd.com</div>
            <div><strong>WhatsApp:</strong> +1 (809) 000-0000</div>
            <div><strong>Soporte:</strong> soporte@bmtechrd.com</div>
          </div>
        </div>

        {requestId && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
            <p className="text-sm font-semibold text-emerald-700">Solicitud registrada</p>
            <p className="text-xs text-emerald-600">ID de solicitud: <strong>{requestId}</strong></p>
          </div>
        )}

        {trialAccess && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6">
            <p className="text-sm font-semibold text-indigo-700">Acceso de prueba activado</p>
            <div className="text-xs text-indigo-600 mt-2 space-y-1">
              <div><strong>Negocio:</strong> {trialAccess.businessName}</div>
              <div><strong>ID Negocio:</strong> {trialAccess.businessCode ?? '—'}</div>
              <div><strong>BusinessId:</strong> {trialAccess.businessId}</div>
              <div><strong>Email:</strong> {trialAccess.email}</div>
              <div><strong>Contraseña:</strong> {trialAccess.password}</div>
              <div><strong>PIN:</strong> {trialAccess.pin}</div>
              <div><strong>Licencia:</strong> {trialAccess.licenseKey}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                <Hash size={16} /> ID de negocio
              </label>
              <input
                required
                title="ID de negocio"
                value={form.businessCode}
                readOnly
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-bold"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                <Building2 size={16} /> Nombre del negocio
              </label>
              <input
                required
                title="Nombre del negocio"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1">RNC / Cédula</label>
              <input
                title="RNC"
                value={form.rnc}
                onChange={(e) => setForm({ ...form, rnc: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1">Tipo de negocio</label>
              <select
                title="Tipo de negocio"
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="restaurante">Restaurante</option>
                <option value="colmado">Colmado</option>
                <option value="tienda">Tienda</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                <ClipboardList size={16} /> Plan
              </label>
              <div className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-bold">
                Prueba 7 días (TRIAL_7_DAYS)
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1">Nombre administrador</label>
              <input
                required
                title="Nombre administrador"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                <Mail size={16} /> Email administrador
              </label>
              <input
                required
                type="email"
                title="Email administrador"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                <Phone size={16} /> Teléfono
              </label>
              <input
                title="Teléfono"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                <MapPin size={16} /> Ciudad / País
              </label>
              <input
                title="Ciudad"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1">País</label>
              <input
                title="País"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

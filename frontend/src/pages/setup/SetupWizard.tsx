import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    User,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Store,
    Mail,
    Phone,
    MapPin,
    Key
} from 'lucide-react';
import api from '../../stores/api';
import { toast } from 'react-hot-toast';
import { useStore } from '../../stores/useStore';

export function SetupWizard() {
    const navigate = useNavigate();
    const { setUser } = useStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [businessData, setBusinessData] = useState({
        name: '',
        rnc: '',
        address: '',
        phone: '',
        email: '',
        currency: 'DOP'
    });

    const [adminData, setAdminData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        pin: ''
    });

    const handleBusinessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (adminData.password !== adminData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/setup/initialize', {
                business: businessData,
                admin: {
                    name: adminData.name,
                    email: adminData.email,
                    password: adminData.password,
                    pin: adminData.pin
                }
            });

            const { token, user } = response.data.data;
            localStorage.setItem('token', token);
            setUser({ ...user, token });

            setStep(3);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al inicializar el sistema');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
            >
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-blue-600 p-8 text-white">
                        <h1 className="text-3xl font-bold mb-2">Bienvenido a BMTECHRD POS</h1>
                        <p className="text-primary-100">Configuremos tu sistema en 3 simples pasos</p>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-2 mt-6">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`flex-1 h-2 rounded-full transition-all ${s <= step ? 'bg-white' : 'bg-white/30'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="p-8">
                        <AnimatePresence mode="wait">

                            {/* Step 1: Business Info */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                            <Building2 className="text-primary-600" size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">Información del Negocio</h2>
                                            <p className="text-slate-500">Datos básicos de tu restaurante</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleBusinessSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                                <Store size={16} />
                                                Nombre del Negocio *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={businessData.name}
                                                onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="Mi Restaurante"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">RNC</label>
                                                <input
                                                    type="text"
                                                    value={businessData.rnc}
                                                    onChange={(e) => setBusinessData({ ...businessData, rnc: e.target.value })}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    placeholder="000-00000-0"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                                    <Phone size={16} />
                                                    Teléfono
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={businessData.phone}
                                                    onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    placeholder="+1 (809) 000-0000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                                <MapPin size={16} />
                                                Dirección
                                            </label>
                                            <input
                                                type="text"
                                                value={businessData.address}
                                                onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="Calle Principal #123"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                                <Mail size={16} />
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={businessData.email}
                                                onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="info@restaurante.com"
                                            />
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                                            >
                                                <span>Continuar</span>
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* Step 2: Admin Account */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <User className="text-blue-600" size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">Cuenta Administrador</h2>
                                            <p className="text-slate-500">Crea tu usuario administrador</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleAdminSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
                                            <input
                                                type="text"
                                                required
                                                value={adminData.name}
                                                onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="Juan Pérez"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                            <input
                                                type="email"
                                                required
                                                value={adminData.email}
                                                onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="admin@restaurante.com"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={adminData.password}
                                                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    placeholder="••••••••"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar *</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={adminData.confirmPassword}
                                                    onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                                <Key size={16} />
                                                PIN de Seguridad (4 dígitos) *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                pattern="[0-9]{4}"
                                                maxLength={4}
                                                value={adminData.pin}
                                                onChange={(e) => setAdminData({ ...adminData, pin: e.target.value.replace(/\D/g, '') })}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-center text-lg"
                                                placeholder="0000"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                                            >
                                                <ArrowLeft size={20} />
                                                <span>Atrás</span>
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        <span>Inicializando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Finalizar Configuración</span>
                                                        <CheckCircle2 size={20} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* Step 3: Success */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                                    >
                                        <CheckCircle2 className="text-green-600" size={48} />
                                    </motion.div>
                                    <h2 className="text-3xl font-bold text-slate-800 mb-3">¡Todo Listo!</h2>
                                    <p className="text-slate-600 mb-2">Tu sistema ha sido configurado exitosamente</p>
                                    <p className="text-sm text-slate-500">Redirigiendo al dashboard...</p>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>

                <p className="text-center text-slate-600 text-sm mt-6">
                    &copy; {new Date().getFullYear()} BMTECHRD POS. Sistema profesional de punto de venta.
                </p>
            </motion.div>
        </div>
    );
}

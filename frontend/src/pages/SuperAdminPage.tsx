import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Search, PlusCircle, Building, Copy, Download, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../stores/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export function SuperAdminPage() {
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [activationRequests, setActivationRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showActivationModal, setShowActivationModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingLanding, setIsSavingLanding] = useState(false);
    const [activationForm, setActivationForm] = useState({ businessId: '', type: 'SIX_MONTHS' });
    const [newBusiness, setNewBusiness] = useState({
        name: '',
        ownerName: '',
        email: '',
        pin: ''
    });
    const [landingSettings, setLandingSettings] = useState({
        landingBackgroundUrl: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        contactWhatsapp: ''
    });

    const fetchData = async () => {
        try {
            const [bizRes, statsRes, requestsRes, landingRes] = await Promise.all([
                api.get('/superadmin/businesses'),
                api.get('/superadmin/stats'),
                api.get('/superadmin/activation-requests'),
                api.get('/superadmin/landing-settings')
            ]);
            setBusinesses(bizRes.data.data);
            setStats(statsRes.data.data);
            setActivationRequests(requestsRes.data.data || []);
            setLandingSettings({
                landingBackgroundUrl: landingRes.data.data?.landingBackgroundUrl || '',
                contactName: landingRes.data.data?.contactName || '',
                contactEmail: landingRes.data.data?.contactEmail || '',
                contactPhone: landingRes.data.data?.contactPhone || '',
                contactWhatsapp: landingRes.data.data?.contactWhatsapp || ''
            });
        } catch (error) {
            toast.error('Error al cargar panel de control global');
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            const res = await api.get('/superadmin/backup', { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/sql' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().split('T')[0]}.sql`;
            a.click();
            toast.success('Backup descargado');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'No se pudo generar el backup');
        }
    };

    const handleGenerateActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/superadmin/licenses/generate', activationForm);
            toast.success('Clave de activación generada');
            setShowActivationModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al generar licencia');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/superadmin/businesses', newBusiness);
            toast.success('Negocio registrado exitosamente');
            setShowRegisterModal(false);
            setNewBusiness({ name: '', ownerName: '', email: '', pin: '' });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al registrar negocio');
        } finally {
            setIsSaving(false);
        }
    };

    const generateLicense = async (businessId: string, type: string) => {
        try {
            await api.post('/superadmin/licenses/generate', { businessId, type });
            toast.success('Licencia generada exitosamente');
            fetchData();
        } catch (error) {
            toast.error('Error al generar licencia');
        }
    };

    const approveRequest = async (id: string, plan: string) => {
        try {
            const { data } = await api.post(`/superadmin/activation-requests/${id}/approve`, { plan });
            toast.success(`Clave generada: ${data.data.licenseKey}`);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al aprobar solicitud');
        }
    };

    const saveLandingSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingLanding(true);
        try {
            await api.put('/superadmin/landing-settings', landingSettings);
            toast.success('Página principal actualizada');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar la personalización');
        } finally {
            setIsSavingLanding(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-8 p-1 text-slate-900">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Shield className="text-red-600" size={32} /> PANEL DE CONTROL GLOBAL
                    </h1>
                    <p className="text-slate-500 font-medium">Gestión administrativa de licencias y negocios BMT-POS</p>
                </div>
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-full border border-red-100 flex items-center gap-2">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Acceso Restringido</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-slate-900">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Ventas Proyectadas (Global)</p>
                    <h2 className="text-4xl font-black text-slate-900">${Number(stats.totalSales).toFixed(2)}</h2>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Licencias Activas</p>
                    <h2 className="text-4xl font-black text-blue-600">{stats.activeLicenses}</h2>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Negocios Registrados</p>
                    <h2 className="text-4xl font-black text-green-600">{stats.totalBusinesses}</h2>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8">
                <h2 className="text-xl font-black text-slate-900">Personalizar Página Principal</h2>
                <p className="text-slate-500 text-sm mb-6">Configura fondo e información de contacto visibles en la página de inicio.</p>

                <form onSubmit={saveLandingSettings} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Imagen de Fondo (URL)</label>
                        <input
                            type="url"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                            placeholder="https://.../fondo.jpg"
                            value={landingSettings.landingBackgroundUrl}
                            onChange={(e) => setLandingSettings({ ...landingSettings, landingBackgroundUrl: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Contacto</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                                placeholder="BMTECHRD"
                                value={landingSettings.contactName}
                                onChange={(e) => setLandingSettings({ ...landingSettings, contactName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                                placeholder="ventas@bmtechrd.com"
                                value={landingSettings.contactEmail}
                                onChange={(e) => setLandingSettings({ ...landingSettings, contactEmail: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                                placeholder="+1 (809) 000-0000"
                                value={landingSettings.contactPhone}
                                onChange={(e) => setLandingSettings({ ...landingSettings, contactPhone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                                placeholder="+1 (809) 000-0000"
                                value={landingSettings.contactWhatsapp}
                                onChange={(e) => setLandingSettings({ ...landingSettings, contactWhatsapp: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSavingLanding}
                            className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 uppercase tracking-widest text-xs disabled:opacity-50"
                        >
                            {isSavingLanding ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col flex-1">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96 text-slate-900">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar negocio por nombre..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowRegisterModal(true)}
                            className="flex items-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                        >
                            <PlusCircle size={20} />
                            <span>Registrar Nuevo Negocio</span>
                        </button>
                        <button
                            onClick={() => setShowActivationModal(true)}
                            className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                        >
                            <KeyRound size={20} />
                            <span>Generar Clave</span>
                        </button>
                        <button
                            onClick={handleBackup}
                            className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
                        >
                            <Download size={20} />
                            <span>Backup BD</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Negocio</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Clave Licencia</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {businesses.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map((biz) => {
                                const activeLicense = biz.licenses?.find((l: any) => l.status === 'ACTIVE');
                                return (
                                    <tr key={biz.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-400">
                                                    <Building size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg leading-tight">{biz.name}</p>
                                                    <p className="text-slate-400 text-sm font-mono uppercase tracking-tighter">ID: {biz.businessCode ?? biz.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {activeLicense ? (
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black font-mono text-slate-600 border border-slate-200">
                                                        {activeLicense.key}
                                                    </code>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(activeLicense.key);
                                                            toast.success('Clave copiada');
                                                        }}
                                                        title="Copiar clave"
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary-600 transition-colors"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 font-bold italic text-xs">Sin Clave Generada</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={clsx(
                                                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                activeLicense ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                                            )}>
                                                {activeLicense ? 'Activa' : 'Sin Licencia'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700 font-mono">
                                                {activeLicense ? new Date(activeLicense.endDate).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 text-slate-900">
                                                <button
                                                    onClick={() => generateLicense(biz.id, 'SIX_MONTHS')}
                                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-colors uppercase tracking-widest"
                                                >
                                                    Renovar 6M
                                                </button>
                                                <button
                                                    onClick={() => generateLicense(biz.id, 'LIFETIME')}
                                                    className="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-[10px] font-black hover:bg-primary-100 transition-colors uppercase border border-primary-200 tracking-widest"
                                                >
                                                    Vitalicia
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col flex-1">
                <div className="p-8 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-900">Solicitudes de Activación</h2>
                    <p className="text-slate-500 text-sm">Clientes pendientes para generar clave</p>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">ID</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Negocio</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Administrador</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activationRequests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-6 text-slate-400">No hay solicitudes pendientes.</td>
                                </tr>
                            )}
                            {activationRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="text-slate-700 font-mono font-black">{req.businessCode || '—'}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-slate-900">{req.businessName}</div>
                                        <div className="text-xs text-slate-400">{req.city || '—'} {req.country ? `| ${req.country}` : ''}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-black uppercase tracking-widest">
                                            {req.plan === 'TRIAL_7_DAYS' ? '7 DÍAS' : req.plan === 'SIX_MONTHS' ? '6 MESES' : req.plan === 'TWELVE_MONTHS' ? 'ANUAL' : 'VITALICIO'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-slate-700 font-semibold">{req.adminName}</div>
                                        <div className="text-xs text-slate-400">{req.adminEmail}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            req.status === 'PENDING' ? "bg-amber-50 text-amber-700 border-amber-100" : req.status === 'APPROVED' ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                                        )}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {req.status === 'PENDING' ? (
                                            <button
                                                title="Aprobar y generar clave"
                                                onClick={() => approveRequest(req.id, req.plan)}
                                                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black hover:bg-primary-700 transition-colors uppercase tracking-widest"
                                            >
                                                Aprobar
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400">{req.licenseKey || '—'}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl text-slate-900"
                    >
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Registrar Nuevo Negocio</h2>
                        <p className="text-slate-500 mb-8 font-medium">Crea una nueva instancia de BMT-POS para un cliente.</p>

                        <form onSubmit={handleCreateBusiness} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                                    placeholder="Ej: Restaurant El Gran Sabor"
                                    value={newBusiness.name}
                                    onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Dueño</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                                        placeholder="Nombre completo"
                                        value={newBusiness.ownerName}
                                        onChange={(e) => setNewBusiness({ ...newBusiness, ownerName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">PIN Acceso</label>
                                    <input
                                        type="password"
                                        required
                                        maxLength={4}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-mono text-xl font-bold text-center tracking-[1rem]"
                                        placeholder="0000"
                                        value={newBusiness.pin}
                                        onChange={(e) => setNewBusiness({ ...newBusiness, pin: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                                    placeholder="cliente@ejemplo.com"
                                    value={newBusiness.email}
                                    onChange={(e) => setNewBusiness({ ...newBusiness, email: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 uppercase tracking-widest text-xs disabled:opacity-50"
                                >
                                    {isSaving ? 'Registrando...' : 'Confirmar Registro'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {showActivationModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl text-slate-900"
                    >
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Generar Clave de Activación</h2>
                        <p className="text-slate-500 mb-8 font-medium">Selecciona el negocio y el plan de licencia.</p>

                        <form onSubmit={handleGenerateActivation} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Negocio</label>
                                <select
                                    title="Seleccionar negocio"
                                    required
                                    value={activationForm.businessId}
                                    onChange={(e) => setActivationForm({ ...activationForm, businessId: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                                >
                                    <option value="">Seleccionar...</option>
                                    {businesses.map((biz) => (
                                        <option key={biz.id} value={biz.id}>{biz.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Plan</label>
                                <select
                                    title="Seleccionar plan"
                                    value={activationForm.type}
                                    onChange={(e) => setActivationForm({ ...activationForm, type: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold"
                                >
                                    <option value="TRIAL_7_DAYS">7 DÍAS</option>
                                    <option value="SIX_MONTHS">6 MESES</option>
                                    <option value="TWELVE_MONTHS">12 MESES</option>
                                    <option value="LIFETIME">VITALICIA</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowActivationModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 uppercase tracking-widest text-xs disabled:opacity-50"
                                >
                                    {isSaving ? 'Generando...' : 'Generar Clave'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

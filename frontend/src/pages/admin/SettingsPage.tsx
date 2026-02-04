import { useState, useEffect } from 'react';
import { Settings, Building2, Save, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../stores/api';
import { toast } from 'react-hot-toast';
import { useStore } from '../../stores/useStore';

interface BusinessSettings {
    name: string;
    rnc?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    currency: string;
    taxRate: number;
    tipRate: number;
}

export function SettingsPage() {
    const { setBusiness } = useStore();
    const [settings, setSettings] = useState<BusinessSettings>({
        name: '',
        rnc: '',
        address: '',
        phone: '',
        email: '',
        taxId: '',
        currency: 'DOP',
        taxRate: 18,
        tipRate: 10
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/business/settings');
            setSettings(data.data || settings);
        } catch (error) {
            toast.error('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.put('/business/settings', settings);
            setBusiness(data.data);
            toast.success('Configuración guardada exitosamente');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar configuración');
        } finally {
            setSaving(false);
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
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="text-primary-500" /> Configuración
                </h1>
                <p className="text-slate-500 text-sm">Personaliza tu sistema POS</p>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                    {/* Información del Negocio */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <Building2 className="text-primary-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Información del Negocio</h2>
                                <p className="text-sm text-slate-500">Datos básicos de tu restaurant</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Negocio *</label>
                                <input
                                    type="text"
                                    required
                                    value={settings.name}
                                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Mi Restaurante"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">RNC</label>
                                <input
                                    type="text"
                                    value={settings.rnc}
                                    onChange={(e) => setSettings({ ...settings, rnc: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="000-00000-0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID</label>
                                <input
                                    type="text"
                                    value={settings.taxId}
                                    onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="ID Fiscal"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    value={settings.address}
                                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Calle Principal #123"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    value={settings.phone}
                                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="+1 (809) 000-0000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="info@restaurant.com"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Configuración Regional */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Globe className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Configuración Regional</h2>
                                <p className="text-sm text-slate-500">Moneda y formatos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                                <select
                                    value={settings.currency}
                                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="DOP">DOP - Peso Dominicano</option>
                                    <option value="USD">USD - Dólar Americano</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="MXN">MXN - Peso Mexicano</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tasa Impuesto (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.taxRate}
                                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Propina Legal (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.tipRate}
                                    onChange={(e) => setSettings({ ...settings, tipRate: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Impresora Térmica */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Settings className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Impresora Térmica</h2>
                                <p className="text-sm text-slate-500">Configuración de tickets y facturas (Local)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tamaño del Papel</label>
                                <select
                                    value={localStorage.getItem('printerSize') || '80mm'}
                                    onChange={(e) => {
                                        localStorage.setItem('printerSize', e.target.value);
                                        toast.success('Tamaño de impresora actualizado');
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="80mm">80mm (Estándar)</option>
                                    <option value="58mm">58mm (Pequeña)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Corte de Papel</label>
                                <select
                                    value={localStorage.getItem('printerAutoCut') || 'true'}
                                    onChange={(e) => {
                                        localStorage.setItem('printerAutoCut', e.target.value);
                                        toast.success('Pre-ajuste de corte guardado');
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="true">Automático</option>
                                    <option value="false">Manual</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>

                    {/* Botón de Guardar */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>Guardar Cambios</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

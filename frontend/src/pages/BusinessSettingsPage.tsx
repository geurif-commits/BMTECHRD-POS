import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import api from '../stores/api';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

// Color preview component with dynamic colors
// Dynamic colors are displayed using inline styles which is necessary for runtime color customization
const ColorPreview = ({ color, label, testId }: { color: string; label: string; testId: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  return (
    <div 
      className="w-24 h-24 rounded-lg border-2 border-slate-300"
      // Inline style necessary for dynamic color values
      style={{ backgroundColor: color }}
      title={label}
      data-testid={testId}
      role="presentation"
    />
  );
};

export function BusinessSettingsPage() {
  const navigate = useNavigate();
  const { business, setBusiness } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    rnc: '',
    bankAccountNumber: '',
    bankName: '',
    bankAccountType: 'Cuenta Corriente',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#0ea5e9',
    logoUrl: '',
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        address: business.address || '',
        phone: business.phone || '',
        email: business.email || '',
        rnc: business.rnc || '',
        bankAccountNumber: business.bankAccountNumber || '',
        bankName: business.bankName || '',
        bankAccountType: business.bankAccountType || 'Cuenta Corriente',
        primaryColor: business.primaryColor || '#2563eb',
        secondaryColor: business.secondaryColor || '#1e40af',
        accentColor: business.accentColor || '#0ea5e9',
        logoUrl: business.logoUrl || '',
      });
    }
  }, [business]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put(`/business/${business?.id}`, formData);
      setBusiness(data.data);
      toast.success('Configuración guardada correctamente');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Atrás
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Configuración del Negocio</h1>
          <p className="text-slate-500 mb-8">Actualiza la información del negocio y detalles bancarios</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección Información General */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">
                Información General
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Ej: Mi Restaurante"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    RNC/CIF
                  </label>
                  <input
                    type="text"
                    name="rnc"
                    value={formData.rnc}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Ej: 123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Ej: +1 (809) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Ej: info@negocio.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Ej: Calle Principal 123, Ciudad"
                  />
                </div>
              </div>
            </div>

            {/* Sección Información Bancaria */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">
                Información Bancaria
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Estos datos se mostrarán en los comprobantes de transferencia
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre del Banco
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Ej: Banco de Reservas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número de Cuenta
                  </label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Ej: 1234567890123456"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Cuenta
                  </label>
                  <select
                    name="bankAccountType"
                    value={formData.bankAccountType}
                    onChange={handleChange}
                    title="Selecciona el tipo de cuenta bancaria"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="Cuenta Corriente">Cuenta Corriente</option>
                    <option value="Cuenta de Ahorros">Cuenta de Ahorros</option>
                    <option value="Cuenta Nómina">Cuenta Nómina</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección Personalización */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">
                Personalización
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Personaliza los colores y el logo de tu negocio
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    URL del Logo
                  </label>
                  <input
                    type="text"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Ej: https://ejemplo.com/logo.png"
                  />
                  {formData.logoUrl && (
                    <div className="mt-3 flex justify-center p-3 bg-slate-100 rounded-lg">
                      <img src={formData.logoUrl} alt="Logo preview" className="h-16 object-contain" />
                    </div>
                  )}
                </div>

                {/* Color Primario */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color Primario
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      title="Selecciona el color primario"
                      className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-mono text-sm"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>

                {/* Color Secundario */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color Secundario
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      title="Selecciona el color secundario"
                      className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-mono text-sm"
                      placeholder="#1e40af"
                    />
                  </div>
                </div>

                {/* Color Acentuado */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color Acentuado
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      title="Selecciona el color acentuado"
                      className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-mono text-sm"
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-slate-100 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 mb-3">Vista previa:</p>
                <div className="flex gap-3">
                  <ColorPreview color={formData.primaryColor} label="Color Primario" testId="color-preview-primary" />
                  <ColorPreview color={formData.secondaryColor} label="Color Secundario" testId="color-preview-secondary" />
                  <ColorPreview color={formData.accentColor} label="Color Acentuado" testId="color-preview-accent" />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6 border-t-2 border-slate-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  'flex-1 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors',
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700'
                )}
              >
                <Save size={18} />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

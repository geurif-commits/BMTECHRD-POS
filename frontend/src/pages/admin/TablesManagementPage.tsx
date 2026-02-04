import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, LayoutGrid, Users as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../stores/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface Table {
    id: string;
    number: number;
    name?: string;
    capacity: number;
    status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
    xPosition?: number;
    yPosition?: number;
}

export function TablesManagementPage() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [bulkCreate, setBulkCreate] = useState(false);

    const [formData, setFormData] = useState({
        number: '',
        name: '',
        capacity: '4'
    });

    const [bulkData, setBulkData] = useState({
        startNumber: '1',
        endNumber: '10',
        capacity: '4'
    });

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const { data } = await api.get('/tables');
            setTables(data.data || []);
        } catch (error) {
            toast.error('Error al cargar mesas');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                tableNumber: parseInt(formData.number),
                capacity: parseInt(formData.capacity)
            };

            if (editingTable) {
                await api.put(`/tables/${editingTable.id}`, { capacity: payload.capacity });
                toast.success('Mesa actualizada');
            } else {
                await api.post('/tables', payload);
                toast.success('Mesa creada');
            }

            setShowModal(false);
            resetForm();
            fetchTables();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar mesa');
        }
    };

    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const start = parseInt(bulkData.startNumber);
            const end = parseInt(bulkData.endNumber);

            if (start > end) {
                toast.error('El número inicial debe ser menor que el final');
                return;
            }

            if (end - start > 100) {
                toast.error('Máximo 100 mesas por operación');
                return;
            }

            await api.post('/tables/bulk-create', {
                startNumber: start,
                endNumber: end,
                capacity: parseInt(bulkData.capacity)
            });

            toast.success(`${end - start + 1} mesas creadas exitosamente`);
            setShowModal(false);
            setBulkCreate(false);
            resetForm();
            fetchTables();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear mesas');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta mesa? Se perderán todos los pedidos asociados.')) return;
        try {
            await api.delete(`/tables/${id}`);
            toast.success('Mesa eliminada');
            fetchTables();
        } catch (error) {
            toast.error('Error al eliminar mesa');
        }
    };

    const resetForm = () => {
        setFormData({
            number: '',
            name: '',
            capacity: '4'
        });
        setBulkData({
            startNumber: '1',
            endNumber: '10',
            capacity: '4'
        });
        setEditingTable(null);
        setBulkCreate(false);
    };

    const openEditModal = (table: Table) => {
        setEditingTable(table);
        setFormData({
            number: table.number.toString(),
            name: table.name || '',
            capacity: table.capacity.toString()
        });
        setShowModal(true);
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            'FREE': 'bg-green-100 text-green-700',
            'OCCUPIED': 'bg-red-100 text-red-700',
            'RESERVED': 'bg-yellow-100 text-yellow-700',
            'CLEANING': 'bg-blue-100 text-blue-700'
        };
        const labels: Record<string, string> = {
            'FREE': 'Libre',
            'OCCUPIED': 'Ocupada',
            'RESERVED': 'Reservada',
            'CLEANING': 'Limpieza'
        };
        return { color: colors[status] || 'bg-slate-100 text-slate-700', label: labels[status] || status };
    };

    const filteredTables = tables
        .filter(t =>
            t.number.toString().includes(searchTerm) ||
            t.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.number - b.number);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutGrid className="text-primary-500" /> Gestión de Mesas
                    </h1>
                    <p className="text-slate-500 text-sm">Administra las mesas de tu restaurante (máx. 100)</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { resetForm(); setBulkCreate(true); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={20} />
                        <span>Crear Múltiples</span>
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                    >
                        <Plus size={20} />
                        <span>Nueva Mesa</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar mesas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <div className="bg-slate-100 px-4 py-2 rounded-xl">
                    <span className="text-sm text-slate-600 font-medium">Total: {tables.length} mesas</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {filteredTables.map((table) => {
                        const statusInfo = getStatusBadge(table.status);
                        return (
                            <motion.div
                                key={table.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-xl border border-slate-200 hover:border-primary-300 transition-all shadow-sm hover:shadow-md p-4"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                            <span className="text-primary-700 font-bold text-lg">{table.number}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">{table.name || `Mesa ${table.number}`}</h3>
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <UsersIcon size={12} />
                                                <span>{table.capacity} pers.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <span className={clsx('px-2 py-1 text-xs font-semibold rounded-lg', statusInfo.color)}>
                                        {statusInfo.label}
                                    </span>
                                </div>

                                <div className="flex gap-1 pt-2 border-t border-slate-100">
                                    <button
                                        onClick={() => openEditModal(table)}
                                        title="Editar mesa"
                                        className="flex-1 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(table.id)}
                                        title="Eliminar mesa"
                                        className="flex-1 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md"
                        >
                            <h2 className="text-xl font-bold mb-4">
                                {bulkCreate ? 'Crear Múltiples Mesas' : editingTable ? 'Editar Mesa' : 'Nueva Mesa'}
                            </h2>

                            {bulkCreate ? (
                                <form onSubmit={handleBulkCreate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Número Inicial</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                required
                                                title="Número inicial"
                                                value={bulkData.startNumber}
                                                onChange={(e) => setBulkData({ ...bulkData, startNumber: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Número Final</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                required
                                                title="Número final"
                                                value={bulkData.endNumber}
                                                onChange={(e) => setBulkData({ ...bulkData, endNumber: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            required
                                            title="Capacidad"
                                            value={bulkData.capacity}
                                            onChange={(e) => setBulkData({ ...bulkData, capacity: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm text-blue-800">
                                            Se crearán {Math.max(0, parseInt(bulkData.endNumber) - parseInt(bulkData.startNumber) + 1)} mesas
                                        </p>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); resetForm(); }}
                                            className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                                        >
                                            Crear Mesas
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Número de Mesa</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            required
                                            title="Número de mesa"
                                            value={formData.number}
                                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            disabled={!!editingTable}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre (opcional)</label>
                                        <input
                                            type="text"
                                            title="Nombre de mesa"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Mesa VIP, Terraza, etc."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            required
                                            title="Capacidad"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); resetForm(); }}
                                            className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                                        >
                                            {editingTable ? 'Actualizar' : 'Crear'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

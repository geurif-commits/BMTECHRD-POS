import { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingDown, Download, RefreshCw, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../stores/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface InventoryItem {
    id: string;
    product: {
        id: string;
        name: string;
        type?: 'DRINK' | 'FOOD' | string;
        category: { name: string };
    };
    quantity: number;
    minStock: number;
    lastUpdate: string;
}

export function InventoryReportsPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'DRINK' | 'FOOD'>('all');
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [editForm, setEditForm] = useState({ quantity: 0, minStock: 0 });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const { data } = await api.get('/inventory');
            setInventory(data.data || []);
        } catch (error) {
            toast.error('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setEditForm({ quantity: item.quantity, minStock: item.minStock });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        setIsSaving(true);
        try {
            await api.patch(`/inventory/${editingItem.product.id}`, editForm);
            toast.success('Inventario actualizado');
            setEditingItem(null);
            fetchInventory();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar');
        } finally {
            setIsSaving(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['Producto', 'Categoría', 'Cantidad', 'Stock Mínimo', 'Estado', 'Última Actualización'];
        const rows = filteredInventory.map(item => [
            item.product.name,
            item.product.category.name,
            item.quantity.toString(),
            item.minStock.toString(),
            getStockStatus(item).label,
            new Date(item.lastUpdate).toLocaleString('es-DO', {
                timeZone: 'America/Santo_Domingo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Reporte exportado');
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.quantity === 0) {
            return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Agotado', icon: AlertTriangle };
        } else if (item.quantity <= item.minStock) {
            return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Bajo', icon: TrendingDown };
        }
        return { color: 'bg-green-100 text-green-700 border-green-200', label: 'Óptimo', icon: Package };
    };

    const filteredInventory = inventory.filter(item => {
        if (typeFilter !== 'all' && item.product.type !== typeFilter) return false;
        if (filter === 'low') return item.quantity > 0 && item.quantity <= item.minStock;
        if (filter === 'out') return item.quantity === 0;
        return true;
    });

    const stats = {
        total: inventory.length,
        low: inventory.filter(i => i.quantity > 0 && i.quantity <= i.minStock).length,
        out: inventory.filter(i => i.quantity === 0).length,
        optimal: inventory.filter(i => i.quantity > i.minStock).length
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-primary-500" /> Gestión de Inventario
                    </h1>
                    <p className="text-slate-500 text-sm">Control de stock y niveles críticos</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchInventory}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <RefreshCw size={18} />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                    >
                        <Download size={18} />
                        <span>Exportar CSV</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Total Productos</span>
                        <Package className="text-blue-500" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:border-green-300"
                    onClick={() => setFilter('all')}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Stock Óptimo</span>
                        <Package className="text-green-500" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.optimal}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:border-yellow-300"
                    onClick={() => setFilter('low')}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Stock Bajo</span>
                        <TrendingDown className="text-yellow-500" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.low}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:border-red-300"
                    onClick={() => setFilter('out')}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Agotados</span>
                        <AlertTriangle className="text-red-500" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.out}</p>
                </motion.div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
                {[
                    { value: 'all', label: 'Todos' },
                    { value: 'low', label: 'Stock Bajo' },
                    { value: 'out', label: 'Agotados' }
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value as any)}
                        className={clsx(
                            'px-4 py-2 rounded-lg transition-colors font-medium text-sm',
                            filter === tab.value
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {[
                    { value: 'all', label: 'Todos' },
                    { value: 'DRINK', label: 'Bebidas' },
                    { value: 'FOOD', label: 'Alimentos' }
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setTypeFilter(tab.value as any)}
                        className={clsx(
                            'px-4 py-2 rounded-lg transition-colors font-medium text-sm',
                            typeFilter === tab.value
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-500/30'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Inventory Table */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-white rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Producto</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Categoría</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Cantidad</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Stock Mín.</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Estado</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInventory.map((item) => {
                            const status = getStockStatus(item);
                            const StatusIcon = status.icon;
                            return (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-slate-900">{item.product.name}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-slate-600">{item.product.category.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={clsx(
                                            'font-bold text-lg',
                                            item.quantity === 0 ? 'text-red-600' :
                                                item.quantity <= item.minStock ? 'text-yellow-600' : 'text-green-600'
                                        )}>
                                            {item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-slate-600 font-medium">{item.minStock}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            <span className={clsx('px-3 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1', status.color)}>
                                                <StatusIcon size={12} />
                                                {status.label}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            title="Editar producto"
                                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredInventory.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="mx-auto text-slate-300 mb-3" size={48} />
                        <p className="text-slate-500">No hay productos en esta categoría</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Actualizar Stock</h3>
                                <button
                                    onClick={() => setEditingItem(null)}
                                    title="Cerrar"
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-2">Producto</p>
                                    <p className="font-bold text-slate-800 text-lg">{editingItem.product.name}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad en Existencia</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={editForm.quantity}
                                        onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                                        title="Cantidad en existencia"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo (Alerta)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={editForm.minStock}
                                        onChange={(e) => setEditForm({ ...editForm, minStock: parseInt(e.target.value) || 0 })}
                                        title="Stock mínimo"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingItem(null)}
                                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                <span>Guardar</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

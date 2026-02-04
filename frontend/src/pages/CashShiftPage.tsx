import { useState, useEffect, useCallback } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, CheckCircle, AlertTriangle, History, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../stores/api';
import { toast } from 'react-hot-toast';
import { useStore } from '../stores/useStore';
import { printZReport } from '../utils/printService';

interface CashShift {
    id: string;
    openedAt: string;
    openingBalance: number;
    expectedCash: number;
    totalSales: number;
    totalSold?: number;
    totalExpenses: number;
    status: 'OPEN' | 'CLOSED';
    expenses: Array<{ description: string; amount: number; category: string; createdAt: string }>;
    user?: { id: string; name: string };
}

export function CashShiftPage() {
    const { business } = useStore();
    const [activeShift, setActiveShift] = useState<CashShift | null>(null);
    const [loading, setLoading] = useState(true);
    const [openingBalance, setOpeningBalance] = useState('');
    const [actualCash, setActualCash] = useState('');
    const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'GENERAL' });
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);

    const fetchShiftStatus = useCallback(async () => {
        try {
            const { data } = await api.get('/cash/status');
            setActiveShift(data.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar estado de caja');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShiftStatus();
    }, [fetchShiftStatus]);

    const handleOpenShift = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/cash/open', {
                openingBalance: parseFloat(openingBalance)
            });
            setActiveShift(data.data);
            toast.success('Caja abierta exitosamente');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al abrir caja');
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/cash/expenses', {
                description: expenseForm.description,
                amount: parseFloat(expenseForm.amount),
                category: expenseForm.category
            });
            setShowExpenseModal(false);
            setExpenseForm({ description: '', amount: '', category: 'GENERAL' });
            fetchShiftStatus();
            toast.success('Gasto registrado');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al registrar gasto');
        }
    };

    const handleCloseShift = async () => {
        if (!activeShift) return;
        try {
            const { data } = await api.post(`/cash/close/${activeShift.id}`, {
                actualCash: parseFloat(actualCash)
            });

            // Print Z-Report automatically
            printZReport({
                business,
                shift: data.data,
                user: useStore.getState().user
            });

            setActiveShift(null);
            setShowCloseModal(false);
            fetchShiftStatus();
            toast.success('Caja cerrada exitosamente. Reporte Z generado.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al cerrar caja');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!activeShift) {
        return (
            <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center">
                <div className="p-4 bg-primary-100 rounded-full mb-6">
                    <Wallet className="text-primary-600 w-12 h-12" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Apertura de Caja</h1>
                <p className="text-slate-500 mb-8">Debes iniciar un nuevo turno para comenzar a registrar ventas y gastos de hoy.</p>

                <form onSubmit={handleOpenShift} className="w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
                    <div className="text-left">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Monto Inicial en Efectivo (Fondo)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                autoFocus
                                className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 active:scale-95"
                    >
                        Abrir Turno de Caja
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Wallet className="text-primary-500" /> Turno de Caja Activo
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Abierto el {new Date(activeShift.openedAt).toLocaleString('es-DO', {
                            timeZone: 'America/Santo_Domingo',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowExpenseModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold border border-red-100"
                    >
                        <ArrowDownCircle size={20} />
                        <span>Registrar Gasto</span>
                    </button>
                    <button
                        onClick={() => setShowCloseModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg"
                    >
                        <CheckCircle size={20} />
                        <span>Cerrar Turno</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Turno / Cajero</p>
                    <h3 className="text-lg font-bold text-slate-800">{activeShift.user?.name || 'Cajero'}</h3>
                    <p className="text-xs text-slate-500 mt-1">ID Turno: {activeShift.id.split('-')[0]}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Saldo Inicial</p>
                    <h3 className="text-2xl font-bold text-slate-800">${Number(activeShift.openingBalance).toFixed(2)}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Vendido (Hasta ahora)</p>
                    <h3 className="text-2xl font-bold text-emerald-600">${Number(activeShift.totalSold || 0).toFixed(2)}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Fondo de Caja</p>
                    <h3 className="text-2xl font-bold text-slate-800">${Number(activeShift.openingBalance).toFixed(2)}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Ventas en Efectivo</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-green-600">${Number(activeShift.totalSales).toFixed(2)}</h3>
                        <ArrowUpCircle className="text-green-500 w-4 h-4" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Egresos / Gastos</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-red-600">-${Number(activeShift.totalExpenses).toFixed(2)}</h3>
                        <ArrowDownCircle className="text-red-500 w-4 h-4" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-primary-100 bg-primary-50/30">
                    <p className="text-primary-700 text-sm font-bold mb-1 uppercase tracking-wider">Efectivo Esperado</p>
                    <h3 className="text-3xl font-bold text-primary-900">${Number(activeShift.expectedCash).toFixed(2)}</h3>
                </div>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <History className="text-slate-400" size={20} /> Historial de Movimientos
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                        {activeShift.expenses.length === 0 && activeShift.totalSales === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                                <Info size={48} className="mb-2 opacity-20" />
                                <p>No hay movimientos registrados en este turno.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Hora</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Descripción</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tipo</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeShift.expenses.map((e, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(e.createdAt).toLocaleTimeString('es-DO', {
                                                    timeZone: 'America/Santo_Domingo',
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700">{e.description}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-bold uppercase">Egreso</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-red-600">-${Number(e.amount).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {/* Note: In a real app we'd fetch individual payments too, here we show summary or just expenses */}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                        <h3 className="flex items-center gap-2 text-amber-800 font-bold mb-2">
                            <AlertTriangle size={20} /> Nota Importante
                        </h3>
                        <p className="text-amber-700 text-sm leading-relaxed">
                            El cuadre de caja compara el dinero que el sistema indica que "debería haber" contra el dinero real contado físicamente.
                            Cualquier diferencia será marcada como faltante o sobrante al cerrar el turno.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4">Ayuda de Monedas</h3>
                        <p className="text-xs text-slate-500 mb-4 uppercase tracking-widest font-bold">Resumen de Totales</p>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Entradas (Caja + Ventas)</span>
                                <span className="font-bold text-slate-800">${(Number(activeShift.openingBalance) + Number(activeShift.totalSales)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Salidas (Gastos)</span>
                                <span className="font-bold text-red-600">-${Number(activeShift.totalExpenses).toFixed(2)}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                                <span>Saldo Actual</span>
                                <span>${Number(activeShift.expectedCash).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Modal */}
            <AnimatePresence>
                {showExpenseModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Registrar Egreso de Caja</h2>
                            <form onSubmit={handleAddExpense} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción / Motivo</label>
                                    <input
                                        type="text"
                                        required
                                        value={expenseForm.description}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Ej: Pago de hielo, gas, propina extra"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                                    <select
                                        value={expenseForm.category}
                                        title="Categoría de gasto"
                                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                        <option value="GENERAL">General/Otros</option>
                                        <option value="SUPPLIES">Insumos</option>
                                        <option value="MAINTENANCE">Mantenimiento</option>
                                        <option value="STAFF">Personal</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowExpenseModal(false)}
                                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                                    >
                                        Registrar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showCloseModal && (
                    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-[2rem] p-10 w-full max-w-lg shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-blue-500" />
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Cuadre Final</h2>
                            <p className="text-slate-500 mb-8 font-medium">Contabiliza el efectivo físico que tienes en este momento para cerrar la caja.</p>

                            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Deben Haber</p>
                                    <p className="text-2xl font-black text-slate-900 font-mono">${Number(activeShift.expectedCash).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Ventas Hoy</p>
                                    <p className="text-2xl font-black text-green-600 font-mono">${Number(activeShift.totalSales).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Dinero Físico Real en Caja</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={actualCash}
                                            onChange={(e) => setActualCash(e.target.value)}
                                            className="w-full pl-12 pr-6 py-5 bg-primary-50 rounded-2xl text-4xl font-black text-primary-900 border-2 border-primary-200 focus:border-primary-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCloseModal(false)}
                                        className="flex-1 py-5 border-2 border-slate-200 rounded-2xl text-slate-500 font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        onClick={handleCloseShift}
                                        className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-slate-500/20 uppercase tracking-widest"
                                    >
                                        Confirmar y Cerrar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

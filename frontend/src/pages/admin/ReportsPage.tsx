/* eslint-disable react/no-inline-styles */
import { useState, useEffect } from 'react';
import { BarChart3, Calendar, Download, Filter, TrendingUp, PieChart as PieIcon, Users } from 'lucide-react';
import api from '../../stores/api';
import { toast } from 'react-hot-toast';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const COLOR_CLASSES = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500', 'bg-pink-500'];

export function AdvancedReportsPage() {
    const formatMoney = (value: number) =>
        new Intl.NumberFormat('es-DO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [data, setData] = useState<any>({
        byProduct: [],
        byWaiter: [],
        byHour: [],
        kpis: {}
    });

    const fetchReports = async () => {
        try {
            const [productRes, waiterRes, hourRes, kpisRes] = await Promise.all([
                api.get('/dashboard/sales/by-product', { params: { startDate: dateRange.start, endDate: dateRange.end } }),
                api.get('/dashboard/sales/by-waiter', { params: { startDate: dateRange.start, endDate: dateRange.end } }),
                api.get('/dashboard/sales/by-hour', { params: { date: dateRange.end } }),
                api.get('/dashboard/kpis')
            ]);

            setData({
                byProduct: productRes.data.data || [],
                byWaiter: waiterRes.data.data || [],
                byHour: hourRes.data.data || [],
                kpis: kpisRes.data.data || {}
            });
        } catch (error) {
            toast.error('Error al cargar reportes');
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="text-primary-500" /> Reportes Avanzados
                    </h1>
                    <p className="text-slate-500 text-sm">Análisis detallado de ventas y rendimiento</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <Calendar size={18} className="text-slate-400 ml-2" />
                        <input
                            type="date"
                            title="Fecha inicio"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0"
                        />
                        <span className="text-slate-300">al</span>
                        <input
                            type="date"
                            title="Fecha fin"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0"
                        />
                    </div>
                    <button
                        onClick={fetchReports}
                        title="Aplicar filtros"
                        className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                    >
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-500" /> Rendimiento de Ventas por Producto
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.byProduct.slice(0, 10)}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PieIcon size={20} className="text-purple-500" /> Participación por Camarero
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.byWaiter}
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="total"
                                >
                                    {data.byWaiter.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {data.byWaiter.slice(0, 4).map((w: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${COLOR_CLASSES[idx % COLOR_CLASSES.length]}`} />
                                    <span className="text-slate-600 font-medium">{w.name}</span>
                                </div>
                                <span className="font-bold text-slate-800">${formatMoney(Number(w.total))}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={20} className="text-blue-500" /> Tabla de Rendimiento Detallada
                    </h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
                        <Download size={16} /> Exportar Excel
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 pb-4">
                                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Insumo/Producto</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Vendidos</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Ingreso Bruto</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Popularidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.byProduct.map((p: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4 font-bold text-slate-700">{p.name}</td>
                                    <td className="px-4 py-4 text-slate-500 font-medium">{p.quantity}</td>
                                    <td className="px-4 py-4 text-primary-600 font-black">${formatMoney(Number(p.total))}</td>
                                    <td className="px-4 py-4">
                                        <div className="text-xs font-semibold text-slate-600">
                                            {Math.min(100, (p.quantity / (data.byProduct[0]?.quantity || 1)) * 100).toFixed(0)}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

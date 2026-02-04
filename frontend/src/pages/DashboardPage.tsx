import { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, Package, Users, LogOut } from 'lucide-react';
import api from '../stores/api';
import { getSocket } from '../utils/socket';

export function DashboardPage() {
  const formatMoney = (value: number) =>
    new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  const [kpis, setKpis] = useState<{
    todaySales?: number;
    todayOrdersCount?: number;
    pendingOrders?: number;
    servedNotPaid?: number;
  }>({});
  const [salesByHour, setSalesByHour] = useState<{ hour: number; total: number }[]>([]);
  const [salesByProduct, setSalesByProduct] = useState<{ name: string; total: number; quantity: number }[]>([]);
  const [salesByWaiter, setSalesByWaiter] = useState<{ name: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [kpisRes, hourRes, productRes, waiterRes] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/dashboard/sales/by-hour', { params: { date: today } }),
        api.get('/dashboard/sales/by-product', { params: { startDate: today, endDate: today } }),
        api.get('/dashboard/sales/by-waiter', { params: { startDate: today, endDate: today } })
      ]);
      setKpis(kpisRes.data.data ?? {});
      setSalesByHour((hourRes.data.data ?? []).map((d: { hour: number; total: number }) => ({ ...d, name: `${d.hour}:00` })));
      setSalesByProduct(productRes.data.data ?? []);
      setSalesByWaiter(waiterRes.data.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);

    s.on('order_paid', () => fetchData());
    s.on('new_order', () => fetchData());
    s.on('item_served', () => fetchData());

    return () => {
      s.disconnect();
    };
  }, [token, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color
  }: {
    title: string;
    value: string | number;
    icon: typeof DollarSign;
    color: string;
  }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="h-full bg-slate-50 p-6 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LogOut className="text-primary-500 rotate-180" /> Dashboard
          </h1>
          <p className="text-slate-500 text-sm">Resumen en tiempo real</p>
        </div>
        <div className="text-sm text-slate-500 font-medium bg-white px-3 py-1 rounded-lg border border-slate-200">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Ventas hoy"
          value={`$${formatMoney(kpis.todaySales ?? 0)}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Órdenes hoy"
          value={kpis.todayOrdersCount ?? 0}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Órdenes pendientes"
          value={kpis.pendingOrders ?? 0}
          icon={Package}
          color="bg-orange-500"
        />
        <StatCard
          title="Servidas sin cobrar"
          value={kpis.servedNotPaid ?? 0}
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Ventas por hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Productos más vendidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByProduct.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="name"
                  position="inside"
                  angle={-90}
                  fill="#0f172a"
                  fontSize={11}
                  offset={10}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Ventas por camarero</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-gray-600">
                <th className="pb-2">Camarero</th>
                <th className="pb-2">Órdenes</th>
                <th className="pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {salesByWaiter.map((w) => (
                <tr key={w.name} className="border-b">
                  <td className="py-3 font-medium">{w.name}</td>
                  <td className="py-3">{w.count}</td>
                  <td className="py-3 font-bold text-green-600">${formatMoney(w.total ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

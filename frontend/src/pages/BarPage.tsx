import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarOrderCard } from '../components/bar/BarOrderCard';
import { InventoryAlert } from '../components/bar/InventoryAlert';
import { useStore } from '../stores/useStore';
import api from '../stores/api';
import { getSocket } from '../utils/socket';
import { Wine, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function BarPage() {
  const { business } = useStore();
  const [orders, setOrders] = useState<{
    id: string;
    table?: { number: number };
    items: Array<{ id: string; quantity: number; notes?: string | null; status: string; product: { name: string; type: string } }>;
    createdAt: string;
  }[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<{ id: string; productId: string; quantity: number; minStock: number; product?: { name: string; type?: string } }[]>([]);
  const [summary, setSummary] = useState({
    day: { pendingCount: 0, dispatchedCount: 0 },
    shift: { pendingCount: 0, dispatchedCount: 0, shiftOpen: false }
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/bar');
      const normalizedOrders = (data.data ?? []).map((order: any) => ({
        ...order,
        table: order.table?.tableNumber
          ? { number: order.table.tableNumber }
          : order.table,
        items: order.orderItems ?? order.items ?? []
      }));
      setOrders(normalizedOrders);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const { data } = await api.get('/inventory/low-stock');
      const alerts = (data.data ?? []).filter((item: any) => item.product?.type === 'DRINK');
      setInventoryAlerts(alerts);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/bar/summary');
      setSummary({
        day: {
          pendingCount: data.data?.day?.pendingCount ?? 0,
          dispatchedCount: data.data?.day?.dispatchedCount ?? 0
        },
        shift: {
          pendingCount: data.data?.shift?.pendingCount ?? 0,
          dispatchedCount: data.data?.shift?.dispatchedCount ?? 0,
          shiftOpen: Boolean(data.data?.shift?.shiftOpen)
        }
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchInventory();
    fetchSummary();
  }, [fetchOrders, fetchInventory, fetchSummary]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    s.on('connect', () => { });
    s.on('order_sent_to_bar', () => {
      fetchOrders();
      fetchSummary();
      toast('Nueva comanda bar', { icon: '🍸' });
    });
    s.on('new_order', (payload: { type?: string }) => {
      if (payload.type === 'BAR') {
        fetchOrders();
        fetchSummary();
        toast('Nueva comanda bar', { icon: '🍸' });
      }
    });
    return () => {
      s.disconnect();
    };
  }, [token, fetchOrders]);

  const handleItemStatusChange = async (itemId: string, orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/item/${itemId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, items: o.items.map((i) => (i.id === itemId ? { ...i, status } : i)) }
            : o
        )
      );
      fetchSummary();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar estado');
    }
  };

  const pendingOrders = orders.filter((o) =>
    o.items.some((i) => i.status === 'PENDING' || i.status === 'PREPARING')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wine className="text-blue-500" /> Bar - {business?.name || 'BMTECHRD'}
          </h1>
          <p className="text-slate-500 text-sm">Gestion de bebidas</p>
        </div>
        <div className="flex items-center gap-4">
          {inventoryAlerts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-700 text-sm">{inventoryAlerts.length} stock bajo</span>
            </div>
          )}
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold">
            {pendingOrders.length} Pendientes
          </div>
        </div>
      </div>
      <div className="px-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm">
            <div className="text-sm text-blue-600 font-semibold">Hoy - Pendientes</div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{summary.day.pendingCount || pendingOrders.length}</div>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
            <div className="text-sm text-emerald-600 font-semibold">Hoy - Despachadas</div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{summary.day.dispatchedCount}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm">
            <div className="text-sm text-blue-600 font-semibold">Turno actual - Pendientes</div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{summary.shift.pendingCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
            <div className="text-sm text-emerald-600 font-semibold">Turno actual - Despachadas</div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{summary.shift.dispatchedCount}</div>
          </div>
        </div>
        {!summary.shift.shiftOpen && (
          <p className="text-xs text-slate-500">No hay turno de caja abierto. Los conteos por turno están en 0.</p>
        )}
      </div>
      {inventoryAlerts.length > 0 && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-red-700">Stock bajo</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {inventoryAlerts.map((alert) => (
              <InventoryAlert key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Órdenes ({pendingOrders.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {pendingOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
              >
                <BarOrderCard order={order} onItemStatusChange={handleItemStatusChange} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

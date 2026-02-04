import { motion } from 'framer-motion';
import { Clock, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  table?: { number: number };
  user?: { name: string };
  items: Array<{
    id: string;
    quantity: number;
    notes?: string | null;
    status: string;
    product: { name: string; type: string };
  }>;
  createdAt: string;
}

interface KitchenOrderCardProps {
  order: Order;
  onItemStatusChange: (itemId: string, orderId: string, status: string) => void;
}

export function KitchenOrderCard({ order, onItemStatusChange }: KitchenOrderCardProps) {
  const tableNumber = order.table?.number ?? order.id.slice(0, 6);

  return (
    <motion.div
      layout
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-4"
    >
      <div className="bg-orange-500 text-white px-4 py-2 flex justify-between items-center">
        <span className="font-bold">Mesa {tableNumber}</span>
        <span className="text-sm opacity-90">
          {new Date(order.createdAt).toLocaleTimeString('es-DO', {
            timeZone: 'America/Santo_Domingo',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div>
              <span className="font-medium text-gray-800">
                {item.quantity}x {item.product?.name ?? 'Producto'}
              </span>
              {item.notes && (
                <p className="text-sm text-gray-500 mt-0.5">Nota: {item.notes}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {item.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => onItemStatusChange(item.id, order.id, 'PREPARING')}
                  className="px-3 py-2 rounded-lg bg-orange-100 text-orange-700 font-medium text-sm"
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  Preparar
                </button>
              )}
              {(item.status === 'PENDING' || item.status === 'PREPARING') && (
                <button
                  type="button"
                  onClick={() => onItemStatusChange(item.id, order.id, 'SERVED')}
                  className="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-medium text-sm"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Listo
                </button>
              )}
              {item.status === 'SERVED' && (
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  Servido
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

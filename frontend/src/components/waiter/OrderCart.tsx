import { motion } from 'framer-motion';
import { Trash2, Send, ShoppingBag } from 'lucide-react';
import { useStore } from '../../stores/useStore';
import clsx from 'clsx';

interface Table {
  id: string;
  number: number;
  status: string;
}

interface OrderCartProps {
  onSendOrder: () => void;
  onCancelOrder?: () => void;
  selectedTable: Table | null;
  orderStatus?: string | null;
}

export function OrderCart({ onSendOrder, onCancelOrder, selectedTable, orderStatus }: OrderCartProps) {
  const { cart, removeFromCart, updateCartItem } = useStore();
  const isReadOnly = orderStatus === 'PAID';

  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Comanda</h2>
          {selectedTable && (
            <span className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full border border-primary-200">
              Mesa {selectedTable.number}
            </span>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {!selectedTable ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
            <div className="p-5 bg-slate-100 rounded-full mb-4">
              <Send size={28} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">Selecciona una mesa para comenzar</p>
          </div>
        ) : selectedTable.status !== 'FREE' && selectedTable.status !== 'RESERVED' && cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
            <p className="text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200 font-medium">
              Mesa ocupada. Verifica PIN para editar.
            </p>
          </div>
        ) : cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
              <ShoppingBag size={24} strokeWidth={1} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">Carrito vacío</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <motion.div
                key={item.tempId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <p className="font-semibold text-slate-800 text-sm line-clamp-2 flex-1">{item.name}</p>
                  <span className="font-bold text-primary-600 text-base whitespace-nowrap ml-auto">
                    ${((item.price || 0) * item.quantity).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {/* Quantity Control */}
                  <div className="inline-flex items-center gap-0.5 bg-slate-100 rounded-full p-1 border border-slate-200">
                    <button
                      onClick={() => updateCartItem(item.tempId, { quantity: Math.max(1, item.quantity - 1) })}
                      disabled={isReadOnly}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm text-slate-600 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItem(item.tempId, { quantity: item.quantity + 1 })}
                      disabled={isReadOnly}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm text-primary-600 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeFromCart(item.tempId)}
                    disabled={isReadOnly}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar producto del carrito"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Totals */}
      {cart.length > 0 && (
        <div className="bg-white border-t-2 border-slate-100 p-5 shadow-2xl z-10">
          <div className="space-y-2.5 mb-5">
            <div className="flex justify-between text-slate-500 text-xs font-medium">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs font-medium">
              <span>IVA (18%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-lg pt-3 border-t border-slate-200">
              <span>Total</span>
              <span className="text-primary-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid gap-2">
            {selectedTable && selectedTable.status === 'OCCUPIED' && !isReadOnly && (
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas ANULAR toda la orden?')) {
                    onCancelOrder?.();
                  }
                }}
                className="py-3 px-4 rounded-lg bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors border border-red-200"
              >
                Anular Orden
              </button>
            )}
            <button
              onClick={onSendOrder}
              disabled={!selectedTable || isReadOnly}
              className={clsx(
                "py-3 px-4 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none hover:shadow-lg hover:shadow-primary-500/40",
                !selectedTable && "opacity-50 cursor-not-allowed"
              )}
            >
              <Send size={16} />
              <span>{isReadOnly ? 'Orden Facturada' : selectedTable && selectedTable.status === 'OCCUPIED' ? 'Actualizar Comanda' : 'Enviar Comanda'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

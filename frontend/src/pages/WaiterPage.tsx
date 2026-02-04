import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TablesGrid } from '../components/waiter/TablesGrid';
import { ProductsGrid } from '../components/waiter/ProductsGrid';
import { OrderCart } from '../components/waiter/OrderCart';
import { WaiterSelection } from '../components/waiter/WaiterSelection';
import { PinPad } from '../components/common/PinPad';
import { useStore, type Table } from '../stores/useStore';
import api from '../stores/api';
import { getSocket } from '../utils/socket';
import { toast } from 'react-hot-toast';
import { ArrowLeft, User as UserIcon } from 'lucide-react';

export function WaiterPage() {
  const [categories, setCategories] = useState<{ id: string; name: string; type: string; products?: unknown[] }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; price: number; type: string; category?: { id: string; name: string } }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderStatus, setCurrentOrderStatus] = useState<string | null>(null);
  const [waiters, setWaiters] = useState<any[]>([]);
  const [activeWaiter, setActiveWaiter] = useState<any>(null);
  const [showPinPad, setShowPinPad] = useState(false);
  const [pinTarget, setPinTarget] = useState<'waiter' | 'table'>('waiter');
  const [pendingSelection, setPendingSelection] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const { tables, setTables, selectedTable, setSelectedTable, addToCart, clearCart, setSocket } = useStore();

  const fetchTables = useCallback(async () => {
    try {
      const { data } = await api.get('/tables');
      console.log('📋 Tables received from API:', data.data);
      setTables(data.data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar mesas');
    }
  }, [setTables]);

  const fetchWaiters = useCallback(async () => {
    try {
      const { data } = await api.get('/users/waiters');
      setWaiters(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/products')
      ]);
      const cats = (catRes.data.data ?? []) as any;
      const prods = (prodRes.data.data ?? []) as any;
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    fetchProducts();
    fetchWaiters();
  }, [fetchTables, fetchProducts, fetchWaiters]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = getSocket(token);
    socket.on('order_paid', () => { fetchTables(); fetchWaiters(); });
    socket.on('item_served', () => { fetchTables(); fetchWaiters(); });
    socket.on('new_order', () => { fetchTables(); fetchWaiters(); });
    setSocket(socket);
    return () => {
      socket.disconnect();
    };
  }, [fetchTables, fetchWaiters, setSocket]);

  // Reset category when table changes
  useEffect(() => {
    setSelectedCategoryId(null);
  }, [selectedTable?.id]);

  const handleWaiterSelect = (waiter: any) => {
    setPendingSelection(waiter);
    setPinTarget('waiter');
    setShowPinPad(true);
  };

  const handlePinVerify = async (pin: string) => {
    setVerifying(true);
    try {
      if (pinTarget === 'waiter') {
        await api.post('/users/verify-pin', { userId: pendingSelection.id, pin });
        setActiveWaiter(pendingSelection);
        setShowPinPad(false);
        setPendingSelection(null);
      } else if (pinTarget === 'table') {
        const { data } = await api.post(`/tables/${pendingSelection.id}/verify-pin`, { pin });

        setSelectedTable(data.data.table as Table);
        setCurrentOrderId(data.data.order?.id ?? null);
        setCurrentOrderStatus(data.data.order?.status ?? null);

        if (data.data.order?.orderItems?.length) {
          clearCart();
          data.data.order.orderItems
            .filter((item: any) => item.sentToKitchen || item.sentToBar || item.status !== 'PENDING')
            .forEach((item: any) => {
            addToCart({
              productId: item.productId,
              name: item.product?.name ?? '',
              price: Number(item.price),
              quantity: item.quantity,
              notes: item.notes,
              status: item.status ?? 'PENDING'
            } as never);
          });
        } else {
          clearCart();
        }
        setShowPinPad(false);
        setPendingSelection(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'PIN incorrecto');
    } finally {
      setVerifying(false);
    }
  };

  const handleTableSelect = async (table: any) => {
    if (!activeWaiter) return;

    if (table.status === 'FREE' || table.status === 'RESERVED') {
      setSelectedTable(table as Table);
      setCurrentOrderId(null);
      setCurrentOrderStatus(null);
      setSelectedCategoryId(null);
      clearCart();
      return;
    }

    if (table.status === 'OCCUPIED') {
      // If the waiter is the owner, or an admin, etc. 
      // For now, always ask for PIN of the waiter who opened it (as per requirement)
      setPendingSelection(table);
      setPinTarget('table');
      setShowPinPad(true);
    }
  };

  const handleSendOrder = async () => {
    const cart = useStore.getState().cart || [];
    if (!selectedTable || cart.length === 0) {
      toast.error('Selecciona una mesa y añade productos');
      return;
    }

    const itemsPayload = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      notes: item.notes
    }));

    try {
      let orderId: string | null = currentOrderId;
      if (currentOrderId) {
        await api.patch(`/orders/${currentOrderId}/items`, { orderItems: itemsPayload });
      } else {
        const { data } = await api.post('/orders', {
          tableId: selectedTable.id,
          userId: activeWaiter.id, // Important: use active waiter ID
          customerCount: 1,
          orderItems: itemsPayload
        });
        orderId = data.data?.id;
        setCurrentOrderId(orderId);
        setCurrentOrderStatus(data.data?.status ?? null);
      }

      const sendRes = await api.post(`/orders/${orderId}/send`);
      if (sendRes.data?.success) {
        setCurrentOrderStatus(sendRes.data?.data?.order?.status ?? currentOrderStatus);
        clearCart();
        toast.success('Comanda enviada');
        fetchTables();
        fetchWaiters();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar comanda');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <AnimatePresence mode="wait">
        {!activeWaiter ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto"
          >
            <WaiterSelection waiters={waiters} onSelect={handleWaiterSelect} />
          </motion.div>
        ) : (
          <motion.div
            key="interface"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col gap-4 overflow-hidden"
          >
            {/* Sub Header for selected waiter */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setActiveWaiter(null); setSelectedTable(null); clearCart(); }}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                  title="Volver a selección de camarero"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Camarero Activo</span>
                    <h2 className="font-bold text-slate-800 leading-none">{activeWaiter.name}</h2>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-sm font-bold text-slate-700">
                    {selectedTable ? `Mesa ${selectedTable.number}` : 'Ninguna mesa seleccionada'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden h-full pb-4">
              <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Tables Section */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-slate-800">Mapa de Mesas</h2>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-400 uppercase tracking-tighter">
                      {tables.length} Mesas
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <TablesGrid
                      tables={tables}
                      onTableSelect={handleTableSelect}
                      selectedTableId={selectedTable?.id}
                    />
                  </div>
                </div>

                {/* Products Section */}
                <div className="flex-[1.2] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <h2 className="font-bold text-slate-800">Menú Digital</h2>
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <ProductsGrid
                      products={products}
                      categories={categories}
                      selectedCategoryId={selectedCategoryId}
                      onSelectCategory={setSelectedCategoryId}
                      onAddProduct={(p: any) => {
                        addToCart({
                          productId: p.id,
                          name: p.name,
                          price: Number(p.price),
                          quantity: 1,
                          status: 'PENDING'
                        } as any);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Section: Order Cart */}
              <div className="w-[380px] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
                <OrderCart
                  onSendOrder={handleSendOrder}
                  onCancelOrder={async () => {
                    if (!currentOrderId) return;
                    try {
                      await api.post(`/orders/${currentOrderId}/cancel`);
                      toast.success('Orden anulada');
                      clearCart();
                      setSelectedTable(null);
                      setCurrentOrderId(null);
                      setCurrentOrderStatus(null);
                      fetchTables();
                      fetchWaiters();
                    } catch (err: any) {
                      toast.error('Error al anular orden');
                    }
                  }}
                  selectedTable={selectedTable}
                  orderStatus={currentOrderStatus}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PinPad
        isOpen={showPinPad}
        onClose={() => { setShowPinPad(false); setPendingSelection(null); }}
        onVerify={handlePinVerify}
        title={pinTarget === 'waiter' ? `Acceso: ${pendingSelection?.name}` : `Acceso Mesa ${pendingSelection?.number}`}
        loading={verifying}
      />
    </div>
  );
}

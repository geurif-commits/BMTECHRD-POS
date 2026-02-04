import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../stores/useStore';
import api from '../stores/api';
import { getSocket } from '../utils/socket';
import { CreditCard, Banknote, CheckCircle, DollarSign, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { printTicket, type PrintData } from '../utils/printService';
import clsx from 'clsx';

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED';

interface Order {
  id: string;
  total: number;
  subtotal: number;
  tax: number;
  paidAmount?: number;
  table?: { number: number };
  user?: { name: string };
  createdAt: string;
  items: Array<{
    id: string;
    product: { name: string; price: number };
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface OpenTableInfo {
  tableNumber: number;
  total: number;
  waiter: string;
  orderId: string;
  createdAt?: string;
}

export function CashierPage() {
  const formatMoney = (value: number) =>
    new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashGiven, setCashGiven] = useState('');
  const [change, setChange] = useState(0);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardLastFour, setCardLastFour] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [tip, setTip] = useState(0);
  const [includeTax, setIncludeTax] = useState(true);
  const [includeTip, setIncludeTip] = useState(true);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [todaySales, setTodaySales] = useState(0);
  const [openTables, setOpenTables] = useState<OpenTableInfo[]>([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { business, user } = useStore();

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/served');
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

  const fetchUsdRate = useCallback(async () => {
    try {
      const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=DOP');
      const json = await res.json();
      const rate = Number(json?.rates?.DOP);
      if (Number.isFinite(rate)) {
        setUsdRate(rate);
        localStorage.setItem('usdRate', String(rate));
        return;
      }
      throw new Error('Invalid rate');
    } catch (err) {
      const cached = localStorage.getItem('usdRate');
      if (cached && Number.isFinite(Number(cached))) {
        setUsdRate(Number(cached));
      }
    }
  }, []);

  const fetchTodaySales = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/kpis');
      setTodaySales(Number(data.data?.todaySales || 0));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchOpenTables = useCallback(async () => {
    try {
      const statuses = ['PENDING', 'PREPARING', 'READY', 'SERVED'];
      const responses = await Promise.all(
        statuses.map((status) => api.get('/orders', { params: { status } }))
      );
      const allOrders = responses.flatMap((res) => res.data?.data ?? []);

      const byTable = new Map<string, OpenTableInfo>();
      allOrders.forEach((order: any) => {
        const tableNumber = order.table?.tableNumber ?? order.table?.number;
        const waiter = order.user?.name || 'Sin asignar';
        if (tableNumber != null) {
          const existing = byTable.get(order.tableId);
          if (!existing || (existing.createdAt && new Date(order.createdAt) > new Date(existing.createdAt)) || (!existing.createdAt && order.createdAt)) {
            byTable.set(order.tableId, {
              tableNumber,
              total: Number(order.total || 0),
              waiter,
              orderId: order.id,
              createdAt: order.createdAt
            });
          }
        }
      });

      setOpenTables(Array.from(byTable.values()).sort((a, b) => a.tableNumber - b.tableNumber));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchUsdRate();
    fetchTodaySales();
    fetchOpenTables();
  }, [fetchOrders]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    s.on('order_paid', () => { fetchOrders(); fetchTodaySales(); fetchOpenTables(); });
    s.on('item_served', () => { fetchOrders(); fetchOpenTables(); });
    s.on('new_order', () => fetchOpenTables());
    return () => {
      s.disconnect();
    };
  }, [token, fetchOrders, fetchOpenTables, fetchTodaySales]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const refresh = setInterval(() => {
      fetchUsdRate();
      fetchTodaySales();
      fetchOpenTables();
    }, 60000);
    return () => clearInterval(refresh);
  }, [fetchOpenTables, fetchTodaySales, fetchUsdRate]);

  useEffect(() => {
    if (!selectedOrder) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedOrder(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedOrder]);

  // Auto-calculate tip as 10% of subtotal when includeTip changes or selectedOrder changes
  useEffect(() => {
    if (includeTip && selectedOrder) {
      const calculatedTip = (selectedOrder.subtotal || 0) * 0.10;
      setTip(Number(calculatedTip.toFixed(2)));
    }
  }, [includeTip, selectedOrder?.id, selectedOrder?.subtotal]);

  const getTotalWithCalculations = () => {
    if (!selectedOrder) return 0;
    let total = selectedOrder.subtotal || 0;
    if (includeTax) total += selectedOrder.tax || 0;
    if (includeTip && tip > 0) total += tip;
    return total;
  };

  const handlePay = async () => {
    if (!selectedOrder) return;
    
    if (paymentMethod === 'CASH') {
      setCashGiven(String(getTotalWithCalculations().toFixed(2)));
      setShowCashModal(true);
      return;
    }

    if (paymentMethod === 'CARD') {
      setShowCardModal(true);
      return;
    }

    if (paymentMethod === 'TRANSFER') {
      setShowTransferModal(true);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Monto inválido');
      return;
    }
    
    await confirmPayment(numAmount, paymentMethod);
  };

  const confirmPayment = async (paymentAmount: number, method: PaymentMethod) => {
    if (!selectedOrder) return;
    
    setProcessing(true);
    try {
      await api.post('/payments', {
        orderId: selectedOrder.id,
        amount: paymentAmount,
        method,
        reference: method === 'CARD' ? cardLastFour : undefined,
        cardBrand: method === 'CARD' ? cardBrand : undefined,
        tip: includeTip ? tip : 0,
        includeTax
      });
      toast.success('Pago registrado');

      // Print final ticket after payment
      handlePrint('FINAL', selectedOrder);

      setSelectedOrder(null);
      setAmount('');
      setTip(0);
      setCardLastFour('');
      setCardBrand('');
      setIncludeTax(true);
      setIncludeTip(true);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Error al registrar pago';
      toast.error(msg ?? 'Error');
    } finally {
      setProcessing(false);
    }
  };

  const confirmCashPayment = async () => {
    if (!selectedOrder) return;
    const numCash = parseFloat(cashGiven);
    if (isNaN(numCash) || numCash <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }
    const total = getTotalWithCalculations();
    if (numCash < total) {
      toast.error('Efectivo insuficiente');
      return;
    }
    const computedChange = Number((numCash - total).toFixed(2));
    setChange(computedChange);
    
    setProcessing(true);
    try {
      await confirmPayment(numCash, 'CASH');
      toast.success(`Pago registrado. Vuelto: RD$ ${computedChange.toFixed(2)}`);
      setShowCashModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const confirmCardPayment = async () => {
    if (!selectedOrder || !cardLastFour || !cardBrand) {
      toast.error('Ingrese los datos de la tarjeta');
      return;
    }
    
    if (cardLastFour.length !== 4 || isNaN(Number(cardLastFour))) {
      toast.error('Ingrese los últimos 4 dígitos válidos');
      return;
    }
    
    const total = getTotalWithCalculations();
    setProcessing(true);
    try {
      await confirmPayment(total, 'CARD');
      setShowCardModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const confirmTransferPayment = async () => {
    if (!selectedOrder) return;
    
    const total = getTotalWithCalculations();
    setProcessing(true);
    try {
      await confirmPayment(total, 'TRANSFER');
      setShowTransferModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = (type: 'PRE' | 'FINAL', orderToPrint?: Order) => {
    const order = orderToPrint || selectedOrder;
    if (!order || !business) {
      toast.error('Datos insuficientes para imprimir');
      return;
    }

    const printData: PrintData = {
      business: {
        name: business.name,
        address: business.address,
        phone: business.phone,
        rnc: business.rnc,
        logoUrl: business.logoUrl
      },
      order: {
        id: order.id,
        table: order.table?.number || 0,
        waiter: order.user?.name || 'Sistema',
        cashier: user?.name || 'Cajero',
        date: new Date(order.createdAt).toLocaleString('es-DO', {
          timeZone: 'America/Santo_Domingo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.subtotal)
        })),
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        tax: Number(order.tax)
      },
      type
    };

    printTicket(printData);
  };

  const methods: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
    { id: 'CASH', label: 'Efectivo', icon: Banknote },
    { id: 'CARD', label: 'Tarjeta', icon: CreditCard },
    { id: 'TRANSFER', label: 'Transferencia', icon: DollarSign },
    { id: 'MIXED', label: 'Mixto', icon: DollarSign }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 p-6 flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-green-500" size={20} /> Caja - {business?.name || 'Sistema'}
          </h1>
          <p className="text-slate-500 text-xs">Gestion de pagos y facturación</p>
        </div>
      </div>

      {!selectedOrder && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase">USD/DOP</p>
              <p className="text-2xl font-bold text-emerald-600">
                {usdRate ? usdRate.toFixed(2) : '—'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Actualizado en tiempo real</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase">Hora actual</p>
              <p className="text-2xl font-bold text-slate-800">
                {now.toLocaleTimeString('es-DO', {
                  timeZone: 'America/Santo_Domingo',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {now.toLocaleDateString('es-DO', {
                  timeZone: 'America/Santo_Domingo',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase">Ventas hoy</p>
              <p className="text-2xl font-bold text-blue-600">${formatMoney(todaySales)}</p>
              <p className="text-[11px] text-slate-400 mt-1">Hasta el momento</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase">Mesas abiertas</p>
              <p className="text-2xl font-bold text-slate-800">{openTables.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Con órdenes activas</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Mesas abiertas</h2>
            {openTables.length === 0 ? (
              <div className="text-sm text-slate-500">No hay mesas abiertas</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {openTables.map((t) => (
                  <div key={t.orderId} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Mesa {t.tableNumber}</span>
                      <span className="font-semibold text-emerald-600">${formatMoney(t.total)}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Camarero: {t.waiter}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <div className="min-h-0 overflow-y-auto pr-1">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Órdenes pendientes de cobro</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.length > 0 ? orders.map((order) => (
                  <motion.button
                    key={order.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedOrder(order);
                      setAmount(String(Number(order.total).toFixed(2)));
                    }}
                    className={`bg-white rounded-xl shadow p-4 text-left border-2 transition-all ${selectedOrder?.id === order.id ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-100'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-gray-800 text-lg">Mesa {order.table?.number ?? '—'}</div>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Servida</span>
                    </div>
                    <div className="text-2xl font-bold text-primary-600 mt-2">
                      ${formatMoney(Number(order.total))}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      Camarero: {order.user?.name}
                    </div>
                  </motion.button>
                )) : (
                  <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <CheckCircle className="mx-auto text-slate-300 mb-2" size={48} />
                    <p className="text-slate-500">No hay órdenes pendientes de cobro</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 border border-slate-200 flex flex-col max-h-[calc(100vh-140px)] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Pagar — Mesa {selectedOrder.table?.number}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                title="Cerrar panel de pago"
                className="text-slate-400 hover:text-slate-600"
              >
                Cerrar
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm space-y-4">
              {/* Subtotal Section */}
              <div className="flex justify-between text-sm text-slate-600">
                <span className="font-medium">Subtotal</span>
                <span className="font-semibold text-slate-800">${Number(selectedOrder.subtotal).toFixed(2)}</span>
              </div>
              
              {/* ITBIS Section */}
              <div className="flex items-center justify-between text-sm text-slate-600 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-medium">ITBIS (18%)</span>
                  <button
                    onClick={() => setIncludeTax(!includeTax)}
                    className={clsx("w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-all", 
                      includeTax ? "bg-primary-600 border-primary-600 text-white" : "border-slate-300 hover:border-slate-400"
                    )}
                  >
                    {includeTax && "✓"}
                  </button>
                </div>
                  <span className={clsx("font-semibold", includeTax ? "text-slate-800" : "text-slate-400 line-through")}>${formatMoney(Number(selectedOrder.tax))}</span>
              </div>

              {/* Propina Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Propina (10%)</span>
                    <button
                      onClick={() => setIncludeTip(!includeTip)}
                      className={clsx("w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-all", 
                        includeTip ? "bg-primary-600 border-primary-600 text-white" : "border-slate-300 hover:border-slate-400"
                      )}
                    >
                      {includeTip && "✓"}
                    </button>
                  </div>
                  <span className={clsx("font-semibold", includeTip && tip > 0 ? "text-slate-800" : "text-slate-400")}>${formatMoney(tip)}</span>
                </div>
                <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="number"
                    step="0.01"
                    value={tip}
                    onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    disabled={!includeTip}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder-slate-400 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* Total Section */}
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t-2 border-slate-200">
                <span>Total</span>
                <span className="text-primary-600">${formatMoney(getTotalWithCalculations())}</span>
              </div>

              {/* Payment Method Section */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-medium text-slate-700">Método de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${paymentMethod === m.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                    >
                      <m.icon className="w-5 h-5" />
                      <span className="font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Section */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">Monto a pagar</label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(Number(selectedOrder.total).toFixed(2)))}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    Pago Exacto
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    placeholder="0.00"
                    onChange={(e) => setAmount(e.target.value)}
                    title="Monto a pagar"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => handlePrint('PRE')}
                className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
              >
                <FileText className="w-5 h-5" />
                <span>Estado Cuenta</span>
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={processing}
                className="flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 font-semibold disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                {processing ? '...' : 'Pagar'}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest mt-2 border-t pt-4">
              Ticket ID: {selectedOrder.id.split('-')[0]}
            </p>

            {showCashModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                  <h4 className="text-lg font-bold mb-2">Cobro en efectivo</h4>
                  <div className="text-sm text-slate-600 mb-3">Total: RD$ {formatMoney(Number(selectedOrder.total))}</div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">Efectivo entregado</label>
                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">RD$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={cashGiven}
                      placeholder="0.00"
                      onChange={(e) => {
                        setCashGiven(e.target.value);
                        const n = parseFloat(e.target.value);
                        const ch = isNaN(n) ? 0 : Number((n - Number(selectedOrder.total)).toFixed(2));
                        setChange(ch);
                      }}
                      title="Ingresa el efectivo entregado"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-slate-600">Vuelto:</div>
                    <div className="text-lg font-bold">RD$ {formatMoney(Number(change))}</div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowCashModal(false); setCashGiven(''); setChange(0); }}
                      className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmCashPayment}
                      disabled={processing}
                      className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-50"
                    >
                      {processing ? '...' : 'Confirmar pago'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showCardModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-xl p-6 w-full max-w-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold">Pago con Tarjeta</h4>
                    <button
                      onClick={() => setShowCardModal(false)}
                      title="Cerrar modal de tarjeta"
                      className="p-1 hover:bg-slate-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Marca de Tarjeta</label>
                      <select
                        value={cardBrand}
                        onChange={(e) => setCardBrand(e.target.value)}
                        title="Selecciona una marca de tarjeta"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Seleccionar marca</option>
                        <option value="VISA">Visa</option>
                        <option value="MASTERCARD">Mastercard</option>
                        <option value="AMEX">American Express</option>
                        <option value="DINERS">Diners Club</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Últimos 4 dígitos</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="0000"
                        value={cardLastFour}
                        onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-600">Subtotal</span>
                        <span className="font-semibold">RD$ {formatMoney(selectedOrder!.subtotal)}</span>
                      </div>
                      {includeTax && (
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-600">ITBIS (18%)</span>
                          <span className="font-semibold">RD$ {formatMoney(selectedOrder!.tax)}</span>
                        </div>
                      )}
                      {includeTip && tip > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-600">Propina</span>
                          <span className="font-semibold">RD$ {formatMoney(tip)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-lg text-primary-600">RD$ {formatMoney(getTotalWithCalculations())}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCardModal(false)}
                        className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmCardPayment}
                        disabled={processing}
                        className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-50"
                      >
                        {processing ? '...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {showTransferModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-xl p-6 w-full max-w-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold">Pago por Transferencia</h4>
                    <button
                      onClick={() => setShowTransferModal(false)}
                      title="Cerrar modal de transferencia"
                      className="p-1 hover:bg-slate-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl space-y-3 border-2 border-slate-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Banco</p>
                          <p className="text-lg font-bold text-slate-800">{business?.bankName || business?.name || 'BMTECHRD POS'}</p>
                        </div>
                        <button
                          onClick={() => navigate('/settings')}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                        >
                          Editar
                        </button>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Número de Cuenta</p>
                        <p className="text-lg font-bold text-slate-800 font-mono bg-white px-3 py-2 rounded-lg border border-slate-200">
                          {business?.bankAccountNumber || 'No configurado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Tipo de Cuenta</p>
                        <p className="text-lg font-bold text-slate-800">{business?.bankAccountType || 'Cuenta Corriente'}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-600">Subtotal</span>
                        <span className="font-semibold">RD$ {formatMoney(selectedOrder!.subtotal)}</span>
                      </div>
                      {includeTax && (
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-600">ITBIS (18%)</span>
                          <span className="font-semibold">RD$ {formatMoney(selectedOrder!.tax)}</span>
                        </div>
                      )}
                      {includeTip && tip > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-600">Propina</span>
                          <span className="font-semibold">RD$ {formatMoney(tip)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold">Total a Transferir</span>
                        <span className="font-bold text-lg text-primary-600">RD$ {formatMoney(getTotalWithCalculations())}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowTransferModal(false)}
                        className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmTransferPayment}
                        disabled={processing}
                        className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-50"
                      >
                        {processing ? '...' : 'Confirmar Transferencia'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

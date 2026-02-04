interface Alert {
  id: string;
  productId: string;
  quantity: number;
  minStock: number;
  product?: { name: string };
}

interface InventoryAlertProps {
  alert: Alert;
}

export function InventoryAlert({ alert }: InventoryAlertProps) {
  const name = alert.product?.name ?? 'Producto';
  return (
    <div className="bg-red-100 border border-red-200 rounded-lg p-3 text-sm">
      <p className="font-semibold text-red-800 truncate">{name}</p>
      <p className="text-red-700 mt-1">
        Stock: {alert.quantity} / Mín: {alert.minStock}
      </p>
    </div>
  );
}

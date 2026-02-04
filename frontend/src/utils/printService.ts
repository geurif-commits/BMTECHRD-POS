export interface PrintData {
  business: {
    name: string;
    address?: string;
    phone?: string;
    rnc?: string;
    logoUrl?: string;
  };
  order: {
    id: string;
    table: number;
    waiter: string;
    cashier?: string;
    date: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    total: number;
    subtotal: number;
    tax?: number;
    discount?: number;
  };
  type: 'PRE' | 'FINAL';
}

export const printTicket = (data: PrintData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Agrupar artículos por nombre + precio para mostrar cantidades consolidadas
  const groupedItemsMap: Record<string, { name: string; quantity: number; price: number; subtotal: number }> = {};
  data.order.items.forEach(item => {
    const key = `${item.name}::${item.price}`;
    if (!groupedItemsMap[key]) {
      groupedItemsMap[key] = { name: item.name, quantity: item.quantity, price: item.price, subtotal: item.subtotal };
    } else {
      groupedItemsMap[key].quantity += item.quantity;
      groupedItemsMap[key].subtotal += item.subtotal;
    }
  });
  const groupedItems = Object.values(groupedItemsMap);

  const itemsHtml = groupedItems.map(item => `
    <tr>
      <td style="padding: 2px 0;">${item.name}<br/><small>${item.quantity} x ${item.price.toFixed(2)}</small></td>
      <td style="text-align: right; vertical-align: bottom;">${item.subtotal.toFixed(2)}</td>
    </tr>
  `).join('');

  const printerSize = localStorage.getItem('printerSize') || '80mm';
  const paperWidth = printerSize === '58mm' ? '52mm' : '72mm';
  const bodyWidth = printerSize === '58mm' ? '58mm' : '80mm';

  const html = `
    <html>
      <head>
        <title>Ticket</title>
        <style>
          @page { size: ${bodyWidth} auto; margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: ${paperWidth}; 
            margin: 0 auto; 
            padding: 5mm 0;
            font-size: ${printerSize === '58mm' ? '10px' : '12px'};
            line-height: 1.2;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .border-top { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; }
          .header { margin-bottom: 5px; }
          .business-name { font-size: ${printerSize === '58mm' ? '14px' : '16px'}; font-weight: bold; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin: 5px 0; }
          .footer { margin-top: 10px; font-size: 10px; }
          .divider { border-top: 1px solid #000; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="text-center header">
          ${data.business.logoUrl ? `<img src="${data.business.logoUrl}" alt="Logo" style="max-width: 100%; height: auto; max-height: 40px; margin-bottom: 5px;" />` : ''}
          <div class="business-name">${data.business.name.toUpperCase()}</div>
          ${data.business.address ? `<div>${data.business.address}</div>` : ''}
          ${data.business.phone ? `<div>Tel: ${data.business.phone}</div>` : ''}
          ${data.business.rnc ? `<div>RNC: ${data.business.rnc}</div>` : ''}
        </div>

        <div class="divider"></div>
        <div class="text-center bold" style="font-size: 14px; margin: 5px 0;">
          ${data.type === 'PRE' ? 'ESTADO DE CUENTA (NO VALIDO COMO FACTURA)' : 'FACTURA DE CONSUMO'}
        </div>
        <div class="divider"></div>

        <div>Fecha: ${data.order.date}</div>
        <div>Mesa: ${data.order.table}</div>
        <div>Camarero: ${data.order.waiter}</div>
        ${data.order.cashier ? `<div>Cajero: ${data.order.cashier}</div>` : ''}
        <div>Orden: #${data.order.id.split('-')[0].toUpperCase()}</div>

        <div class="divider"></div>
        <table>
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th style="text-align: left;">DESC.</th>
              <th style="text-align: right;">VALOR</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>
        <div class="text-right">
          <div>Subtotal: ${data.order.subtotal.toFixed(2)}</div>
          ${data.order.tax ? `<div>Impuestos: ${data.order.tax.toFixed(2)}</div>` : ''}
          ${data.order.discount ? `<div>Descuento: -${data.order.discount.toFixed(2)}</div>` : ''}
          <div class="bold" style="font-size: 14px; margin-top: 5px;">TOTAL: RD$ ${data.order.total.toFixed(2)}</div>
        </div>

        <div class="divider"></div>
        <div class="text-center footer">
          ${data.type === 'FINAL' ? '<p>¡GRACIAS POR SU VISITA!</p>' : '<p>ESTO ES UN PRE-TICKET PARA REVISION</p>'}
          <p>Potenciado por BMTECHRD POS</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
export const printZReport = (data: {
  business: any;
  shift: any;
  user: any;
}) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const printerSize = localStorage.getItem('printerSize') || '80mm';
  const paperWidth = printerSize === '58mm' ? '52mm' : '72mm';
  const bodyWidth = printerSize === '58mm' ? '58mm' : '80mm';

  const expensesHtml = data.shift.expenses.map((e: any) => `
    <tr>
      <td style="padding: 2px 0;">${e.description}</td>
      <td style="text-align: right;">${Number(e.amount).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head>
        <title>Reporte Z - Cierre de Caja</title>
        <style>
          @page { size: ${bodyWidth} auto; margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: ${paperWidth}; 
            margin: 0 auto; 
            padding: 5mm 0;
            font-size: ${printerSize === '58mm' ? '10px' : '12px'};
            line-height: 1.2;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .business-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="business-name">${data.business.name.toUpperCase()}</div>
          <div class="bold">REPORTE Z - CIERRE DE CAJA</div>
          <div>--------------------------------</div>
        </div>

        <div style="margin-top: 5px;">
          <div>ID TURNO: #${data.shift.id.split('-')[0].toUpperCase()}</div>
          <div>USUARIO: ${data.user.name}</div>
          <div>APERTURA: ${new Date(data.shift.openedAt).toLocaleString()}</div>
          <div>CIERRE: ${new Date().toLocaleString()}</div>
        </div>

        <div class="divider"></div>

        <table>
          <tr>
            <td>(+) FONDO INICIAL:</td>
            <td class="text-right">${Number(data.shift.openingBalance).toFixed(2)}</td>
          </tr>
          <tr>
            <td>(+) VENTAS EFECTIVO:</td>
            <td class="text-right">${Number(data.shift.totalSales).toFixed(2)}</td>
          </tr>
          <tr>
            <td>(-) TOTAL GASTOS:</td>
            <td class="text-right">${Number(data.shift.totalExpenses).toFixed(2)}</td>
          </tr>
          <tr class="bold">
            <td>(=) EFECTIVO ESPERADO:</td>
            <td class="text-right">${Number(data.shift.expectedCash).toFixed(2)}</td>
          </tr>
          <tr class="divider"></tr>
          <tr>
            <td>( ) EFECTIVO REAL:</td>
            <td class="text-right">${Number(data.shift.actualCash).toFixed(2)}</td>
          </tr>
          <tr class="bold">
            <td>(DIFERENCIA):</td>
            <td class="text-right">${Number(data.shift.difference).toFixed(2)}</td>
          </tr>
        </table>

        ${data.shift.expenses.length > 0 ? `
          <div class="divider"></div>
          <div class="bold">DESGLOSE DE GASTOS:</div>
          <table>
            ${expensesHtml}
          </table>
        ` : ''}

        <div class="divider"></div>
        <div class="text-center" style="margin-top: 20px;">
          <p>__________________________</p>
          <p>FIRMA DEL RESPONSABLE</p>
          <p style="font-size: 10px; margin-top: 20px;">
            FECHA DE IMPRESIÓN: ${new Date().toLocaleString()}<br/>
            SISTEMA POS - BMTECHRD
          </p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

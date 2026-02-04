import prisma from '../config/database.js';
import { Decimal } from '@prisma/client/runtime/library';

export class ReportService {
  async salesSummary(businessId: string, startDate?: string, endDate?: string) {
    const where: any = { businessId };
    if (startDate || endDate) where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);

    const orders = await prisma.order.findMany({
      where,
      include: { payments: true, orderItems: { include: { product: true } }, user: true, table: true }
    });

    const totalSales = orders.reduce((acc: Decimal, o: any) => acc.add(new Decimal(o.total || 0)), new Decimal(0));
    const totalTax = orders.reduce((acc: Decimal, o: any) => acc.add(new Decimal(o.tax || 0)), new Decimal(0));
    const totalOrders = orders.length;

    const payments = await prisma.payment.findMany({
      where: { businessId, order: { createdAt: where.createdAt } },
      include: { order: true }
    });

    const paymentByMethod: Record<string, number> = {};
    payments.forEach((p: any) => {
      const m = p.method || 'CASH';
      paymentByMethod[m] = (paymentByMethod[m] || 0) + Number(p.amount);
    });

    const itemsMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    orders.forEach((o: any) => {
      (o.orderItems || []).forEach((it: any) => {
        const key = `${it.productId}`;
        if (!itemsMap[key]) itemsMap[key] = { name: it.product?.name || 'Unknown', qty: 0, revenue: 0 };
        itemsMap[key].qty += Number(it.quantity || 0);
        itemsMap[key].revenue += Number(it.subtotal || (it.price * it.quantity) || 0);
      });
    });

    const topItems = Object.values(itemsMap).sort((a, b) => b.revenue - a.revenue).slice(0, 20);

    return {
      totalSales: Number((totalSales as any).toNumber ? (totalSales as any).toNumber() : totalSales),
      totalTax: Number((totalTax as any).toNumber ? (totalTax as any).toNumber() : totalTax),
      totalOrders,
      paymentByMethod,
      topItems,
      orders
    };
  }

  toCSV(summary: any) {
    const lines: string[] = [];
    lines.push('Report,Value');
    lines.push(`Total Orders,${summary.totalOrders}`);
    lines.push(`Total Sales,${(summary.totalSales || 0).toFixed ? summary.totalSales.toFixed(2) : summary.totalSales}`);
    lines.push(`Total Tax,${(summary.totalTax || 0).toFixed ? summary.totalTax.toFixed(2) : summary.totalTax}`);
    lines.push('');
    lines.push('Payment Method,Balance');
    for (const k of Object.keys(summary.paymentByMethod || {})) {
      const v = summary.paymentByMethod[k] || 0;
      lines.push(`${k},${v.toFixed ? v.toFixed(2) : v}`);
    }
    lines.push('');
    lines.push('Top Items (name,qty,revenue)');
    (summary.topItems || []).forEach((it: any) => lines.push(`${it.name},${it.qty},${it.revenue.toFixed ? it.revenue.toFixed(2) : it.revenue}`));

    lines.push('');
    lines.push('Orders:');
    lines.push('OrderId,Table,Waiter,Date,Total');
    (summary.orders || []).forEach((o: any) => {
      lines.push(`${o.id},${o.table?.number || ''},${o.user?.name || ''},${new Date(o.createdAt).toISOString()},${Number(o.total || 0).toFixed(2)}`);
    });

    return lines.join('\n');
  }
}

export default new ReportService();

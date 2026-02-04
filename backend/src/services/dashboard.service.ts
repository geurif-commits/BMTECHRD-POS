import prisma from '../config/database.js';
import { OrderStatus } from '../types/enums.js';

export class DashboardService {
  private toLocalStart(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`);
  }

  private toLocalEnd(dateStr: string) {
    return new Date(`${dateStr}T23:59:59.999`);
  }

  async salesToday(businessId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    const orders = await prisma.order.findMany({
      where: {
        businessId,
        status: OrderStatus.PAID,
        OR: [
          { paidAt: { gte: start, lte: end } },
          { paidAt: null, createdAt: { gte: start, lte: end } }
        ]
      },
      include: { orderItems: true, user: true }
    });

    let total = 0;
    for (const o of orders) {
      total += Number(o.total);
    }

    return {
      total,
      ordersCount: orders.length,
      orders
    };
  }

  async salesByWaiter(businessId: string, startDate?: string, endDate?: string) {
    const where: {
      businessId: string;
      status: (typeof OrderStatus)[keyof typeof OrderStatus];
      OR?: Array<{ paidAt?: { gte?: Date; lte?: Date } | null; createdAt?: { gte?: Date; lte?: Date } }>;
    } = {
      businessId,
      status: OrderStatus.PAID
    };
    if (startDate || endDate) {
      const range: { gte?: Date; lte?: Date } = {};
      if (startDate) range.gte = this.toLocalStart(startDate);
      if (endDate) {
        range.lte = this.toLocalEnd(endDate);
      }
      where.OR = [
        { paidAt: range },
        { paidAt: null, createdAt: range }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: { user: true }
    });

    const byWaiter: Record<string, { userId: string; name: string; total: number; count: number }> = {};
    for (const o of orders) {
      const key = o.userId;
      if (!byWaiter[key]) {
        byWaiter[key] = { userId: o.userId, name: o.user.name, total: 0, count: 0 };
      }
      byWaiter[key].total += Number(o.total);
      byWaiter[key].count += 1;
    }

    return Object.values(byWaiter).sort((a, b) => b.total - a.total);
  }

  async salesByProduct(businessId: string, startDate?: string, endDate?: string) {
    const whereOrder: {
      businessId: string;
      status: (typeof OrderStatus)[keyof typeof OrderStatus];
      OR?: Array<{ paidAt?: { gte?: Date; lte?: Date } | null; createdAt?: { gte?: Date; lte?: Date } }>;
    } = {
      businessId,
      status: OrderStatus.PAID
    };
    if (startDate || endDate) {
      const range: { gte?: Date; lte?: Date } = {};
      if (startDate) range.gte = this.toLocalStart(startDate);
      if (endDate) {
        range.lte = this.toLocalEnd(endDate);
      }
      whereOrder.OR = [
        { paidAt: range },
        { paidAt: null, createdAt: range }
      ];
    }

    const items = await prisma.orderItem.findMany({
      where: { order: whereOrder },
      include: { product: true }
    });

    const byProduct: Record<string, { productId: string; name: string; quantity: number; total: number }> = {};
    for (const item of items) {
      const key = item.productId;
      if (!byProduct[key]) {
        byProduct[key] = {
          productId: item.productId,
          name: item.product.name,
          quantity: 0,
          total: 0
        };
      }
      byProduct[key].quantity += item.quantity;
      byProduct[key].total += Number(item.subtotal);
    }

    return Object.values(byProduct).sort((a, b) => b.total - a.total);
  }

  async salesByHour(businessId: string, date?: string) {
    const day = date ? this.toLocalStart(date) : new Date();
    day.setHours(0, 0, 0, 0);
    const nextDay = date ? this.toLocalEnd(date) : new Date(day);
    if (!date) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    const orders = await prisma.order.findMany({
      where: {
        businessId,
        status: OrderStatus.PAID,
        OR: [
          { paidAt: { gte: day, lte: nextDay } },
          { paidAt: null, createdAt: { gte: day, lte: nextDay } }
        ]
      }
    });

    const byHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;
    for (const o of orders) {
      const paidTime = o.paidAt ?? o.createdAt;
      const h = paidTime.getHours();
      byHour[h] = (byHour[h] || 0) + Number(o.total);
    }

    return Object.entries(byHour).map(([hour, total]) => ({ hour: Number(hour), total }));
  }

  async kpis(businessId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    const todayOrders = await prisma.order.findMany({
      where: {
        businessId,
        status: OrderStatus.PAID,
        OR: [
          { paidAt: { gte: start, lte: end } },
          { paidAt: null, createdAt: { gte: start, lte: end } }
        ]
      }
    });

    let todaySales = 0;
    for (const o of todayOrders) todaySales += Number(o.total);

    const pendingOrders = await prisma.order.count({
      where: {
        businessId,
        status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED] }
      }
    });

    const servedNotPaid = await prisma.order.count({
      where: { businessId, status: OrderStatus.SERVED }
    });

    return {
      todaySales,
      todayOrdersCount: todayOrders.length,
      pendingOrders,
      servedNotPaid
    };
  }
}

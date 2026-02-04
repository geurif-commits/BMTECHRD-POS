import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/database.js';
import { PaymentMethod, OrderStatus, TableStatus, type PaymentMethodType } from '../types/enums.js';
import { emitOrderPaid } from '../config/socket.js';

export class PaymentService {
  async create(businessId: string, orderId: string, userId: string, data: {
    amount: number;
    method: PaymentMethodType;
    reference?: string;
    notes?: string;
  }) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: { payments: true, orderItems: true }
    });
    if (!order) throw new Error('Orden no encontrada');
    if (order.status !== OrderStatus.SERVED && order.status !== OrderStatus.READY) {
      throw new Error('Solo se pueden pagar órdenes en estado READY o SERVED');
    }

    const amount = new Decimal(data.amount);
    const totalPaid = order.payments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));
    const remaining = new Decimal(order.total).sub(totalPaid);

    if (amount.lte(0)) throw new Error('El monto debe ser mayor a 0');

    const payment = await prisma.payment.create({
      data: {
        businessId,
        orderId,
        amount: amount as never,
        method: data.method,
        reference: data.reference,
        notes: data.notes
      }
    });

    const newTotalPaid = totalPaid.add(amount);
    const orderTotal = new Decimal(order.total);
    if (newTotalPaid.gte(orderTotal)) {
      const paidOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          paidAmount: newTotalPaid
        } as never,
        include: { table: true, orderItems: { include: { product: true } } }
      });
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: TableStatus.FREE }
      });
      await prisma.orderLog.create({
        data: {
          orderId,
          userId,
          action: 'PAID',
          details: { amount: data.amount, method: data.method }
        }
      });
      const inventoryService = new (await import('./inventory.service.js')).InventoryService();
      if (order.orderItems && order.orderItems.length > 0) {
        await inventoryService.decrementByOrderItems(businessId, order.orderItems.map(i => ({ productId: i.productId, quantity: i.quantity })));
      }

      emitOrderPaid(businessId, { order: paidOrder, tableId: order.tableId });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { paidAmount: newTotalPaid } as never
      });
    }

    return prisma.payment.findUnique({
      where: { id: payment.id },
      include: { order: true }
    });
  }

  async history(businessId: string, filters: { startDate?: string; endDate?: string; orderId?: string }) {
    const where: { businessId: string; createdAt?: { gte?: Date; lte?: Date }; orderId?: string } = {
      businessId
    };
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return prisma.payment.findMany({
      where,
      include: { order: { include: { table: true, user: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}

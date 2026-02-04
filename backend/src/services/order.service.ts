import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/database.js';
import { OrderStatus, OrderItemStatus, ProductType, TableStatus } from '../types/enums.js';
import { emitNewOrder, emitItemServed, emitOrderPaid } from '../config/socket.js';

export interface CreateOrderInput {
  businessId: string;
  tableId: string;
  userId: string;
  customerName?: string;
  customerCount?: number;
  orderItems: Array<{ productId: string; quantity: number; notes?: string }>;
}

export interface UpdateOrderItemsInput {
  orderItems: Array<{ productId: string; quantity: number; notes?: string }>;
}

export class OrderService {
  private getStartOfDay(date: Date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private async getActiveBusinessShift(businessId: string) {
    return prisma.cashShift.findFirst({
      where: { businessId, isOpen: true },
      orderBy: { openedAt: 'desc' }
    });
  }

  private async countPendingAndDispatched(
    businessId: string,
    productType: (typeof ProductType)[keyof typeof ProductType],
    startDate?: Date
  ) {
    const baseWhere: Prisma.OrderWhereInput = {
      businessId,
      ...(startDate ? { createdAt: { gte: startDate } } : {})
    };

    const pendingCount = await prisma.order.count({
      where: {
        ...baseWhere,
        status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING] },
        orderItems: {
          some: {
            product: { type: productType },
            ...(productType === ProductType.FOOD ? { sentToKitchen: true } : { sentToBar: true }),
            status: { in: [OrderItemStatus.PENDING, OrderItemStatus.PREPARING] }
          }
        }
      }
    });

    const dispatchedCount = await prisma.order.count({
      where: {
        ...baseWhere,
        orderItems: {
          some: {
            product: { type: productType },
            ...(productType === ProductType.FOOD ? { sentToKitchen: true } : { sentToBar: true })
          },
          none: {
            product: { type: productType },
            ...(productType === ProductType.FOOD ? { sentToKitchen: true } : { sentToBar: true }),
            status: { not: OrderItemStatus.SERVED }
          }
        }
      }
    });

    return { pendingCount, dispatchedCount };
  }

  async create(data: CreateOrderInput) {
    const table = await prisma.table.findFirst({
      where: { id: data.tableId, businessId: data.businessId }
    });
    if (!table) throw new Error('Mesa no encontrada');
    if (table.status !== TableStatus.FREE && table.status !== TableStatus.RESERVED) {
      throw new Error('La mesa está ocupada. Debe verificar el PIN del camarero que la abrió.');
    }

    const productIds = data.orderItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, businessId: data.businessId, isActive: true },
      include: { category: true }
    });

    const orderItemsData: Array<{
      productId: string;
      quantity: number;
      price: Decimal;
      subtotal: Decimal;
      notes: string | null;
      status: (typeof OrderItemStatus)[keyof typeof OrderItemStatus];
      sentToKitchen: boolean;
      sentToBar: boolean;
    }> = [];
    let subtotal = new Decimal(0);

    for (const item of data.orderItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
      const price = new Decimal(product.price);
      const itemSubtotal = price.mul(item.quantity);
      subtotal = subtotal.add(itemSubtotal);
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
        notes: item.notes ?? null,
        status: OrderItemStatus.PENDING,
        sentToKitchen: false,
        sentToBar: false
      });
    }

    const business = await prisma.business.findUnique({ where: { id: data.businessId } });
    const taxRate = Number(business?.taxRate || 18) / 100;
    const tipRate = Number(business?.tipRate || 10) / 100;

    const tax = subtotal.mul(taxRate);
    const tip = subtotal.mul(tipRate);
    const total = subtotal.add(tax).add(tip);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          businessId: data.businessId,
          tableId: data.tableId,
          userId: data.userId,
          customerName: data.customerName,
          customerCount: data.customerCount ?? 1,
          subtotal,
          tax,
          total,
          status: OrderStatus.PENDING,
          orderItems: { create: orderItemsData },
          orderLogs: {
            create: {
              userId: data.userId,
              action: 'CREATED',
              details: { itemsCount: data.orderItems.length, total: total.toNumber() }
            }
          }
        } as never,
        include: {
          orderItems: { include: { product: { include: { category: true } } } },
          table: true,
          user: true
        }
      });

      await tx.table.update({
        where: { id: data.tableId },
        data: { status: TableStatus.OCCUPIED, reservedById: null } as never
      });

      return created;
    });

    return order;
  }

  async list(businessId: string, filters: { status?: string; startDate?: string; endDate?: string }) {
    const where: Prisma.OrderWhereInput = {
      businessId
    };
    if (filters.status) where.status = filters.status as Prisma.EnumOrderStatusFilter;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return prisma.order.findMany({
      where,
      include: {
        orderItems: { include: { product: true } },
        table: true,
        user: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(orderId: string, businessId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: {
        orderItems: { include: { product: true } },
        table: true,
        user: true,
        payments: true,
        orderLogs: true
      }
    });
    if (!order) throw new Error('Orden no encontrada');
    return order;
  }

  async getKitchenOrders(businessId: string) {
    const orders = await prisma.order.findMany({
      where: {
        businessId,
        status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING] },
        orderItems: {
          some: {
            product: { type: ProductType.FOOD },
            sentToKitchen: true,
            status: { in: [OrderItemStatus.PENDING, OrderItemStatus.PREPARING] }
          }
        }
      },
      include: {
        orderItems: {
          include: { product: true }
        },
        table: true,
        user: true
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
    });

    // Filtrar items de comida en el resultado
    return orders.map(order => ({
      ...order,
      orderItems: order.orderItems.filter(
        item => item.product.type === ProductType.FOOD && item.sentToKitchen
      )
    })).filter(order => order.orderItems.length > 0);
  }

  async getKitchenSummary(businessId: string) {
    const startOfDay = this.getStartOfDay();
    const activeShift = await this.getActiveBusinessShift(businessId);
    const day = await this.countPendingAndDispatched(businessId, ProductType.FOOD, startOfDay);
    const shift = activeShift
      ? await this.countPendingAndDispatched(businessId, ProductType.FOOD, activeShift.openedAt)
      : { pendingCount: 0, dispatchedCount: 0 };

    return {
      day,
      shift: {
        ...shift,
        shiftOpen: Boolean(activeShift),
        shiftId: activeShift?.id
      }
    };
  }

  async getBarOrders(businessId: string) {
    const orders = await prisma.order.findMany({
      where: {
        businessId,
        status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING] },
        orderItems: {
          some: {
            product: { type: ProductType.DRINK },
            sentToBar: true,
            status: { in: [OrderItemStatus.PENDING, OrderItemStatus.PREPARING] }
          }
        }
      },
      include: {
        orderItems: {
          include: { product: true }
        },
        table: true,
        user: true
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
    });

    // Filtrar items de bebida en el resultado
    return orders.map(order => ({
      ...order,
      orderItems: order.orderItems.filter(
        item => item.product.type === ProductType.DRINK && item.sentToBar
      )
    })).filter(order => order.orderItems.length > 0);
  }

  async getBarSummary(businessId: string) {
    const startOfDay = this.getStartOfDay();
    const activeShift = await this.getActiveBusinessShift(businessId);
    const day = await this.countPendingAndDispatched(businessId, ProductType.DRINK, startOfDay);
    const shift = activeShift
      ? await this.countPendingAndDispatched(businessId, ProductType.DRINK, activeShift.openedAt)
      : { pendingCount: 0, dispatchedCount: 0 };

    return {
      day,
      shift: {
        ...shift,
        shiftOpen: Boolean(activeShift),
        shiftId: activeShift?.id
      }
    };
  }

  async getServedOrders(businessId: string) {
    const statuses = [OrderStatus.SERVED, OrderStatus.READY];
    return prisma.order.findMany({
      where: { 
        businessId, 
        status: {
          in: statuses
        }
      },
      include: {
        orderItems: { include: { product: true } },
        table: true,
        user: true,
        payments: true
      },
      orderBy: { servedAt: 'asc' }
    });
  }

  async updateItems(orderId: string, businessId: string, userId: string, data: UpdateOrderItemsInput, requireSupervisorPin?: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: { orderItems: true, user: true }
    });
    if (!order) throw new Error('Orden no encontrada');
    if (order.status === OrderStatus.PAID || order.status === OrderStatus.CANCELLED) {
      throw new Error('No se puede modificar una orden pagada o cancelada');
    }

    const anyItemSent = order.orderItems?.some((i) => i.sentToKitchen || i.sentToBar) ?? false;
    if (anyItemSent && !requireSupervisorPin) {
      throw new Error('La orden ya fue enviada. Se requiere PIN de supervisor para modificar.');
    }
    if (anyItemSent && requireSupervisorPin) {
      const supervisor = await prisma.user.findFirst({
        where: { businessId, pin: requireSupervisorPin, isActive: true },
        include: { role: true }
      });
      if (!supervisor || !['ADMIN', 'SUPERVISOR'].includes(supervisor.role.name)) {
        throw new Error('PIN de supervisor inválido');
      }
    }

    const productIds = data.orderItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, businessId, isActive: true }
    });

    const newOrderItems: Array<{
      productId: string;
      quantity: number;
      price: Decimal;
      subtotal: Decimal;
      notes: string | null;
      status: (typeof OrderItemStatus)[keyof typeof OrderItemStatus];
      sentToKitchen: boolean;
      sentToBar: boolean;
    }> = [];
    let subtotal = new Decimal(0);

    for (const item of data.orderItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
      const price = new Decimal(product.price);
      const itemSubtotal = price.mul(item.quantity);
      subtotal = subtotal.add(itemSubtotal);
      newOrderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
        notes: item.notes ?? null,
        status: OrderItemStatus.PENDING,
        sentToKitchen: false,
        sentToBar: false
      });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    const taxRate = Number(business?.taxRate || 18) / 100;
    const tipRate = Number(business?.tipRate || 10) / 100;

    const tax = subtotal.mul(taxRate);
    const tip = subtotal.mul(tipRate);
    const total = subtotal.add(tax).add(tip);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId } });
      const created = await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal,
          tax,
          total,
          orderItems: { create: newOrderItems },
          orderLogs: {
            create: {
              userId,
              action: 'ITEMS_UPDATED',
              details: { itemsCount: newOrderItems.length, total: total.toNumber() }
            }
          }
        } as never,
        include: {
          orderItems: { include: { product: true } },
          table: true,
          user: true
        }
      });
      return created;
    });

    return updated;
  }

  async sendOrder(orderId: string, businessId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: {
        orderItems: { include: { product: true } },
        table: true
      }
    });
    if (!order) throw new Error('Orden no encontrada');
    if (order.status === OrderStatus.PAID || order.status === OrderStatus.CANCELLED) {
      throw new Error('No se puede enviar esta orden');
    }

    const foodItems = (order.orderItems || []).filter((i) => i.product.type === ProductType.FOOD && !i.sentToKitchen);
    const drinkItems = (order.orderItems || []).filter((i) => i.product.type === ProductType.DRINK && !i.sentToBar);

    await prisma.$transaction(async (tx) => {
      if (foodItems.length > 0) {
        await tx.orderItem.updateMany({
          where: { id: { in: foodItems.map((i) => i.id) } },
          data: { sentToKitchen: true, status: OrderItemStatus.PENDING }
        });
      }
      if (drinkItems.length > 0) {
        await tx.orderItem.updateMany({
          where: { id: { in: drinkItems.map((i) => i.id) } },
          data: { sentToBar: true, status: OrderItemStatus.PENDING }
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: {
          sentAt: new Date(),
          status: order.status === OrderStatus.PENDING ? OrderStatus.PREPARING : order.status,
          orderLogs: {
            create: {
              userId,
              action: 'ORDER_SENT',
              details: { foodCount: foodItems.length, drinkCount: drinkItems.length }
            }
          }
        } as never
      });
    });

    const updatedOrder = await this.getById(orderId, businessId);
    const toNum = (v: unknown) => (v instanceof Decimal ? v.toNumber() : v);
    if (foodItems.length > 0) {
      emitNewOrder(businessId, {
        type: 'KITCHEN',
        orderId,
        orderItems: foodItems.map((i) => ({
          id: i.id,
          productId: i.productId,
          quantity: i.quantity,
          notes: i.notes,
          price: toNum(i.price),
          subtotal: toNum(i.subtotal),
          product: { id: i.product.id, name: i.product.name, type: i.product.type }
        })),
        table: updatedOrder.table.tableNumber,
        createdAt: (updatedOrder as { sentAt?: Date }).sentAt || updatedOrder.createdAt
      });
    }
    if (drinkItems.length > 0) {
      emitNewOrder(businessId, {
        type: 'BAR',
        orderId,
        orderItems: drinkItems.map((i) => ({
          id: i.id,
          productId: i.productId,
          quantity: i.quantity,
          notes: i.notes,
          price: toNum(i.price),
          subtotal: toNum(i.subtotal),
          product: { id: i.product.id, name: i.product.name, type: i.product.type }
        })),
        table: updatedOrder.table.tableNumber,
        createdAt: (updatedOrder as { sentAt?: Date }).sentAt || updatedOrder.createdAt
      });
    }
    return { order: updatedOrder, foodItems, drinkItems };
  }

  async updateItemStatus(orderItemId: string, businessId: string, status: (typeof OrderItemStatus)[keyof typeof OrderItemStatus], userId: string) {
    const item = await prisma.orderItem.findFirst({
      where: { id: orderItemId },
      include: { order: true, product: true }
    });
    if (!item || item.order.businessId !== businessId) throw new Error('Item no encontrado');

    const updated = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status },
      include: { order: true, product: true }
    });

    await prisma.orderLog.create({
      data: {
        orderId: item.orderId,
        userId,
        action: 'ITEM_STATUS_CHANGED',
        details: { itemId: orderItemId, status, productName: item.product.name }
      }
    });

    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: item.orderId },
      include: { product: true }
    });
    const allServed = orderItems.every((i) => i.status === OrderItemStatus.SERVED);
    if (allServed) {
      await prisma.order.update({
        where: { id: item.orderId },
        data: { status: OrderStatus.SERVED, servedAt: new Date() }
      });
    }
    const payload = { item: updated, orderId: item.orderId, orderUpdated: allServed };
    emitItemServed(businessId, payload);

    return { item: updated, orderUpdated: allServed };
  }

  async updateStatus(orderId: string, businessId: string, status: (typeof OrderStatus)[keyof typeof OrderStatus], userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: { table: true }
    });
    if (!order) throw new Error('Orden no encontrada');

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as string,
        ...(status === OrderStatus.SERVED && { servedAt: new Date() }),
        ...(status === OrderStatus.PAID && { paidAt: new Date() })
      } as never,
      include: {
        orderItems: { include: { product: true } },
        table: true,
        user: true,
        payments: true
      }
    });

    await prisma.orderLog.create({
      data: {
        orderId,
        userId,
        action: 'STATUS_CHANGED',
        details: { from: order.status, to: status }
      }
    });

    if (status === OrderStatus.PAID) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: TableStatus.FREE }
      });
      emitOrderPaid(businessId, { order: updated, tableId: order.tableId });
    }

    return updated;
  }

  async cancel(orderId: string, businessId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: { table: true }
    });
    if (!order) throw new Error('Orden no encontrada');
    if (order.status === OrderStatus.PAID) throw new Error('No se puede cancelar una orden pagada');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          orderLogs: {
            create: {
              userId,
              action: 'ORDER_CANCELLED',
              details: { previousStatus: order.status }
            }
          }
        } as any,
        include: { orderItems: true, table: true }
      });

      await tx.table.update({
        where: { id: order.tableId },
        data: {
          status: TableStatus.FREE,
          reservedById: null
        } as any
      });

      return updated;
    });
  }
}

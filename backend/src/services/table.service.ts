import prisma from '../config/database.js';
import { TableStatus, OrderStatus } from '../types/enums.js';

export class TableService {
  async list(businessId: string) {
    return prisma.table.findMany({
      where: { businessId },
      include: {
        orders: {
          where: { status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED] } },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      } as never,
      orderBy: { tableNumber: 'asc' }
    });
  }

  async getById(tableId: string, businessId: string) {
    const table = await prisma.table.findFirst({
      where: { id: tableId, businessId },
include: {
          orders: {
            where: { status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED] } },
            include: { orderItems: { include: { product: true } }, user: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        } as never
    });
    if (!table) throw new Error('Mesa no encontrada');
    return table;
  }

  async openTable(tableId: string, businessId: string, userId: string) {
    const table = await prisma.table.findFirst({
      where: { id: tableId, businessId }
    });
    if (!table) throw new Error('Mesa no encontrada');
    if (table.status === TableStatus.OCCUPIED) {
      throw new Error('La mesa ya está ocupada. Use verificar PIN para acceder a la orden.');
    }
    return this.getById(tableId, businessId);
  }

  async verifyPinAndGetOrder(tableId: string, businessId: string, pin: string) {
    const table = await prisma.table.findFirst({
      where: { id: tableId, businessId },
      include: {
        orders: {
          where: { status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED] } },
          include: {
            orderItems: { include: { product: true } },
            user: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    if (!table) throw new Error('Mesa no encontrada');
    if (table.status !== TableStatus.OCCUPIED) {
      throw new Error('La mesa no está ocupada');
    }
    const activeOrder = table.orders[0];
    if (!activeOrder) throw new Error('No hay orden activa en esta mesa');
    const waiterPin = activeOrder.user.pin;
    if (waiterPin !== pin) {
      throw new Error('PIN incorrecto');
    }
    return { table, order: activeOrder };
  }

  async reserve(tableId: string, businessId: string, userId: string) {
    const table = await prisma.table.findFirst({
      where: { id: tableId, businessId }
    });
    if (!table) throw new Error('Mesa no encontrada');
    if (table.status !== TableStatus.FREE) {
      throw new Error('La mesa no está disponible para reservar');
    }

    await prisma.table.update({
      where: { id: tableId },
      data: {
        status: TableStatus.RESERVED,
        reservedAt: new Date(),
        reservedById: userId
      } as Record<string, unknown>
    });

    return this.getById(tableId, businessId);
  }
}

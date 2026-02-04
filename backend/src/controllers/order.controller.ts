import { Response } from 'express';
import { OrderService } from '../services/order.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { serializeDecimals } from '../utils/serialize.js';
import { OrderItemStatus } from '../types/enums.js';
import prisma from '../config/database.js';

const orderService = new OrderService();

export class OrderController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { userId: requestedUserId, ...payload } = req.body;
      let orderUserId = req.user!.id;

      if (requestedUserId && requestedUserId !== req.user!.id) {
        const target = await prisma.user.findFirst({
          where: { id: requestedUserId, businessId: req.user!.businessId, isActive: true },
          include: { role: true }
        });

        if (!target) {
          return res.status(400).json({ success: false, message: 'Camarero no valido' });
        }

        if (!['CAMARERO', 'SUPERVISOR', 'ADMIN'].includes(target.role.name)) {
          return res.status(400).json({ success: false, message: 'Rol no permitido para crear ordenes' });
        }

        orderUserId = target.id;
      }

      const order = await orderService.create({
        ...payload,
        businessId: req.user!.businessId,
        userId: orderUserId
      });
      res.status(201).json({ success: true, data: serializeDecimals(order) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear orden';
      res.status(400).json({ success: false, message });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const { status, startDate, endDate } = req.query;
      const orders = await orderService.list(req.user!.businessId, {
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      res.json({ success: true, data: serializeDecimals(orders) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al listar órdenes';
      res.status(500).json({ success: false, message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.getById(req.params.id, req.user!.businessId);
      res.json({ success: true, data: serializeDecimals(order) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Orden no encontrada';
      res.status(404).json({ success: false, message });
    }
  }

  async getKitchenOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await orderService.getKitchenOrders(req.user!.businessId);
      res.json({ success: true, data: serializeDecimals(orders) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener órdenes de cocina';
      res.status(500).json({ success: false, message });
    }
  }

  async getKitchenSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await orderService.getKitchenSummary(req.user!.businessId);
      res.json({ success: true, data: summary });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener resumen de cocina';
      res.status(500).json({ success: false, message });
    }
  }

  async getBarOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await orderService.getBarOrders(req.user!.businessId);
      res.json({ success: true, data: serializeDecimals(orders) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener órdenes del bar';
      res.status(500).json({ success: false, message });
    }
  }

  async getBarSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await orderService.getBarSummary(req.user!.businessId);
      res.json({ success: true, data: summary });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener resumen del bar';
      res.status(500).json({ success: false, message });
    }
  }

  async getServedOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await orderService.getServedOrders(req.user!.businessId);
      res.json({ success: true, data: serializeDecimals(orders) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener órdenes servidas';
      res.status(500).json({ success: false, message });
    }
  }

  async updateItems(req: AuthRequest, res: Response) {
    try {
      const { supervisorPin } = req.body;
      const order = await orderService.updateItems(
        req.params.id,
        req.user!.businessId,
        req.user!.id,
        req.body.orderItems,
        supervisorPin
      );
      res.json({ success: true, data: serializeDecimals(order) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar items';
      res.status(400).json({ success: false, message });
    }
  }

  async sendOrder(req: AuthRequest, res: Response) {
    try {
      const result = await orderService.sendOrder(req.params.id, req.user!.businessId, req.user!.id);
      res.json({
        success: true,
        data: {
          order: serializeDecimals(result.order),
          foodorderItems: result.foodItems.length,
          drinkorderItems: result.drinkItems.length
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al enviar orden';
      res.status(400).json({ success: false, message });
    }
  }

  async updateItemStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.body;
      if (!status || !['PENDING', 'PREPARING', 'READY', 'SERVED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado inválido' });
      }
      const result = await orderService.updateItemStatus(
        req.params.itemId,
        req.user!.businessId,
        status as (typeof OrderItemStatus)[keyof typeof OrderItemStatus],
        req.user!.id
      );
      res.json({ success: true, data: serializeDecimals(result) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar estado del item';
      res.status(400).json({ success: false, message });
    }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Estado requerido' });
      }
      const order = await orderService.updateStatus(
        req.params.id,
        req.user!.businessId,
        status,
        req.user!.id
      );
      res.json({ success: true, data: serializeDecimals(order) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar estado';
      res.status(400).json({ success: false, message });
    }
  }
  async cancel(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.cancel(req.params.id, req.user!.businessId, req.user!.id);
      res.json({ success: true, data: serializeDecimals(order) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cancelar orden';
      res.status(400).json({ success: false, message });
    }
  }
}

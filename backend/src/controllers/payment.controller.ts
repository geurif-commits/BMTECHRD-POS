import { Response } from 'express';
import { PaymentService } from '../services/payment.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { serializeDecimals } from '../utils/serialize.js';
import { PaymentMethod } from '../types/enums.js';

const paymentService = new PaymentService();

export class PaymentController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { orderId, amount, method, reference, notes } = req.body;
      if (!orderId || amount == null || !method) {
        return res.status(400).json({
          success: false,
          message: 'orderId, amount y method son requeridos'
        });
      }
      const payment = await paymentService.create(
        req.user!.businessId,
        orderId,
        req.user!.id,
        { amount: Number(amount), method: method as (typeof PaymentMethod)[keyof typeof PaymentMethod], reference, notes }
      );
      res.status(201).json({ success: true, data: serializeDecimals(payment) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al registrar pago';
      res.status(400).json({ success: false, message });
    }
  }

  async history(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, orderId } = req.query;
      const payments = await paymentService.history(req.user!.businessId, {
        startDate: startDate as string,
        endDate: endDate as string,
        orderId: orderId as string
      });
      res.json({ success: true, data: serializeDecimals(payments) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener historial';
      res.status(500).json({ success: false, message });
    }
  }
}

import { Response } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { serializeDecimals } from '../utils/serialize.js';

const dashboardService = new DashboardService();

export class DashboardController {
  async salesToday(req: AuthRequest, res: Response) {
    try {
      const data = await dashboardService.salesToday(req.user!.businessId);
      res.json({ success: true, data: serializeDecimals(data) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener ventas del día';
      res.status(500).json({ success: false, message });
    }
  }

  async salesByWaiter(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await dashboardService.salesByWaiter(
        req.user!.businessId,
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener ventas por camarero';
      res.status(500).json({ success: false, message });
    }
  }

  async salesByProduct(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await dashboardService.salesByProduct(
        req.user!.businessId,
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener ventas por producto';
      res.status(500).json({ success: false, message });
    }
  }

  async salesByHour(req: AuthRequest, res: Response) {
    try {
      const { date } = req.query;
      const data = await dashboardService.salesByHour(req.user!.businessId, date as string);
      res.json({ success: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener ventas por hora';
      res.status(500).json({ success: false, message });
    }
  }

  async kpis(req: AuthRequest, res: Response) {
    try {
      const data = await dashboardService.kpis(req.user!.businessId);
      res.json({ success: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener KPIs';
      res.status(500).json({ success: false, message });
    }
  }
}

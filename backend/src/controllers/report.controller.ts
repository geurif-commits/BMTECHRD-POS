import { Response } from 'express';
import reportService from '../services/report.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { serializeDecimals } from '../utils/serialize.js';

const svc = reportService;

export class ReportController {
  async sales(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, format } = req.query;
      const summary = await svc.salesSummary(req.user!.businessId, startDate as string, endDate as string);

      if ((format as string)?.toLowerCase() === 'csv') {
        const csv = svc.toCSV(summary);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
        return res.send(csv);
      }

      res.json({ success: true, data: serializeDecimals(summary) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al generar reporte de ventas';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new ReportController();

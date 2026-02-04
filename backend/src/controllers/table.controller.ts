import { Response } from 'express';
import { TableService } from '../services/table.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { serializeDecimals, mapTableForFrontend } from '../utils/serialize.js';

const tableService = new TableService();

export class TableController {
  async list(req: AuthRequest, res: Response) {
    try {
      const tables = await tableService.list(req.user!.businessId);
      res.json({ success: true, data: mapTableForFrontend(tables) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al listar mesas';
      res.status(500).json({ success: false, message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const table = await tableService.getById(req.params.id, req.user!.businessId);
      res.json({ success: true, data: mapTableForFrontend(table) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Mesa no encontrada';
      res.status(404).json({ success: false, message });
    }
  }

  async openTable(req: AuthRequest, res: Response) {
    try {
      const table = await tableService.openTable(req.params.id, req.user!.businessId, req.user!.id);
      res.json({ success: true, data: mapTableForFrontend(table) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al abrir mesa';
      res.status(400).json({ success: false, message });
    }
  }

  async verifyPinAndGetOrder(req: AuthRequest, res: Response) {
    try {
      const { pin } = req.body;
      if (!pin) {
        return res.status(400).json({ success: false, message: 'PIN requerido' });
      }
      const result = await tableService.verifyPinAndGetOrder(req.params.id, req.user!.businessId, pin);
      res.json({ success: true, data: mapTableForFrontend(result) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al verificar PIN';
      res.status(400).json({ success: false, message });
    }
  }

  async reserve(req: AuthRequest, res: Response) {
    try {
      const table = await tableService.reserve(req.params.id, req.user!.businessId, req.user!.id);
      res.json({ success: true, data: serializeDecimals(table) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al reservar mesa';
      res.status(400).json({ success: false, message });
    }
  }
}

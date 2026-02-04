import { Response } from 'express';
import { InventoryService } from '../services/inventory.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { serializeDecimals } from '../utils/serialize.js';

const inventoryService = new InventoryService();

export class InventoryController {
  async list(req: AuthRequest, res: Response) {
    try {
      const items = await inventoryService.list(req.user!.businessId);
      res.json({ success: true, data: serializeDecimals(items) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al listar inventario';
      res.status(500).json({ success: false, message });
    }
  }

  async lowStock(req: AuthRequest, res: Response) {
    try {
      const items = await inventoryService.lowStock(req.user!.businessId);
      res.json({ success: true, data: serializeDecimals(items) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al listar stock bajo';
      res.status(500).json({ success: false, message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { quantity, minStock } = req.body;
      if (quantity == null) {
        return res.status(400).json({ success: false, message: 'quantity requerido' });
      }
      const item = await inventoryService.update(
        req.params.productId,
        req.user!.businessId,
        Number(quantity),
        minStock != null ? Number(minStock) : undefined
      );
      res.json({ success: true, data: serializeDecimals(item) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar inventario';
      res.status(400).json({ success: false, message });
    }
  }
}

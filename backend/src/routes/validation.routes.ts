import { Router } from 'express';
import { authorize } from '../middlewares/authorize.js';
import { validationService } from '../services/validation.service.js';
import type { Request, Response } from 'express';

const router = Router();

/**
 * GET /validation/full-system
 * Ejecuta validación completa del sistema
 */
router.get('/full-system', authorize(['ADMIN', 'OWNER']), async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user?.businessId;
    if (!businessId) {
      return res.status(401).json({ success: false, message: 'Usuario no autorizado' });
    }
    const validation = await validationService.validateFullSystem(businessId);
    res.json({ success: true, data: validation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error en validación';
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /validation/communication-report
 * Obtiene reporte de comunicación de mesas
 */
router.get('/communication-report', authorize(['ADMIN', 'OWNER']), async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user?.businessId;
    if (!businessId) {
      return res.status(401).json({ success: false, message: 'Usuario no autorizado' });
    }
    const report = await validationService.getTableCommunicationReport(businessId);
    res.json({ success: true, data: report });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener reporte';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /validation/sync-orientation
 * Sincroniza orientación de todas las mesas
 */
router.post('/sync-orientation', authorize(['ADMIN', 'OWNER']), async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user?.businessId;
    if (!businessId) {
      return res.status(401).json({ success: false, message: 'Usuario no autorizado' });
    }
    const { orientation } = req.body;
    if (!['horizontal', 'vertical'].includes(orientation)) {
      return res.status(400).json({ success: false, message: 'Orientación inválida' });
    }
    const result = await validationService.syncTableOrientation(businessId, orientation);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al sincronizar';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /validation/auto-position
 * Genera posiciones automáticas para mesas
 */
router.post('/auto-position', authorize(['ADMIN', 'OWNER']), async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user?.businessId;
    if (!businessId) {
      return res.status(401).json({ success: false, message: 'Usuario no autorizado' });
    }
    const { gridColumns = 4, spacingX = 150, spacingY = 150 } = req.body;
    const result = await validationService.autoPositionTables(
      businessId,
      gridColumns,
      spacingX,
      spacingY
    );
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al posicionar';
    res.status(500).json({ success: false, message });
  }
});

export default router;

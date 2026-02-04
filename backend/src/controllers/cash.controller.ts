import { Request, Response } from 'express';
import { CashService } from '../services/cash.service.js';
import { AuthRequest } from '../middleware/auth.js';

const cashService = new CashService();

export class CashController {
    async getStatus(req: AuthRequest, res: Response) {
        try {
            const shift = await cashService.getActiveShift(req.user!.businessId, req.user!.id);
            res.json({ success: true, data: shift });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async open(req: AuthRequest, res: Response) {
        try {
            const { openingBalance, notes } = req.body;
            const shift = await cashService.openShift(req.user!.businessId, req.user!.id, openingBalance, notes);
            res.json({ success: true, data: shift });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async close(req: AuthRequest, res: Response) {
        try {
            const { actualCash, notes } = req.body;
            const { id } = req.params;
            const canOverride = ['ADMIN', 'OWNER', 'SUPERVISOR'].includes(req.user!.role);
            const shift = await cashService.closeShift(id, req.user!.businessId, req.user!.id, actualCash, notes, canOverride);
            res.json({ success: true, data: shift });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async addExpense(req: AuthRequest, res: Response) {
        try {
            const { description, amount, category } = req.body;
            const expense = await cashService.addExpense(req.user!.businessId, description, amount, category);
            res.json({ success: true, data: expense });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

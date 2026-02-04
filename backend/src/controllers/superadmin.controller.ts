import { Response } from 'express';
import { SuperAdminService } from '../services/superadmin.service.js';
import { AuthRequest } from '../middleware/auth.js';

const superAdminService = new SuperAdminService();

export class SuperAdminController {
    async getBusinesses(req: AuthRequest, res: Response) {
        try {
            const data = await superAdminService.listBusinesses();
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async generateLicense(req: AuthRequest, res: Response) {
        try {
            const { businessId, type } = req.body;
            const license = await superAdminService.generateLicense(businessId, type);
            res.json({ success: true, data: license });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getStats(req: AuthRequest, res: Response) {
        try {
            const data = await superAdminService.getGlobalStats();
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getLandingSettings(req: AuthRequest, res: Response) {
        try {
            const data = await superAdminService.getLandingSettings();
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateLandingSettings(req: AuthRequest, res: Response) {
        try {
            const data = await superAdminService.updateLandingSettings(req.body || {});
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async createBusiness(req: AuthRequest, res: Response) {
        try {
            const business = await superAdminService.createBusiness(req.body);
            res.status(201).json({ success: true, data: business });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async backupDatabase(req: AuthRequest, res: Response) {
        try {
            const backup = await superAdminService.backupDatabase();
            res.download(backup.outputPath, backup.fileName);
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async listActivationRequests(req: AuthRequest, res: Response) {
        try {
            const data = await superAdminService.listActivationRequests();
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async approveActivationRequest(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { plan } = req.body || {};
            const result = await superAdminService.approveActivationRequest(id, plan);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

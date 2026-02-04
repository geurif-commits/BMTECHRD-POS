import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

// Get public business config (no auth required)
router.get('/:id/config', async (req, res) => {
    try {
        const { id } = req.params;
        const business = await prisma.business.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                currency: true
            }
        });

        if (!business) {
            return res.status(404).json({ success: false, message: 'Negocio no encontrado' });
        }

        res.json({ success: true, data: business });
    } catch (error) {
        console.error('Error fetching business config:', error);
        res.status(500).json({ success: false, message: 'Error al obtener configuración' });
    }
});

router.use(authenticate);
router.use(licenseCheck);

// Get business settings
router.get('/settings', authorize(['ADMIN', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const business = await prisma.business.findUnique({
            where: { id: req.user!.businessId },
            select: {
                id: true,
                name: true,
                rnc: true,
                address: true,
                phone: true,
                email: true,
                taxId: true,
                currency: true,
                taxRate: true,
                tipRate: true,
                bankAccountNumber: true,
                bankName: true,
                bankAccountType: true
            }
        });

        res.json({ success: true, data: business });
    } catch (error) {
        console.error('Error fetching business settings:', error);
        res.status(500).json({ success: false, message: 'Error al obtener configuración' });
    }
});

// Update business settings
router.put('/settings', authorize(['ADMIN', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const { name, rnc, address, phone, email, taxId, currency, taxRate, tipRate, bankAccountNumber, bankName, bankAccountType } = req.body;

        const business = await prisma.business.update({
            where: { id: req.user!.businessId },
            data: {
                ...(name && { name }),
                ...(rnc && { rnc }),
                ...(address && { address }),
                ...(phone && { phone }),
                ...(email && { email }),
                ...(taxId && { taxId }),
                ...(currency && { currency }),
                ...(taxRate !== undefined && { taxRate }),
                ...(tipRate !== undefined && { tipRate }),
                ...(bankAccountNumber && { bankAccountNumber }),
                ...(bankName && { bankName }),
                ...(bankAccountType && { bankAccountType })
            }
        });

        res.json({ success: true, data: business });
    } catch (error) {
        console.error('Error updating business settings:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar configuración' });
    }
});

// Update business by ID
router.put('/:id', authorize(['ADMIN', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { name, rnc, address, phone, email, taxId, currency, taxRate, tipRate, bankAccountNumber, bankName, bankAccountType } = req.body;

        if (req.user?.businessId !== id) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const business = await prisma.business.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(rnc && { rnc }),
                ...(address && { address }),
                ...(phone && { phone }),
                ...(email && { email }),
                ...(taxId && { taxId }),
                ...(currency && { currency }),
                ...(taxRate !== undefined && { taxRate }),
                ...(tipRate !== undefined && { tipRate }),
                ...(bankAccountNumber && { bankAccountNumber }),
                ...(bankName && { bankName }),
                ...(bankAccountType && { bankAccountType })
            },
            include: {
                licenses: true,
                users: { select: { id: true, name: true, email: true, role: true } }
            }
        });

        res.json({ success: true, data: business });
    } catch (error: any) {
        console.error('Error updating business:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

export default router;

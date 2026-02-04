import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BusinessController {
  async updateBusiness(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, address, phone, email, rnc, bankAccountNumber, bankName, bankAccountType } = req.body;

      // Verificar que el usuario pertenezca al negocio (opcional pero recomendado)
      if (req.user?.businessId && req.user.businessId !== id) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }

      const business = await prisma.business.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(address && { address }),
          ...(phone && { phone }),
          ...(email && { email }),
          ...(rnc && { rnc }),
          ...(bankAccountNumber && { bankAccountNumber }),
          ...(bankName && { bankName }),
          ...(bankAccountType && { bankAccountType }),
        },
        include: {
          licenses: true,
          users: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      res.json({ success: true, data: business });
    } catch (error: any) {
      console.error('Error updating business:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getBusiness(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const business = await prisma.business.findUnique({
        where: { id },
        include: {
          licenses: true,
          users: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      if (!business) {
        return res.status(404).json({ success: false, message: 'Negocio no encontrado' });
      }

      res.json({ success: true, data: business });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

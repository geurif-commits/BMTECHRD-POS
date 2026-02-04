import { Router } from 'express';
import prisma from '../config/database.js';
import { SuperAdminService } from '../services/superadmin.service.js';

const router = Router();
const superAdminService = new SuperAdminService();

const getNextBusinessCode = async () => {
  const businessMax = await prisma.business.aggregate({
    _max: { businessCode: true }
  });
  const requestMax = await (prisma as any).activationRequest.aggregate({
    _max: { businessCode: true }
  });

  const maxCode = Math.max(
    businessMax?._max?.businessCode ?? 0,
    requestMax?._max?.businessCode ?? 0
  );

  return maxCode + 1;
};

// Get next auto-increment business code (preview)
router.get('/next-business-code', async (_req, res) => {
  try {
    const nextBusinessCode = await getNextBusinessCode();
    res.json({ success: true, data: { nextBusinessCode } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public landing settings
router.get('/landing-settings', async (_req, res) => {
  try {
    const data = await superAdminService.getLandingSettings();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public activation request
router.post('/request', async (req, res) => {
  try {
    const {
      businessCode,
      businessName,
      rnc,
      businessType,
      adminName,
      adminEmail,
      phone,
      city,
      country,
      plan
    } = req.body || {};

    if (!businessName || !adminName || !adminEmail || !plan) {
      return res.status(400).json({ success: false, message: 'Datos requeridos incompletos' });
    }

    const existing = await (prisma as any).activationRequest.findFirst({
      where: {
        adminEmail,
        status: 'PENDING'
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Ya existe una solicitud pendiente para este email' });
    }

    let resolvedBusinessCode = businessCode ? Number(businessCode) : undefined;
    if (!resolvedBusinessCode) {
      resolvedBusinessCode = await getNextBusinessCode();
    }

    const existingCode = await prisma.business.findFirst({
      where: { businessCode: resolvedBusinessCode }
    });
    const existingRequestCode = await (prisma as any).activationRequest.findFirst({
      where: { businessCode: resolvedBusinessCode }
    });
    if (existingCode || existingRequestCode) {
      resolvedBusinessCode = await getNextBusinessCode();
    }

    const request = await superAdminService.createActivationRequest({
      businessCode: resolvedBusinessCode,
      businessName,
      rnc,
      businessType,
      adminName,
      adminEmail,
      phone,
      city,
      country,
      plan
    });

    if (plan === 'TRIAL_7_DAYS') {
      const approved = await superAdminService.approveActivationRequest(request.id, plan);
      return res.status(201).json({
        success: true,
        data: {
          autoApproved: true,
          requestId: request.id,
          business: approved.business,
          licenseKey: approved.licenseKey,
          credentials: approved.credentials
        }
      });
    }

    res.status(201).json({ success: true, data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

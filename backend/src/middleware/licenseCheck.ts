import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export const licenseCheck = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.license) {
    return res.status(403).json({
      success: false,
      code: 'LICENSE_EXPIRED',
      message: 'La licencia del negocio ha expirado. Contacte al soporte.'
    });
  }

  const endDate = new Date(req.license.endDate);
  if (Number.isNaN(endDate.getTime()) || endDate.getTime() < Date.now()) {
    return res.status(403).json({
      success: false,
      code: 'LICENSE_EXPIRED',
      message: 'La licencia del negocio ha expirado. Contacte al soporte.'
    });
  }

  // Check if license is expiring soon (within 7 days)
  const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
    res.setHeader('X-License-Warning', `License expires in ${daysUntilExpiry} days`);
  }

  next();
};

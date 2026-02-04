import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para esta acción'
      });
    }

    next();
  };
};

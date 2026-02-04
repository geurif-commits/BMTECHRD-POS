import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { LicenseStatus } from '../types/enums.js';

export interface AuthPayload {
  userId: string;
  businessId: string;
  role: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    businessId: string;
    role: string;
    email: string;
  };
  license?: {
    type: string;
    endDate: Date;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as AuthPayload;

    // Get user with business and license
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        business: {
          include: {
            licenses: {
              where: {
                status: LicenseStatus.ACTIVE,
                endDate: { gte: new Date() }
              },
              orderBy: { endDate: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const activeLicense = user.business.licenses[0];

    req.user = {
      id: user.id,
      businessId: user.businessId,
      role: user.role.name,
      email: user.email
    };

    if (activeLicense) {
      req.license = {
        type: activeLicense.type,
        endDate: activeLicense.endDate
      };
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: 'Token expirado' });
    }
    res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { LicenseStatus } from '../types/enums.js';

export interface LoginInput {
  email: string;
  password: string;
  businessId: string;
}

export interface AuthPayload {
  userId: string;
  businessId: string;
  role: string;
  email: string;
}

export class AuthService {
  async login(data: LoginInput) {
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        businessId: data.businessId,
        isActive: true
      },
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
      throw new Error('Usuario incorrecto o negocio no existe');
    }

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      throw new Error('Clave inválida');
    }

    const activeLicense = user.business.licenses[0];
    if (!activeLicense) {
      throw new Error('La licencia del negocio ha expirado. Contacte al soporte.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const payload: AuthPayload = {
      userId: user.id,
      businessId: user.businessId,
      role: user.role.name,
      email: user.email
    };

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(payload, secret, { expiresIn: (process.env.JWT_EXPIRES_IN as string) || '8h' } as jwt.SignOptions);

    return {
      token,
      user: {
        id: user.id,
        businessId: user.businessId,
        name: user.name,
        email: user.email,
        role: user.role.name,
        pin: user.pin,
        permissions: user.role.permissions
      },
      license: {
        type: activeLicense.type,
        endDate: activeLicense.endDate
      }
    };
  }

  async changePin(userId: string, businessId: string, currentPin: string, newPin: string) {
    const pinRegex = /^\d{4}$/;
    if (!pinRegex.test(newPin)) {
      throw new Error('El PIN debe ser de 4 dígitos numéricos');
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, businessId, isActive: true }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.pin !== currentPin) {
      throw new Error('PIN actual incorrecto');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { pin: newPin }
    });

    return { success: true };
  }
}

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../middleware/auth.js';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password, businessId } = req.body;
      if (!email || !password || !businessId) {
        return res.status(400).json({
          success: false,
          message: 'Email, contraseña y businessId son requeridos'
        });
      }
      const result = await authService.login({ email, password, businessId });
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      res.status(400).json({ success: false, message });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    res.json({ success: true, message: 'Sesión cerrada' });
  }

  async me(req: AuthRequest, res: Response) {
    res.json({
      success: true,
      data: {
        user: req.user,
        license: req.license
      }
    });
  }

  async changePin(req: AuthRequest, res: Response) {
    try {
      const { currentPin, newPin } = req.body;
      if (!currentPin || !newPin) {
        return res.status(400).json({
          success: false,
          message: 'currentPin y newPin son requeridos'
        });
      }
      await authService.changePin(
        req.user!.id,
        req.user!.businessId,
        currentPin,
        newPin
      );
      res.json({ success: true, message: 'PIN actualizado' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cambiar PIN';
      res.status(400).json({ success: false, message });
    }
  }
}

import { Response } from 'express';
import { ProductService } from '../services/product.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { serializeDecimals } from '../utils/serialize.js';
import { ProductType, type ProductTypeType } from '../types/enums.js';

const productService = new ProductService();

export class ProductController {
  async list(req: AuthRequest, res: Response) {
    try {
      const type = req.query.type as ProductTypeType | undefined;
      const products = await productService.list(req.user!.businessId, type);
      res.json({ success: true, data: serializeDecimals(products) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al listar productos';
      res.status(500).json({ success: false, message });
    }
  }

  async listCategories(req: AuthRequest, res: Response) {
    try {
      const type = req.query.type as ProductTypeType | undefined;
      const categories = await productService.listCategories(req.user!.businessId, type);
      res.json({ success: true, data: serializeDecimals(categories) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al listar categorías';
      res.status(500).json({ success: false, message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const product = await productService.getById(req.params.id, req.user!.businessId);
      res.json({ success: true, data: serializeDecimals(product) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Producto no encontrado';
      res.status(404).json({ success: false, message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const product = await productService.create(req.user!.businessId, {
        ...req.body,
        type: req.body.type as ProductTypeType
      });
      res.status(201).json({ success: true, data: serializeDecimals(product) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear producto';
      res.status(400).json({ success: false, message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const product = await productService.update(
        req.params.id,
        req.user!.businessId,
        req.body
      );
      res.json({ success: true, data: serializeDecimals(product) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar producto';
      res.status(400).json({ success: false, message });
    }
  }
}

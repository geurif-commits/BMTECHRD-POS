import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/database.js';
import { ProductType, type ProductTypeType } from '../types/enums.js';

export class ProductService {
  async list(businessId: string, type?: ProductTypeType) {
    const where: { businessId: string; isActive?: boolean; type?: ProductTypeType } = {
      businessId
    };
    if (type) where.type = type;

    return prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }]
    });
  }

  async listCategories(businessId: string, type?: ProductTypeType) {
    const where: { businessId: string; isActive: boolean; type?: ProductTypeType } = {
      businessId,
      isActive: true
    };
    if (type) where.type = type;

    return prisma.category.findMany({
      where,
      include: {
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async getById(productId: string, businessId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, businessId },
      include: { category: true, inventory: true }
    });
    if (!product) throw new Error('Producto no encontrado');
    return product;
  }

  async create(businessId: string, data: {
    categoryId: string;
    name: string;
    description?: string;
    code?: string;
    price: number;
    cost?: number;
    type: ProductTypeType;
    isActive?: boolean;
    hasStock?: boolean;
    sortOrder?: number;
    image?: string;
  }) {
    const price = new Decimal(data.price);
    const cost = data.cost != null ? new Decimal(data.cost) : null;

    const product = await prisma.product.create({
      data: {
        businessId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        code: data.code,
        price,
        cost,
        type: data.type as ProductTypeType,
        isActive: data.isActive ?? true,
        hasStock: data.hasStock ?? false,
        isIngredient: (data as any).isIngredient ?? false,
        unit: (data as any).unit ?? 'UNIDAD',
        sortOrder: data.sortOrder ?? 0,
        image: data.image
      } as any,
      include: { category: true }
    });

    if (data.hasStock) {
      await prisma.inventory.create({
        data: {
          businessId,
          productId: product.id,
          quantity: 0,
          minStock: 10
        }
      });
    }

    return prisma.product.findUnique({
      where: { id: product.id },
      include: { category: true, inventory: true }
    });
  }

  async update(productId: string, businessId: string, data: Partial<{
    name: string;
    description: string;
    code: string;
    price: number;
    cost: number;
    type: ProductTypeType;
    isActive: boolean;
    hasStock: boolean;
    sortOrder: number;
    image: string;
  }>) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.price != null) updateData.price = new Decimal(data.price);
    if (data.cost != null) updateData.cost = new Decimal(data.cost);

    return prisma.product.update({
      where: { id: productId },
      data: {
        ...updateData,
        isIngredient: (data as any).isIngredient,
        unit: (data as any).unit
      } as any,
      include: { category: true, inventory: true }
    });
  }
}

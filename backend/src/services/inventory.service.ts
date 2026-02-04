import prisma from '../config/database.js';

export class InventoryService {
  async list(businessId: string) {
    // Ensure all active products have an inventory record
    const products = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true
      }
    });

    for (const p of products) {
      await prisma.inventory.upsert({
        where: { productId: p.id },
        update: {},
        create: {
          businessId,
          productId: p.id,
          quantity: 0,
          minStock: 10,
          lastUpdate: new Date()
        }
      });
    }

    return prisma.inventory.findMany({
      where: { businessId },
      include: {
        product: {
          include: { category: true }
        }
      },
      orderBy: { product: { name: 'asc' } }
    });
  }

  async lowStock(businessId: string) {
    const all = await prisma.inventory.findMany({
      where: { businessId },
      include: {
        product: {
          include: { category: true }
        }
      },
      orderBy: { quantity: 'asc' }
    });
    return all.filter((inv) => inv.quantity <= inv.minStock);
  }

  async update(productId: string, businessId: string, quantity: number, minStock?: number) {
    const inv = await prisma.inventory.findFirst({
      where: { productId, businessId }
    });

    if (!inv) {
      // If it doesn't exist, check if product exists first
      const product = await prisma.product.findFirst({
        where: { id: productId, businessId }
      });
      if (!product) throw new Error('Producto no encontrado');

      return prisma.inventory.create({
        data: {
          businessId,
          productId,
          quantity,
          minStock: minStock ?? 0,
          lastUpdate: new Date()
        },
        include: { product: true }
      });
    }

    return prisma.inventory.update({
      where: { id: inv.id },
      data: {
        quantity,
        ...(minStock != null && { minStock }),
        lastUpdate: new Date()
      },
      include: { product: true }
    });
  }

  async decrementByOrderItems(businessId: string, orderItems: Array<{ productId: string; quantity: number }>) {
    for (const item of orderItems) {
      // Check if product has a recipe
      const recipe = await prisma.recipe.findMany({
        where: { productId: item.productId, businessId }
      });

      if (recipe.length > 0) {
        // Decrement ingredients
        for (const r of recipe) {
          const needed = Number(r.quantity) * item.quantity;
          const inv = await prisma.inventory.findFirst({
            where: { productId: r.ingredientId, businessId }
          });
          if (inv) {
            await prisma.inventory.update({
              where: { id: inv.id },
              data: {
                quantity: { decrement: Math.ceil(needed) },
                lastUpdate: new Date()
              }
            });
          }
        }
      } else {
        // Decrement product directly
        const inv = await prisma.inventory.findFirst({
          where: { productId: item.productId, businessId }
        });
        if (inv) {
          await prisma.inventory.update({
            where: { id: inv.id },
            data: {
              quantity: { decrement: item.quantity },
              lastUpdate: new Date()
            }
          });
        }
      }
    }
  }
}

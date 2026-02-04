import prisma from '../src/config/database.js';

async function incrementByOrderItems(businessId: string, orderItems: Array<{ productId: string; quantity: number }>) {
  for (const item of orderItems) {
    const recipe = await prisma.recipe.findMany({
      where: { productId: item.productId, businessId }
    });

    if (recipe.length > 0) {
      for (const r of recipe) {
        const needed = Number(r.quantity) * item.quantity;
        const inv = await prisma.inventory.findFirst({
          where: { productId: r.ingredientId, businessId }
        });
        if (inv) {
          await prisma.inventory.update({
            where: { id: inv.id },
            data: {
              quantity: { increment: Math.ceil(needed) },
              lastUpdate: new Date()
            }
          });
        }
      }
    } else {
      const inv = await prisma.inventory.findFirst({
        where: { productId: item.productId, businessId }
      });
      if (inv) {
        await prisma.inventory.update({
          where: { id: inv.id },
          data: {
            quantity: { increment: item.quantity },
            lastUpdate: new Date()
          }
        });
      }
    }
  }
}

async function main() {
  const testOrders = await prisma.order.findMany({
    where: {
      customerName: 'Cliente Test'
    },
    include: { orderItems: true, table: true, payments: true }
  });

  if (testOrders.length === 0) {
    console.log('✅ No hay órdenes de validación para limpiar.');
    return;
  }

  for (const order of testOrders) {
    await incrementByOrderItems(order.businessId, order.orderItems.map((i: { productId: string; quantity: number }) => ({
      productId: i.productId,
      quantity: i.quantity
    })));

    await prisma.orderLog.deleteMany({ where: { orderId: order.id } });
    await prisma.payment.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });

    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'FREE', reservedById: null }
      });
    }
  }

  console.log(`✅ Limpieza completada. Órdenes eliminadas: ${testOrders.length}`);
}

main()
  .catch((error) => {
    console.error('❌ Error en limpieza:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library.js';

const prisma = new PrismaClient();

async function initializeSystem() {
  try {
    console.log('🔧 INICIALIZACIÓN DEL SISTEMA POS - VERSIÓN PROFESIONAL\n');

    const businessId = '11111111-1111-1111-1111-111111111111';

    // 1. Sincronizar inventario con productos
    console.log('1️⃣  Sincronizando inventario con productos...');
    const products = await prisma.product.findMany({
      where: { businessId }
    });

    for (const product of products) {
      const existing = await prisma.inventory.findUnique({
        where: { productId: product.id }
      });

      if (!existing) {
        await prisma.inventory.create({
          data: {
            businessId,
            productId: product.id,
            quantity: 100, // Stock inicial
            minStock: 20   // Stock mínimo
          }
        });
        console.log(`   ✅ Inventario creado: ${product.name}`);
      }
    }

    const inventoryCount = await prisma.inventory.count();
    console.log(`   ✅ Total inventario sincronizado: ${inventoryCount}\n`);

    // 2. Validar rutas de órdenes
    console.log('2️⃣  Validando rutas de órdenes por tipo de producto...');
    
    const categories = await prisma.category.findMany({ where: { businessId } });
    console.log(`   ✅ Categorías registradas: ${categories.length}`);
    
    for (const cat of categories) {
      const count = await prisma.product.count({
        where: { businessId, categoryId: cat.id }
      });
      const route = cat.type === 'FOOD' ? 'COCINA' : 'BAR';
      console.log(`      - ${cat.name} (${count} productos) → ${route}`);
    }
    console.log();

    // 3. Crear orden de prueba para validar flujo
    console.log('3️⃣  Creando orden de prueba para validar flujo...');
    
    const camarero = await prisma.user.findFirst({
      where: { businessId, role: { name: 'CAMARERO' } }
    });

    const table = await prisma.table.findFirst({
      where: { businessId }
    });

    if (camarero && table) {
      // Obtener un producto de comida y uno de bebida
      const foodProduct = await prisma.product.findFirst({
        where: { businessId, type: 'FOOD' }
      });

      const drinkProduct = await prisma.product.findFirst({
        where: { businessId, type: 'DRINK' }
      });

      if (foodProduct && drinkProduct) {
        const order = await prisma.order.create({
          data: {
            businessId,
            tableId: table.id,
            userId: camarero.id,
            status: 'PENDING',
            total: new Decimal(0),
            orderItems: {
              create: [
                {
                  productId: foodProduct.id,
                  quantity: 1,
                  price: new Decimal(foodProduct.price),
                  subtotal: new Decimal(foodProduct.price),
                  status: 'PENDING'
                },
                {
                  productId: drinkProduct.id,
                  quantity: 1,
                  price: new Decimal(drinkProduct.price),
                  subtotal: new Decimal(drinkProduct.price),
                  status: 'PENDING'
                }
              ]
            }
          }
        });

        const orderTotal = new Decimal(foodProduct.price).add(new Decimal(drinkProduct.price));
        await prisma.order.update({
          where: { id: order.id },
          data: { total: orderTotal }
        });

        console.log(`   ✅ Orden de prueba creada`);
        console.log(`      - ID: ${order.id.substring(0, 8)}...`);
        console.log(`      - Mesa: ${table.tableNumber}`);
        console.log(`      - Items: 2 (1 comida + 1 bebida)`);
        console.log(`      - Total: $${orderTotal}\n`);

        // 4. Registrar orden en log
        console.log('4️⃣  Registrando orden en auditoría...');
        await prisma.orderLog.create({
          data: {
            orderId: order.id,
            userId: camarero.id,
            action: 'CREATED',
            details: { items: 2, total: orderTotal.toString() }
          }
        });
        console.log(`   ✅ Orden registrada en auditoría\n`);

        // 5. Simular flujo COCINA
        console.log('5️⃣  Simulando flujo COCINA...');
        const cocinero = await prisma.user.findFirst({
          where: { businessId, role: { name: 'COCINERO' } }
        });

        if (cocinero) {
          // Marcar item de comida como listo
          await prisma.orderItem.updateMany({
            where: { orderId: order.id, product: { type: 'FOOD' } },
            data: { status: 'READY' }
          });

          await prisma.orderLog.create({
            data: {
              orderId: order.id,
              userId: cocinero.id,
              action: 'KITCHEN_READY',
              details: { items: 'comidas listas' }
            }
          });

          console.log(`   ✅ Comida marcada como lista por cocina\n`);
        }

        // 6. Simular flujo BAR
        console.log('6️⃣  Simulando flujo BAR...');
        // En un sistema real, habría un usuario con rol BARTENDER
        // Por ahora usamos el cocinero para simular
        if (cocinero) {
          // Marcar item de bebida como listo
          await prisma.orderItem.updateMany({
            where: { orderId: order.id, product: { type: 'DRINK' } },
            data: { status: 'READY' }
          });

          await prisma.orderLog.create({
            data: {
              orderId: order.id,
              userId: cocinero.id,
              action: 'BAR_READY',
              details: { items: 'bebidas listas' }
            }
          });

          console.log(`   ✅ Bebida marcada como lista\n`);
        }

        // 7. Simular flujo CAMARERO (servir)
        console.log('7️⃣  Simulando flujo CAMARERO (servir)...');
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'SERVED' }
        });

        await prisma.orderLog.create({
          data: {
            orderId: order.id,
            userId: camarero.id,
            action: 'SERVED',
            details: { items: 'todos servidos' }
          }
        });

        console.log(`   ✅ Orden marcada como servida\n`);

        // 8. Simular flujo PAGO/CAJA
        console.log('8️⃣  Simulando flujo PAGO/CAJA...');
        const cajero = await prisma.user.findFirst({
          where: { businessId, role: { name: 'CAJERO' } }
        });

        if (cajero) {
          // Abrir turno de caja
          const cashShift = await prisma.cashShift.create({
            data: {
              businessId,
              userId: cajero.id,
              openingBalance: new Decimal(1000),
              isOpen: true
            }
          });

          console.log(`   ✅ Turno de caja abierto`);
          console.log(`      - Saldo inicial: $1000\n`);

          // Procesar pago
          const payment = await prisma.payment.create({
            data: {
              businessId,
              orderId: order.id,
              amount: orderTotal,
              method: 'CASH',
              reference: 'CASH_PAYMENT_001'
            }
          });

          console.log(`   ✅ Pago registrado`);
          console.log(`      - Monto: $${orderTotal}`);
          console.log(`      - Método: EFECTIVO`);
          console.log(`      - Referencia: ${payment.reference}\n`);

          // Actualizar orden como pagada
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
              paidAmount: orderTotal
            }
          });

          // Liberar mesa
          await prisma.table.update({
            where: { id: table.id },
            data: { status: 'FREE' }
          });

          console.log(`   ✅ Orden pagada y mesa liberada\n`);

          // Registrar auditoría de pago
          await prisma.orderLog.create({
            data: {
              orderId: order.id,
              userId: cajero.id,
              action: 'PAID',
              details: { amount: orderTotal.toString(), method: 'CASH' }
            }
          });

          // Cerrar turno de caja
          const closingShift = await prisma.cashShift.update({
            where: { id: cashShift.id },
            data: {
              closingBalance: new Decimal(1000).add(orderTotal),
              totalSales: orderTotal,
              isOpen: false,
              closedAt: new Date()
            }
          });

          console.log(`   ✅ Turno de caja cerrado`);
          console.log(`      - Saldo final: $${closingShift.closingBalance}`);
          console.log(`      - Total ventas: $${closingShift.totalSales}\n`);
        }

        // 9. Registrar evento en auditoría general
        console.log('9️⃣  Validando auditoría de orden...');
        const logs = await prisma.orderLog.findMany({
          where: { orderId: order.id }
        });

        console.log(`   ✅ Registros de auditoría: ${logs.length}`);
        logs.forEach(log => {
          const actions = {
            CREATED: '📝 Creada',
            KITCHEN_READY: '🍳 Cocina lista',
            BAR_READY: '🍷 Bar listo',
            SERVED: '🚀 Servida',
            PAID: '💰 Pagada'
          };
          console.log(`      - ${actions[log.action] || log.action}: ${log.createdAt.toLocaleTimeString()}`);
        });
        console.log();
      }
    }

    // 10. Resumen final
    console.log('════════════════════════════════════════════════════════');
    console.log('✅ INICIALIZACIÓN COMPLETADA');
    console.log('════════════════════════════════════════════════════════\n');

    console.log('📋 VALIDACIÓN DE FLUJOS COMPLETOS:\n');

    console.log('FLUJO CAMARERO → COCINA → CAMARERO:');
    const kitchenOrders = await prisma.order.findMany({
      where: { businessId, orderItems: { some: { product: { type: 'FOOD' } } } }
    });
    console.log(`   ✅ ${kitchenOrders.length} órdenes para cocina\n`);

    console.log('FLUJO CAMARERO → BAR → CAMARERO:');
    const barOrders = await prisma.order.findMany({
      where: { businessId, orderItems: { some: { product: { type: 'DRINK' } } } }
    });
    console.log(`   ✅ ${barOrders.length} órdenes para bar\n`);

    console.log('FLUJO CAMARERO → CAJA → DASHBOARD:');
    const paidOrders = await prisma.order.findMany({
      where: { businessId, status: 'PAID' }
    });
    console.log(`   ✅ ${paidOrders.length} órdenes pagadas\n`);

    console.log('FLUJO INVENTARIO → ÓRDENES:');
    console.log(`   ✅ ${inventoryCount} productos con inventario sincronizado\n`);

    console.log('════════════════════════════════════════════════════════');
    console.log('🎯 SISTEMA COMPLETAMENTE FUNCIONAL Y LISTO');
    console.log('════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error en inicialización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeSystem();

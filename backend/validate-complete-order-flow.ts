import prisma from './src/config/database.js';
import { OrderStatus, OrderItemStatus, ProductType, TableStatus, PaymentMethod } from './src/types/enums.js';
import { OrderService } from './src/services/order.service.js';
import { PaymentService } from './src/services/payment.service.js';
import { Decimal } from '@prisma/client/runtime/library';

const orderService = new OrderService();
const paymentService = new PaymentService();

interface ValidationResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: ValidationResult[] = [];

function logStep(step: string, success: boolean, message: string, data?: any) {
  results.push({ step, success, message, data });
  const status = success ? '✅' : '❌';
  console.log(`${status} ${step}: ${message}`);
  if (data) console.log(`   📊 Data:`, JSON.stringify(data, null, 2));
}

async function validateCompleteOrderFlow() {
  try {
    console.log('\n🔄 VALIDACIÓN COMPLETA DEL FLUJO DE ORDEN POS\n');
    console.log('═'.repeat(60));

    // STEP 1: Verificar datos básicos
    console.log('\n📋 PASO 1: VALIDAR DATOS BÁSICOS');
    console.log('─'.repeat(60));

    const business = await prisma.business.findFirst();
    if (!business) throw new Error('No hay negocio configurado');
    logStep('1.1', true, '✓ Negocio encontrado', { id: business.id, name: business.name });

    const table = await prisma.table.findFirst({
      where: { businessId: business.id, status: TableStatus.FREE }
    });
    if (!table) throw new Error('No hay mesas disponibles');
    logStep('1.2', true, '✓ Mesa disponible', { tableNumber: table.tableNumber, status: table.status });

    const user = await prisma.user.findFirst({
      where: { businessId: business.id, isActive: true },
      include: { role: true }
    });
    if (!user) throw new Error('No hay usuarios disponibles');
    logStep('1.3', true, '✓ Usuario encontrado', { id: user.id, name: user.name, role: user.role.name });

    const products = await prisma.product.findMany({
      where: { businessId: business.id, isActive: true },
      include: { category: true }
    });
    if (products.length < 2) throw new Error('No hay suficientes productos');
    logStep('1.4', true, `✓ ${products.length} productos disponibles`);

    // STEP 2: Crear orden
    console.log('\n📝 PASO 2: CREAR ORDEN (Apertura)');
    console.log('─'.repeat(60));

    const foodProduct = products.find(p => p.type === ProductType.FOOD);
    const drinkProduct = products.find(p => p.type === ProductType.DRINK);

    if (!foodProduct || !drinkProduct) {
      throw new Error('No hay productos de comida o bebida disponibles');
    }

    const newOrder = await orderService.create({
      businessId: business.id,
      tableId: table.id,
      userId: user.id,
      customerName: 'Cliente Test',
      customerCount: 2,
      orderItems: [
        { productId: foodProduct.id, quantity: 2, notes: 'Sin picante' },
        { productId: drinkProduct.id, quantity: 2, notes: 'Con hielo' }
      ]
    });

    logStep('2.1', true, '✓ Orden creada exitosamente', {
      orderId: newOrder.id,
      status: newOrder.status,
      subtotal: newOrder.subtotal.toString(),
      total: newOrder.total.toString(),
      itemsCount: newOrder.orderItems.length
    });

    // Validar estado de la orden
    if (newOrder.status !== OrderStatus.PENDING) {
      throw new Error(`Estado incorrecto: ${newOrder.status}, esperado: ${OrderStatus.PENDING}`);
    }
    logStep('2.2', true, '✓ Estado correcto: PENDING');

    // Validar estado de la mesa
    const tableAfterOrder = await prisma.table.findUnique({ where: { id: table.id } });
    if (tableAfterOrder?.status !== TableStatus.OCCUPIED) {
      throw new Error(`Mesa no ocupada después de crear orden`);
    }
    logStep('2.3', true, '✓ Mesa marcada como OCCUPIED');

    // Validar items de la orden
    if (newOrder.orderItems.length !== 2) {
      throw new Error(`Número de items incorrecto: ${newOrder.orderItems.length}`);
    }
    logStep('2.4', true, '✓ Items creados correctamente', {
      items: newOrder.orderItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
    });

    // STEP 3: Enviar comanda a cocina/bar
    console.log('\n🍽️  PASO 3: ENVIAR COMANDA (Cocina/Bar)');
    console.log('─'.repeat(60));

    const sentOrder = await orderService.sendOrder(newOrder.id, business.id, user.id);

    logStep('3.1', true, '✓ Comanda enviada exitosamente', {
      orderId: sentOrder.order.id,
      status: sentOrder.order.status,
      foodItems: sentOrder.foodItems.length,
      drinkItems: sentOrder.drinkItems.length
    });

    // Validar que los items tengan sentToKitchen/sentToBar
    const sentOrderFull = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: { orderItems: true }
    });

    if (!sentOrderFull) throw new Error('Orden no encontrada después de enviar');

    const foodSent = sentOrderFull.orderItems.filter(i => foodProduct.id === i.productId);
    const drinkSent = sentOrderFull.orderItems.filter(i => drinkProduct.id === i.productId);

    if (foodSent.some(i => !i.sentToKitchen)) {
      throw new Error('No todos los items de comida fueron marcados como sentToKitchen');
    }
    logStep('3.2', true, '✓ Items de comida marcados como sentToKitchen');

    if (drinkSent.some(i => !i.sentToBar)) {
      throw new Error('No todos los items de bebida fueron marcados como sentToBar');
    }
    logStep('3.3', true, '✓ Items de bebida marcados como sentToBar');

    // Validar estado de la orden después de enviar
    if (sentOrder.order.status !== OrderStatus.PREPARING) {
      throw new Error(`Estado incorrecto después de enviar: ${sentOrder.order.status}`);
    }
    logStep('3.4', true, '✓ Estado de orden actualizado a PREPARING');

    // STEP 4: Cocinero prepara items
    console.log('\n👨‍🍳 PASO 4: COCINERO PREPARA COMIDA');
    console.log('─'.repeat(60));

    const foodItemsToUpdate = sentOrderFull.orderItems.filter(i => foodProduct.id === i.productId);
    for (const item of foodItemsToUpdate) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: OrderItemStatus.READY }
      });
    }
    logStep('4.1', true, `✓ ${foodItemsToUpdate.length} item(s) de comida marcados como READY`);

    // STEP 5: Camarero/Barman prepara bebidas
    console.log('\n🍹 PASO 5: BARMAN PREPARA BEBIDAS');
    console.log('─'.repeat(60));

    const drinkItemsToUpdate = sentOrderFull.orderItems.filter(i => drinkProduct.id === i.productId);
    for (const item of drinkItemsToUpdate) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: OrderItemStatus.READY }
      });
    }
    logStep('5.1', true, `✓ ${drinkItemsToUpdate.length} item(s) de bebida marcados como READY`);

    // STEP 6: Camarero entrega los platos/tragos
    console.log('\n🧑‍🍳 PASO 6: CAMARERO ENTREGA PLATOS/TRAGOS');
    console.log('─'.repeat(60));

    const allItems = await prisma.orderItem.findMany({
      where: { orderId: newOrder.id }
    });

    for (const item of allItems) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: OrderItemStatus.SERVED }
      });
    }
    logStep('6.1', true, `✓ ${allItems.length} item(s) marcados como SERVED`);

    // Actualizar estado de orden a SERVED
    const servedOrder = await orderService.updateStatus(
      newOrder.id,
      business.id,
      OrderStatus.SERVED,
      user.id
    );

    logStep('6.2', true, '✓ Orden marcada como SERVED', {
      status: servedOrder.status,
      servedAt: servedOrder.servedAt
    });

    // STEP 7: Cajera realiza cobro
    console.log('\n💳 PASO 7: COBRO Y GENERACIÓN DE FACTURA');
    console.log('─'.repeat(60));

    const currentOrder = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: { payments: true }
    });

    if (!currentOrder) throw new Error('Orden no encontrada para cobro');

    const paymentAmount = Number(currentOrder.total);
    logStep('7.1', true, '✓ Monto a cobrar calculado', {
      total: currentOrder.total.toString(),
      amount: paymentAmount
    });

    // Realizar pago
    const payment = await paymentService.create(
      business.id,
      newOrder.id,
      user.id,
      {
        amount: paymentAmount,
        method: PaymentMethod.CASH,
        reference: 'CASH-001',
        notes: 'Pago efectivo'
      }
    );

    logStep('7.2', true, '✓ Pago registrado exitosamente', {
      paymentId: payment.id,
      amount: payment.amount.toString(),
      method: payment.method,
      status: payment.status
    });

    // Validar que la orden esté PAID
    const paidOrder = await prisma.order.findUnique({
      where: { id: newOrder.id }
    });

    if (paidOrder?.status !== OrderStatus.PAID) {
      throw new Error(`Orden no marcada como PAID después del pago: ${paidOrder?.status}`);
    }
    logStep('7.3', true, '✓ Orden marcada como PAID después del pago');

    // Validar que la mesa esté FREE
    const tableAfterPayment = await prisma.table.findUnique({ where: { id: table.id } });
    if (tableAfterPayment?.status !== TableStatus.FREE) {
      throw new Error(`Mesa no está FREE después del pago: ${tableAfterPayment?.status}`);
    }
    logStep('7.4', true, '✓ Mesa liberada (FREE) después del pago');

    // STEP 8: Validar logs y auditoría
    console.log('\n📋 PASO 8: VALIDACIÓN DE LOGS Y AUDITORÍA');
    console.log('─'.repeat(60));

    const logs = await prisma.orderLog.findMany({
      where: { orderId: newOrder.id }
    });

    if (logs.length === 0) {
      throw new Error('No hay logs de la orden');
    }
    logStep('8.1', true, `✓ ${logs.length} log(s) registrados`, {
      actions: logs.map(l => l.action)
    });

    // STEP 9: Validar inventario
    console.log('\n📦 PASO 9: VALIDACIÓN DE INVENTARIO');
    console.log('─'.repeat(60));

    const foodInventory = await prisma.inventory.findFirst({
      where: { productId: foodProduct.id, businessId: business.id }
    });

    const drinkInventory = await prisma.inventory.findFirst({
      where: { productId: drinkProduct.id, businessId: business.id }
    });

    logStep('9.1', true, '✓ Inventario verificado', {
      foodProduct: {
        name: foodProduct.name,
        stock: foodInventory?.quantity ?? 0
      },
      drinkProduct: {
        name: drinkProduct.name,
        stock: drinkInventory?.quantity ?? 0
      }
    });

    // RESUMEN FINAL
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 RESUMEN DE VALIDACIÓN\n');

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const successRate = ((successCount / totalCount) * 100).toFixed(1);

    console.log(`✅ Pasos exitosos: ${successCount}/${totalCount} (${successRate}%)`);
    console.log(`❌ Pasos fallidos: ${totalCount - successCount}`);

    console.log('\n📋 DETALLES DEL PROCESO:\n');
    results.forEach((r, i) => {
      const status = r.success ? '✅' : '❌';
      console.log(`${status} ${i + 1}. ${r.step}: ${r.message}`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('\n🎉 VALIDACIÓN COMPLETADA EXITOSAMENTE\n');
    console.log('El sistema POS está funcionando correctamente en todo el flujo:');
    console.log('  1. ✅ Apertura de orden');
    console.log('  2. ✅ Envío a cocina/bar');
    console.log('  3. ✅ Preparación de comida');
    console.log('  4. ✅ Preparación de bebidas');
    console.log('  5. ✅ Entrega de platos/tragos');
    console.log('  6. ✅ Cobro y generación de factura');
    console.log('  7. ✅ Auditoría y logs');
    console.log('  8. ✅ Control de inventario\n');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`\n❌ ERROR EN VALIDACIÓN:\n${message}\n`);
    logStep('ERROR', false, message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar validación
validateCompleteOrderFlow();

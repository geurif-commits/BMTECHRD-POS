import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear negocio demo
  const business = await prisma.business.upsert({
    where: { email: 'demo@bmtechrd.com' },
    update: {},
    create: {
      name: 'Restaurante Demo BMTECHRD',
      email: 'demo@bmtechrd.com',
      phone: '+1 234 567 8900',
      address: 'Av. Principal #123, Ciudad',
      taxId: 'RUC-12345678901',
      isActive: true
    }
  });

  console.log(`✅ Negocio creado: ${business.name}`);

  // 2. Crear licencia de prueba (1 mes)
  const license = await prisma.license.create({
    data: {
      businessId: business.id,
      type: 'trial',
      key: `BMT-TRIAL-${Date.now()}`,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
    }
  });

  console.log(`✅ Licencia de prueba creada: ${license.key}`);

  // 3. Obtener roles
  const roles = await prisma.role.findMany();
  const roleMap = {};
  roles.forEach(role => {
    roleMap[role.name] = role.id;
  });

  // 4. Crear usuarios por cada rol
  const users = [
    {
      name: 'Administrador Sistema',
      email: 'admin@bmtechrd.com',
      password: await bcrypt.hash('admin123', 10),
      pin: '1111',
      roleId: roleMap.ADMIN
    },
    {
      name: 'Supervisor Local',
      email: 'supervisor@restaurant.com',
      password: await bcrypt.hash('super123', 10),
      pin: '2222',
      roleId: roleMap.SUPERVISOR
    },
    {
      name: 'Carlos Camarero',
      email: 'camarero@restaurant.com',
      password: await bcrypt.hash('cam123', 10),
      pin: '3333',
      roleId: roleMap.CAMARERO
    },
    {
      name: 'Chef Juan',
      email: 'cocina@restaurant.com',
      password: await bcrypt.hash('coc123', 10),
      pin: '4444',
      roleId: roleMap.COCINA
    },
    {
      name: 'Bartender María',
      email: 'bar@restaurant.com',
      password: await bcrypt.hash('bar123', 10),
      pin: '5555',
      roleId: roleMap.BARTENDER
    },
    {
      name: 'Cajero Luis',
      email: 'caja@restaurant.com',
      password: await bcrypt.hash('caj123', 10),
      pin: '6666',
      roleId: roleMap.CAJA
    },
    {
      name: 'Propietario Remoto',
      email: 'propietario@restaurant.com',
      password: await bcrypt.hash('prop123', 10),
      pin: '7777',
      roleId: roleMap.PROPIETARIO
    }
  ];

  for (const userData of users) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        businessId: business.id
      }
    });
    console.log(`✅ Usuario creado: ${user.name} (${user.email})`);
  }

  // 5. Crear categorías
  const categories = [
    { name: 'Entradas', type: 'FOOD', color: '#FBBF24', icon: '🥗' },
    { name: 'Platos Principales', type: 'FOOD', color: '#F97316', icon: '🍛' },
    { name: 'Postres', type: 'FOOD', color: '#D946EF', icon: '🍰' },
    { name: 'Bebidas sin Alcohol', type: 'DRINK', color: '#0EA5E9', icon: '🥤' },
    { name: 'Cervezas', type: 'DRINK', color: '#F59E0B', icon: '🍺' },
    { name: 'Cocteles', type: 'DRINK', color: '#10B981', icon: '🍹' },
    { name: 'Vinos', type: 'DRINK', color: '#8B5CF6', icon: '🍷' }
  ];

  const createdCategories = [];
  for (const catData of categories) {
    const category = await prisma.category.create({
      data: {
        ...catData,
        businessId: business.id,
        sortOrder: categories.indexOf(catData)
      }
    });
    createdCategories.push(category);
    console.log(`✅ Categoría creada: ${category.name}`);
  }

  // 6. Crear productos
  const products = [
    // Entradas
    { name: 'Ceviche Mixto', category: 'Entradas', price: 25.90, cost: 12.50, type: 'FOOD', hasStock: true, code: 'ENT001' },
    { name: 'Tequeños (12 unidades)', category: 'Entradas', price: 18.50, cost: 8.00, type: 'FOOD', hasStock: true, code: 'ENT002' },
    { name: 'Ensalada César', category: 'Entradas', price: 16.90, cost: 7.50, type: 'FOOD', hasStock: true, code: 'ENT003' },
    
    // Platos Principales
    { name: 'Lomo Saltado', category: 'Platos Principales', price: 32.90, cost: 15.00, type: 'FOOD', hasStock: true, code: 'PP001' },
    { name: 'Arroz con Mariscos', category: 'Platos Principales', price: 28.50, cost: 12.00, type: 'FOOD', hasStock: true, code: 'PP002' },
    { name: 'Pasta Alfredo con Pollo', category: 'Platos Principales', price: 24.90, cost: 10.50, type: 'FOOD', hasStock: true, code: 'PP003' },
    { name: 'Hamburguesa Clásica', category: 'Platos Principales', price: 22.90, cost: 9.00, type: 'FOOD', hasStock: true, code: 'PP004' },
    
    // Postres
    { name: 'Cheesecake de Fresa', category: 'Postres', price: 14.90, cost: 6.00, type: 'FOOD', hasStock: true, code: 'POST001' },
    { name: 'Brownie con Helado', category: 'Postres', price: 16.50, cost: 6.50, type: 'FOOD', hasStock: true, code: 'POST002' },
    
    // Bebidas sin Alcohol
    { name: 'Jugo de Naranja Natural', category: 'Bebidas sin Alcohol', price: 8.90, cost: 3.00, type: 'DRINK', hasStock: true, code: 'BSA001' },
    { name: 'Limonada Frozen', category: 'Bebidas sin Alcohol', price: 10.90, cost: 3.50, type: 'DRINK', hasStock: true, code: 'BSA002' },
    { name: 'Gaseosa Personal', category: 'Bebidas sin Alcohol', price: 6.90, cost: 2.00, type: 'DRINK', hasStock: true, code: 'BSA003' },
    
    // Cervezas
    { name: 'Cerveza Artesanal IPA', category: 'Cervezas', price: 15.90, cost: 6.00, type: 'DRINK', hasStock: true, code: 'CER001' },
    { name: 'Cerveza Lager Nacional', category: 'Cervezas', price: 12.90, cost: 4.50, type: 'DRINK', hasStock: true, code: 'CER002' },
    
    // Cocteles
    { name: 'Pisco Sour', category: 'Cocteles', price: 18.90, cost: 7.00, type: 'DRINK', hasStock: true, code: 'COC001' },
    { name: 'Mojito', category: 'Cocteles', price: 16.90, cost: 6.00, type: 'DRINK', hasStock: true, code: 'COC002' },
    { name: 'Margarita', category: 'Cocteles', price: 19.90, cost: 7.50, type: 'DRINK', hasStock: true, code: 'COC003' },
    
    // Vinos
    { name: 'Vino Tinto Reserva (Copa)', category: 'Vinos', price: 22.90, cost: 9.00, type: 'DRINK', hasStock: true, code: 'VIN001' },
    { name: 'Vino Blanco Semi Seco (Copa)', category: 'Vinos', price: 21.90, cost: 8.50, type: 'DRINK', hasStock: true, code: 'VIN002' }
  ];

  const createdProducts = [];
  for (const prodData of products) {
    const category = createdCategories.find(c => c.name === prodData.category);
    const product = await prisma.product.create({
      data: {
        name: prodData.name,
        description: `Delicioso ${prodData.name.toLowerCase()}, preparado con los mejores ingredientes.`,
        price: prodData.price,
        cost: prodData.cost,
        type: prodData.type,
        code: prodData.code,
        hasStock: prodData.hasStock,
        businessId: business.id,
        categoryId: category.id
      }
    });
    createdProducts.push(product);
    console.log(`✅ Producto creado: ${product.name} - $${product.price}`);

    // Crear registro de inventario para bebidas
    if (prodData.type === 'DRINK' && prodData.hasStock) {
      await prisma.inventory.create({
        data: {
          businessId: business.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 50) + 20, // 20-70 unidades
          minStock: 10
        }
      });
    }
  }

  // 7. Crear mesas
  for (let i = 1; i <= 15; i++) {
    const table = await prisma.table.create({
      data: {
        businessId: business.id,
        number: i,
        name: i <= 5 ? `Interior ${i}` : i <= 10 ? `Terraza ${i-5}` : `Ventana ${i-10}`,
        capacity: i % 4 === 0 ? 6 : i % 3 === 0 ? 4 : 2,
        status: Math.random() > 0.7 ? 'OCCUPIED' : Math.random() > 0.8 ? 'RESERVED' : 'FREE',
        xPosition: ((i - 1) % 5) * 120,
        yPosition: Math.floor((i - 1) / 5) * 120
      }
    });
    console.log(`✅ Mesa creada: ${table.name} - Capacidad: ${table.capacity}`);
  }

  // 8. Crear algunas órdenes de ejemplo
  const exampleOrders = [
    { tableNumber: 1, customerName: 'Familia Rodríguez', customerCount: 4 },
    { tableNumber: 3, customerName: 'Juan Pérez', customerCount: 2 },
    { tableNumber: 5, customerName: 'Reunión Empresarial', customerCount: 6 }
  ];

  const waiter = await prisma.user.findFirst({ where: { email: 'camarero@restaurant.com' } });

  for (const orderData of exampleOrders) {
    const table = await prisma.table.findFirst({ 
      where: { 
        businessId: business.id, 
        number: orderData.tableNumber 
      } 
    });

    if (table) {
      const order = await prisma.order.create({
        data: {
          businessId: business.id,
          tableId: table.id,
          userId: waiter.id,
          customerName: orderData.customerName,
          customerCount: orderData.customerCount,
          status: Math.random() > 0.5 ? 'PAID' : 'SERVED',
          subtotal: 0,
          tax: 0,
          total: 0
        }
      });

      // Agregar items aleatorios
      const randomProducts = createdProducts.sort(() => 0.5 - Math.random()).slice(0, 3);
      let subtotal = 0;

      for (const product of randomProducts) {
        const quantity = Math.floor(Math.random() * 2) + 1;
        const itemSubtotal = product.price * quantity;
        subtotal += itemSubtotal;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity,
            price: product.price,
            subtotal: itemSubtotal,
            status: order.status === 'PAID' ? 'SERVED' : 'PENDING',
            sentToKitchen: product.type === 'FOOD',
            sentToBar: product.type === 'DRINK'
          }
        });
      }

      const tax = subtotal * 0.18;
      const total = subtotal + tax;

      await prisma.order.update({
        where: { id: order.id },
        data: { subtotal, tax, total }
      });

      // Actualizar estado de la mesa si la orden está pagada
      if (order.status === 'PAID') {
        await prisma.table.update({
          where: { id: table.id },
          data: { status: 'FREE' }
        });
      }

      console.log(`✅ Orden de ejemplo creada: Mesa ${orderData.tableNumber} - Total: $${total.toFixed(2)}`);
    }
  }

  console.log('🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('👉 Admin: admin@bmtechrd.com / admin123');
  console.log('👉 Camarero: camarero@restaurant.com / cam123');
  console.log('👉 Cocina: cocina@restaurant.com / coc123');
  console.log('👉 Bar: bar@restaurant.com / bar123');
  console.log('👉 Caja: caja@restaurant.com / caj123');
  console.log('👉 Propietario: propietario@restaurant.com / prop123');
  console.log('\n🔗 Frontend: http://localhost:3000');
  console.log('🔗 Backend API: http://localhost:3001');
  console.log('🔗 Prisma Studio: npx prisma studio');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
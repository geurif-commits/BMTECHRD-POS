import { PrismaClient, LicenseType, LicenseStatus, ProductType, TableStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Database...');
  
  // ===== ROLES =====
  console.log('📋 Creating roles...');
  const r1 = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
    .then(r => r || prisma.role.create({ data: { name: 'ADMIN', description: 'Admin', permissions: ['*'] } }));
  
  const r2 = await prisma.role.findUnique({ where: { name: 'CAMARERO' } })
    .then(r => r || prisma.role.create({ data: { name: 'CAMARERO', description: 'Waiter', permissions: ['orders'] } }));

  const r3 = await prisma.role.findUnique({ where: { name: 'COCINERO' } })
    .then(r => r || prisma.role.create({ data: { name: 'COCINERO', description: 'Chef', permissions: ['kitchen'] } }));

  const r4 = await prisma.role.findUnique({ where: { name: 'CAJERO' } })
    .then(r => r || prisma.role.create({ data: { name: 'CAJERO', description: 'Cashier', permissions: ['payments'] } }));

  // ===== BUSINESS =====
  console.log('🏢 Creating business...');
  let biz = await prisma.business.findUnique({ where: { id: '11111111-1111-1111-1111-111111111111' } });
  if (!biz) {
    biz = await prisma.business.create({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Restaurant Demo',
        email: 'demo@test.com',
        phone: '+1-555-0123',
        address: 'Calle Principal 123, Zona 1',
        rnc: '123456789',
        taxId: 'TAX123456',
        currency: 'DOP',
        bankName: 'Banco Popular',
        bankAccountNumber: '1234567890',
        bankAccountType: 'Corriente',
        taxRate: new Decimal('18.00'),
        tipRate: new Decimal('10.00')
      }
    });
  }

  // ===== LICENSE =====
  console.log('📜 Creating license...');
  let lic = await prisma.license.findUnique({ where: { key: 'DEMO-2024' } });
  if (!lic) {
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    lic = await prisma.license.create({
      data: {
        key: 'DEMO-2024',
        businessId: biz.id,
        type: 'TWELVE_MONTHS',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: end
      }
    });
  }

  // ===== USERS =====
  console.log('👥 Creating users...');
  const pwd = await bcrypt.hash('admin123', 10);
  
  let u1 = await prisma.user.findUnique({
    where: { businessId_email: { businessId: biz.id, email: 'admin@demo.com' } }
  });
  if (!u1) {
    u1 = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        name: 'Admin User',
        password: pwd,
        pin: '0000',
        roleId: r1.id,
        businessId: biz.id,
        isActive: true
      }
    });
  }

  let u2 = await prisma.user.findUnique({
    where: { businessId_email: { businessId: biz.id, email: 'camarero@demo.com' } }
  });
  if (!u2) {
    u2 = await prisma.user.create({
      data: {
        email: 'camarero@demo.com',
        name: 'Camarero Demo',
        password: pwd,
        pin: '1111',
        roleId: r2.id,
        businessId: biz.id,
        isActive: true
      }
    });
  }

  let u3 = await prisma.user.findUnique({
    where: { businessId_email: { businessId: biz.id, email: 'cocina@demo.com' } }
  });
  if (!u3) {
    u3 = await prisma.user.create({
      data: {
        email: 'cocina@demo.com',
        name: 'Cocinero Demo',
        password: pwd,
        pin: '2222',
        roleId: r3.id,
        businessId: biz.id,
        isActive: true
      }
    });
  }

  let u4 = await prisma.user.findUnique({
    where: { businessId_email: { businessId: biz.id, email: 'caja@demo.com' } }
  });
  if (!u4) {
    u4 = await prisma.user.create({
      data: {
        email: 'caja@demo.com',
        name: 'Cajero Demo',
        password: pwd,
        pin: '3333',
        roleId: r4.id,
        businessId: biz.id,
        isActive: true
      }
    });
  }

  // ===== CATEGORIES =====
  console.log('🏷️  Creating categories...');
  const catFood1 = await prisma.category.findFirst({
    where: { businessId: biz.id, name: 'Entradas', type: 'FOOD' }
  }).then(c => c || prisma.category.create({
    data: {
      businessId: biz.id,
      name: 'Entradas',
      type: 'FOOD',
      sortOrder: 1,
      color: '#FF6B6B',
      icon: '🍝'
    }
  }));

  const catFood2 = await prisma.category.findFirst({
    where: { businessId: biz.id, name: 'Platos Principales', type: 'FOOD' }
  }).then(c => c || prisma.category.create({
    data: {
      businessId: biz.id,
      name: 'Platos Principales',
      type: 'FOOD',
      sortOrder: 2,
      color: '#4ECDC4',
      icon: '🍖'
    }
  }));

  const catFood3 = await prisma.category.findFirst({
    where: { businessId: biz.id, name: 'Postres', type: 'FOOD' }
  }).then(c => c || prisma.category.create({
    data: {
      businessId: biz.id,
      name: 'Postres',
      type: 'FOOD',
      sortOrder: 3,
      color: '#FFE66D',
      icon: '🍰'
    }
  }));

  const catDrink1 = await prisma.category.findFirst({
    where: { businessId: biz.id, name: 'Bebidas Frías', type: 'DRINK' }
  }).then(c => c || prisma.category.create({
    data: {
      businessId: biz.id,
      name: 'Bebidas Frías',
      type: 'DRINK',
      sortOrder: 1,
      color: '#95E1D3',
      icon: '🧊'
    }
  }));

  const catDrink2 = await prisma.category.findFirst({
    where: { businessId: biz.id, name: 'Bebidas Calientes', type: 'DRINK' }
  }).then(c => c || prisma.category.create({
    data: {
      businessId: biz.id,
      name: 'Bebidas Calientes',
      type: 'DRINK',
      sortOrder: 2,
      color: '#F38181',
      icon: '☕'
    }
  }));

  // ===== PRODUCTS - FOOD =====
  console.log('🍽️  Creating food products...');
  const products = [
    // Entradas
    { name: 'Tabla de Quesos', price: '350', categoryId: catFood1.id, type: 'FOOD', code: 'FOOD001', image: 'https://images.unsplash.com/photo-1589985643862-8406e4ef4fca?w=400' },
    { name: 'Tabla de Embutidos', price: '400', categoryId: catFood1.id, type: 'FOOD', code: 'FOOD002', image: 'https://images.unsplash.com/photo-1588248543803-ba48f8c23bca?w=400' },
    { name: 'Camarones al Ajillo', price: '425', categoryId: catFood1.id, type: 'FOOD', code: 'FOOD003', image: 'https://images.unsplash.com/photo-1625631806891-c58c85cd37f3?w=400' },
    { name: 'Ceviche Mixto', price: '350', categoryId: catFood1.id, type: 'FOOD', code: 'FOOD004', image: 'https://images.unsplash.com/photo-1630384478749-e35caf784a5d?w=400' },

    // Platos Principales
    { name: 'Filete a la Pimienta', price: '650', categoryId: catFood2.id, type: 'FOOD', code: 'FOOD005', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
    { name: 'Salmón a la Mantequilla', price: '750', categoryId: catFood2.id, type: 'FOOD', code: 'FOOD006', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
    { name: 'Pechuga de Pollo Rellena', price: '550', categoryId: catFood2.id, type: 'FOOD', code: 'FOOD007', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400' },
    { name: 'Pastas a la Boloñesa', price: '480', categoryId: catFood2.id, type: 'FOOD', code: 'FOOD008', image: 'https://images.unsplash.com/photo-1473093295203-cad00df16e50?w=400' },
    { name: 'Chuleta de Cerdo BBQ', price: '620', categoryId: catFood2.id, type: 'FOOD', code: 'FOOD009', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },

    // Postres
    { name: 'Tiramisú', price: '180', categoryId: catFood3.id, type: 'FOOD', code: 'FOOD010', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
    { name: 'Brownie con Helado', price: '150', categoryId: catFood3.id, type: 'FOOD', code: 'FOOD011', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400' },
    { name: 'Flan Casero', price: '120', categoryId: catFood3.id, type: 'FOOD', code: 'FOOD012', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
    { name: 'Fresas con Crema', price: '140', categoryId: catFood3.id, type: 'FOOD', code: 'FOOD013', image: 'https://images.unsplash.com/photo-1590922761801-38f5ff6f716f?w=400' },
  ];

  for (const prod of products) {
    const existing = await prisma.product.findFirst({
      where: { businessId: biz.id, code: prod.code }
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          businessId: biz.id,
          categoryId: prod.categoryId,
          name: prod.name,
          price: new Decimal(prod.price),
          code: prod.code,
          type: prod.type as any,
          image: prod.image,
          isActive: true,
          sortOrder: 0,
          hasStock: false,
          isIngredient: false,
          unit: 'UNIDAD'
        }
      });
    }
  }

  // ===== PRODUCTS - DRINKS =====
  console.log('🥤 Creating drink products...');
  const drinks = [
    // Bebidas Frías
    { name: 'Refresco Coca Cola', price: '80', categoryId: catDrink1.id, type: 'DRINK', code: 'DRINK001', image: 'https://images.unsplash.com/photo-1554866585-e92f4c5fdddb?w=400' },
    { name: 'Agua Embotellada', price: '50', categoryId: catDrink1.id, type: 'DRINK', code: 'DRINK002', image: 'https://images.unsplash.com/photo-1614262235654-6d6937a0e292?w=400' },
    { name: 'Jugo Natural Naranja', price: '120', categoryId: catDrink1.id, type: 'DRINK', code: 'DRINK003', image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64e58?w=400' },
    { name: 'Limonada Fresca', price: '100', categoryId: catDrink1.id, type: 'DRINK', code: 'DRINK004', image: 'https://images.unsplash.com/photo-1590968033100-9f60a05a9d82?w=400' },
    { name: 'Cerveza Premium', price: '150', categoryId: catDrink1.id, type: 'DRINK', code: 'DRINK005', image: 'https://images.unsplash.com/photo-1608270861620-7db80663feaf?w=400' },

    // Bebidas Calientes
    { name: 'Café Americano', price: '90', categoryId: catDrink2.id, type: 'DRINK', code: 'DRINK006', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=400' },
    { name: 'Capuchino', price: '120', categoryId: catDrink2.id, type: 'DRINK', code: 'DRINK007', image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400' },
    { name: 'Espresso', price: '80', categoryId: catDrink2.id, type: 'DRINK', code: 'DRINK008', image: 'https://images.unsplash.com/photo-1537701494ce32f966ea04eae957cda7522b92c69?w=400' },
    { name: 'Té Caliente', price: '70', categoryId: catDrink2.id, type: 'DRINK', code: 'DRINK009', image: 'https://images.unsplash.com/photo-1597318615121-58899f9c1f0c?w=400' },
    { name: 'Chocolate Caliente', price: '110', categoryId: catDrink2.id, type: 'DRINK', code: 'DRINK010', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
  ];

  for (const drink of drinks) {
    const existing = await prisma.product.findFirst({
      where: { businessId: biz.id, code: drink.code }
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          businessId: biz.id,
          categoryId: drink.categoryId,
          name: drink.name,
          price: new Decimal(drink.price),
          code: drink.code,
          type: drink.type as any,
          image: drink.image,
          isActive: true,
          sortOrder: 0,
          hasStock: false,
          isIngredient: false,
          unit: 'UNIDAD'
        }
      });
    }
  }

  // ===== TABLES =====
  console.log('🪑 Creating tables...');
  for (let i = 1; i <= 8; i++) {
    const existing = await prisma.table.findFirst({
      where: { businessId: biz.id, tableNumber: i }
    });
    if (!existing) {
      await prisma.table.create({
        data: {
          businessId: biz.id,
          tableNumber: i,
          capacity: 2 + (i % 4),
          status: 'FREE',
          pin: '0000',
          isActive: true,
          xPosition: ((i - 1) % 4) * 150,
          yPosition: Math.floor((i - 1) / 4) * 150,
          orientation: 'horizontal',
          shape: 'rectangular'
        }
      });
    }
  }

  console.log('✅ Seeding Complete!');
  console.log('📊 Demo Credentials:');
  console.log('   Admin:    admin@demo.com / admin123');
  console.log('   Waiter:   camarero@demo.com / admin123');
  console.log('   Kitchen:  cocina@demo.com / admin123');
  console.log('   Cashier:  caja@demo.com / admin123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

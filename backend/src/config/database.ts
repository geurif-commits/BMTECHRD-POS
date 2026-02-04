import { PrismaClient } from '@prisma/client';
import { LicenseStatus } from '../types/enums.js';

// Extension para logging y manejo de errores
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
}).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const before = Date.now();
        try {
          const result = await query(args);
          const after = Date.now();
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Query ${model}.${operation} tomó ${after - before}ms`);
          }
          
          return result;
        } catch (error: any) {
          console.error('❌ Error en consulta a base de datos:', {
            model,
            action: operation,
            error: error.message
          });
          throw error;
        }
      }
    }
  }
});

// Conexión a la base de datos
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL en localhost:5432/pos_db');
    
    // Verificar licencias activas
    const activeLicenses = await prisma.license.count({
      where: {
        status: LicenseStatus.ACTIVE,
        endDate: {
          gte: new Date()
        }
      }
    });
    
    console.log(`📋 Licencias activas en el sistema: ${activeLicenses}`);
    
    return prisma;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    process.exit(1);
  }
};

export default prisma;

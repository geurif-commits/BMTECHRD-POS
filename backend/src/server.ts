import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { app, httpServer } from './config/socket.js';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import tableRoutes from './routes/table.routes.js';
import productRoutes from './routes/product.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import userRoutes from './routes/user.routes.js';
import businessRoutes from './routes/business.routes.js';
import setupRoutes from './routes/setup.routes.js';
import cashRoutes from './routes/cash.routes.js';
import superAdminRoutes from './routes/superadmin.routes.js';
import reportRoutes from './routes/report.routes.js';
import validationRoutes from './routes/validation.routes.js';
import activationRoutes from './routes/activation.routes.js';
dotenv.config();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'BMTECHRD POS API'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/activation', activationRoutes);

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  res.status(500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && err instanceof Error && { stack: err.stack })
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);

const startServer = async () => {
  try {
    console.log('🔧 Iniciando base de datos...');
    await connectDatabase();
    console.log('✅ Base de datos lista');

    console.log(`🔧 Intentando escuchar en puerto ${PORT}...`);
    const server = httpServer.listen(PORT, () => {
      console.log(`✅ Servidor BMTECHRD POS escuchando en http://localhost:${PORT}`);
      console.log(`✅ Socket.IO en ws://localhost:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ Servidor listo para conexiones`);
    });

    server.on('listening', () => {
      console.log('📡 Server is listening event emitted');
    });

    server.on('error', (error: any) => {
      console.error('❌ Error en servidor HTTP:', error);
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      console.log('Recibido SIGTERM, cerrando servidor...');
      server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('Recibido SIGINT, cerrando servidor...');
      server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
      });
    });

    console.log('🎯 Handlers registrados, esperando conexiones...');

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error('❌ Error fatal en startServer:', error);
  process.exit(1);
});

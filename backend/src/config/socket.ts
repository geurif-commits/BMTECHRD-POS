import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from './database.js';
import { LicenseStatus } from '../types/enums.js';

export const app = express();
export const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error('Autenticación requerida'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      include: { role: true, business: true }
    });

    if (!user) {
      return next(new Error('Usuario no válido'));
    }

    const activeLicense = await prisma.license.findFirst({
      where: {
        businessId: user.businessId,
        status: LicenseStatus.ACTIVE,
        endDate: { gte: new Date() }
      }
    });
    if (!activeLicense) {
      return next(new Error('Licencia expirada'));
    }

    socket.data.user = {
      id: user.id,
      businessId: user.businessId,
      role: user.role.name
    };

    next();
  } catch (error) {
    console.error('Socket.IO auth error:', error);
    next(new Error('Error de autenticación'));
  }
});

io.on('connection', (socket) => {
  const { businessId, role } = socket.data.user as { businessId: string; role: string };

  socket.join(`business-${businessId}`);

  if (['CAMARERO', 'ADMIN', 'SUPERVISOR'].includes(role)) {
    socket.join(`waiter-${businessId}`);
    socket.join(`tables-${businessId}`);
  }
  if (['COCINERO', 'ADMIN', 'SUPERVISOR'].includes(role)) {
    socket.join(`kitchen-${businessId}`);
  }
  if (['CAMARERO', 'ADMIN', 'SUPERVISOR', 'BARTENDER'].includes(role)) {
    socket.join(`bar-${businessId}`);
  }
  if (['CAJERO', 'ADMIN', 'SUPERVISOR'].includes(role)) {
    socket.join(`cashier-${businessId}`);
  }
  if (['OWNER', 'ADMIN'].includes(role)) {
    socket.join(`dashboard-${businessId}`);
  }

  socket.on('joinTable', (tableId: string) => {
    socket.join(`table-${tableId}`);
  });

  socket.on('disconnect', () => {
    // cleanup if needed
  });
});

export function emitNewOrder(businessId: string, payload: { type: 'KITCHEN' | 'BAR'; orderId: string; orderItems: unknown[]; table: number; createdAt: Date }) {
  if (payload.type === 'KITCHEN') {
    io.to(`kitchen-${businessId}`).emit('order_sent_to_kitchen', payload);
    io.to(`kitchen-${businessId}`).emit('new_order', payload);
  } else {
    io.to(`bar-${businessId}`).emit('order_sent_to_bar', payload);
    io.to(`bar-${businessId}`).emit('new_order', payload);
  }
  io.to(`business-${businessId}`).emit('new_order', payload);
}

export function emitItemServed(businessId: string, payload: unknown) {
  io.to(`kitchen-${businessId}`).emit('item_served', payload);
  io.to(`bar-${businessId}`).emit('item_served', payload);
  io.to(`waiter-${businessId}`).emit('item_served', payload);
  io.to(`cashier-${businessId}`).emit('item_served', payload);
  io.to(`dashboard-${businessId}`).emit('item_served', payload);
}

export function emitOrderPaid(businessId: string, payload: unknown) {
  io.to(`business-${businessId}`).emit('order_paid', payload);
  io.to(`tables-${businessId}`).emit('order_paid', payload);
  io.to(`cashier-${businessId}`).emit('order_paid', payload);
  io.to(`dashboard-${businessId}`).emit('order_paid', payload);
}

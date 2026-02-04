import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';
import { body, validationResult } from 'express-validator';
import { mapTableForFrontend } from '../utils/serialize.js';

const router = Router();

router.use(authenticate);
router.use(licenseCheck);

// Get all tables
router.get('/', async (req: AuthRequest, res) => {
    try {
        const tables = await prisma.table.findMany({
            where: { businessId: req.user!.businessId },
            orderBy: { tableNumber: 'asc' },
            include: {
                reservedBy: {
                    select: {
                        id: true,
                        name: true,
                        pin: true
                    }
                }
            }
        });

        res.json({ success: true, data: mapTableForFrontend(tables) });
    } catch (error) {
        console.error('Error fetching tables:', error);
        res.status(500).json({ success: false, message: 'Error al obtener mesas' });
    }
});

// Create single table
router.post('/',
    authorize(['ADMIN', 'OWNER']),
    [
        body('tableNumber').isInt({ min: 1, max: 100 }).withMessage('Número debe estar entre 1 y 100'),
        body('capacity').isInt({ min: 1, max: 20 }).withMessage('Capacidad debe estar entre 1 y 20')
    ],
    async (req: AuthRequest, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Datos invalidos', errors: errors.array() });
            }

            const { tableNumber, capacity } = req.body;

            // Check if table number already exists
            const existing = await prisma.table.findFirst({
                where: {
                    businessId: req.user!.businessId,
                    tableNumber
                }
            });

            if (existing) {
                return res.status(400).json({ success: false, message: 'Ya existe una mesa con este número' });
            }

            const table = await prisma.table.create({
                data: {
                    businessId: req.user!.businessId,
                    tableNumber,
                    capacity,
                    pin: Math.random().toString().substring(2, 6),
                    status: 'FREE'
                }
            });

            res.status(201).json({ success: true, data: table });
        } catch (error) {
            console.error('Error creating table:', error);
            res.status(500).json({ success: false, message: 'Error al crear mesa' });
        }
    }
);

// Bulk create tables
router.post('/bulk-create',
    authorize(['ADMIN', 'OWNER']),
    [
        body('startNumber').isInt({ min: 1, max: 100 }),
        body('endNumber').isInt({ min: 1, max: 100 }),
        body('capacity').isInt({ min: 1, max: 20 })
    ],
    async (req: AuthRequest, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Datos invalidos', errors: errors.array() });
            }

            const { startNumber, endNumber, capacity } = req.body;

            if (endNumber - startNumber > 100) {
                return res.status(400).json({ success: false, message: 'Máximo 100 mesas por operación' });
            }

            const tables: any[] = [];
            for (let num = startNumber; num <= endNumber; num++) {
                // Check if exists
                const existing = await prisma.table.findFirst({
                    where: {
                        businessId: req.user!.businessId,
                        tableNumber: num
                    }
                });

                if (!existing) {
                    tables.push({
                        businessId: req.user!.businessId,
                        tableNumber: num,
                        capacity,
                        pin: Math.random().toString().substring(2, 6),
                        status: 'FREE' as const
                    });
                }
            }

            if (tables.length > 0) {
                await prisma.table.createMany({
                    data: tables
                });
            }

            res.status(201).json({
                success: true,
                data: { created: tables.length },
                message: `${tables.length} mesas creadas exitosamente`
            });
        } catch (error) {
            console.error('Error bulk creating tables:', error);
            res.status(500).json({ success: false, message: 'Error al crear mesas' });
        }
    }
);

// Update table
router.put('/:id', authorize(['ADMIN', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { capacity } = req.body;

        const existing = await prisma.table.findFirst({
            where: { id, businessId: req.user!.businessId }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
        }

        const table = await prisma.table.update({
            where: { id: existing.id },
            data: {
                ...(capacity && { capacity })
            }
        });

        res.json({ success: true, data: table });
    } catch (error) {
        console.error('Error updating table:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar mesa' });
    }
});

// Delete table
router.delete('/:id', authorize(['ADMIN', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const result = await prisma.table.deleteMany({
            where: { id: req.params.id, businessId: req.user!.businessId }
        });

        if (result.count === 0) {
            return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
        }

        res.json({ success: true, message: 'Mesa eliminada' });
    } catch (error) {
        console.error('Error deleting table:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar mesa' });
    }
});

// Verify PIN to access an occupied table
router.post('/:id/verify-pin', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { pin } = req.body;

        const table = await prisma.table.findFirst({
            where: { id, businessId: req.user!.businessId },
            include: {
                orders: {
                    where: { status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED'] } },
                    include: {
                        user: true,
                        orderItems: {
                            include: { product: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!table) {
            return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
        }

        if (table.status !== 'OCCUPIED') {
            return res.json({ success: true, data: { table } });
        }

        const currentOrder = table.orders[0];
        if (!currentOrder) {
            // Inconsistent state: occupied but no order. Reset state.
            await prisma.table.update({ where: { id }, data: { status: 'FREE' } });
            return res.json({ success: true, data: { table: { ...table, status: 'FREE' } } });
        }

        // Verify PIN against the owner of the order
        // In some cases, we might allow any waiter PIN if we want a shared terminal, 
        // but the requirement says "según el camarero" and "vuelva entrar a una mesa bajo su nombre".
        if (currentOrder.user.pin !== pin) {
            return res.status(403).json({ success: false, message: 'PIN incorrecto para esta mesa' });
        }

        res.json({
            success: true,
            data: {
                table,
                order: currentOrder
            }
        });
    } catch (error) {
        console.error('Error verifying table pin:', error);
        res.status(500).json({ success: false, message: 'Error al verificar PIN' });
    }
});

export default router;

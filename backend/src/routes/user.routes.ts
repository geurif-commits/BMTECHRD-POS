import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';
import bcrypt from 'bcryptjs';

const router = Router();

router.use(authenticate);
router.use(licenseCheck);

// Get all roles (Move up to avoid conflict with /:id)
router.get('/roles', authorize(['ADMIN', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const roles = await prisma.role.findMany({
            select: {
                id: true,
                name: true,
                description: true
            }
        });
        res.json({ success: true, data: roles });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ success: false, message: 'Error al obtener roles' });
    }
});

// Get all users (admin only)
router.get('/', authorize(['ADMIN', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { businessId: req.user!.businessId },
            select: {
                id: true,
                name: true,
                email: true,
                pin: true,
                isActive: true,
                createdAt: true,
                role: {
                    select: { name: true, description: true }
                }
            }
        });

        const usersWithRole = users.map(user => ({
            ...user,
            role: user.role.name
        }));

        res.json({ success: true, data: usersWithRole });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
});

// Create user (admin only)
router.post('/',
    authorize(['ADMIN', 'OWNER']),
    [
        body('name').notEmpty().withMessage('El nombre es requerido'),
        body('email').notEmpty().withMessage('El usuario es requerido'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('roleId').notEmpty().withMessage('El rol es requerido'),
        body('pin').matches(/^\d{4}$/).withMessage('El PIN debe tener 4 dígitos')
    ],
    async (req: AuthRequest, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Datos invalidos', errors: errors.array() });
            }

            const { name, email, password, roleId, pin, isActive = true } = req.body;

            // Check if email already exists
            const existing = await prisma.user.findFirst({
                where: {
                    businessId: req.user!.businessId,
                    email
                }
            });

            if (existing) {
                return res.status(400).json({ success: false, message: 'El usuario ya está en uso' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    businessId: req.user!.businessId,
                    roleId,
                    name,
                    email,
                    password: hashedPassword,
                    pin,
                    isActive
                },
                include: {
                    role: true
                }
            });

            res.status(201).json({
                success: true,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role.name,
                    pin: user.pin,
                    isActive: user.isActive
                }
            });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ success: false, message: 'Error al crear usuario' });
        }
    }
);

// Update user (admin only)
router.put('/:id', authorize(['ADMIN', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, roleId, pin, isActive } = req.body;

        const target = await prisma.user.findFirst({
            where: { id, businessId: req.user!.businessId }
        });

        if (!target) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const data: any = {
            name,
            email,
            roleId,
            pin,
            isActive
        };

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: target.id },
            data,
            include: { role: true }
        });

        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                pin: user.pin,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
});

// Delete user (admin only)
router.delete('/:id', authorize(['ADMIN', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const result = await prisma.user.deleteMany({
            where: { id: req.params.id, businessId: req.user!.businessId }
        });

        if (result.count === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, message: 'Usuario eliminado' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
    }
});


// Get all waiters (camareros) for the business
router.get('/waiters', authorize(['CAMARERO', 'ADMIN', 'SUPERVISOR', 'OWNER']), async (req: AuthRequest, res) => {
    try {
        const waiters = await prisma.user.findMany({
            where: {
                businessId: req.user!.businessId,
                role: {
                    name: { in: ['CAMARERO', 'ADMIN', 'SUPERVISOR'] }
                },
                isActive: true
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                orders: {
                    where: {
                        status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED'] }
                    },
                    select: { id: true }
                }
            }
        });

        const result = waiters.map(w => ({
            id: w.id,
            name: w.name,
            avatar: w.avatar,
            hasOpenOrders: w.orders.length > 0
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching waiters:', error);
        res.status(500).json({ success: false, message: 'Error al obtener camareros' });
    }
});

// Verify user PIN
router.post('/verify-pin', async (req: AuthRequest, res) => {
    try {
        const { userId, pin } = req.body;
        const user = await prisma.user.findFirst({
            where: { id: userId, businessId: req.user!.businessId, isActive: true }
        });

        if (!user || user.pin !== pin) {
            return res.status(403).json({ success: false, message: 'PIN incorrecto' });
        }

        res.json({ success: true, message: 'PIN verificado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al verificar PIN' });
    }
});

export default router;

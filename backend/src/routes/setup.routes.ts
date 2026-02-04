import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Initialize system (first-time setup)
router.post('/initialize',
    [
        body('business.name').notEmpty().withMessage('El nombre del negocio es requerido'),
        body('admin.name').notEmpty().withMessage('El nombre del administrador es requerido'),
        body('admin.email').notEmpty().withMessage('El usuario del administrador es requerido'),
        body('admin.password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('admin.pin').matches(/^\d{4}$/).withMessage('El PIN debe tener 4 dígitos')
    ],
    async (req: any, res: any) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Datos invalidos', errors: errors.array() });
            }

            const { business, admin } = req.body;

            // Check if system is already initialized
            const existingBusiness = await prisma.business.findFirst({
                where: { configCompleted: true }
            });

            if (existingBusiness) {
                return res.status(400).json({
                    success: false,
                    message: 'El sistema ya ha sido inicializado'
                });
            }

            // Create business
            const newBusiness = await prisma.business.create({
                data: {
                    name: business.name,
                    rnc: business.rnc,
                    address: business.address,
                    phone: business.phone,
                    email: business.email,
                    currency: business.currency || 'DOP',
                    configCompleted: true
                }
            });

            // Get ADMIN role
            let adminRole = await prisma.role.findUnique({
                where: { name: 'ADMIN' }
            });

            if (!adminRole) {
                adminRole = await prisma.role.create({
                    data: {
                        name: 'ADMIN',
                        description: 'Administrador del Sistema',
                        permissions: ['*']
                    }
                });
            }

            // Create admin user
            const hashedPassword = await bcrypt.hash(admin.password, 10);
            const adminUser = await prisma.user.create({
                data: {
                    businessId: newBusiness.id,
                    roleId: adminRole.id,
                    name: admin.name,
                    email: admin.email,
                    password: hashedPassword,
                    pin: admin.pin
                },
                include: {
                    role: true
                }
            });

            // Generate JWT
            const token = jwt.sign(
                {
                    userId: adminUser.id,
                    businessId: newBusiness.id,
                    role: adminRole.name
                },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: '30d' }
            );

            // Generate automatic trial license
            const superAdminService = new (await import('../services/superadmin.service.js')).SuperAdminService();
            await superAdminService.generateLicense(newBusiness.id, 'TRIAL_7_DAYS');

            res.status(201).json({
                success: true,
                data: {
                    token,
                    user: {
                        id: adminUser.id,
                        name: adminUser.name,
                        email: adminUser.email,
                        role: adminRole.name,
                        businessId: newBusiness.id,
                        pin: adminUser.pin
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing system:', error);
            res.status(500).json({ success: false, message: 'Error al inicializar el sistema' });
        }
    }
);

export default router;

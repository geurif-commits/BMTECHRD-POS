import prisma from '../config/database.js';
import { LicenseStatus } from '../types/enums.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

export class SuperAdminService {
    private parseDatabaseUrl() {
        const url = process.env.DATABASE_URL || '';
        if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
            throw new Error('DATABASE_URL inválida para backup');
        }

        const parsed = new URL(url);
        return {
            user: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
            host: parsed.hostname,
            port: parsed.port || '5432',
            database: parsed.pathname.replace('/', ''),
        };
    }

    async backupDatabase() {
        const { user, password, host, port, database } = this.parseDatabaseUrl();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup_${database}_${timestamp}.sql`;
        const outputPath = path.join(os.tmpdir(), fileName);

        const env = {
            ...process.env,
            PGPASSWORD: password
        };

        try {
            await execFileAsync('pg_dump', [
                '-h', host,
                '-p', port,
                '-U', user,
                '-F', 'p',
                '-f', outputPath,
                database
            ], { env });

            return { fileName, outputPath };
        } catch (error: any) {
            const message = error?.message || 'Error al ejecutar pg_dump';
            throw new Error(`Backup fallido: ${message}`);
        }
    }
    async listBusinesses() {
        return prisma.business.findMany({
            include: {
                licenses: true,
                _count: {
                    select: { orders: true, users: true }
                }
            }
        });
    }

    async getLandingSettings() {
        const existing = await (prisma as any).globalSetting.findFirst();
        if (existing) return existing;
        return (prisma as any).globalSetting.create({ data: {} });
    }

    async updateLandingSettings(data: {
        landingBackgroundUrl?: string;
        contactName?: string;
        contactEmail?: string;
        contactPhone?: string;
        contactWhatsapp?: string;
    }) {
        const existing = await (prisma as any).globalSetting.findFirst();
        if (existing) {
            return (prisma as any).globalSetting.update({
                where: { id: existing.id },
                data
            });
        }
        return (prisma as any).globalSetting.create({ data });
    }

    async generateLicense(businessId: string, type: string) {
        const key = `BMT-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        const startDate = new Date();
        const endDate = new Date();

        if (type === 'TRIAL_7_DAYS') endDate.setDate(endDate.getDate() + 7);
        else if (type === 'SIX_MONTHS') endDate.setMonth(endDate.getMonth() + 6);
        else if (type === 'TWELVE_MONTHS') endDate.setFullYear(endDate.getFullYear() + 1);
        else if (type === 'LIFETIME') endDate.setFullYear(endDate.getFullYear() + 99);

        // Deactivate previous licenses
        await prisma.license.updateMany({
            where: { businessId, status: LicenseStatus.ACTIVE },
            data: { status: LicenseStatus.SUSPENDED }
        });

        return prisma.license.create({
            data: {
                businessId,
                type: type as any,
                key,
                status: LicenseStatus.ACTIVE,
                startDate,
                endDate
            }
        });
    }

    async getGlobalStats() {
        const totalSales = await prisma.order.aggregate({
            where: { status: 'PAID' },
            _sum: { total: true }
        });

        const activeLicenses = await prisma.license.count({
            where: { status: LicenseStatus.ACTIVE, endDate: { gte: new Date() } }
        });

        const totalBusinesses = await prisma.business.count();

        return {
            totalSales: totalSales._sum.total || 0,
            activeLicenses,
            totalBusinesses
        };
    }

    async createBusiness(data: { name: string, ownerName: string, email: string, pin: string }) {
        // Find owner role
        const ownerRole = await prisma.role.findFirst({ where: { name: 'OWNER' } });
        if (!ownerRole) throw new Error('Rol de propietario (OWNER) no encontrado');

        const business = await prisma.business.create({
            data: {
                name: data.name,
                currency: 'DOP',
                taxRate: 18,
                tipRate: 10,
                users: {
                    create: {
                        name: data.ownerName,
                        email: data.email,
                        password: '', // PIN based login
                        pin: data.pin,
                        roleId: ownerRole.id
                    }
                }
            }
        });

        // Generate automatic trial license
        await this.generateLicense(business.id, 'TRIAL_7_DAYS');

        return business;
    }

    async createActivationRequest(data: {
        businessCode?: number;
        businessName: string;
        rnc?: string;
        businessType?: string;
        adminName: string;
        adminEmail: string;
        phone?: string;
        city?: string;
        country?: string;
        plan: 'TRIAL_7_DAYS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'LIFETIME';
    }) {
        return (prisma as any).activationRequest.create({
            data: {
                businessCode: data.businessCode,
                businessName: data.businessName,
                rnc: data.rnc,
                businessType: data.businessType,
                adminName: data.adminName,
                adminEmail: data.adminEmail,
                phone: data.phone,
                city: data.city,
                country: data.country,
                plan: data.plan
            }
        });
    }

    async listActivationRequests() {
        return (prisma as any).activationRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async approveActivationRequest(id: string, planOverride?: string) {
        const request = await (prisma as any).activationRequest.findUnique({ where: { id } });
        if (!request) throw new Error('Solicitud no encontrada');
        if (request.status !== 'PENDING') throw new Error('Solicitud ya procesada');

        const planType = planOverride || request.plan;

        const ownerRole = await prisma.role.findFirst({ where: { name: 'OWNER' } })
            .then(r => r || prisma.role.create({ data: { name: 'OWNER', description: 'Propietario', permissions: ['*'] } }));

        const tempPassword = crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const tempPin = Math.floor(1000 + Math.random() * 9000).toString();

        const business = await prisma.business.create({
            data: {
                businessCode: request.businessCode || undefined,
                name: request.businessName,
                email: request.adminEmail,
                phone: request.phone,
                rnc: request.rnc,
                address: [request.city, request.country].filter(Boolean).join(', '),
                currency: 'DOP',
                taxRate: 18,
                tipRate: 10,
                users: {
                    create: {
                        name: request.adminName,
                        email: request.adminEmail,
                        password: hashedPassword,
                        pin: tempPin,
                        roleId: ownerRole.id
                    }
                }
            }
        });

        const license = await this.generateLicense(business.id, planType);

        await (prisma as any).activationRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                businessId: business.id,
                licenseKey: license.key
            }
        });

        return {
            business,
            licenseKey: license.key,
            credentials: {
                email: request.adminEmail,
                password: tempPassword,
                pin: tempPin
            }
        };
    }
}

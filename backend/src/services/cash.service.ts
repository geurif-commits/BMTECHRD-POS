import prisma from '../config/database.js';
import { Decimal } from '@prisma/client/runtime/library.js';

export class CashService {
    private async buildShiftSummary(shift: { id: string; businessId: string; userId: string; openingBalance: Decimal; openedAt: Date; isOpen: boolean; notes: string | null; user?: { id: string; name: string } | null; }) {
        const payments = await prisma.payment.findMany({
            where: {
                businessId: shift.businessId,
                createdAt: { gte: shift.openedAt }
            }
        });

        const totalSalesCash = payments
            .filter((p) => p.method === 'CASH')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const totalSold = payments.reduce((sum, p) => sum + Number(p.amount), 0);

        const expenses = await prisma.expense.findMany({
            where: {
                businessId: shift.businessId,
                createdAt: { gte: shift.openedAt }
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const expectedCash = Number(shift.openingBalance) + totalSalesCash - totalExpenses;

        return {
            ...shift,
            openingBalance: Number(shift.openingBalance),
            totalSales: totalSalesCash,
            totalSold,
            totalExpenses,
            expectedCash,
            expenses
        };
    }

    async getActiveShift(businessId: string, userId: string) {
        const shift = await prisma.cashShift.findFirst({
            where: {
                businessId,
                userId,
                isOpen: true
            },
            include: {
                user: { select: { id: true, name: true } }
            }
        });

        if (!shift) return null;
        return this.buildShiftSummary(shift);
    }

    async openShift(businessId: string, userId: string, openingBalance: number, notes?: string) {
        const active = await this.getActiveShift(businessId, userId);
        if (active) throw new Error('Ya tienes un turno abierto');

        const created = await prisma.cashShift.create({
            data: {
                businessId,
                userId,
                openingBalance: new Decimal(openingBalance),
                notes
            },
            include: { user: { select: { id: true, name: true } } }
        });

        return this.buildShiftSummary(created);
    }

    async closeShift(shiftId: string, businessId: string, userId: string, closingBalance: number, notes?: string, canOverride: boolean = false) {
        const shift = await prisma.cashShift.findFirst({
            where: { id: shiftId, businessId }
        });

        if (!shift || !shift.isOpen) {
            throw new Error('Turno no encontrado o ya cerrado');
        }

        if (shift.userId !== userId && !canOverride) {
            throw new Error('No autorizado para cerrar este turno');
        }

        // Calculate totals from payments and expenses
        const payments = await prisma.payment.findMany({
            where: {
                businessId: shift.businessId,
                createdAt: { gte: shift.openedAt }
            }
        });

        const totalSalesCash = payments
            .filter((p) => p.method === 'CASH')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const expenses = await prisma.expense.findMany({
            where: {
                businessId: shift.businessId,
                createdAt: { gte: shift.openedAt }
            }
        });

        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        const updated = await prisma.cashShift.update({
            where: { id: shiftId },
            data: {
                closedAt: new Date(),
                closingBalance: new Decimal(closingBalance),
                totalSales: new Decimal(totalSalesCash),
                totalExpenses: new Decimal(totalExpenses),
                isOpen: false,
                notes: notes || shift.notes
            },
            include: { user: { select: { id: true, name: true } } }
        });

        return this.buildShiftSummary(updated);
    }

    async addExpense(businessId: string, description: string, amount: number, category: string = 'GENERAL') {
        return prisma.expense.create({
            data: {
                businessId,
                description,
                amount: new Decimal(amount),
                category
            }
        });
    }

    async getShiftReport(shiftId: string) {
        return prisma.cashShift.findUnique({
            where: { id: shiftId },
            include: {
                user: { select: { name: true } },
                business: { select: { name: true } }
            }
        });
    }
}

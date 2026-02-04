import prisma from '../config/database.js';
import { OrderStatus, TableStatus } from '../types/enums.js';

interface ValidationResult {
  success: boolean;
  checks: {
    name: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    message: string;
    data?: unknown;
  }[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export class ValidationService {
  /**
   * Valida integridad completa del sistema
   */
  async validateFullSystem(businessId: string): Promise<ValidationResult> {
    const checks: Array<{
      name: string;
      status: 'PASS' | 'FAIL' | 'WARNING';
      message: string;
      data?: unknown;
    }> = [];

    // Check 1: Todas las mesas tienen orientación
    const tables = await prisma.table.findMany({
      where: { businessId }
    });

    const tablesWithoutOrientation = tables.filter(t => !t.orientation || t.orientation === '');
    checks.push({
      name: 'Table Orientation',
      status: tablesWithoutOrientation.length === 0 ? 'PASS' : 'FAIL',
      message: tablesWithoutOrientation.length === 0 
        ? 'Todas las mesas tienen orientación definida'
        : `${tablesWithoutOrientation.length} mesas sin orientación`,
      data: tablesWithoutOrientation.map(t => ({ id: t.id, number: t.tableNumber }))
    });

    // Check 2: Todas las mesas tienen shape consistente
    const shapes = new Set(tables.map(t => t.shape));
    checks.push({
      name: 'Table Shape Consistency',
      status: shapes.size <= 1 ? 'PASS' : 'WARNING',
      message: shapes.size <= 1 
        ? `Todas las mesas usan la misma forma: ${Array.from(shapes)[0]}`
        : `Hay múltiples formas en uso: ${Array.from(shapes).join(', ')}`,
      data: { shapes: Array.from(shapes), count: tables.length }
    });

    // Check 3: Todas las mesas tienen posición (xPosition, yPosition)
    const tablesWithoutPosition = tables.filter(t => t.xPosition === null || t.yPosition === null);
    checks.push({
      name: 'Table Positioning',
      status: tablesWithoutPosition.length === 0 ? 'PASS' : 'FAIL',
      message: tablesWithoutPosition.length === 0
        ? 'Todas las mesas tienen posición definida'
        : `${tablesWithoutPosition.length} mesas sin posición`,
      data: tablesWithoutPosition.map(t => ({ id: t.id, number: t.tableNumber }))
    });

    // Check 4: Órdenes activas tienen referencia válida a mesas
    const activeOrders = await prisma.order.findMany({
      where: {
        businessId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED]
        }
      },
      include: { table: true }
    });

    const ordersWithoutTable = activeOrders.filter(o => !o.table);
    checks.push({
      name: 'Order Table References',
      status: ordersWithoutTable.length === 0 ? 'PASS' : 'FAIL',
      message: ordersWithoutTable.length === 0
        ? `Todas las ${activeOrders.length} órdenes activas tienen mesa asignada`
        : `${ordersWithoutTable.length} órdenes sin mesa asignada`,
      data: { activeOrders: activeOrders.length, orphaned: ordersWithoutTable.length }
    });

    // Check 5: Estados de mesas son válidos
    const invalidStatusTables = tables.filter(t => 
      !['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING'].includes(t.status)
    );
    checks.push({
      name: 'Table Status Validity',
      status: invalidStatusTables.length === 0 ? 'PASS' : 'FAIL',
      message: invalidStatusTables.length === 0
        ? 'Todos los estados de mesa son válidos'
        : `${invalidStatusTables.length} mesas con estado inválido`,
      data: invalidStatusTables.map(t => ({ id: t.id, number: t.tableNumber, status: t.status }))
    });

    // Check 6: Mesas OCCUPIED tienen órdenes activas
    const occupiedTables = tables.filter(t => t.status === TableStatus.OCCUPIED);
    const occupiedWithOrders = occupiedTables.filter(t => 
      activeOrders.some(o => o.tableId === t.id)
    );
    const occupiedWithoutOrders = occupiedTables.filter(t => 
      !activeOrders.some(o => o.tableId === t.id)
    );

    checks.push({
      name: 'Occupied Table Consistency',
      status: occupiedWithoutOrders.length === 0 ? 'PASS' : 'FAIL',
      message: occupiedWithoutOrders.length === 0
        ? `Todas las ${occupiedTables.length} mesas ocupadas tienen órdenes activas`
        : `${occupiedWithoutOrders.length} mesas ocupadas sin órdenes activas`,
      data: {
        occupied: occupiedTables.length,
        withOrders: occupiedWithOrders.length,
        withoutOrders: occupiedWithoutOrders.map(t => ({ id: t.id, number: t.tableNumber }))
      }
    });

    // Check 7: Comunicación WebSocket - Validar PIN en todas las mesas
    const tablesWithoutPin = tables.filter(t => !t.pin || t.pin.length === 0);
    checks.push({
      name: 'Table PIN Assignment',
      status: tablesWithoutPin.length === 0 ? 'PASS' : 'FAIL',
      message: tablesWithoutPin.length === 0
        ? 'Todas las mesas tienen PIN asignado para comunicación'
        : `${tablesWithoutPin.length} mesas sin PIN`,
      data: tablesWithoutPin.map(t => ({ id: t.id, number: t.tableNumber }))
    });

    // Check 8: Capacidad de mesas válida
    const tablesWithInvalidCapacity = tables.filter(t => t.capacity < 1 || t.capacity > 20);
    checks.push({
      name: 'Table Capacity',
      status: tablesWithInvalidCapacity.length === 0 ? 'PASS' : 'FAIL',
      message: tablesWithInvalidCapacity.length === 0
        ? 'Todas las mesas tienen capacidad válida (1-20 personas)'
        : `${tablesWithInvalidCapacity.length} mesas con capacidad inválida`,
      data: tablesWithInvalidCapacity.map(t => ({ id: t.id, number: t.tableNumber, capacity: t.capacity }))
    });

    // Calcular resumen
    const summary = {
      totalChecks: checks.length,
      passed: checks.filter(c => c.status === 'PASS').length,
      failed: checks.filter(c => c.status === 'FAIL').length,
      warnings: checks.filter(c => c.status === 'WARNING').length
    };

    return {
      success: summary.failed === 0,
      checks,
      summary
    };
  }

  /**
   * Sincroniza orientación de todas las mesas
   */
  async syncTableOrientation(businessId: string, orientation: 'horizontal' | 'vertical' = 'horizontal') {
    const updated = await prisma.table.updateMany({
      where: { businessId },
      data: { orientation }
    });

    return {
      success: true,
      message: `${updated.count} mesas actualizadas con orientación: ${orientation}`,
      count: updated.count
    };
  }

  /**
   * Genera posiciones automáticas para mesas en grid
   */
  async autoPositionTables(businessId: string, gridColumns: number = 4, spacingX: number = 150, spacingY: number = 150) {
    const tables = await prisma.table.findMany({
      where: { businessId },
      orderBy: { tableNumber: 'asc' }
    });

    const updates = tables.map((table, index) => {
      const col = index % gridColumns;
      const row = Math.floor(index / gridColumns);
      return {
        id: table.id,
        xPosition: col * spacingX,
        yPosition: row * spacingY
      };
    });

    for (const update of updates) {
      await prisma.table.update({
        where: { id: update.id },
        data: {
          xPosition: update.xPosition,
          yPosition: update.yPosition
        }
      });
    }

    return {
      success: true,
      message: `${updates.length} mesas reposicionadas en grid de ${gridColumns} columnas`,
      updates
    };
  }

  /**
   * Obtiene reporte de comunicación de mesas
   */
  async getTableCommunicationReport(businessId: string) {
    const tables = await prisma.table.findMany({
      where: { businessId },
      include: {
        orders: {
          where: { status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED] } },
          include: { orderItems: true }
        }
      }
    });

    const report = {
      totalTables: tables.length,
      byStatus: {
        FREE: tables.filter(t => t.status === TableStatus.FREE).length,
        OCCUPIED: tables.filter(t => t.status === TableStatus.OCCUPIED).length,
        RESERVED: tables.filter(t => t.status === TableStatus.RESERVED).length,
        CLEANING: tables.filter(t => t.status === TableStatus.CLEANING).length
      },
      totalActiveOrders: tables.reduce((sum, t) => sum + t.orders.length, 0),
      communicationStatus: tables.map(t => ({
        id: t.id,
        number: t.tableNumber,
        status: t.status,
        orientation: t.orientation,
        shape: t.shape,
        position: { x: t.xPosition, y: t.yPosition },
        pin: t.pin,
        hasActiveOrders: t.orders.length > 0,
        activeOrderCount: t.orders.length,
        isActive: t.isActive
      }))
    };

    return report;
  }
}

export const validationService = new ValidationService();

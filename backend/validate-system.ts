import prisma from './src/config/database.js';
import { validationService } from './src/services/validation.service.js';

async function main() {
  try {
    console.log('\n🔍 SISTEMA DE VALIDACIÓN DE MESAS Y COMUNICACIÓN\n');
    console.log('═'.repeat(70) + '\n');

    // Obtener negocio principal
    const business = await prisma.business.findFirst();
    if (!business) {
      console.error('❌ No se encontró negocio configurado');
      return;
    }

    console.log(`📍 Negocio: ${business?.name}`);
    console.log(`🆔 ID: ${business?.id}\n`);

    // 1. Ejecutar validación completa
    console.log('1️⃣  VALIDACIÓN COMPLETA DEL SISTEMA\n');
    console.log('─'.repeat(70));
    const validation = await validationService.validateFullSystem(business?.id || '');

    validation.checks.forEach((check, i) => {
      const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️ ';
      console.log(`\n${icon} ${i + 1}. ${check.name}`);
      console.log(`   ${check.message}`);
      if (check.data) {
        console.log(`   📊 ${JSON.stringify(check.data).substring(0, 100)}...`);
      }
    });

    console.log('\n' + '─'.repeat(70));
    console.log(`\n📋 RESUMEN:`);
    console.log(`   Total de checks: ${validation.summary.totalChecks}`);
    console.log(`   ✅ Pasados: ${validation.summary.passed}`);
    console.log(`   ❌ Fallidos: ${validation.summary.failed}`);
    console.log(`   ⚠️  Advertencias: ${validation.summary.warnings}`);
    console.log(`\n   Estado General: ${validation.success ? '✅ SISTEMA OK' : '❌ ERRORES DETECTADOS'}`);

    // 2. Reporte de comunicación
    console.log('\n\n2️⃣  REPORTE DE COMUNICACIÓN DE MESAS\n');
    console.log('─'.repeat(70));
    const report = await validationService.getTableCommunicationReport(business?.id || '');

    console.log(`\n📊 Estadísticas Generales:`);
    console.log(`   Total de mesas: ${report.totalTables}`);
    console.log(`   Órdenes activas: ${report.totalActiveOrders}`);
    console.log(`\n   Estado de mesas:`);
    console.log(`      🟢 Libres (FREE): ${report.byStatus.FREE}`);
    console.log(`      🔴 Ocupadas (OCCUPIED): ${report.byStatus.OCCUPIED}`);
    console.log(`      🟡 Reservadas (RESERVED): ${report.byStatus.RESERVED}`);
    console.log(`      🔵 Limpieza (CLEANING): ${report.byStatus.CLEANING}`);

    console.log(`\n📍 Detalles de Comunicación por Mesa:`);
    console.log('─'.repeat(70));
    report.communicationStatus.forEach((table, i) => {
      console.log(`\n${i + 1}. Mesa ${table.number}`);
      console.log(`   Estado: ${table.status} | Orientación: ${table.orientation} | Forma: ${table.shape}`);
      console.log(`   Posición: (${table.position.x}, ${table.position.y}) | PIN: ${table.pin}`);
      console.log(`   Activa: ${table.isActive ? 'Sí' : 'No'} | Órdenes activas: ${table.activeOrderCount}`);
      console.log(`   Comunicación: ${table.isActive && table.pin ? '✅ OPERATIVA' : '⚠️  INCOMPLETA'}`);
    });

    // 3. Sincronizar orientación
    console.log('\n\n3️⃣  SINCRONIZACIÓN DE ORIENTACIÓN\n');
    console.log('─'.repeat(70));
    const syncResult = await validationService.syncTableOrientation(business?.id || '', 'horizontal');
    console.log(`\n✅ ${syncResult.message}`);

    // 4. Auto-posicionar mesas
    console.log('\n\n4️⃣  POSICIONAMIENTO AUTOMÁTICO\n');
    console.log('─'.repeat(70));
    const posResult = await validationService.autoPositionTables(business?.id || '', 4, 150, 150);
    console.log(`\n✅ ${posResult.message}`);

    // 5. Validación final
    console.log('\n\n5️⃣  VALIDACIÓN FINAL\n');
    console.log('─'.repeat(70));
    const finalValidation = await validationService.validateFullSystem(business?.id || '');
    console.log(`\n${finalValidation.success ? '✅ TODAS LAS VALIDACIONES EXITOSAS' : '❌ AÚN HAY ERRORES'}`);
    console.log(`   Checks pasados: ${finalValidation.summary.passed}/${finalValidation.summary.totalChecks}`);

    console.log('\n' + '═'.repeat(70));
    console.log('\n✨ Validación completada\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

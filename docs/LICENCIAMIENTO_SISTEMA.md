# 🔐 DOCUMENTACIÓN DE LICENCIAMIENTO - SISTEMA POS BMTECHRD

**Versión:** 1.0.0  
**Fecha:** Febrero 3, 2026

---

## 🎯 Propósito
Definir el modelo de licenciamiento, el flujo de activación, la renovación y las políticas de uso del sistema.

---

## 🧾 Tipos de Licencia

| Plan | Código | Duración | Renovación | Notas |
|------|--------|----------|------------|------|
| Prueba 7 días | `TRIAL_7_DAYS` | 7 días | No | Validación inicial |
| Semestral | `SIX_MONTHS` | 6 meses | Sí | Uso operativo |
| Anual | `TWELVE_MONTHS` | 12 meses | Sí | Recomendado |
| Vitalicio | `LIFETIME` | Ilimitado | No | Pago único |

---

## ✅ Flujo de Activación

1. Cliente solicita activación en `/activar`
2. El sistema genera **ID de solicitud**
3. SuperAdmin revisa y aprueba
4. Se crea **licencia activa** y negocio
5. Se entrega al cliente su acceso

---

## 🔁 Renovación

- Renovación manual por SuperAdmin
- Notificación recomendada 15 días antes del vencimiento
- Renovación crea nueva fecha de expiración

---

## ⛔ Revocación y Suspensión

Se puede revocar una licencia cuando:
- Incumplimiento de pago
- Uso fraudulento
- Violación de términos

**Efecto:** el sistema bloquea acceso en todos los endpoints protegidos por `licenseCheck`.

---

## 🔒 Seguridad de Licencias

- Validación en cada request API
- Bloqueo automático si expira
- Token protegido por `LICENSE_SECRET`

---

## 📋 Requisitos para Comercialización

- Contrato de licenciamiento firmado
- Datos fiscales del cliente
- Registro interno de licencias emitidas

---

## 📌 Recomendaciones para Venta

- Incluir demo inicial de 7 días
- Entregar manual de uso y soporte
- Definir SLA mínimo (24–48h)
- Definir proceso de facturación

---

**BMTECHRD POS** · Política de Licenciamiento

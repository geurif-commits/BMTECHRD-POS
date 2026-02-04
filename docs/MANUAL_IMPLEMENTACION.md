# 📘 MANUAL DE IMPLEMENTACIÓN - SISTEMA POS BMTECHRD

**Versión:** 1.0.0  
**Fecha:** Febrero 3, 2026  
**Estado:** Manual operativo

---

## 🎯 Objetivo
Este manual describe el proceso recomendado para implementar el sistema en un entorno productivo: instalación, configuración, despliegue, verificación y operación inicial.

---

## ✅ Requisitos Previos

### Infraestructura
- Servidor Linux/Windows con acceso administrativo
- PostgreSQL 15+ (recomendado 16/18)
- Node.js 18+ (recomendado LTS)
- Dominio y SSL (Let’s Encrypt o certificado comercial)
- Almacenamiento para backups

### Accesos
- Credenciales de base de datos
- Usuario administrador del sistema
- Acceso al panel de superadmin

---

## 📦 Variables de Entorno (Backend)
Configurar en `.env` dentro de `backend/`:

- `DATABASE_URL` (PostgreSQL)
- `JWT_SECRET` (clave fuerte, mínima 32 caracteres)
- `PORT` (recomendado 3010)
- `CORS_ORIGIN` (dominio frontend)
- `LICENSE_SECRET` (firma de licencias)
- `SUPERADMIN_EMAIL` (opcional, para acceso inicial)

> **Nota:** evitar valores por defecto en producción.

---

## 🧱 Despliegue (Backend)

1. Instalar dependencias
2. Ejecutar migraciones de Prisma
3. Generar cliente Prisma
4. Construir el backend
5. Iniciar proceso con PM2 o servicio

---

## 🎨 Despliegue (Frontend)

1. Configurar `VITE_API_URL` o proxy en `vite.config.ts`
2. Ejecutar build con `npm run build`
3. Servir `dist/` desde Nginx o servidor estático

---

## 🔐 Activación y Licencias

1. Crear solicitud de activación en **/activar**
2. Validar solicitud en SuperAdmin
3. Aprobar y generar licencia
4. Entregar credenciales al cliente

---

## ✅ Checklist de Verificación Inicial

- [ ] Backend responde en `/api/health`
- [ ] Frontend carga en dominio
- [ ] Login funcional con rol Admin
- [ ] Crear orden y enviar a cocina/bar
- [ ] Pago y cierre de orden exitoso
- [ ] Inventario decrementa correctamente
- [ ] Licencia validada en requests

---

## 🔄 Mantenimiento y Backups

- Backup automático diario de PostgreSQL
- Revisión de logs semanal
- Revisión de vencimientos de licencia
- Renovación SSL

---

## 🔁 Rollback Rápido

1. Detener servicios
2. Restaurar backup de DB
3. Desplegar versión anterior
4. Validar endpoints críticos

---

## 📞 Soporte

- **Email:** support@bmtechrd.com
- **Horario sugerido:** Lun–Sáb, 9:00 AM – 6:00 PM

---

**BMTECHRD POS** · Manual de implementación oficial

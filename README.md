# BMTECHRD POS

Sistema POS completo con backend Node/Express + Prisma/PostgreSQL y frontend React/Vite.

## Estructura

- `backend/` API, servicios, Prisma
- `frontend/` UI React + Vite
- `docs/` documentación

## Requisitos

- Node.js 18+
- PostgreSQL

## Variables de entorno (backend)

Crear `backend/.env`:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME`
- `JWT_SECRET=tu_secreto`
- `FRONTEND_URL=http://localhost:5173`
- `PORT=3010`

## Arranque en desarrollo

Backend:

- `npm install`
- `npm run dev`

Frontend:

- `npm install`
- `npm run dev`

## Builds

Backend:

- `npm run build`

Frontend:

- `npm run build`

## Validaciones

- `backend/validate-system.ts`
- `backend/validate-complete-order-flow.ts`
- `backend/validate-user-access-by-role.ts`

## Despliegue

Ver `docs/GUIA_DESPLIEGUE_AWS.md`.

# BMTECHRD POS – Auditoría y correcciones

## Resumen

Auditoría completa del proyecto (backend y frontend). El sistema queda estable y ejecutable.

---

## Errores corregidos

### Backend

1. **ERR_MODULE_NOT_FOUND (socket.js)**  
   - **Causa:** Con `ts-node-esm`, Node resolvía `./config/socket.js` y el archivo es `socket.ts`.  
   - **Solución:** Sustitución de `ts-node-esm` por **tsx** en `package.json` (`nodemon --exec tsx src/server.ts`). tsx resuelve correctamente imports `.js` a fuentes `.ts` en desarrollo.

2. **Import inexistente `initSocket`**  
   - **Causa:** `server.ts` importaba `initSocket` desde `./config/socket.js`, pero `socket.ts` no exporta esa función.  
   - **Solución:** Eliminado el import y la referencia a `initSocket` en `server.ts`.

3. **database.ts – status de licencia**  
   - **Causa:** Se usaba `status: 'active'` en lugar del enum `LicenseStatus.ACTIVE`.  
   - **Solución:** Import de `LicenseStatus` desde `../types/enums.js` y uso de `status: LicenseStatus.ACTIVE` en la consulta de licencias activas.

4. **order.service.ts – tipo de `where` en `list()`**  
   - **Causa:** El objeto `where` tenía un tipo que no coincidía con `Prisma.OrderWhereInput` (en especial `status`).  
   - **Solución:** Uso de `Prisma.OrderWhereInput` y `Prisma.EnumOrderStatusFilter` para el filtro de estado.

### Frontend

5. **main.tsx – getElementById('root') puede ser null**  
   - **Causa:** TypeScript no acepta `null` como argumento de `createRoot`.  
   - **Solución:** Comprobación previa y lanzamiento de error si no existe el elemento: `const rootEl = document.getElementById('root'); if (!rootEl) throw new Error('Root element not found');`.

6. **CashierPage.tsx – DollarSign no encontrado**  
   - **Causa:** Uso de `DollarSign` sin importar desde `lucide-react`.  
   - **Solución:** Añadido `DollarSign` al import de `lucide-react` y tipado del array de métodos con `typeof Banknote`.

7. **WaiterPage.tsx – tipo de `Table`**  
   - **Causa:** `setSelectedTable(table)` con `table.status: string` no era compatible con el tipo `Table` del store (`status: 'FREE' | 'OCCUPIED' | ...`).  
   - **Solución:** Import del tipo `Table` desde el store y uso de `setSelectedTable(table as Table)` (y `data.data.table as Table` donde corresponda).

8. **index.html y main.tsx**  
   - **Causa:** `index.html` apuntaba a `main.jsx` y `main.tsx` importaba `./App.js`.  
   - **Solución:** Entrada en `index.html` cambiada a `/src/main.tsx` y en `main.tsx` a `import App from './App'`.

9. **Build Vite – "default is not exported by stores/api.js"**  
   - **Causa:** Coexistían `stores/api.js` (CJS) y `stores/api.ts` (ESM). Rollup resolvía a `api.js`, que no exponía bien el default en ESM.  
   - **Solución:** Eliminados los archivos **duplicados** `.jsx`/`.js` que tenían equivalente `.tsx`/`.ts` (páginas, componentes, `stores/api.js`, `stores/useStore.jsx`, `services/api.js`, `App.jsx`), de modo que el build use solo las versiones TypeScript y no haya conflicto con CJS.

10. **vite.config.ts**  
    - Añadido `resolve.extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']` para priorizar resolución TypeScript.

---

## Archivos eliminados (duplicados)

Se eliminaron **solo** duplicados que ya tenían versión funcional en TypeScript; no se eliminó lógica nueva.

- **Frontend – páginas:** `KitchenPage.jsx`, `BarPage.jsx`, `CashierPage.jsx`, `WaiterPage.jsx`, `LoginPage.jsx`, `LicenseExpiredPage.jsx`, `DashboardPage.jsx`
- **Frontend – componentes:** `TablesGrid.jsx`, `ProductsGrid.jsx`, `OrderCart.jsx`, `KitchenOrderCard.jsx`, `BarOrderCard.jsx`, `InventoryAlert.jsx`, `Layout.jsx`
- **Frontend – stores/services:** `stores/api.js`, `stores/useStore.jsx`, `services/api.js`, `App.jsx`

Los módulos funcionales siguen en sus versiones `.tsx`/`.ts`.

---

## Archivos modificados (sin crear nuevos)

- **Backend:** `package.json` (tsx, scripts dev/seed), `src/server.ts` (quitar initSocket), `src/config/database.ts` (LicenseStatus), `src/services/order.service.ts` (Prisma types)
- **Frontend:** `index.html` (main.tsx), `src/main.tsx` (root + App), `src/pages/CashierPage.tsx` (DollarSign), `src/pages/WaiterPage.tsx` (Table), `vite.config.ts` (resolve.extensions)

---

## Cómo ejecutar

### Backend

```bash
cd bmt-techrd-pos/backend
npm install
npx prisma generate
# Si la migración falló antes (P3018): npx prisma migrate resolve --rolled-back 20260129180151_init
npx prisma migrate dev
npm run dev    # desarrollo (tsx)
# o
npm run build && npm start   # producción (node dist/server.js)
```

### Frontend

```bash
cd bmt-techrd-pos/frontend
npm install
npm run dev    # desarrollo (Vite)
# o
npm run build && npm run preview   # producción
```

### Migración fallida (P3018)

Si la migración `20260129180151_init` falló por restricciones únicas en PostgreSQL, la migración ya está corregida (usa `DROP CONSTRAINT IF EXISTS` en lugar de `DROP INDEX`). Pasos:

1. `npx prisma migrate resolve --rolled-back 20260129180151_init`
2. `npx prisma migrate dev`

---

## Estado final

- `npm install` funciona en backend y frontend.
- `npm run dev` (backend) arranca con tsx sin error de módulo.
- `npm run dev` (frontend) arranca con Vite.
- `npm run build` (backend) genera `dist/` correctamente.
- `npm run build` (frontend) genera `dist/` correctamente.
- `npm start` (backend) ejecuta `node dist/server.js` (requiere puerto 3001 libre).
- No se han añadido funcionalidades nuevas; se mantienen roles, sockets, auth y rutas POS.
- El sistema está listo para pruebas funcionales en entorno real.

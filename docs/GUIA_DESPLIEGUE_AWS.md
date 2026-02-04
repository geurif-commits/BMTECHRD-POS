# Guía de Despliegue — BMTECHRD POS (AWS Free Tier)

**Objetivo:** desplegar el sistema en AWS usando EC2 Ubuntu + RDS PostgreSQL + Nginx + PM2.

---

## 1) Requisitos previos
- Cuenta AWS con Free Tier activo.
- Dominio (opcional, para SSL).
- Acceso SSH a la instancia EC2.

---

## 2) Crear infraestructura en AWS

### 2.1 EC2 (Ubuntu)
1. EC2 → Launch Instance.
2. AMI: **Ubuntu Server 22.04 LTS**.
3. Tipo: **t2.micro** (Free Tier).
4. Security Group (Inbound):
   - SSH: 22
   - HTTP: 80
   - HTTPS: 443
   - (Opcional) 3010 si no usarás proxy.
5. Crear/descargar llave .pem.

### 2.2 RDS (PostgreSQL)
1. RDS → Create Database.
2. Engine: **PostgreSQL**.
3. Free Tier.
4. Guardar:
   - **DB_HOST**
   - **DB_PORT** (5432)
   - **DB_NAME**
   - **DB_USER**
   - **DB_PASS**
5. Permitir acceso desde la EC2 (Security Group).

---

## 3) Conectar a EC2

Desde tu PC:
- ssh -i tu-llave.pem ubuntu@IP_PUBLICA

---

## 4) Instalar dependencias en EC2

Actualiza e instala:
- sudo apt update
- sudo apt install -y nginx git
- curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
- sudo apt install -y nodejs
- sudo npm install -g pm2

---

## 5) Subir proyecto al servidor

Opción A: Git
- git clone <TU_REPO>

Opción B: ZIP
- Subir ZIP y descomprimir en /var/www/bmt-pos

---

## 6) Configurar variables de entorno (Backend)

Crear archivo `.env` en `backend/`:
- DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
- JWT_SECRET=TU_SECRETO
- FRONTEND_URL=https://TU_DOMINIO
- PORT=3010

---

## 7) Backend — Build y Deploy

Desde `backend/`:
- npm install
- npm run build
- npx prisma generate
- npx prisma migrate deploy
- pm2 start dist/server.js --name bmt-pos-backend
- pm2 save

---

## 8) Frontend — Build y Deploy

Desde `frontend/`:
- npm install
- npm run build

Copiar `frontend/dist` a Nginx:
- sudo rm -rf /var/www/html/*
- sudo cp -r dist/* /var/www/html/

---

## 9) Nginx (Reverse Proxy API)

Editar `/etc/nginx/sites-available/default` y usar:

server {
    listen 80;
    server_name TU_DOMINIO o IP_PUBLICA;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3010/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

Luego:
- sudo nginx -t
- sudo systemctl restart nginx

---

## 10) SSL (opcional pero recomendado)

- sudo apt install -y certbot python3-certbot-nginx
- sudo certbot --nginx -d TU_DOMINIO

---

## 11) Verificación final

1. Abrir https://TU_DOMINIO
2. Registrar prueba y verificar credenciales.
3. Acceder a SuperAdmin.
4. Activar licencias y verificar accesos.

---

## 12) Mantenimiento básico

- pm2 status
- pm2 logs bmt-pos-backend
- sudo systemctl restart nginx

---

## 13) Migración futura a Windows

1. Exportar DB desde RDS.
2. Importar en PostgreSQL Windows.
3. Mover backend y frontend.
4. Reconfigurar `.env`.

---

**Fin de guía.**

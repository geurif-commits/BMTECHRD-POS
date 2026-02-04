#!/bin/bash

echo "🚀 Configurando BMTECHRD POS para PostgreSQL..."

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado. Instálalo primero:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   Windows: https://www.postgresql.org/download/windows/"
    exit 1
fi

# Verificar conexión a PostgreSQL
echo "🔍 Verificando conexión a PostgreSQL..."
if ! PGPASSWORD=0120 psql -h localhost -U postgres -p 5432 -c "\q" &> /dev/null; then
    echo "❌ No se puede conectar a PostgreSQL. Verifica:"
    echo "   1. Que PostgreSQL esté corriendo: sudo service postgresql start"
    echo "   2. Que el usuario 'postgres' exista"
    echo "   3. Que la contraseña sea '0120'"
    exit 1
fi

echo "✅ Conexión a PostgreSQL establecida"

# Crear base de datos si no existe
echo "🗄️ Creando base de datos 'pos_db'..."
PGPASSWORD=0120 psql -h localhost -U postgres -p 5432 -c "CREATE DATABASE pos_db;" 2>/dev/null || echo "ℹ️ La base de datos ya existe, continuando..."

# Instalar dependencias
echo "📦 Instalando dependencias del backend..."
cd backend
npm install

# Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
npx prisma generate

# Ejecutar migraciones
echo "🚀 Ejecutando migraciones de la base de datos..."
npx prisma migrate deploy

# Ejecutar seed
echo "🌱 Ejecutando seed de datos iniciales..."
node scripts/seed-database.js

echo ""
echo "🎉 ¡Configuración completada exitosamente!"
echo ""
echo "📋 Para iniciar el sistema:"
echo "   1. Iniciar backend: cd backend && npm run dev"
echo "   2. En otra terminal, iniciar frontend: cd frontend && npm run dev"
echo ""
echo "🔗 URLs importantes:"
echo "   - Sistema POS: http://localhost:3000"
echo "   - API Backend: http://localhost:3001"
echo "   - Prisma Studio (admin DB): npx prisma studio"
echo ""
echo "🔑 Credenciales de prueba:"
echo "   - Admin: admin@bmtechrd.com / admin123"
echo "   - Camarero: camarero@restaurant.com / cam123"
echo "   - PINs: 1111 (admin), 3333 (camarero), etc."
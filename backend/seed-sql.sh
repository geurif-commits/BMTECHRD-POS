#!/bin/bash

# Script para popular la base de datos pos_db con datos de prueba

# Variables
DATABASE="pos_db"
HOST="localhost"
PORT="5432"
USER="postgres"
PASSWORD="postgres"

# Función para ejecutar SQL
run_sql() {
  PGPASSWORD=$PASSWORD psql -h $HOST -U $USER -d $DATABASE -c "$1"
}

echo "🌱 Poblando base de datos..."

# Crear roles
echo "📋 Creando roles..."
run_sql "INSERT INTO roles (id, name, description, permissions) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'ADMIN', 'Admin', '[]'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'CAMARERO', 'Waiter', '[]'::jsonb),
  ('00000000-0000-0000-0000-000000000003', 'COCINERO', 'Chef', '[]'::jsonb),
  ('00000000-0000-0000-0000-000000000004', 'CAJERO', 'Cashier', '[]'::jsonb)
ON CONFLICT (name) DO NOTHING;"

# Crear negocio
echo "🏢 Creando negocio..."
run_sql "INSERT INTO businesses (id, name, email, phone, address, rnc, tax_id, currency, bank_name, bank_account_number, bank_account_type, tax_rate, tip_rate)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Restaurant Demo', 'demo@test.com', '+1-555-0123', 'Calle Principal 123', 123456789, 'TAX123456', 'DOP', 'Banco Popular', '1234567890', 'Corriente', 18.00, 10.00)
ON CONFLICT (id) DO NOTHING;"

echo "✅ Base de datos poblada!"

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '0120',
  database: 'postgres'
});

async function reset() {
  try {
    await client.connect();
    console.log('📡 Connected to PostgreSQL');
    
    // Terminate all connections to pos_db
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'pos_db'
      AND pid <> pg_backend_pid();
    `);
    console.log('✅ Terminated existing connections');
    
    // Drop database
    await client.query('DROP DATABASE IF EXISTS pos_db CASCADE;');
    console.log('✅ Dropped pos_db');
    
    // Recreate database
    await client.query('CREATE DATABASE pos_db ENCODING UTF8;');
    console.log('✅ Created pos_db');
    
    await client.end();
    console.log('✅ Database reset complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

reset();

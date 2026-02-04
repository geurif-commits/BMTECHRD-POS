import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function resetDB() {
  try {
    // Set environment variable
    process.env.DATABASE_URL = 'postgresql://postgres:0120@localhost:5432/postgres';
    
    console.log('🔄 Resetting database...');
    const { stdout, stderr } = await execAsync('npx prisma db execute --stdin < reset-db.sql', { cwd: process.cwd() });
    console.log('✅ Database reset:', stdout);
    if (stderr) console.warn('⚠️', stderr);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

resetDB();

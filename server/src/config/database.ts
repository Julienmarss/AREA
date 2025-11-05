import { Pool } from 'pg';

const poolConfig: any = {
  max: 10,
  min: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,
};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
} else {
  poolConfig.host = process.env.DB_HOST || 'dpg-d3di0d6r433s73earhrg-a.frankfurt-postgres.render.com';
  poolConfig.port = parseInt(process.env.DB_PORT || '5432');
  poolConfig.database = process.env.DB_NAME || 'area_db_m376';
  poolConfig.user = process.env.DB_USER || 'area_user';
  poolConfig.password = process.env.DB_PASSWORD || 'wBK9nEv5JQOoBBy7ePaGkyuhSiIibVh9';
  
  if (poolConfig.host.includes('render.com')) {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }
}

const pool = new Pool(poolConfig);

pool.on('connect', (client) => {
  console.log('New client connected to PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error('Unexpected database error on idle client:', err.message);
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});

export async function testConnection(): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connection test successful:', result.rows[0].now);
    return true;
  } catch (error: any) {
    console.error('Database connection test failed:', error.message);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

export function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

export default pool;
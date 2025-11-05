import pool from '../config/database';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  let client;
  try {
    console.log('Initializing database...');

    client = await pool.connect();
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');

    console.log('Database initialized successfully');
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Failed to initialize database:', error.message);
    
    if (error.code !== '42710' && error.code !== '42P07') {
      throw error;
    } else {
      console.log('Some database objects already exist (this is normal)');
    }
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection test successful:', result.rows[0].now);
    return true;
  } catch (error: any) {
    console.error('Database connection test failed:', error.message);
    return false;
  }
}

export async function resetDatabase() {
  let client;
  try {
    console.log('Resetting database (this will delete all data)...');
    
    client = await pool.connect();
    
    await client.query('BEGIN');
    
    await client.query('DROP TABLE IF EXISTS oauth_tokens CASCADE');
    await client.query('DROP TABLE IF EXISTS areas CASCADE');
    await client.query('DROP TABLE IF EXISTS user_services CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    await client.query('DROP FUNCTION IF EXISTS update_updated_at_column CASCADE');
    
    await client.query('COMMIT');
    
    console.log('Database reset successfully');
    
    await initializeDatabase();
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Failed to reset database:', error.message);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}
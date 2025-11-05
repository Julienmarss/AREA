import pool from '../config/database';
import { User } from '../types/user';

class UserStorage {
  async create(user: User): Promise<void> {
    const query = `
      INSERT INTO users (id, email, first_name, last_name, password_hash, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await pool.query(query, [
      user.id,
      user.email,
      user.firstName,
      user.lastName,
      user.passwordHash,
      user.createdAt
    ]);
  }

  async findById(id: string): Promise<User | undefined> {
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [id]);
    
    if (userResult.rows.length === 0) return undefined;

    const userData = userResult.rows[0];
    
    const servicesQuery = 'SELECT * FROM user_services WHERE user_id = $1';
    const servicesResult = await pool.query(servicesQuery, [id]);
    
    const services: any = {};
    for (const service of servicesResult.rows) {
      services[service.service_name] = {
        connected: true,
        accessToken: service.access_token,
        refreshToken: service.refresh_token,
        expiresAt: service.expires_at,
        connectedAt: service.connected_at,
        ...service.metadata
      };
    }

    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      passwordHash: userData.password_hash,
      createdAt: userData.created_at,
      services
    };
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) return undefined;

    return this.findById(result.rows[0].id);
  }

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.firstName) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(updates.firstName);
    }
    if (updates.lastName) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(updates.lastName);
    }
    if (updates.passwordHash) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(updates.passwordHash);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}`;
    await pool.query(query, values);

    return this.findById(id);
  }

  async updateServices(
    id: string,
    service: 'github' | 'discord' | 'spotify' | 'google',
    data: any
  ): Promise<User | undefined> {
    const query = `
      INSERT INTO user_services (user_id, service_name, access_token, refresh_token, expires_at, metadata, connected_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, service_name) 
      DO UPDATE SET 
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        metadata = EXCLUDED.metadata,
        connected_at = EXCLUDED.connected_at
    `;

    const { accessToken, refreshToken, expiresAt, ...metadata } = data;

    await pool.query(query, [
      id,
      service,
      accessToken || null,
      refreshToken || null,
      expiresAt || null,
      JSON.stringify(metadata),
      new Date()
    ]);

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAll(): Promise<User[]> {
    const query = 'SELECT id FROM users';
    const result = await pool.query(query);
    
    const users: User[] = [];
    for (const row of result.rows) {
      const user = await this.findById(row.id);
      if (user) users.push(user);
    }
    return users;
  }

  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM users';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }
}

export const userStorage = new UserStorage();
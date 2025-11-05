import pool from '../config/database';

export interface AREA {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  action: {
    service: string;
    type: string;
    config: any;
  };
  reaction: {
    service: string;
    type: string;
    config: any;
  };
  lastTriggered?: Date;
  lastChecked?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserToken {
  userId: string;
  service: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  metadata?: {
    bot_id?: string;
    workspace_id?: string;
    workspace_name?: string;
    workspace_icon?: string;
    [key: string]: any;
  };
}

export class InMemoryDB {
  static async createArea(area: Omit<AREA, 'id' | 'createdAt' | 'updatedAt'>): Promise<AREA> {
    const client = await pool.connect();
    try {
      const id = `area_${Date.now()}_${Math.random()}`;
      const now = new Date();

      const query = `
        INSERT INTO areas (
          id, user_id, name, enabled,
          action_service, action_type, action_config,
          reaction_service, reaction_type, reaction_config,
          metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const result = await client.query(query, [
        id,
        area.userId,
        area.name,
        area.enabled,
        area.action.service,
        area.action.type,
        JSON.stringify(area.action.config),
        area.reaction.service,
        area.reaction.type,
        JSON.stringify(area.reaction.config),
        JSON.stringify(area.metadata || {}),
        now,
        now
      ]);

      return this.rowToArea(result.rows[0]);
    } catch (error) {
      console.error('Error creating area:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAreas(userId?: string): Promise<AREA[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM areas';
      const params: any[] = [];

      if (userId) {
        query += ' WHERE user_id = $1';
        params.push(userId);
      }

      query += ' ORDER BY created_at DESC';

      const result = await client.query(query, params);
      return result.rows.map(row => this.rowToArea(row));
    } catch (error) {
      console.error('Error getting areas:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAreaById(id: string): Promise<AREA | undefined> {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM areas WHERE id = $1';
      const result = await client.query(query, [id]);

      if (result.rows.length === 0) return undefined;
      return this.rowToArea(result.rows[0]);
    } catch (error) {
      console.error('Error getting area by id:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateArea(id: string, updates: Partial<AREA>): Promise<AREA | undefined> {
    const client = await pool.connect();
    try {
      const current = await this.getAreaById(id);
      if (!current) return undefined;

      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.enabled !== undefined) {
        fields.push(`enabled = $${paramCount++}`);
        values.push(updates.enabled);
      }
      if (updates.action) {
        fields.push(`action_service = $${paramCount++}`);
        values.push(updates.action.service);
        fields.push(`action_type = $${paramCount++}`);
        values.push(updates.action.type);
        fields.push(`action_config = $${paramCount++}`);
        values.push(JSON.stringify(updates.action.config));
      }
      if (updates.reaction) {
        fields.push(`reaction_service = $${paramCount++}`);
        values.push(updates.reaction.service);
        fields.push(`reaction_type = $${paramCount++}`);
        values.push(updates.reaction.type);
        fields.push(`reaction_config = $${paramCount++}`);
        values.push(JSON.stringify(updates.reaction.config));
      }
      if (updates.metadata !== undefined) {
        fields.push(`metadata = $${paramCount++}`);
        values.push(JSON.stringify(updates.metadata));
      }
      if (updates.lastTriggered !== undefined) {
        fields.push(`last_triggered = $${paramCount++}`);
        values.push(updates.lastTriggered);
      }
      if (updates.lastChecked !== undefined) {
        fields.push(`last_checked = $${paramCount++}`);
        values.push(updates.lastChecked);
      }

      if (fields.length === 0) return current;

      values.push(id);
      const query = `UPDATE areas SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      
      const result = await client.query(query, values);
      return this.rowToArea(result.rows[0]);
    } catch (error) {
      console.error('Error updating area:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteArea(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const query = 'DELETE FROM areas WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting area:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async saveToken(token: Omit<UserToken, 'createdAt'>): Promise<UserToken> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO oauth_tokens (user_id, service, access_token, refresh_token, expires_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, service) 
        DO UPDATE SET 
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          expires_at = EXCLUDED.expires_at,
          metadata = EXCLUDED.metadata
        RETURNING *
      `;

      const result = await client.query(query, [
        token.userId,
        token.service,
        token.accessToken,
        token.refreshToken || null,
        token.expiresAt || null,
        JSON.stringify(token.metadata || {})
      ]);

      return this.rowToToken(result.rows[0]);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getToken(userId: string, service: string): Promise<UserToken | undefined> {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM oauth_tokens WHERE user_id = $1 AND service = $2';
      const result = await client.query(query, [userId, service]);

      if (result.rows.length === 0) return undefined;
      return this.rowToToken(result.rows[0]);
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteToken(userId: string, service: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const query = 'DELETE FROM oauth_tokens WHERE user_id = $1 AND service = $2';
      const result = await client.query(query, [userId, service]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting token:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private static rowToArea(row: any): AREA {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      enabled: row.enabled,
      action: {
        service: row.action_service,
        type: row.action_type,
        config: row.action_config
      },
      reaction: {
        service: row.reaction_service,
        type: row.reaction_type,
        config: row.reaction_config
      },
      metadata: row.metadata,
      lastTriggered: row.last_triggered,
      lastChecked: row.last_checked,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static rowToToken(row: any): UserToken {
    return {
      userId: row.user_id,
      service: row.service,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      metadata: row.metadata
    };
  }
}
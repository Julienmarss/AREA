// Modèle AREA simple (à adapter selon ta base de données)

export interface AREA {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  
  // Action configuration
  action: {
    service: string;  // 'spotify'
    type: string;     // 'new_track_played', 'new_track_saved', etc.
    config: any;      // Configuration spécifique (ex: artistId)
  };
  
  // REAction configuration
  reaction: {
    service: string;  // 'spotify', 'discord', etc.
    type: string;     // 'add_track_to_playlist', etc.
    config: any;      // Configuration spécifique (ex: playlistId)
  };
  
  // État pour éviter les triggers multiples
  lastTriggered?: Date;
  lastChecked?: Date;
  metadata?: any;  // Données temporaires (dernier track ID, etc.)
  
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les tokens OAuth
export interface UserToken {
  userId: string;
  service: string;  // 'spotify'
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
}

// Base de données en mémoire temporaire (remplacer par PostgreSQL)
export class InMemoryDB {
  private static areas: AREA[] = [];
  private static tokens: UserToken[] = [];
  
  // AREAS
  static createArea(area: Omit<AREA, 'id' | 'createdAt' | 'updatedAt'>): AREA {
    const newArea: AREA = {
      ...area,
      id: `area_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.areas.push(newArea);
    return newArea;
  }
  
  static getAreas(userId?: string): AREA[] {
    if (userId) {
      return this.areas.filter(a => a.userId === userId);
    }
    return this.areas;
  }
  
  static getAreaById(id: string): AREA | undefined {
    return this.areas.find(a => a.id === id);
  }
  
  static updateArea(id: string, updates: Partial<AREA>): AREA | undefined {
    const index = this.areas.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.areas[index] = {
      ...this.areas[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.areas[index];
  }
  
  static deleteArea(id: string): boolean {
    const index = this.areas.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.areas.splice(index, 1);
    return true;
  }
  
  // TOKENS
  static saveToken(token: Omit<UserToken, 'createdAt'>): UserToken {
    // Supprimer ancien token si existe
    this.tokens = this.tokens.filter(
      t => !(t.userId === token.userId && t.service === token.service)
    );
    
    const newToken: UserToken = {
      ...token,
      createdAt: new Date(),
    };
    this.tokens.push(newToken);
    return newToken;
  }
  
  static getToken(userId: string, service: string): UserToken | undefined {
    return this.tokens.find(t => t.userId === userId && t.service === service);
  }
  
  static deleteToken(userId: string, service: string): boolean {
    const initialLength = this.tokens.length;
    this.tokens = this.tokens.filter(
      t => !(t.userId === userId && t.service === service)
    );
    return this.tokens.length < initialLength;
  }
}
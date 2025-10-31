// server/src/types/user.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: Date;
  services: {
    github?: {
      connected: boolean;
      accessToken?: string;
      username?: string;
      connectedAt: Date;
    };
    discord?: {
      connected: boolean;
      accessToken?: string;
      refreshToken?: string;
      expiresIn?: number;
      username?: string;
      discriminator?: string;
      userId?: string;
      botToken?: string;
      guildId?: string;
      guildName?: string;
      guilds?: Array<{
        id: string;
        name: string;
        icon?: string;
        owner: boolean;
        permissions: string;
      }>;
      connectedAt: Date;
    };
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  error?: string;
}

export interface UserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  services: User['services'];
}
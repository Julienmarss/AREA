// web/src/types/index.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  services?: {
    github?: ServiceConnection;
    discord?: ServiceConnection;
    spotify?: ServiceConnection;
  };
}

export interface ServiceConnection {
  connected: boolean;
  username?: string;
  connectedAt: Date;
  accessToken?: string;
  botToken?: string;
  guildId?: string;
}

export interface Service {
  name: string;
  displayName: string;
  icon: string;
  description: string;
  color: string;
  actions: ServiceAction[];
  reactions: ServiceReaction[];
}

export interface ServiceAction {
  name: string;
  description: string;
}

export interface ServiceReaction {
  name: string;
  description: string;
}

export interface Area {
  id: string;
  userId: string;
  name: string;
  description?: string;
  enabled: boolean;
  action: {
    service: string;
    type: string;
    config: Record<string, any>;
  };
  reaction: {
    service: string;
    type: string;
    config: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
}

export interface AboutData {
  client: {
    host: string;
  };
  server: {
    current_time: number;
    services: ServiceInfo[];
  };
}

export interface ServiceInfo {
  name: string;
  actions: Array<{ name: string; description: string }>;
  reactions: Array<{ name: string; description: string }>;
}
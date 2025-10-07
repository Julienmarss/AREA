export interface ServiceConfig {
  name: string;
  displayName: string;
  description: string;
  authType: 'oauth2' | 'api_key' | 'bot_token';
  baseUrl?: string;
  scopes?: string[];
}

export interface ActionConfig {
  name: string;
  displayName: string;
  description: string;
  parameters: ActionParameter[];
}

export interface ReactionConfig {
  name: string;
  displayName: string;
  description: string;
  parameters: ActionParameter[];
}

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  description: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Area {
  id: string;
  userId: string;
  name: string;
  description?: string;
  enabled: boolean;
  action: {
    serviceId: string;
    actionId: string;
    parameters: Record<string, any>;
  };
  reaction: {
    serviceId: string;
    reactionId: string;
    parameters: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
}

export interface ServiceAuthData {
  userId: string;
  serviceId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
  metadata?: Record<string, any>;
}

export interface ActionTriggerEvent {
  serviceId: string;
  actionId: string;
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface ReactionExecutionEvent {
  serviceId: string;
  reactionId: string;
  userId: string;
  parameters: Record<string, any>;
  triggerData: Record<string, any>;
  timestamp: Date;
}
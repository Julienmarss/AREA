import { ActionTriggerEvent, ReactionExecutionEvent, ServiceConfig, ServiceAuthData, ActionConfig, ReactionConfig } from '../../types/area';

export abstract class ServiceBase {
  protected config: ServiceConfig;
  protected authData: Map<string, ServiceAuthData> = new Map();

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  // Configuration methods
  getConfig(): ServiceConfig {
    return this.config;
  }

  abstract getActions(): ActionConfig[];
  abstract getReactions(): ReactionConfig[];

  // Authentication methods
  abstract authenticate(userId: string, authData: any): Promise<boolean>;
  abstract isAuthenticated(userId: string): Promise<boolean>;
  abstract refreshAuth(userId: string): Promise<boolean>;

  // Service lifecycle methods
  abstract initialize(): Promise<void>;
  abstract destroy(): Promise<void>;

  // Action methods - used to listen for triggers
  abstract startListening(userId: string, actionId: string, parameters: Record<string, any>): Promise<void>;
  abstract stopListening(userId: string, actionId: string): Promise<void>;

  // Reaction methods - used to execute reactions
  abstract executeReaction(reactionId: string, userId: string, parameters: Record<string, any>, triggerData: Record<string, any>): Promise<boolean>;

  // Helper methods
  protected setAuthData(userId: string, authData: ServiceAuthData): void {
    this.authData.set(userId, authData);
  }

  protected getAuthData(userId: string): ServiceAuthData | undefined {
    return this.authData.get(userId);
  }

  protected removeAuthData(userId: string): void {
    this.authData.delete(userId);
  }

  // Event emission for actions
  protected emitActionTrigger(event: ActionTriggerEvent): void {
    console.log(`Action triggered: ${event.serviceId}.${event.actionId} for user ${event.userId}`);
  }
}
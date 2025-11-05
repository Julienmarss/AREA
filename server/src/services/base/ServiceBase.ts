import { ActionTriggerEvent, ReactionExecutionEvent, ServiceConfig, ServiceAuthData, ActionConfig, ReactionConfig } from '../../types/area';

export abstract class ServiceBase {
  protected config: ServiceConfig;
  protected authData: Map<string, ServiceAuthData> = new Map();

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  getConfig(): ServiceConfig {
    return this.config;
  }

  abstract getActions(): ActionConfig[];
  abstract getReactions(): ReactionConfig[];

  abstract authenticate(userId: string, authData: any): Promise<boolean>;
  abstract isAuthenticated(userId: string): Promise<boolean>;
  abstract refreshAuth(userId: string): Promise<boolean>;

  abstract initialize(): Promise<void>;
  abstract destroy(): Promise<void>;

  abstract startListening(userId: string, actionId: string, parameters: Record<string, any>): Promise<void>;
  abstract stopListening(userId: string, actionId: string): Promise<void>;

  abstract executeReaction(reactionId: string, userId: string, parameters: Record<string, any>, triggerData: Record<string, any>): Promise<boolean>;

  protected setAuthData(userId: string, authData: ServiceAuthData): void {
    this.authData.set(userId, authData);
  }

  protected getAuthData(userId: string): ServiceAuthData | undefined {
    return this.authData.get(userId);
  }

  protected removeAuthData(userId: string): void {
    this.authData.delete(userId);
  }

  protected emitActionTrigger(event: ActionTriggerEvent): void {
    console.log(`Action triggered: ${event.serviceId}.${event.actionId} for user ${event.userId}`);
  }
}
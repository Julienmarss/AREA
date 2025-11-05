
export interface TimerActionConfig {
  cronExpression?: string;
  timezone?: string;
  intervalMinutes?: number;
  time?: string;
  days?: string[];
}

export interface TimerReactionConfig {
  delayMinutes?: number;
  
  scheduledTime?: string;
}

export interface ScheduledJob {
  id: string;
  areaId: string;
  userId: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
}

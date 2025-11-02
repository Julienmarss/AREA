// Types pour le service Timer/Schedule

export interface TimerActionConfig {
  // Pour 'scheduled_time' action
  cronExpression?: string;  // Expression cron (ex: "0 9 * * *" = tous les jours à 9h)
  timezone?: string;        // Timezone (ex: "Europe/Paris")
  
  // Pour 'interval' action
  intervalMinutes?: number; // Intervalle en minutes
  
  // Pour 'specific_time' action
  time?: string;           // Heure spécifique (ex: "09:00")
  days?: string[];         // Jours de la semaine (ex: ["monday", "friday"])
}

export interface TimerReactionConfig {
  // Pour 'delay_action' reaction
  delayMinutes?: number;   // Délai en minutes avant d'exécuter l'action
  
  // Pour 'schedule_action' reaction
  scheduledTime?: string;  // Heure planifiée (ex: "14:30")
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

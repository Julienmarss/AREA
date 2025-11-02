import cron from 'node-cron';
import { AREA, InMemoryDB } from '../models/area.model';
import { ScheduledJob } from '../types/timer';

/**
 * Service de gestion des timers et planifications
 */
export class TimerService {
  private static jobs: Map<string, cron.ScheduledTask> = new Map();
  private static scheduledJobs: ScheduledJob[] = [];

  /**
   * Démarre le service Timer et initialise tous les jobs planifiés
   */
  static start(): void {
    console.log('⏰ Starting Timer Service...');
    
    // Charger tous les AREAs avec des actions timer et les planifier
    const timerAreas = InMemoryDB.getAreas().filter(
      area => area.enabled && area.action.service === 'timer'
    );

    for (const area of timerAreas) {
      this.scheduleArea(area);
    }

    console.log(`✅ Timer Service started with ${timerAreas.length} scheduled jobs`);
  }

  /**
   * Planifie une AREA avec une action timer
   */
  static scheduleArea(area: AREA): void {
    const { type, config } = area.action;

    let cronExpression: string | null = null;
    const timezone = config.timezone || 'Europe/Paris';

    switch (type) {
      case 'scheduled_time':
        // Expression cron personnalisée
        cronExpression = config.cronExpression;
        break;

      case 'every_hour':
        // Toutes les heures à la minute 0
        cronExpression = '0 * * * *';
        break;

      case 'every_day': {
        // Tous les jours à l'heure spécifiée (par défaut 9h)
        const time = config.time || '09:00';
        const [hour, minute] = time.split(':');
        cronExpression = `${minute} ${hour} * * *`;
        break;
      }

      case 'every_week': {
        // Tous les lundis à 9h par défaut
        const weekTime = config.time || '09:00';
        const [wHour, wMinute] = weekTime.split(':');
        const day = config.day || '1'; // 1 = lundi
        cronExpression = `${wMinute} ${wHour} * * ${day}`;
        break;
      }

      case 'interval': {
        // Intervalle en minutes
        const interval = config.intervalMinutes || 60;
        if (interval < 60) {
          cronExpression = `*/${interval} * * * *`;
        } else {
          const hours = Math.floor(interval / 60);
          cronExpression = `0 */${hours} * * *`;
        }
        break;
      }

      default:
        console.warn(`⚠️ Unknown timer action type: ${type}`);
        return;
    }

    if (!cronExpression || !cron.validate(cronExpression)) {
      console.error(`❌ Invalid cron expression for AREA ${area.id}: ${cronExpression}`);
      return;
    }

    // Supprimer l'ancien job s'il existe
    this.cancelAreaJob(area.id);

    // Créer le job
    const job = cron.schedule(
      cronExpression,
      async () => {
        console.log(`⏰ Timer triggered for AREA: ${area.name} (${area.id})`);
        
        // Importer dynamiquement pour éviter les dépendances circulaires
        const { AreaExecutor } = await import('./AreaExecutor');
        
        const triggerData = {
          timer: {
            triggeredAt: new Date(),
            cronExpression,
            areaId: area.id,
            areaName: area.name,
          }
        };

        // Exécuter la réaction de l'AREA
        await AreaExecutor.executeMatchingAreas('timer', type, triggerData)
          .catch(err => console.error(`Error executing timer AREA ${area.id}:`, err));
      },
      {
        scheduled: true,
        timezone,
      }
    );

    this.jobs.set(area.id, job);

    // Enregistrer le job planifié
    const scheduledJob: ScheduledJob = {
      id: `timer_${area.id}`,
      areaId: area.id,
      userId: area.userId,
      cronExpression,
      timezone,
      enabled: true,
      createdAt: new Date(),
    };
    this.scheduledJobs.push(scheduledJob);

    console.log(`✅ Timer scheduled: ${area.name} - ${cronExpression} (${timezone})`);
  }

  /**
   * Annule le job planifié d'une AREA
   */
  static cancelAreaJob(areaId: string): void {
    const job = this.jobs.get(areaId);
    if (job) {
      job.stop();
      this.jobs.delete(areaId);
      this.scheduledJobs = this.scheduledJobs.filter(j => j.areaId !== areaId);
      console.log(`🗑️ Timer cancelled for AREA: ${areaId}`);
    }
  }

  /**
   * Met à jour un job planifié
   */
  static updateAreaJob(area: AREA): void {
    this.cancelAreaJob(area.id);
    if (area.enabled && area.action.service === 'timer') {
      this.scheduleArea(area);
    }
  }

  /**
   * Récupère tous les jobs planifiés pour un utilisateur
   */
  static getUserJobs(userId: string): ScheduledJob[] {
    return this.scheduledJobs.filter(job => job.userId === userId);
  }

  /**
   * Récupère tous les jobs planifiés
   */
  static getAllJobs(): ScheduledJob[] {
    return [...this.scheduledJobs];
  }

  /**
   * Arrête tous les jobs
   */
  static stopAll(): void {
    for (const [areaId, job] of this.jobs.entries()) {
      job.stop();
      console.log(`⏸️ Stopped timer job: ${areaId}`);
    }
    this.jobs.clear();
    this.scheduledJobs = [];
    console.log('⏰ All timer jobs stopped');
  }

  /**
   * Valide une expression cron
   */
  static validateCronExpression(expression: string): boolean {
    return cron.validate(expression);
  }

  /**
   * Génère des exemples d'expressions cron
   */
  static getCronExamples(): { description: string; expression: string }[] {
    return [
      { description: 'Toutes les heures', expression: '0 * * * *' },
      { description: 'Tous les jours à 9h', expression: '0 9 * * *' },
      { description: 'Tous les lundis à 9h', expression: '0 9 * * 1' },
      { description: 'Du lundi au vendredi à 9h', expression: '0 9 * * 1-5' },
      { description: 'Toutes les 30 minutes', expression: '*/30 * * * *' },
      { description: 'Toutes les 5 minutes', expression: '*/5 * * * *' },
      { description: 'Premier jour du mois à 9h', expression: '0 9 1 * *' },
      { description: 'Tous les dimanches à 10h', expression: '0 10 * * 0' },
    ];
  }
}

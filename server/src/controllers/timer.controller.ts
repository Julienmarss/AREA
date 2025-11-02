import { Request, Response } from 'express';
import { TimerService } from '../services/TimerService';

/**
 * Contrôleur pour le service Timer
 */

/**
 * @swagger
 * /api/v1/services/timer/jobs:
 *   get:
 *     summary: Récupère tous les jobs planifiés de l'utilisateur
 *     tags: [Timer]
 *     responses:
 *       200:
 *         description: Liste des jobs planifiés
 */
export const getUserTimerJobs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      const allJobs = TimerService.getAllJobs();
      return res.json({
        success: true,
        jobs: [],
        count: allJobs.length,
      });
    }

    const jobs = TimerService.getUserJobs(userId);

    res.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error('Error fetching timer jobs:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des jobs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @swagger
 * /api/v1/services/timer/validate:
 *   post:
 *     summary: Valide une expression cron
 *     tags: [Timer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cronExpression:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation réussie
 */
export const validateCronExpression = async (req: Request, res: Response) => {
  try {
    const { cronExpression } = req.body;

    if (!cronExpression) {
      return res.status(400).json({
        error: 'cronExpression est requis',
      });
    }

    const isValid = TimerService.validateCronExpression(cronExpression);

    res.json({
      success: true,
      valid: isValid,
      expression: cronExpression,
    });
  } catch (error) {
    console.error('Error validating cron expression:', error);
    res.status(500).json({
      error: 'Erreur lors de la validation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @swagger
 * /api/v1/services/timer/examples:
 *   get:
 *     summary: Récupère des exemples d'expressions cron
 *     tags: [Timer]
 *     responses:
 *       200:
 *         description: Liste d'exemples
 */
export const getCronExamples = async (req: Request, res: Response) => {
  try {
    const examples = TimerService.getCronExamples();

    res.json({
      success: true,
      examples,
    });
  } catch (error) {
    console.error('Error fetching cron examples:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des exemples',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @swagger
 * /api/v1/services/timer/info:
 *   get:
 *     summary: Récupère les informations du service Timer
 *     tags: [Timer]
 *     responses:
 *       200:
 *         description: Informations du service
 */
export const getTimerInfo = async (req: Request, res: Response) => {
  try {
    const allJobs = TimerService.getAllJobs();

    res.json({
      success: true,
      service: 'timer',
      status: 'active',
      totalJobs: allJobs.length,
      description: 'Service de planification et minuteurs pour déclencher des actions automatiquement',
      availableActions: [
        {
          type: 'every_hour',
          description: 'Déclenche toutes les heures',
          config: {},
        },
        {
          type: 'every_day',
          description: 'Déclenche tous les jours à une heure spécifique',
          config: { time: '09:00' },
        },
        {
          type: 'every_week',
          description: 'Déclenche toutes les semaines un jour spécifique',
          config: { time: '09:00', day: '1' },
        },
        {
          type: 'interval',
          description: 'Déclenche à intervalles réguliers',
          config: { intervalMinutes: 60 },
        },
        {
          type: 'scheduled_time',
          description: 'Déclenche selon une expression cron personnalisée',
          config: { cronExpression: '0 9 * * *', timezone: 'Europe/Paris' },
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching timer info:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des informations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

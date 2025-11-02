import { Router } from 'express';
import {
  getUserTimerJobs,
  validateCronExpression,
  getCronExamples,
  getTimerInfo,
} from '../controllers/timer.controller';

const router = Router();

/**
 * Routes pour le service Timer
 */

// Informations sur le service
router.get('/info', getTimerInfo);

// Récupérer les jobs planifiés de l'utilisateur
router.get('/jobs', getUserTimerJobs);

// Valider une expression cron
router.post('/validate', validateCronExpression);

// Récupérer des exemples d'expressions cron
router.get('/examples', getCronExamples);

export default router;

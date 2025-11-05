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

router.get('/info', getTimerInfo);

router.get('/jobs', getUserTimerJobs);

router.post('/validate', validateCronExpression);

router.get('/examples', getCronExamples);

export default router;

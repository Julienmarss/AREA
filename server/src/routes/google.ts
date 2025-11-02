import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  getRecentEmails,
  sendEmail,
  getGoogleStatus,
  disconnectGoogle,
} from '../controllers/google.controller';

const router = Router();

/**
 * @swagger
 * /services/google/oauth/authorize:
 *   get:
 *     summary: Initiate Google OAuth flow
 *     tags: [Google]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OAuth URL generated
 */
router.get('/oauth/authorize', initiateGoogleAuth);

/**
 * @swagger
 * /services/google/oauth/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Google]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Bad request
 */
router.get('/oauth/callback', handleGoogleCallback);

/**
 * @swagger
 * /services/google/oauth/status:
 *   get:
 *     summary: Check Google authentication status
 *     tags: [Google]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Authentication status
 */
router.get('/oauth/status', getGoogleStatus);

/**
 * @swagger
 * /services/google/oauth/disconnect:
 *   delete:
 *     summary: Disconnect Google account
 *     tags: [Google]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disconnected successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/oauth/disconnect', authenticate, disconnectGoogle);

/**
 * @swagger
 * /services/google/emails:
 *   get:
 *     summary: Get recent emails
 *     tags: [Google]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of emails
 *       401:
 *         description: Unauthorized
 */
router.get('/emails', authenticate, getRecentEmails);

/**
 * @swagger
 * /services/google/emails/send:
 *   post:
 *     summary: Send an email
 *     tags: [Google]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - body
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/emails/send', authenticate, sendEmail);

export default router;

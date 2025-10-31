import { Router } from 'express';
import { NotionController } from '../controllers/notion.controller';

const router = Router();

/**
 * @openapi
 * /auth/notion:
 *   get:
 *     summary: Initier l'authentification OAuth2 Notion
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: URL d'authentification Notion
 */
router.get('/auth/notion', NotionController.initiateAuth);

/**
 * @openapi
 * /auth/notion/callback:
 *   get:
 *     summary: Callback OAuth2 Notion
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       302:
 *         description: Redirection vers le front
 */
router.get('/auth/notion/callback', NotionController.callback);

/**
 * @openapi
 * /notion/databases:
 *   get:
 *     summary: Récupérer les bases de données accessibles
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Liste des bases de données Notion
 */
router.get('/notion/databases', NotionController.getDatabases);

/**
 * @openapi
 * /notion/pages:
 *   get:
 *     summary: Récupérer les pages accessibles
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Liste des pages Notion
 */
router.get('/notion/pages', NotionController.getPages);

/**
 * @openapi
 * /notion/status:
 *   get:
 *     summary: Vérifie si l'utilisateur est connecté à Notion
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Status de connexion
 */
router.get('/notion/status', NotionController.checkStatus);

/**
 * @openapi
 * /notion/disconnect:
 *   post:
 *     summary: Déconnecter Notion
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Succès de la déconnexion
 */
router.post('/notion/disconnect', NotionController.disconnect);

export default router;

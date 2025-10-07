import { Router } from 'express';
import { AreasController } from '../controllers/areas.controller';

const router = Router();

/**
 * @openapi
 * /areas:
 *   get:
 *     summary: Récupérer toutes les AREAs d'un utilisateur
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Liste des AREAs
 */
router.get('/areas', AreasController.getAreas);

/**
 * @openapi
 * /areas/{id}:
 *   get:
 *     summary: Récupérer une AREA spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Une AREA
 *       404:
 *         description: AREA non trouvée
 */
router.get('/areas/:id', AreasController.getArea);

/**
 * @openapi
 * /areas:
 *   post:
 *     summary: Créer une nouvelle AREA
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - action
 *               - reaction
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               action:
 *                 type: object
 *               reaction:
 *                 type: object
 *               enabled:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: AREA créée
 */
router.post('/areas', AreasController.createArea);

/**
 * @openapi
 * /areas/{id}:
 *   put:
 *     summary: Mettre à jour une AREA
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: AREA mise à jour
 *       404:
 *         description: AREA non trouvée
 */
router.put('/areas/:id', AreasController.updateArea);

/**
 * @openapi
 * /areas/{id}:
 *   delete:
 *     summary: Supprimer une AREA
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Succès
 *       404:
 *         description: AREA non trouvée
 */
router.delete('/areas/:id', AreasController.deleteArea);

/**
 * @openapi
 * /areas/{id}/toggle:
 *   post:
 *     summary: Activer ou désactiver une AREA
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AREA togglée
 *       404:
 *         description: AREA non trouvée
 */
router.post('/areas/:id/toggle', AreasController.toggleArea);

/**
 * @openapi
 * /areas/{id}/test:
 *   post:
 *     summary: Tester manuellement une AREA
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AREA testée
 *       404:
 *         description: AREA non trouvée
 */
router.post('/areas/:id/test', AreasController.testArea);

export default router;

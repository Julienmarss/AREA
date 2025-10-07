import { Request, Response } from 'express';
import { InMemoryDB } from '../models/area.model';
import { HooksService } from '../services/hooks.service';

export class AreasController {
  
  /**
   * @openapi
   * /api/v1/areas:
   *   get:
   *     summary: Récupérer toutes les AREAs d'un utilisateur
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *         description: Identifiant utilisateur
   *     responses:
   *       200:
   *         description: Liste des AREAs
   */
  static getAreas(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    const areas = InMemoryDB.getAreas(userId);
    
    res.json({ areas });
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}:
   *   get:
   *     summary: Récupérer une AREA spécifique
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de l'AREA
   *     responses:
   *       200:
   *         description: AREA trouvée
   *       404:
   *         description: AREA non trouvée
   */
  static getArea(req: Request, res: Response) {
    const { id } = req.params;
    const area = InMemoryDB.getAreaById(id);
    
    if (!area) {
      return res.status(404).json({ error: 'AREA not found' });
    }
    
    res.json({ area });
  }
  
  /**
   * @openapi
   * /api/v1/areas:
   *   post:
   *     summary: Créer une nouvelle AREA
   *     requestBody:
   *       required: true
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
   *       400:
   *         description: Champs requis manquants
   */
  static createArea(req: Request, res: Response) {
    const { userId, name, action, reaction, enabled } = req.body;
    
    if (!userId || !name || !action || !reaction) {
      return res.status(400).json({
        error: 'Missing required fields: userId, name, action, reaction',
      });
    }
    
    if (!action.service || !action.type) {
      return res.status(400).json({ error: 'Action must have service and type' });
    }
    
    if (!reaction.service || !reaction.type) {
      return res.status(400).json({ error: 'Reaction must have service and type' });
    }
    
    try {
      const area = InMemoryDB.createArea({
        userId: userId || 'demo_user',
        name,
        action,
        reaction,
        enabled: enabled !== false,
      });
      
      console.log(`AREA créée: ${area.id} - ${area.name}`);
      res.status(201).json({ area });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}:
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
  static updateArea(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    
    const area = InMemoryDB.updateArea(id, updates);
    
    if (!area) {
      return res.status(404).json({ error: 'AREA not found' });
    }
    
    console.log(`AREA mise à jour: ${area.id}`);
    res.json({ area });
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}:
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
   *         description: AREA supprimée
   *       404:
   *         description: AREA non trouvée
   */
  static deleteArea(req: Request, res: Response) {
    const { id } = req.params;
    const deleted = InMemoryDB.deleteArea(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'AREA not found' });
    }
    
    console.log(`AREA supprimée: ${id}`);
    res.json({ success: true });
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}/toggle:
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
   *         description: AREA activée/désactivée
   *       404:
   *         description: AREA non trouvée
   */
  static toggleArea(req: Request, res: Response) {
    const { id } = req.params;
    const area = InMemoryDB.getAreaById(id);
    
    if (!area) {
      return res.status(404).json({ error: 'AREA not found' });
    }
    
    const updated = InMemoryDB.updateArea(id, { enabled: !area.enabled });
    
    console.log(`AREA ${updated?.enabled ? 'activée' : 'désactivée'}: ${id}`);
    res.json({ area: updated });
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}/test:
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
   *         description: AREA testée avec succès
   *       404:
   *         description: AREA non trouvée
   */
  static async testArea(req: Request, res: Response) {
    const { id } = req.params;
    const area = InMemoryDB.getAreaById(id);
    
    if (!area) {
      return res.status(404).json({ error: 'AREA not found' });
    }
    
    try {
      console.log(`Test manuel de l'AREA ${id}...`);
      await HooksService.forceCheckArea(id);
      res.json({ success: true, message: 'AREA tested' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

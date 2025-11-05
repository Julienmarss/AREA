import { Request, Response } from 'express';
import { InMemoryDB } from '../models/area.model';
import { HooksService } from '../services/hooks.service';
import { TimerService } from '../services/TimerService';
import { GitHubService } from '../services/GitHubService';
import { userStorage } from '../storage/UserStorage';

export class AreasController {
  
  /**
   * @openapi
   * /api/v1/areas:
   *   get:
   *     summary: Récupérer toutes les AREAs d'un utilisateur
   */
  static async getAreas(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'demo_user';
      const areas = await InMemoryDB.getAreas(userId);
      
      console.log('Getting AREAs for user:', userId, '- Found:', areas.length);
      
      res.json(areas);
    } catch (error: any) {
      console.error('Error getting areas:', error);
      res.status(500).json([]);
    }
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}:
   *   get:
   *     summary: Récupérer une AREA spécifique
   */
  static async getArea(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const area = await InMemoryDB.getAreaById(id);
      
      if (!area) {
        return res.status(404).json({ error: 'AREA not found' });
      }
      
      res.json(area);
    } catch (error: any) {
      console.error('Error getting area:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * @openapi
   * /api/v1/areas:
   *   post:
   *     summary: Créer une nouvelle AREA
   */
  static async createArea(req: Request, res: Response) {
    try {
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
      
      const area = await InMemoryDB.createArea({
        userId: userId || 'demo_user',
        name,
        action,
        reaction,
        enabled: enabled !== false,
      });

      if (area.action.service === 'timer' && area.enabled) {
        TimerService.scheduleArea(area);
      }
      
      console.log(`AREA créée: ${area.id} - ${area.name}`);
      res.status(201).json(area);
    } catch (error: any) {
      console.error('Error creating area:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}:
   *   put:
   *     summary: Mettre à jour une AREA
   */
  static async updateArea(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const area = await InMemoryDB.updateArea(id, updates);
      
      if (!area) {
        return res.status(404).json({ error: 'AREA not found' });
      }

      if (area.action.service === 'timer') {
        TimerService.updateAreaJob(area);
      }
      
      console.log(`AREA mise à jour: ${area.id}`);
      res.json(area);
    } catch (error: any) {
      console.error('Error updating area:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}:
   *   delete:
   *     summary: Supprimer une AREA
   */
  static async deleteArea(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const area = await InMemoryDB.getAreaById(id);
      
      if (!area) {
        return res.status(404).json({ error: 'AREA not found' });
      }

      if (area.action.service === 'timer') {
        TimerService.cancelAreaJob(id);
      }
      
      await InMemoryDB.deleteArea(id);
      
      console.log(`AREA supprimée: ${id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting area:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}/toggle:
   *   post:
   *     summary: Activer ou désactiver une AREA
   */
  static async toggleArea(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const area = await InMemoryDB.getAreaById(id);
      
      if (!area) {
        return res.status(404).json({ error: 'AREA not found' });
      }
      
      const updated = await InMemoryDB.updateArea(id, { enabled: !area.enabled });

      if (updated && area.action.service === 'timer') {
        TimerService.updateAreaJob(updated);
      }
      
      console.log(`AREA ${updated?.enabled ? 'activée' : 'désactivée'}: ${id}`);
      res.json(updated);
    } catch (error: any) {
      console.error('Error toggling area:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * @openapi
   * /api/v1/areas/{id}/test:
   *   post:
   *     summary: Tester manuellement une AREA
   */
  static async testArea(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const area = await InMemoryDB.getAreaById(id);
      
      if (!area) {
        return res.status(404).json({ error: 'AREA not found' });
      }
      
      console.log(`Test manuel de l'AREA ${id}...`);
      await HooksService.forceCheckArea(id);
      res.json({ success: true, message: 'AREA tested' });
    } catch (error: any) {
      console.error('Error testing area:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
import { Request, Response } from 'express';
import { getNotionAuthUrl, NOTION_TOKEN_URL } from '../config/notion';
import { InMemoryDB } from '../models/area.model';
import { NotionAuthData } from '../types/notion';
import axios from 'axios';

export class NotionController {
  /**
   * @openapi
   * /api/v1/auth/notion:
   *   get:
   *     summary: Initier l'authentification OAuth2 Notion
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *         description: Identifiant utilisateur
   *     responses:
   *       200:
   *         description: URL d'authentification générée
   */
  static initiateAuth(req: Request, res: Response) {
    const state = Buffer.from(
      JSON.stringify({
        userId: req.query.userId || 'demo_user',
        timestamp: Date.now(),
      })
    ).toString('base64');

    const authUrl = getNotionAuthUrl(state);
    res.json({ authUrl });
  }

  /**
   * @openapi
   * /api/v1/auth/notion/callback:
   *   get:
   *     summary: Callback OAuth2 Notion
   *     parameters:
   *       - in: query
   *         name: code
   *         schema:
   *           type: string
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *     responses:
   *       302:
   *         description: Redirection vers le frontend
   */
  static async callback(req: Request, res: Response) {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/error?message=${error}`);
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    try {
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const userId = stateData.userId;

      console.log('  DEBUG - Notion OAuth callback');
      console.log('  CLIENT_ID:', process.env.NOTION_CLIENT_ID);
      console.log(
        '  CLIENT_SECRET:',
        process.env.NOTION_CLIENT_SECRET?.substring(0, 8) + '...'
      );
      console.log('  REDIRECT_URI:', process.env.NOTION_REDIRECT_URI);

      // Exchange authorization code for access token
      const auth = Buffer.from(
        `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
      ).toString('base64');

      const response = await axios.post<NotionAuthData>(
        NOTION_TOKEN_URL,
        {
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: process.env.NOTION_REDIRECT_URI,
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Store token
      InMemoryDB.saveToken({
        userId,
        service: 'notion',
        accessToken: response.data.access_token,
        refreshToken: undefined, // Notion tokens don't expire
        expiresAt: undefined,
        metadata: {
          bot_id: response.data.bot_id,
          workspace_id: response.data.workspace_id,
          workspace_name: response.data.workspace_name,
          workspace_icon: response.data.workspace_icon,
        },
      });

      console.log(`Token Notion sauvegardé pour user ${userId}`);
      console.log(`  Workspace: ${response.data.workspace_name}`);

      res.redirect(`${process.env.FRONTEND_URL}/services?connected=notion`);
    } catch (error: any) {
      console.error('Erreur callback Notion:', error.response?.data || error.message);
      if (error.response?.data) {
        console.error('   Détails:', JSON.stringify(error.response.data, null, 2));
      }
      res.redirect(`${process.env.FRONTEND_URL}/error?message=auth_failed`);
    }
  }

  /**
   * @openapi
   * /api/v1/notion/databases:
   *   get:
   *     summary: Récupérer les bases de données accessibles
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des bases de données
   */
  static async getDatabases(req: Request, res: Response) {
    const userId = (req.query.userId as string) || 'demo_user';

    try {
      const token = InMemoryDB.getToken(userId, 'notion');

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated with Notion' });
      }

      const response = await axios.post(
        'https://api.notion.com/v1/search',
        {
          filter: { property: 'object', value: 'database' },
          sort: { direction: 'descending', timestamp: 'last_edited_time' },
        },
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
        }
      );

      res.json({ databases: response.data.results });
    } catch (error: any) {
      console.error('Error fetching Notion databases:', error.response?.data || error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/v1/notion/pages:
   *   get:
   *     summary: Récupérer les pages accessibles
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des pages
   */
  static async getPages(req: Request, res: Response) {
    const userId = (req.query.userId as string) || 'demo_user';

    try {
      const token = InMemoryDB.getToken(userId, 'notion');

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated with Notion' });
      }

      const response = await axios.post(
        'https://api.notion.com/v1/search',
        {
          filter: { property: 'object', value: 'page' },
          sort: { direction: 'descending', timestamp: 'last_edited_time' },
        },
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
        }
      );

      res.json({ pages: response.data.results });
    } catch (error: any) {
      console.error('Error fetching Notion pages:', error.response?.data || error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/v1/notion/status:
   *   get:
   *     summary: Vérifier si l'utilisateur est connecté à Notion
   *     responses:
   *       200:
   *         description: Statut de connexion
   */
  static checkStatus(req: Request, res: Response) {
    const userId = (req.query.userId as string) || 'demo_user';
    const token = InMemoryDB.getToken(userId, 'notion');

    res.json({
      connected: !!token,
      workspace: token?.metadata?.workspace_name,
      workspaceIcon: token?.metadata?.workspace_icon,
    });
  }

  /**
   * @openapi
   * /api/v1/notion/disconnect:
   *   post:
   *     summary: Déconnecter Notion
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 example: demo_user
   *     responses:
   *       200:
   *         description: Déconnexion effectuée
   */
  static disconnect(req: Request, res: Response) {
    const userId = req.body.userId || 'demo_user';
    const deleted = InMemoryDB.deleteToken(userId, 'notion');

    res.json({ success: deleted });
  }
}

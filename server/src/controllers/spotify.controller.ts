import { Request, Response } from 'express';
import { getSpotifyAuthUrl } from '../config/spotify';
import { InMemoryDB } from '../models/area.model';
import { SpotifyService } from '../services/spotify.service';
import axios from 'axios';

export class SpotifyController {
  
  /**
   * @openapi
   * /api/v1/auth/spotify:
   *   get:
   *     summary: Initier l'authentification OAuth2 Spotify
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
    const state = Buffer.from(JSON.stringify({
      userId: req.query.userId || 'demo_user',
      timestamp: Date.now(),
    })).toString('base64');
    
    const authUrl = getSpotifyAuthUrl(state);
    res.json({ authUrl });
  }
  
  /**
   * @openapi
   * /api/v1/auth/spotify/callback:
   *   get:
   *     summary: Callback OAuth2 Spotify
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
      const stateData = JSON.parse(
        Buffer.from(state as string, 'base64').toString()
      );
      const userId = stateData.userId;
      
      console.log('  DEBUG - Credentials utilisés:');
      console.log('  CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID);
      console.log('  CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET?.substring(0, 8) + '...');
      console.log('  REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);
      
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('code', code as string);
      params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI!);
      
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        params,
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in);
      
      InMemoryDB.saveToken({
        userId,
        service: 'spotify',
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt,
      });
      
      console.log(`Token Spotify sauvegardé pour user ${userId}`);
      res.redirect(`${process.env.FRONTEND_URL}/services?connected=spotify`);
    } catch (error: any) {
      console.error('Erreur callback Spotify:', error.response?.data || error.message);
      if (error.response?.data) {
        console.error('   Détails:', JSON.stringify(error.response.data, null, 2));
      }
      res.redirect(`${process.env.FRONTEND_URL}/error?message=auth_failed`);
    }
  }
  
  /**
   * @openapi
   * /api/v1/spotify/playlists:
   *   get:
   *     summary: Récupérer les playlists de l'utilisateur
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des playlists utilisateur
   */
  static async getPlaylists(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    
    try {
      const playlists = await SpotifyService.getUserPlaylists(userId);
      res.json({ playlists });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * @openapi
   * /api/v1/spotify/search/artists:
   *   get:
   *     summary: Rechercher des artistes sur Spotify
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *           example: Daft Punk
   *     responses:
   *       200:
   *         description: Résultats de recherche
   */
  static async searchArtists(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }
    
    try {
      const artists = await SpotifyService.searchArtist(userId, query);
      res.json({ artists });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * @openapi
   * /api/v1/spotify/status:
   *   get:
   *     summary: Vérifier si l'utilisateur est connecté à Spotify
   *     responses:
   *       200:
   *         description: Statut de connexion
   */
  static checkStatus(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    const token = InMemoryDB.getToken(userId, 'spotify');
    
    res.json({
      connected: !!token,
      expiresAt: token?.expiresAt,
    });
  }
  
  /**
   * @openapi
   * /api/v1/spotify/disconnect:
   *   post:
   *     summary: Déconnecter Spotify
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
    const deleted = InMemoryDB.deleteToken(userId, 'spotify');
    
    res.json({ success: deleted });
  }
}

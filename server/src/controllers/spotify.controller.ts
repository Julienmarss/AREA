import { Request, Response } from 'express';
import { getSpotifyAuthUrl } from '../config/spotify';
import { InMemoryDB } from '../models/area.model';
import { SpotifyService } from '../services/spotify.service';
import { userStorage } from '../storage/UserStorage';
import axios from 'axios';

export class SpotifyController {
  
  static async actionNewTrackPlayed(req: Request, res: Response) {
    const userId = (req.query.userId as string) || 'demo_user';
    const lastTrackId = req.query.lastTrackId as string | undefined;
    try {
      const result = await SpotifyService.checkNewTrackPlayed(userId, lastTrackId);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  static async actionNewTrackSaved(req: Request, res: Response) {
    const userId = (req.query.userId as string) || 'demo_user';
    const lastSavedCount = req.query.lastSavedCount ? Number(req.query.lastSavedCount) : undefined;
    try {
      const result = await SpotifyService.checkNewTrackSaved(userId, lastSavedCount);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  static async actionPlaylistUpdated(req: Request, res: Response) {
    const userId = (req.query.userId as string) || 'demo_user';
    const playlistId = req.query.playlistId as string;
    const lastSnapshotId = req.query.lastSnapshotId as string | undefined;
    if (!playlistId) return res.status(400).json({ error: 'playlistId is required' });
    try {
      const result = await SpotifyService.checkPlaylistUpdated(userId, playlistId, lastSnapshotId);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  static async actionSpecificArtistPlayed(req: Request, res: Response) {
    const userId = (req.query.userId as string) || 'demo_user';
    const artistId = req.query.artistId as string;
    const lastCheckTime = req.query.lastCheckTime ? new Date(String(req.query.lastCheckTime)) : undefined;
    if (!artistId) return res.status(400).json({ error: 'artistId is required' });
    try {
      const result = await SpotifyService.checkSpecificArtistPlayed(userId, artistId, lastCheckTime);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  static async actionNewArtistFollowed(req: Request, res: Response) {
    const userId = (req.query.userId as string) || 'demo_user';
    const lastFollowedArtistIds = req.query.lastFollowedArtistIds
      ? String(req.query.lastFollowedArtistIds).split(',').map(s => s.trim()).filter(Boolean)
      : undefined;
    try {
      const result = await SpotifyService.checkNewArtistFollowed(userId, lastFollowedArtistIds);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  static async reactAddTrackToPlaylist(req: Request, res: Response) {
    const userId = (req.body.userId as string) || 'demo_user';
    const trackUri = req.body.trackUri as string;
    const playlistId = req.body.playlistId as string;
    if (!trackUri || !playlistId) return res.status(400).json({ error: 'trackUri and playlistId are required' });
    const result = await SpotifyService.addTrackToPlaylist(userId, trackUri, playlistId);
    return res.status(result.success ? 200 : 400).json(result);
  }

  static async reactCreatePlaylist(req: Request, res: Response) {
    const userId = (req.body.userId as string) || 'demo_user';
    const { name, description, isPublic } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await SpotifyService.createPlaylist(userId, name, description, Boolean(isPublic));
    return res.status(result.success ? 200 : 400).json(result);
  }

  static async reactFollowArtist(req: Request, res: Response) {
    const userId = (req.body.userId as string) || 'demo_user';
    const artistId = req.body.artistId as string;
    if (!artistId) return res.status(400).json({ error: 'artistId is required' });
    const result = await SpotifyService.followArtist(userId, artistId);
    return res.status(result.success ? 200 : 400).json(result);
  }

  static async reactCreatePlaylistWithArtistTopTracks(req: Request, res: Response) {
    const userId = (req.body.userId as string) || 'demo_user';
    const artistId = req.body.artistId as string;
    const playlistName = (req.body.playlistName as string) || undefined;
    const playlistDescription = (req.body.playlistDescription as string) || undefined;
    const isPublic = Boolean(req.body.isPublic);

    if (!artistId) return res.status(400).json({ error: 'artistId is required' });

    const topTracks = await SpotifyService.getArtistTopTracks(userId, artistId, 5);
    if (topTracks.length === 0) return res.status(400).json({ success: false, error: 'No top tracks found' });

    const name = playlistName || `Top 5 - ${artistId}`;
    const desc = playlistDescription || `Top 5 tracks from ${artistId}`;

    const playlist = await SpotifyService.createPlaylist(userId, name, desc, isPublic);
    if (!playlist.success || !playlist.playlistId) return res.status(400).json(playlist);

    const uris = topTracks.map(t => t.uri).join(',');
    const add = await SpotifyService.addTrackToPlaylist(userId, uris, playlist.playlistId);
    if (!add.success) return res.status(400).json(add);

    return res.json({ success: true, playlistId: playlist.playlistId, tracks: topTracks.length });
  }
  
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

      try {
        const me = await axios.get('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${response.data.access_token}`,
          },
        });
        const displayName = me.data.display_name || me.data.id;
        userStorage.updateServices(userId, 'spotify', {
          username: displayName,
        });
      } catch (e) {
        console.warn('Failed to fetch Spotify profile:', (e as any).message);
        userStorage.updateServices(userId, 'spotify', {});
      }
      
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
  static async checkStatus(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    const token = await InMemoryDB.getToken(userId, 'spotify');
    
    res.json({
      connected: !!token,
      expiresAt: token?.expiresAt,
    });
  }

  static checkStatusOAuth(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    const token = InMemoryDB.getToken(userId, 'spotify');
    const user = userStorage.findById(userId);
    const spotifyData = (user as any)?.services?.spotify;

    res.json({
      authenticated: !!token && spotifyData?.connected !== false,
      service: 'spotify',
      username: spotifyData?.username,
      connectedAt: spotifyData?.connectedAt,
      connected: !!token,
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

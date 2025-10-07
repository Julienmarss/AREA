import { Router } from 'express';
import { SpotifyController } from '../controllers/spotify.controller';

const router = Router();

/**
 * @openapi
 * /auth/spotify:
 *   get:
 *     summary: Initier l'authentification OAuth2 Spotify
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: URL d'authentification Spotify
 */
router.get('/auth/spotify', SpotifyController.initiateAuth);

/**
 * @openapi
 * /auth/spotify/callback:
 *   get:
 *     summary: Callback OAuth2 Spotify
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
router.get('/auth/spotify/callback', SpotifyController.callback);

/**
 * @openapi
 * /spotify/playlists:
 *   get:
 *     summary: Récupérer les playlists de l'utilisateur
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Liste des playlists
 */
router.get('/spotify/playlists', SpotifyController.getPlaylists);

/**
 * @openapi
 * /spotify/search/artists:
 *   get:
 *     summary: Rechercher des artistes
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Nom de l'artiste
 *     responses:
 *       200:
 *         description: Liste des artistes trouvés
 */
router.get('/spotify/search/artists', SpotifyController.searchArtists);

/**
 * @openapi
 * /spotify/status:
 *   get:
 *     summary: Vérifie si l'utilisateur est connecté à Spotify
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
router.get('/spotify/status', SpotifyController.checkStatus);

/**
 * @openapi
 * /spotify/disconnect:
 *   post:
 *     summary: Déconnecter Spotify
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
router.post('/spotify/disconnect', SpotifyController.disconnect);

export default router;

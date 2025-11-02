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

// Mirror GitHub/Discord style endpoints under /services/spotify/oauth
router.get('/services/spotify/oauth/authorize', SpotifyController.initiateAuth);

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

router.get('/services/spotify/oauth/callback', SpotifyController.callback);

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

router.get('/services/spotify/oauth/status', SpotifyController.checkStatusOAuth);

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

router.post('/services/spotify/oauth/disconnect', SpotifyController.disconnect);

/**
 * Debug/test endpoints for Spotify Actions
 */
router.get('/spotify/actions/new-track-played', SpotifyController.actionNewTrackPlayed);
router.get('/spotify/actions/new-track-saved', SpotifyController.actionNewTrackSaved);
router.get('/spotify/actions/playlist-updated', SpotifyController.actionPlaylistUpdated);
router.get('/spotify/actions/specific-artist-played', SpotifyController.actionSpecificArtistPlayed);
router.get('/spotify/actions/new-artist-followed', SpotifyController.actionNewArtistFollowed);

/**
 * Direct execution endpoints for Spotify Reactions
 */
router.post('/spotify/reactions/add-track-to-playlist', SpotifyController.reactAddTrackToPlaylist);
router.post('/spotify/reactions/create-playlist', SpotifyController.reactCreatePlaylist);
router.post('/spotify/reactions/follow-artist', SpotifyController.reactFollowArtist);
router.post('/spotify/reactions/create-playlist-with-artist-top-tracks', SpotifyController.reactCreatePlaylistWithArtistTopTracks);

export default router;

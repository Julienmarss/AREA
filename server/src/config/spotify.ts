import SpotifyWebApi from 'spotify-web-api-node';

/**
 * Vérifie que les variables d'environnement Spotify sont définies
 */
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  console.error('SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET manquant dans .env');
}

/**
 * Instance SpotifyWebApi pour interagir avec l'API Spotify
 */
export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

/**
 * Scopes nécessaires pour les actions et réactions Spotify
 * @see https://developer.spotify.com/documentation/general/guides/scopes/
 */
export const SPOTIFY_SCOPES = [
  'user-read-recently-played',
  'user-library-read',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-follow-modify',
  'user-follow-read',
];

/**
 * Génère l'URL d'autorisation OAuth2 Spotify
 * @param state - chaîne encodée pour suivre l'utilisateur et le timestamp
 * @returns URL complète pour redirection vers Spotify
 */
export const getSpotifyAuthUrl = (state: string) => {
  const baseUrl = 'https://accounts.spotify.com/authorize';
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || '',
    state: state,
    scope: SPOTIFY_SCOPES.join(' '),
    show_dialog: 'true', // Force l'affichage du dialogue d'autorisation
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.log('URL générée:', url); // Debug
  return url;
};

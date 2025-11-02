import SpotifyWebApi from 'spotify-web-api-node';
import { spotifyApi } from '../config/spotify';
import { InMemoryDB } from '../models/area.model';

export class SpotifyService {
  
  // ==================== AUTHENTIFICATION ====================
  
  /**
   * Créer une instance Spotify API avec le token de l'utilisateur
   */
  private static async getUserSpotifyApi(userId: string): Promise<SpotifyWebApi | null> {
    const token = InMemoryDB.getToken(userId, 'spotify');
    if (!token) return null;

    // Vérifier que les champs Spotify requis sont présents
    if (!token.refreshToken || !token.expiresAt) {
      console.error('Spotify token missing required fields');
      return null;
    }

    // Vérifier si le token est expiré
    if (new Date() >= token.expiresAt) {
      const refreshed = await this.refreshToken(userId, token.refreshToken);
      if (!refreshed) return null;
    }

    const userApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });

    const freshToken = InMemoryDB.getToken(userId, 'spotify');
    if (!freshToken || !freshToken.refreshToken) return null;

    userApi.setAccessToken(freshToken.accessToken);
    userApi.setRefreshToken(freshToken.refreshToken);

    return userApi;
  }
  
  /**
   * Rafraîchir le token d'accès
   */
  private static async refreshToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      spotifyApi.setRefreshToken(refreshToken);
      const data = await spotifyApi.refreshAccessToken();
      
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.body.expires_in);
      
      InMemoryDB.saveToken({
        userId,
        service: 'spotify',
        accessToken: data.body.access_token,
        refreshToken: refreshToken,
        expiresAt,
      });
      
      return true;
    } catch (error) {
      console.error('Erreur refresh token Spotify:', error);
      return false;
    }
  }
  
  // ==================== ACTIONS (Triggers) ====================
  
  /**
   * @openapi
   * /spotify/new-track-played:
   *   get:
   *     summary: Vérifie si un nouvel extrait a été joué
   *     parameters:
   *       - in: query
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: lastTrackId
   *         required: false
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Indique si un nouveau morceau a été joué
   */
  static async checkNewTrackPlayed(userId: string, lastTrackId?: string): Promise<{
    triggered: boolean;
    data?: any;
  }> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return { triggered: false };
    
    try {
      const recent = await api.getMyRecentlyPlayedTracks({ limit: 1 });
      if (recent.body.items.length === 0) return { triggered: false };
      
      const latestTrack = recent.body.items[0].track;
      
      if (!lastTrackId || latestTrack.id !== lastTrackId) {
        return {
          triggered: true,
          data: {
            trackId: latestTrack.id,
            trackName: latestTrack.name,
            artistName: latestTrack.artists[0].name,
            artistId: latestTrack.artists[0].id,
            artists: latestTrack.artists.map(a => ({ id: a.id, name: a.name })),
            albumName: latestTrack.album.name,
            uri: latestTrack.uri,
          },
        };
      }
      return { triggered: false };
    } catch (error) {
      console.error('Erreur checkNewTrackPlayed:', error);
      return { triggered: false };
    }
  }
  
  /**
   * @openapi
   * /spotify/new-track-saved:
   *   get:
   *     summary: Vérifie si un nouveau track a été sauvegardé
   */
  static async checkNewTrackSaved(userId: string, lastSavedCount?: number): Promise<{
    triggered: boolean;
    data?: any;
  }> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return { triggered: false };
    
    try {
      const saved = await api.getMySavedTracks({ limit: 50 });
      const currentCount = saved.body.total;
      
      if (lastSavedCount !== undefined && currentCount > lastSavedCount) {
        const newTrack = saved.body.items[0].track;
        return {
          triggered: true,
          data: {
            trackId: newTrack.id,
            trackName: newTrack.name,
            artistName: newTrack.artists[0].name,
            artistId: newTrack.artists[0].id,
            artists: newTrack.artists.map(a => ({ id: a.id, name: a.name })),
            savedCount: currentCount,
            uri: newTrack.uri,
          },
        };
      }
      
      return { triggered: false, data: { savedCount: currentCount } };
    } catch (error) {
      console.error('Erreur checkNewTrackSaved:', error);
      return { triggered: false };
    }
  }
  
  /**
   * @openapi
   * /spotify/playlist-updated:
   *   get:
   *     summary: Vérifie si une playlist a été modifiée
   */
  static async checkPlaylistUpdated(
    userId: string,
    playlistId: string,
    lastSnapshotId?: string
  ): Promise<{ triggered: boolean; data?: any }> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return { triggered: false };
    
    try {
      const playlist = await api.getPlaylist(playlistId);
      const currentSnapshotId = playlist.body.snapshot_id;
      
      if (!lastSnapshotId || currentSnapshotId !== lastSnapshotId) {
        return {
          triggered: true,
          data: {
            playlistId: playlist.body.id,
            playlistName: playlist.body.name,
            snapshotId: currentSnapshotId,
            trackCount: playlist.body.tracks.total,
          },
        };
      }
      return { triggered: false };
    } catch (error) {
      console.error('Erreur checkPlaylistUpdated:', error);
      return { triggered: false };
    }
  }
  
  /**
   * @openapi
   * /spotify/specific-artist-played:
   *   get:
   *     summary: Vérifie si un artiste spécifique a été joué
   */
  static async checkSpecificArtistPlayed(
    userId: string,
    artistId: string,
    lastCheckTime?: Date
  ): Promise<{ triggered: boolean; data?: any }> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return { triggered: false };
    
    try {
      const recent = await api.getMyRecentlyPlayedTracks({ limit: 50 });
      const newTracks = lastCheckTime
        ? recent.body.items.filter(item => new Date(item.played_at) > lastCheckTime)
        : recent.body.items;
      
      const artistTrack = newTracks.find(item =>
        item.track.artists.some(artist => artist.id === artistId)
      );
      
      if (artistTrack) {
        return {
          triggered: true,
          data: {
            trackId: artistTrack.track.id,
            trackName: artistTrack.track.name,
            artistName: artistTrack.track.artists[0].name,
            artistId: artistTrack.track.artists[0].id,
            playedAt: artistTrack.played_at,
            uri: artistTrack.track.uri,
          },
        };
      }
      return { triggered: false };
    } catch (error) {
      console.error('Erreur checkSpecificArtistPlayed:', error);
      return { triggered: false };
    }
  }

  /**
   * @openapi
   * /spotify/new-artist-followed:
   *   get:
   *     summary: Vérifie si un nouvel artiste a été suivi
   */
  static async checkNewArtistFollowed(
    userId: string,
    lastFollowedArtistIds?: string[]
  ): Promise<{ triggered: boolean; data?: any }> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return { triggered: false };
    
    try {
      const followed = await api.getFollowedArtists({ limit: 50 });
      const currentArtistIds = followed.body.artists.items.map(a => a.id);
      
      if (!lastFollowedArtistIds || lastFollowedArtistIds.length === 0) {
        return { triggered: false, data: { followedArtistIds: currentArtistIds } };
      }
      
      const newArtists = followed.body.artists.items.filter(
        artist => !lastFollowedArtistIds.includes(artist.id)
      );
      
      if (newArtists.length > 0) {
        const newArtist = newArtists[0];
        return {
          triggered: true,
          data: {
            artistId: newArtist.id,
            artistName: newArtist.name,
            followedArtistIds: currentArtistIds,
          },
        };
      }
      return { triggered: false, data: { followedArtistIds: currentArtistIds } };
    } catch (error) {
      console.error('Erreur checkNewArtistFollowed:', error);
      return { triggered: false };
    }
  }
  
  // ==================== REACTIONS ====================
  
  /**
   * @openapi
   * /spotify/add-track-to-playlist:
   *   post:
   *     summary: Ajoute un morceau à une playlist
   */
  static async addTrackToPlaylist(
    userId: string,
    trackUri: string,
    playlistId: string
  ): Promise<{ success: boolean; error?: string }> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return { success: false, error: 'User not authenticated' };

    const normalizePlaylistId = (value: string): string => {
      let v = value.trim();
      // Strip URL query
      if (v.includes('?')) v = v.split('?')[0];
      // Handle full URLs
      const urlMatch = v.match(/playlist\/([a-zA-Z0-9]+)/);
      if (urlMatch) return urlMatch[1];
      // Handle spotify:playlist:ID
      if (v.startsWith('spotify:playlist:')) return v.split(':').pop() as string;
      // If it's a full URI like spotify:playlist:ID?si=...
      if (v.includes(':')) {
        const parts = v.split(':');
        return parts[parts.length - 1];
      }
      return v;
    };

    try {
      const uris = trackUri.includes(',') ? trackUri.split(',') : [trackUri];
      const normalizedId = normalizePlaylistId(playlistId);
      await api.addTracksToPlaylist(normalizedId, uris);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur addTrackToPlaylist:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * @openapi
   * /spotify/create-playlist:
   *   post:
   *     summary: Crée une nouvelle playlist
   */
  static async createPlaylist(
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<{ success: boolean; playlistId?: string; error?: string }> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return { success: false, error: 'User not authenticated' };
    
    try {
      const me = await api.getMe();
      const playlist = await api.createPlaylist(name, {
        description: description || '',
        public: isPublic,
      });
      
      return { success: true, playlistId: playlist.body.id };
    } catch (error: any) {
      console.error('Erreur createPlaylist:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * @openapi
   * /spotify/follow-artist:
   *   post:
   *     summary: Suit un artiste
   */
  static async followArtist(
    userId: string,
    artistId: string
  ): Promise<{ success: boolean; error?: string }> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return { success: false, error: 'User not authenticated' };
    
    try {
      await api.followArtists([artistId]);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur followArtist:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== HELPERS ====================
  
  /**
   * @openapi
   * /spotify/search-artist:
   *   get:
   *     summary: Recherche un artiste par nom
   */
  static async searchArtist(userId: string, artistName: string): Promise<any[]> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return [];
    
    try {
      const result = await api.searchArtists(artistName, { limit: 10 });
      return result.body.artists?.items || [];
    } catch (error) {
      console.error('Erreur searchArtist:', error);
      return [];
    }
  }
  
  /**
   * @openapi
   * /spotify/user-playlists:
   *   get:
   *     summary: Récupère les playlists de l'utilisateur
   */
  static async getUserPlaylists(userId: string): Promise<any[]> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return [];
    
    try {
      const result = await api.getUserPlaylists({ limit: 50 });
      return result.body.items || [];
    } catch (error) {
      console.error('Erreur getUserPlaylists:', error);
      return [];
    }
  }

  /**
   * @openapi
   * /spotify/artist-top-tracks:
   *   get:
   *     summary: Récupère les top morceaux d'un artiste
   */
  static async getArtistTopTracks(
    userId: string,
    artistId: string,
    limit: number = 5
  ): Promise<any[]> {
    const api = await this.getUserSpotifyApi(userId);
    if (!api) return [];

    try {
      const result = await api.getArtistTopTracks(artistId, 'FR');
      return result.body.tracks.slice(0, limit);
    } catch (error) {
      console.error('Erreur getArtistTopTracks:', error);
      return [];
    }
  }
}

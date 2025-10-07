import cron from 'node-cron';
import { AREA, InMemoryDB } from '../models/area.model';
import { SpotifyService } from './spotify.service';

/**
 * Service de gestion des hooks
 * Vérifie périodiquement les Actions et déclenche les REActions
 */
export class HooksService {
  private static isRunning = false;
  private static cronJob: cron.ScheduledTask | null = null;
  
  /**
   * @swagger
   * tags:
   *   name: Hooks
   *   description: Gestion des hooks et déclenchement des AREAs
   */

  /**
   * @swagger
   * /hooks/start:
   *   post:
   *     summary: Démarrer le système de hooks
   *     description: Lance une tâche cron qui vérifie toutes les AREAs toutes les 60 secondes.
   *     tags: [Hooks]
   *     responses:
   *       200:
   *         description: Le système de hooks a démarré
   */
  static start() {
    if (this.isRunning) {
      console.log('Hooks déjà démarrés');
      return;
    }
    
    console.log('Démarrage du système de hooks...');
    
    // Cron job: toutes les 60 secondes
    this.cronJob = cron.schedule('*/60 * * * * *', async () => {
      await this.checkAllAreas();
    });
    
    this.isRunning = true;
    console.log('Hooks démarrés (vérification toutes les 60s)');
  }
  
  /**
   * @swagger
   * /hooks/stop:
   *   post:
   *     summary: Arrêter le système de hooks
   *     description: Stoppe la tâche cron qui vérifie les AREAs.
   *     tags: [Hooks]
   *     responses:
   *       200:
   *         description: Le système de hooks a été arrêté
   */
  static stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('Hooks arrêtés');
  }
  
  /**
   * Vérifier toutes les AREAs actives
   */
  private static async checkAllAreas() {
    const areas = InMemoryDB.getAreas();
    const activeAreas = areas.filter(area => area.enabled);
    
    if (activeAreas.length === 0) return;
    
    console.log(`Vérification de ${activeAreas.length} AREAs...`);
    
    for (const area of activeAreas) {
      try {
        await this.checkArea(area);
      } catch (error) {
        console.error(`Erreur vérification AREA ${area.id}:`, error);
      }
    }
  }
  
  /**
   * Vérifier une AREA spécifique
   * @param area AREA à vérifier
   */
  private static async checkArea(area: AREA) {
    // Vérifier l'Action selon le service
    if (area.action.service === 'spotify') {
      await this.checkSpotifyAction(area);
    }
    // Ajouter ici d'autres services (github, discord, etc.)
    
    // Mettre à jour lastChecked
    InMemoryDB.updateArea(area.id, {
      lastChecked: new Date(),
    });
  }
  
  /**
   * Vérifier une Action Spotify
   */
  private static async checkSpotifyAction(area: AREA) {
    const { type, config } = area.action;
    let result: { triggered: boolean; data?: any } = { triggered: false };
    
    switch (type) {
      case 'new_track_played':
        result = await SpotifyService.checkNewTrackPlayed(
          area.userId,
          area.metadata?.lastTrackId
        );
        if (result.triggered && result.data) {
          InMemoryDB.updateArea(area.id, {
            metadata: { ...area.metadata, lastTrackId: result.data.trackId },
          });
        }
        break;
        
      case 'new_track_saved':
        result = await SpotifyService.checkNewTrackSaved(
          area.userId,
          area.metadata?.lastSavedCount
        );
        if (result.data) {
          InMemoryDB.updateArea(area.id, {
            metadata: { ...area.metadata, lastSavedCount: result.data.savedCount },
          });
        }
        break;
        
      case 'playlist_updated':
        result = await SpotifyService.checkPlaylistUpdated(
          area.userId,
          config.playlistId,
          area.metadata?.lastSnapshotId
        );
        if (result.triggered && result.data) {
          InMemoryDB.updateArea(area.id, {
            metadata: { ...area.metadata, lastSnapshotId: result.data.snapshotId },
          });
        }
        break;
        
      case 'specific_artist_played':
        result = await SpotifyService.checkSpecificArtistPlayed(
          area.userId,
          config.artistId,
          area.lastChecked
        );
        break;

      case 'new_artist_followed':
        result = await SpotifyService.checkNewArtistFollowed(
          area.userId,
          area.metadata?.followedArtistIds
        );
        if (result.data) {
          InMemoryDB.updateArea(area.id, {
            metadata: { ...area.metadata, followedArtistIds: result.data.followedArtistIds },
        });
      }
      break;
    }
    
    if (result.triggered) {
      console.log(`Action déclenchée pour AREA ${area.id}: ${type}`);
      await this.executeReaction(area, result.data);
      
      InMemoryDB.updateArea(area.id, {
        lastTriggered: new Date(),
      });
    }
  }

  /**
   * Exécuter une REAction
   */
  private static async executeReaction(area: AREA, actionData: any) {
    const { service, type, config } = area.reaction;
    
    console.log(`Exécution REAction: ${service}.${type}`);
    
    if (service === 'spotify') {
      await this.executeSpotifyReaction(area, type, config, actionData);
    }
    // Ajouter ici d'autres services
  }
  
  /**
   * Exécuter une REAction Spotify
   */
  private static async executeSpotifyReaction(
    area: AREA,
    type: string,
    config: any,
    actionData: any
  ) {
    switch (type) {
      case 'add_track_to_playlist': {
        const trackUri = actionData?.uri || config.trackUri;
        if (!trackUri) {
          console.error('Pas de track URI pour add_track_to_playlist');
          return;
        }

        const addResult = await SpotifyService.addTrackToPlaylist(
          area.userId,
          trackUri,
          config.playlistId
        );

        if (addResult.success) {
          console.log(`Track ajouté à la playlist ${config.playlistId}`);
        } else {
          console.error(`Erreur: ${addResult.error}`);
        }
        break;
      }

      case 'create_playlist': {
        const createResult = await SpotifyService.createPlaylist(
          area.userId,
          config.name,
          config.description,
          config.isPublic
        );

        if (createResult.success) {
          console.log(`Playlist créée: ${createResult.playlistId}`);
        } else {
          console.error(`Erreur: ${createResult.error}`);
        }
        break;
      }

      case 'follow_artist': {
        const artistId = actionData?.artistId || config.artistId;
        if (!artistId) {
          console.error('Pas d\'artist ID pour follow_artist');
          return;
        }

        const followResult = await SpotifyService.followArtist(
          area.userId,
          artistId
        );

        if (followResult.success) {
          console.log(`Artiste suivi: ${artistId}`);
        } else {
          console.error(`Erreur: ${followResult.error}`);
        }
        break;
      }

      case 'create_playlist_with_artist_top_tracks': {
        const artistIdForPlaylist = actionData?.artistId || config.artistId;
        const artistName = actionData?.artistName || config.artistName || 'Artist';

        if (!artistIdForPlaylist) {
          console.error('Pas d\'artist ID pour create_playlist_with_artist_top_tracks');
          return;
        }

        const topTracks = await SpotifyService.getArtistTopTracks(
          area.userId,
          artistIdForPlaylist,
          5
        );

        if (topTracks.length === 0) {
          console.error('Impossible de récupérer les top tracks');
          return;
        }

        const playlistName = config.playlistName || `Top 5 - ${artistName}`;
        const playlistDesc = config.playlistDescription || `Top 5 tracks de ${artistName} ajoutés automatiquement`;

        const playlistResult = await SpotifyService.createPlaylist(
          area.userId,
          playlistName,
          playlistDesc,
          config.isPublic || false
        );

        if (!playlistResult.success || !playlistResult.playlistId) {
          console.error(`Erreur création playlist: ${playlistResult.error}`);
          return;
        }

        const trackUris = topTracks.map(track => track.uri);
        const addTracksResult = await SpotifyService.addTrackToPlaylist(
          area.userId,
          trackUris.join(','),
          playlistResult.playlistId
        );

        if (addTracksResult.success) {
          console.log(`Playlist "${playlistName}" créée avec ${topTracks.length} tracks`);
        } else {
          console.error(`Erreur ajout tracks: ${addTracksResult.error}`);
        }
        break;
      }
    }
  }

  /**
   * Forcer la vérification d'une AREA spécifique (pour les tests)
   * @param areaId ID de l'AREA
   * @returns true si l'AREA a pu être vérifiée
   */
  static async forceCheckArea(areaId: string): Promise<boolean> {
    const area = InMemoryDB.getAreaById(areaId);
    if (!area) return false;
    
    await this.checkArea(area);
    return true;
  }
}

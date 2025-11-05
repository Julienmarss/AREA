import cron from 'node-cron';
import { AREA, InMemoryDB } from '../models/area.model';
import { SpotifyService } from './spotify.service';
import { AreaExecutor } from './AreaExecutor';

export class HooksService {
  private static isRunning = false;
  private static cronJob: cron.ScheduledTask | null = null;
  
  static start() {
    if (this.isRunning) {
      console.log('Hooks déjà démarrés');
      return;
    }
    
    console.log('Démarrage du système de hooks...');
    
    this.cronJob = cron.schedule('*/60 * * * * *', async () => {
      await this.checkAllAreas();
    });
    
    this.isRunning = true;
    console.log('Hooks démarrés (vérification toutes les 60s)');
  }
  
  static stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('Hooks arrêtés');
  }
  
  private static async checkAllAreas() {
    const areas = await InMemoryDB.getAreas();
    const activeAreas = areas.filter(area => area.enabled && area.action.service === 'spotify');
    
    if (activeAreas.length === 0) return;
    
    console.log(`Vérification de ${activeAreas.length} AREAs Spotify...`);
    
    for (const area of activeAreas) {
      try {
        await this.checkSpotifyArea(area);
      } catch (error) {
        console.error(`Erreur vérification AREA ${area.id}:`, error);
      }
    }
  }
  
  private static async checkSpotifyArea(area: AREA) {
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
      console.log(`Spotify Action déclenchée: ${area.name} (${type})`);
      
      await AreaExecutor.executeMatchingAreas('spotify', type, result.data);
      
      InMemoryDB.updateArea(area.id, {
        lastTriggered: new Date(),
        lastChecked: new Date(),
      });
    } else {
      InMemoryDB.updateArea(area.id, {
        lastChecked: new Date(),
      });
    }
  }

  static async forceCheckArea(areaId: string): Promise<boolean> {
    const area = await InMemoryDB.getAreaById(areaId);
    if (!area) return false;
    
    if (area.action.service === 'spotify') {
      await this.checkSpotifyArea(area);
    }
    
    return true;
  }
}
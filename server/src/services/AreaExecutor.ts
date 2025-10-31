import { AREA, InMemoryDB } from '../models/area.model';
import { GitHubService } from './GitHubService';
import { DiscordService } from './DiscordService';
import { SpotifyService } from './spotify.service';
import { NotionService } from './NotionService';
import { userStorage } from '../storage/UserStorage';

/**
 * Service central pour exécuter les REActions des AREAs
 */
export class AreaExecutor {
  // Supprimer les instances statiques partagées
  // private static githubService = new GitHubService();
  // private static discordService = new DiscordService();

  /**
   * Trouve et exécute toutes les AREAs correspondant à un événement
   */
  static async executeMatchingAreas(
    serviceName: string,
    actionType: string,
    triggerData: any
  ): Promise<void> {
    const matchingAreas = InMemoryDB.getAreas().filter(area => 
      area.enabled &&
      area.action.service === serviceName &&
      area.action.type === actionType &&
      this.matchesActionConfig(area, triggerData)
    );

    console.log(`🎯 Found ${matchingAreas.length} matching AREAs for ${serviceName}.${actionType}`);

    for (const area of matchingAreas) {
      try {
        await this.executeArea(area, triggerData);
        
        InMemoryDB.updateArea(area.id, {
          lastTriggered: new Date(),
        });
        
        console.log(`✅ AREA executed: ${area.name} (${area.id})`);
      } catch (error) {
        console.error(`❌ Failed to execute AREA ${area.id}:`, error);
      }
    }
  }

  private static matchesActionConfig(area: AREA, triggerData: any): boolean {
    const config = area.action.config;

    if (area.action.service === 'github') {
      if (config.owner && triggerData.repository?.owner !== config.owner) {
        return false;
      }
      if (config.repo && triggerData.repository?.repo !== config.repo) {
        return false;
      }

      if (config.labels && triggerData.issue?.labels) {
        const requiredLabels = config.labels.split(',').map((l: string) => l.trim());
        const issueLabels = triggerData.issue.labels;
        const hasMatchingLabel = requiredLabels.some((label: string) => 
          issueLabels.includes(label)
        );
        if (!hasMatchingLabel) return false;
      }

      if (config.targetBranch && triggerData.pull_request?.base?.ref !== config.targetBranch) {
        return false;
      }
    }

    if (area.action.service === 'discord') {
      if (config.channelId && triggerData.message?.channelId !== config.channelId) {
        return false;
      }

      if (config.keyword && !triggerData.message?.content?.toLowerCase().includes(config.keyword.toLowerCase())) {
        return false;
      }

      if (config.authorId && triggerData.message?.authorId !== config.authorId) {
        return false;
      }
    }

    if (area.action.service === 'spotify') {
      if (config.artistId && triggerData.artistId !== config.artistId) {
        return false;
      }

      if (config.playlistId && triggerData.playlistId !== config.playlistId) {
        return false;
      }
    }

    if (area.action.service === 'notion') {
      if (config.databaseId && triggerData.databaseId !== config.databaseId) {
        return false;
      }

      if (config.parentPageId && triggerData.parentPageId !== config.parentPageId) {
        return false;
      }

      if (config.propertyName && triggerData.propertyName !== config.propertyName) {
        return false;
      }
    }

    return true;
  }

  private static async executeArea(area: AREA, triggerData: any): Promise<void> {
    const { service, type, config } = area.reaction;

    console.log(`🔄 Executing REAction: ${service}.${type}`);

    const enrichedConfig = this.enrichConfig(config, triggerData);

    switch (service) {
      case 'github':
        await this.executeGitHubReaction(area.userId, type, enrichedConfig, triggerData);
        break;

      case 'discord':
        await this.executeDiscordReaction(area.userId, type, enrichedConfig, triggerData);
        break;

      case 'spotify':
        await this.executeSpotifyReaction(area.userId, type, enrichedConfig, triggerData);
        break;

      case 'notion':
        await this.executeNotionReaction(area.userId, type, enrichedConfig, triggerData);
        break;

      default:
        console.error(`❌ Unknown service: ${service}`);
    }
  }

  private static enrichConfig(config: any, triggerData: any): any {
    const enriched = { ...config };

    if (enriched.content && typeof enriched.content === 'string') {
      enriched.content = this.replacePlaceholders(enriched.content, triggerData);
    }

    if (enriched.body && typeof enriched.body === 'string') {
      enriched.body = this.replacePlaceholders(enriched.body, triggerData);
    }

    if (enriched.title && typeof enriched.title === 'string') {
      enriched.title = this.replacePlaceholders(enriched.title, triggerData);
    }

    return enriched;
  }

  private static replacePlaceholders(text: string, triggerData: any): string {
    let result = text;

    if (triggerData.issue) {
      result = result.replace(/\{\{issue\.title\}\}/g, triggerData.issue.title || '');
      result = result.replace(/\{\{issue\.number\}\}/g, triggerData.issue.number?.toString() || '');
      result = result.replace(/\{\{issue\.user\.login\}\}/g, triggerData.issue.user?.login || '');
      result = result.replace(/\{\{issue\.html_url\}\}/g, triggerData.issue.html_url || '');
    }

    if (triggerData.pull_request) {
      result = result.replace(/\{\{pr\.title\}\}/g, triggerData.pull_request.title || '');
      result = result.replace(/\{\{pr\.number\}\}/g, triggerData.pull_request.number?.toString() || '');
      result = result.replace(/\{\{pr\.user\.login\}\}/g, triggerData.pull_request.user?.login || '');
      result = result.replace(/\{\{pr\.html_url\}\}/g, triggerData.pull_request.html_url || '');
    }

    if (triggerData.repository) {
      result = result.replace(/\{\{repo\.owner\}\}/g, triggerData.repository.owner || '');
      result = result.replace(/\{\{repo\.name\}\}/g, triggerData.repository.repo || '');
    }

    if (triggerData.message) {
      result = result.replace(/\{\{message\.content\}\}/g, triggerData.message.content || '');
      result = result.replace(/\{\{message\.author\}\}/g, triggerData.message.authorUsername || '');
      result = result.replace(/\{\{message\.channel\}\}/g, triggerData.message.channelName || '');
    }

    if (triggerData.trackName) {
      result = result.replace(/\{\{track\.name\}\}/g, triggerData.trackName || '');
      result = result.replace(/\{\{track\.artist\}\}/g, triggerData.artistName || '');
    }

    if (triggerData.pageId) {
      result = result.replace(/\{\{notion\.pageId\}\}/g, triggerData.pageId || '');
      result = result.replace(/\{\{notion\.url\}\}/g, triggerData.url || '');
      result = result.replace(/\{\{notion\.databaseId\}\}/g, triggerData.databaseId || '');
    }

    return result;
  }

  private static async executeGitHubReaction(
    userId: string,
    reactionType: string,
    config: any,
    triggerData: any
  ): Promise<void> {
    console.log(`🔧 Executing GitHub reaction for user: ${userId}`);
    
    // ✅ Créer une instance dédiée et l'authentifier
    const githubService = new GitHubService();
    
    // Récupérer le token depuis userStorage
    const user = userStorage.findById(userId);
    const githubData = user?.services?.github;
    
    if (!githubData?.accessToken) {
      console.error(`❌ No GitHub token found for user ${userId}`);
      throw new Error('GitHub not authenticated for this user');
    }
    
    console.log(`✅ Found GitHub token for user ${userId}`);
    
    // Authentifier le service avec le token
    const authenticated = await githubService.authenticate(userId, { 
      accessToken: githubData.accessToken 
    });
    
    if (!authenticated) {
      console.error(`❌ Failed to authenticate GitHub service for user ${userId}`);
      throw new Error('GitHub authentication failed');
    }
    
    console.log(`✅ GitHub service authenticated for user ${userId}`);
    
    // Exécuter la réaction
    await githubService.executeReaction(reactionType, userId, config, triggerData);
  }

  private static async executeDiscordReaction(
    userId: string,
    reactionType: string,
    config: any,
    triggerData: any
  ): Promise<void> {
    console.log(`🔧 Executing Discord reaction for user: ${userId}`);
    
    // ✅ Créer une instance dédiée
    const discordService = new DiscordService();
    
    // Récupérer les données Discord depuis userStorage
    const user = userStorage.findById(userId);
    const discordData = user?.services?.discord;
    
    if (!discordData?.botToken || !discordData?.guildId) {
      console.error(`❌ No Discord credentials found for user ${userId}`);
      throw new Error('Discord not authenticated for this user');
    }
    
    console.log(`✅ Found Discord credentials for user ${userId}`);
    
    // Authentifier le service
    const authenticated = await discordService.authenticate(userId, {
      botToken: discordData.botToken,
      guildId: discordData.guildId
    });
    
    if (!authenticated) {
      console.error(`❌ Failed to authenticate Discord service for user ${userId}`);
      throw new Error('Discord authentication failed');
    }
    
    console.log(`✅ Discord service authenticated for user ${userId}`);
    
    // Exécuter la réaction
    await discordService.executeReaction(reactionType, userId, config, triggerData);
  }

  private static async executeSpotifyReaction(
    userId: string,
    reactionType: string,
    config: any,
    triggerData: any
  ): Promise<void> {
    switch (reactionType) {
      case 'add_track_to_playlist': {
        const trackUri = triggerData.uri || config.trackUri;
        if (!trackUri) {
          console.error('No track URI for add_track_to_playlist');
          return;
        }
        const result = await SpotifyService.addTrackToPlaylist(userId, trackUri, config.playlistId);
        if (result.success) {
          console.log(`✅ Track added to playlist ${config.playlistId}`);
        } else {
          console.error(`❌ Error: ${result.error}`);
        }
        break;
      }

      case 'create_playlist': {
        const result = await SpotifyService.createPlaylist(
          userId,
          config.name,
          config.description,
          config.isPublic
        );
        if (result.success) {
          console.log(`✅ Playlist created: ${result.playlistId}`);
        } else {
          console.error(`❌ Error: ${result.error}`);
        }
        break;
      }

      case 'follow_artist': {
        const artistId = triggerData.artistId || config.artistId;
        if (!artistId) {
          console.error('No artist ID for follow_artist');
          return;
        }
        const result = await SpotifyService.followArtist(userId, artistId);
        if (result.success) {
          console.log(`✅ Artist followed: ${artistId}`);
        } else {
          console.error(`❌ Error: ${result.error}`);
        }
        break;
      }

      case 'create_playlist_with_artist_top_tracks': {
        const artistId = triggerData.artistId || config.artistId;
        const artistName = triggerData.artistName || config.artistName || 'Artist';

        if (!artistId) {
          console.error('No artist ID for create_playlist_with_artist_top_tracks');
          return;
        }

        const topTracks = await SpotifyService.getArtistTopTracks(userId, artistId, 5);
        if (topTracks.length === 0) {
          console.error('Unable to get top tracks');
          return;
        }

        const playlistName = config.playlistName || `Top 5 - ${artistName}`;
        const playlistDesc = config.playlistDescription || `Top 5 tracks from ${artistName}`;

        const playlistResult = await SpotifyService.createPlaylist(
          userId,
          playlistName,
          playlistDesc,
          config.isPublic || false
        );

        if (!playlistResult.success || !playlistResult.playlistId) {
          console.error(`Error creating playlist: ${playlistResult.error}`);
          return;
        }

        const trackUris = topTracks.map(track => track.uri);
        const addResult = await SpotifyService.addTrackToPlaylist(
          userId,
          trackUris.join(','),
          playlistResult.playlistId
        );

        if (addResult.success) {
          console.log(`✅ Playlist "${playlistName}" created with ${topTracks.length} tracks`);
        } else {
          console.error(`Error adding tracks: ${addResult.error}`);
        }
        break;
      }
    }
  }

  private static async executeNotionReaction(
    userId: string,
    reactionType: string,
    config: any,
    triggerData: any
  ): Promise<void> {
    console.log(`🔧 Executing Notion reaction for user: ${userId}`);

    // Créer une instance dédiée
    const notionService = new NotionService();

    // Récupérer les données Notion depuis InMemoryDB
    const token = InMemoryDB.getToken(userId, 'notion');

    if (!token?.accessToken) {
      console.error(`❌ No Notion token found for user ${userId}`);
      throw new Error('Notion not authenticated for this user');
    }

    console.log(`✅ Found Notion token for user ${userId}`);

    // Authentifier le service avec le token
    const authenticated = await notionService.authenticate(userId, {
      access_token: token.accessToken,
      bot_id: token.metadata?.bot_id || '',
      workspace_id: token.metadata?.workspace_id || '',
      workspace_name: token.metadata?.workspace_name || '',
      workspace_icon: token.metadata?.workspace_icon || '',
      owner: { type: 'user' }
    });

    if (!authenticated) {
      console.error(`❌ Failed to authenticate Notion service for user ${userId}`);
      throw new Error('Notion authentication failed');
    }

    console.log(`✅ Notion service authenticated for user ${userId}`);

    // Exécuter la réaction
    await notionService.executeReaction(reactionType, userId, config, triggerData);
  }
}
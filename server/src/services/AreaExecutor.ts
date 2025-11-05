import { AREA, InMemoryDB } from '../models/area.model';
import { GitHubService } from './GitHubService';
import { DiscordService } from './DiscordService';
import { SpotifyService } from './spotify.service';
import { GoogleService } from './GoogleService';
import { userStorage } from '../storage/UserStorage';

/**
 * Service central pour exécuter les REActions des AREAs
 */
export class AreaExecutor {

  /**
   * Trouve et exécute toutes les AREAs correspondant à un événement
   */
  static async executeMatchingAreas(
    serviceName: string,
    actionType: string,
    triggerData: any
  ): Promise<void> {
    const matchingAreas = (await InMemoryDB.getAreas()).filter(area => 
      area.enabled &&
      area.action.service === serviceName &&
      area.action.type === actionType &&
      this.matchesActionConfig(area, triggerData)
    );

    console.log(`Found ${matchingAreas.length} matching AREAs for ${serviceName}.${actionType}`);

    for (const area of matchingAreas) {
      try {
        await this.executeArea(area, triggerData);
        
        InMemoryDB.updateArea(area.id, {
          lastTriggered: new Date(),
        });
        
        console.log(`AREA executed: ${area.name} (${area.id})`);
      } catch (error) {
        console.error(`Failed to execute AREA ${area.id}:`, error);
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
      if (area.action.type === 'message_posted_in_channel') {
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
      
      if (area.action.type === 'user_mentioned') {
        if (config.userId && triggerData.mention?.userId !== config.userId) {
          return false;
        }
      }
      
      if (area.action.type === 'user_joined_server') {
        if (config.guildId && triggerData.guild?.id !== config.guildId) {
          return false;
        }
      }
    }

    if (area.action.service === 'spotify') {
      if (config.artistId) {
        const triggerArtistIds: string[] = [
          ...(triggerData.artists?.map((a: any) => a.id) || []),
          ...(triggerData.artistId ? [triggerData.artistId] : [])
        ];
        if (!triggerArtistIds.includes(config.artistId)) {
          return false;
        }
      }

      if (config.artistName) {
        const triggerArtistNames: string[] = [
          ...(triggerData.artists?.map((a: any) => a.name?.toLowerCase()) || []),
          ...(triggerData.artistName ? [String(triggerData.artistName).toLowerCase()] : [])
        ];
        if (!triggerArtistNames.includes(String(config.artistName).toLowerCase())) {
          return false;
        }
      }

      if (config.playlistId && triggerData.playlistId !== config.playlistId) {
        return false;
      }
    }


    return true;
  }

  private static async executeArea(area: AREA, triggerData: any): Promise<void> {
    const { service, type, config } = area.reaction;

    console.log(`Executing REAction: ${service}.${type}`);

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

      case 'google':
        await this.executeGoogleReaction(area.userId, type, enrichedConfig, triggerData);
        break;

      default:
        console.error(`Unknown service: ${service}`);
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
    
    if (triggerData.mention) {
      result = result.replace(/\{\{mention\.username\}\}/g, triggerData.mention.username || '');
      result = result.replace(/\{\{mention\.tag\}\}/g, triggerData.mention.tag || '');
      result = result.replace(/\{\{mention\.userId\}\}/g, triggerData.mention.userId || '');
    }

    if (triggerData.trackName) {
      result = result.replace(/\{\{track\.name\}\}/g, triggerData.trackName || '');
      result = result.replace(/\{\{track\.artist\}\}/g, triggerData.artistName || '');
    }
    if (triggerData.email) {
      result = result.replace(/\{\{email\.from\}\}/g, triggerData.email.from || '');
      result = result.replace(/\{\{email\.to\}\}/g, triggerData.email.to || '');
      result = result.replace(/\{\{email\.subject\}\}/g, triggerData.email.subject || '');
      result = result.replace(/\{\{email\.body\}\}/g, triggerData.email.body || '');
      result = result.replace(/\{\{email\.snippet\}\}/g, triggerData.email.snippet || '');
    }

    return result;
  }

  private static async executeGitHubReaction(
    userId: string,
    reactionType: string,
    config: any,
    triggerData: any
  ): Promise<void> {
    console.log(`Executing GitHub reaction for user: ${userId}`);
    
    const githubService = new GitHubService();
    
    const user = await userStorage.findById(userId);
    const githubData = user?.services?.github;
    
    if (!githubData?.accessToken) {
      console.error(`No GitHub token found for user ${userId}`);
      throw new Error('GitHub not authenticated for this user');
    }
    
    console.log(`Found GitHub token for user ${userId}`);
    
    const authenticated = await githubService.authenticate(userId, { 
      accessToken: githubData.accessToken 
    });
    
    if (!authenticated) {
      console.error(`Failed to authenticate GitHub service for user ${userId}`);
      throw new Error('GitHub authentication failed');
    }
    
    console.log(`GitHub service authenticated for user ${userId}`);
    
    await githubService.executeReaction(reactionType, userId, config, triggerData);
  }

  private static async executeDiscordReaction(
    userId: string,
    reactionType: string,
    config: any,
    triggerData: any
  ): Promise<void> {
    console.log(`Executing Discord reaction for user: ${userId}`);
    
    const discordService = new DiscordService();
    
    const user = await userStorage.findById(userId);
    const discordData = user?.services?.discord;
    
    if (!discordData?.guildId) {
      console.error(`No Discord credentials found for user ${userId}`);
      throw new Error('Discord not authenticated for this user');
    }
    
    console.log(`Found Discord credentials for user ${userId} (guild: ${discordData.guildId})`);
    
    const authenticated = await discordService.authenticate(userId, {
      guildId: discordData.guildId
    });
    
    if (!authenticated) {
      console.error(`Failed to authenticate Discord service for user ${userId}`);
      throw new Error('Discord authentication failed');
    }
    
    console.log(`Discord service authenticated for user ${userId}`);
    
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
          console.log(`Track added to playlist ${config.playlistId}`);
        } else {
          console.error(`Error: ${result.error}`);
        }
        break;
      }

      case 'create_playlist': {
        const fallbackName = triggerData.trackName
          ? `AREA - ${triggerData.trackName}`
          : (triggerData.artistName ? `AREA - ${triggerData.artistName}` : `AREA Playlist`);
        const name = (config.name && String(config.name).trim()) || fallbackName;
        const description = config.description || '';
        const isPublic = Boolean(config.isPublic);

        const result = await SpotifyService.createPlaylist(
          userId,
          name,
          description,
          isPublic
        );
        if (result.success) {
          console.log(`Playlist created: ${result.playlistId}`);
        } else {
          console.error(`Error: ${result.error}`);
        }
        break;
      }

      case 'follow_artist': {
        if (!config.artistId && !config.artistName && Array.isArray(triggerData.artists) && triggerData.artists.length > 1) {
          console.error('Ambiguous artist for follow_artist. Provide reaction.config.artistId or artistName.');
          return;
        }
        const artistId =
          config.artistId ||
          (config.artistName && triggerData.artists?.find((a: any) => a.name?.toLowerCase() === String(config.artistName).toLowerCase())?.id) ||
          triggerData.artistId ||
          triggerData.artists?.[0]?.id;
        if (!artistId) {
          console.error('No artist ID for follow_artist');
          return;
        }
        const result = await SpotifyService.followArtist(userId, artistId);
        if (result.success) {
          console.log(`Artist followed: ${artistId}`);
        } else {
          console.error(`Error: ${result.error}`);
        }
        break;
      }

      case 'create_playlist_with_artist_top_tracks': {
        if (!config.artistId && !config.artistName && Array.isArray(triggerData.artists) && triggerData.artists.length > 1) {
          console.error('Ambiguous artist for create_playlist_with_artist_top_tracks. Provide reaction.config.artistId or artistName.');
          return;
        }
        const resolvedArtist = (() => {
          if (config.artistId) {
            const matchById = triggerData.artists?.find((a: any) => a.id === config.artistId);
            return { id: config.artistId, name: matchById?.name || config.artistName };
          }
          if (config.artistName && triggerData.artists?.length) {
            const m = triggerData.artists.find((a: any) => a.name?.toLowerCase() === String(config.artistName).toLowerCase());
            if (m) return { id: m.id, name: m.name };
          }
          if (triggerData.artistId || triggerData.artistName) {
            return { id: triggerData.artistId, name: triggerData.artistName };
          }
          if (triggerData.artists?.length) {
            return { id: triggerData.artists[0].id, name: triggerData.artists[0].name };
          }
          return { id: undefined, name: undefined };
        })();

        const artistId = resolvedArtist.id;
        const artistName = resolvedArtist.name || 'Artist';

        if (!artistId) {
          console.error('No artist ID for create_playlist_with_artist_top_tracks');
          return;
        }

        const topTracks = await SpotifyService.getArtistTopTracks(userId, artistId, 5);
        if (topTracks.length === 0) {
          console.error('Unable to get top tracks');
          return;
        }

        const playlistName = (config.playlistName && String(config.playlistName).trim()) || `Top 5 - ${artistName}`;
        const playlistDesc = (config.playlistDescription && String(config.playlistDescription).trim()) || `Top 5 tracks from ${artistName}`;

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
          console.log(`Playlist "${playlistName}" created with ${topTracks.length} tracks`);
        } else {
          console.error(`Error adding tracks: ${addResult.error}`);
        }
        break;
      }
    }
  }

private static async executeGoogleReaction(
  userId: string,
  reactionType: string,
  config: any,
  triggerData: any
): Promise<void> {
  console.log(`🔧 Executing Google reaction for user: ${userId}`);
  
  const googleService = new GoogleService();
  
  const user = await userStorage.findById(userId);
  const googleData = user?.services?.google;
  
  if (!googleData?.accessToken) {
    console.error(`No Google credentials found for user ${userId}`);
    throw new Error('Google not authenticated for this user');
  }
  
  console.log(`Found Google credentials for user ${userId}`);
  
  const authenticated = await googleService.authenticate(userId, {
    accessToken: googleData.accessToken,
    refreshToken: googleData.refreshToken,
    expiresAt: googleData.expiresAt,
  });
  
  if (!authenticated) {
    console.error(`Failed to authenticate Google service for user ${userId}`);
    throw new Error('Google authentication failed');
  }
  
  console.log(`Google service authenticated for user ${userId}`);
  
  await googleService.executeReaction(reactionType, userId, config, triggerData);
}
}

import { Request, Response } from 'express';
import { getDiscordAuthUrl } from '../config/discord';
import { DiscordService } from '../services/DiscordService';
import { userStorage } from '../storage/UserStorage';
import axios from 'axios';

const discordService = new DiscordService();

export class DiscordController {
  
  /**
   * Initier l'authentification OAuth2 Discord
   */
  static initiateAuth(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    
    const state = Buffer.from(JSON.stringify({
      userId: userId,
      timestamp: Date.now(),
    })).toString('base64');
    
    const authUrl = getDiscordAuthUrl(state);
    
    console.log('🔐 Discord OAuth initiated for user:', userId);
    console.log('📍 Redirect URI:', process.env.DISCORD_REDIRECT_URI);
    
    res.json({ authUrl });
  }
  
/**
 * Callback OAuth2 Discord
 */
static async callback(req: Request, res: Response) {
  const { code, state, error, guild_id } = req.query;
  
  console.log('📥 Discord callback received');
  console.log('  Code:', code ? '✅' : '❌');
  console.log('  State:', state ? '✅' : '❌');
  console.log('  Guild ID:', guild_id || '❌ not provided');
  console.log('  Error:', error || 'none');
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
  
  if (error) {
    console.error('❌ Discord OAuth error:', error);
    return res.redirect(`${frontendUrl}/services?error=${error}`);
  }
  
  if (!code || !state) {
    console.error('❌ Missing code or state');
    return res.redirect(`${frontendUrl}/services?error=missing_params`);
  }
  
  try {
    const stateData = JSON.parse(
      Buffer.from(state as string, 'base64').toString()
    );
    const userId = stateData.userId;
    
    console.log('🔐 Processing Discord OAuth for user:', userId);
    
    const selectedGuildId = guild_id as string;
    
    if (!selectedGuildId) {
      console.error('❌ No guild selected');
      return res.redirect(`${frontendUrl}/services?error=no_guild_selected`);
    }
    
    console.log('✅ Guild selected:', selectedGuildId);
    
    const { getDiscordClient } = await import('../middleware/autoReactions');
    const client = getDiscordClient();
    
    if (!client || !client.isReady()) {
      console.error('❌ Discord bot is not online');
      return res.redirect(`${frontendUrl}/services?error=bot_offline`);
    }
    
    console.log('🤖 Discord bot status:');
    console.log('   Bot user:', client.user?.tag);
    console.log('   Guilds count:', client.guilds.cache.size);
    
    console.log('⏳ Waiting for guild propagation...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 secondes
    
    await client.guilds.fetch();
    
    let guild = client.guilds.cache.get(selectedGuildId);
    
    if (!guild) {
      console.error('❌ Bot not in guild:', selectedGuildId);
      console.error('   Available guilds:');
      client.guilds.cache.forEach(g => {
        console.error(`     - ${g.name} (${g.id})`);
      });
      
      return res.redirect(`${frontendUrl}/services?error=bot_not_in_guild&guild_id=${selectedGuildId}`);
    }
    
    console.log('✅ Bot found in guild:', guild.name);
    
    const success = await discordService.authenticate(userId, { 
      guildId: selectedGuildId
    });
    
    if (!success) {
      console.error('❌ Service authentication failed');
      return res.redirect(`${frontendUrl}/services?error=service_auth_failed`);
    }
    
    userStorage.updateServices(userId, 'discord', {
      userId: userId,
      guildId: selectedGuildId,
      guildName: guild.name,
      connectedAt: new Date()
    });
    
    console.log('✅ Discord authenticated successfully');
    console.log(`   User: ${userId}`);
    console.log(`   Server: ${guild.name} (${selectedGuildId})`);
    
    return res.redirect(`${frontendUrl}/services?connected=discord&guild=${encodeURIComponent(guild.name)}`);
    
  } catch (error: any) {
    console.error('❌ Discord OAuth callback error:', error.message);
    console.error('   Stack:', error.stack);
    return res.redirect(`${frontendUrl}/services?error=auth_failed&details=${encodeURIComponent(error.message)}`);
  }
}
  
  /**
   * Vérifier le statut de connexion
   */
  static async checkStatus(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'demo_user';
      
      console.log('🔍 Checking Discord status for user:', userId);
      
      const isAuthenticated = await discordService.isAuthenticated(userId);
      
      const user = userStorage.findById(userId);
      const discordData = user?.services?.discord;
      
      console.log('  Service authenticated:', isAuthenticated);
      console.log('  UserStorage data:', discordData ? 'present' : 'missing');
      console.log('  Username:', discordData?.username || 'N/A');
      
      res.json({
        authenticated: isAuthenticated && discordData?.connected === true,
        service: 'discord',
        username: discordData?.username,
        discriminator: discordData?.discriminator,
        userId: discordData?.userId,
        guildId: discordData?.guildId,
        guilds: discordData?.guilds || [],
        connectedAt: discordData?.connectedAt
      });
    } catch (error) {
      console.error('❌ Error checking Discord status:', error);
      res.status(500).json({ 
        authenticated: false, 
        service: 'discord',
        error: 'Failed to check status'
      });
    }
  }
  
  /**
   * Déconnecter Discord
   */
  static async disconnect(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'demo_user';
      
      console.log('🔌 Disconnecting Discord for user:', userId);
      
      const user = userStorage.findById(userId);
      if (user) {
        userStorage.updateServices(userId, 'discord', {
          connected: false
        });
      }
      
      const client = (discordService as any).userClients.get(userId);
      if (client) {
        client.destroy();
        (discordService as any).userClients.delete(userId);
      }
      
      console.log('✅ Discord disconnected for user:', userId);
      
      res.json({
        success: true,
        message: 'Discord disconnected successfully'
      });
    } catch (error) {
      console.error('❌ Error disconnecting Discord:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to disconnect'
      });
    }
  }
}
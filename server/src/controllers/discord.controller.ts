// server/src/controllers/discord.controller.ts
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
    
    // Encoder les données dans le state pour les récupérer au callback
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
  console.log('  Code:', code ? 'present' : 'missing');
  console.log('  State:', state ? 'present' : 'missing');
  console.log('  Guild ID:', guild_id || 'not provided'); // ✅ Le serveur choisi par l'utilisateur
  console.log('  Error:', error || 'none');
  
  if (error) {
    console.error('❌ Discord OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/services?error=${error}`);
  }
  
  if (!code || !state) {
    console.error('❌ Missing code or state');
    return res.status(400).json({ error: 'Missing code or state' });
  }
  
  try {
    // Décoder le state pour récupérer le userId
    const stateData = JSON.parse(
      Buffer.from(state as string, 'base64').toString()
    );
    const userId = stateData.userId;
    
    console.log('🔐 Exchanging Discord code for token...');
    console.log('  User ID:', userId);
    
    // Échanger le code contre un access token
    const params = new URLSearchParams();
    params.append('client_id', process.env.DISCORD_CLIENT_ID!);
    params.append('client_secret', process.env.DISCORD_CLIENT_SECRET!);
    params.append('grant_type', 'authorization_code');
    params.append('code', code as string);
    params.append('redirect_uri', process.env.DISCORD_REDIRECT_URI!);
    
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      throw new Error('No access token received from Discord');
    }
    
    console.log('✅ Got Discord user access token');
    
    // Récupérer les infos utilisateur Discord
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const discordUser = userResponse.data;
    console.log('✅ Got Discord user info:', discordUser.username);
    
    // Récupérer les guilds de l'utilisateur
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const guilds = guildsResponse.data;
    console.log('✅ Got user guilds:', guilds.length);
    
    // ✅ UTILISER LE GUILD_ID fourni par Discord OAuth (le serveur où le bot a été ajouté)
    const selectedGuildId = guild_id as string;
    
    if (!selectedGuildId) {
      console.error('❌ No guild selected - user did not add bot to a server');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      return res.redirect(`${frontendUrl}/services?error=no_guild_selected`);
    }
    
    console.log('✅ Bot added to guild:', selectedGuildId);
    
    // ✅ UTILISER LE BOT TOKEN depuis .env
    const botToken = process.env.DISCORD_BOT_TOKEN;
    
    if (!botToken) {
      console.error('❌ DISCORD_BOT_TOKEN not configured in .env');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      return res.redirect(`${frontendUrl}/services?error=bot_not_configured`);
    }
    
    console.log('🤖 Authenticating Discord service with BOT token...');
    
    // Authentifier le service Discord avec le BOT TOKEN
    const success = await discordService.authenticate(userId, { 
      botToken,
      guildId: selectedGuildId
    });
    
    if (!success) {
      throw new Error('Discord service authentication failed - bot may not have access to guild');
    }
    
    // Trouver le nom du serveur sélectionné
    const selectedGuild = guilds.find((g: any) => g.id === selectedGuildId);
    
    // Sauvegarder dans le userStorage
    userStorage.updateServices(userId, 'discord', {
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      userId: discordUser.id,
      guildId: selectedGuildId,
      guildName: selectedGuild?.name || 'Unknown Server', // ✅ Nom du serveur
      guilds: guilds.map((g: any) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
        permissions: g.permissions
      })),
      connectedAt: new Date()
    });
    
    console.log(`✅ Discord authenticated for user ${userId}`);
    console.log(`   - Username: ${discordUser.username}#${discordUser.discriminator}`);
    console.log(`   - Server: ${selectedGuild?.name} (${selectedGuildId})`);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    return res.redirect(`${frontendUrl}/services?connected=discord&guild=${encodeURIComponent(selectedGuild?.name || 'Unknown')}`);
    
  } catch (error: any) {
    console.error('❌ Discord OAuth callback error:', error.response?.data || error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    return res.redirect(`${frontendUrl}/services?error=auth_failed`);
  }
}
  
  /**
   * Vérifier le statut de connexion
   */
  static async checkStatus(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'demo_user';
      
      console.log('🔍 Checking Discord status for user:', userId);
      
      // Vérifier dans le service
      const isAuthenticated = await discordService.isAuthenticated(userId);
      
      // Récupérer les infos du userStorage
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
      
      // Supprimer du userStorage
      const user = userStorage.findById(userId);
      if (user) {
        userStorage.updateServices(userId, 'discord', {
          connected: false
        });
      }
      
      // Déconnecter du service (détruit le client)
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
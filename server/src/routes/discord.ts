// server/src/routes/discord.ts
import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { DiscordService } from '../services/DiscordService';
import { DiscordController } from '../controllers/discord.controller';
import { authenticate, AuthRequest } from '../middleware/auth';
import { userStorage } from '../storage/UserStorage';

const router = Router();
const discordService = new DiscordService();

// ============= OAUTH2 ROUTES =============

// Initier l'OAuth2
router.get('/oauth/authorize', DiscordController.initiateAuth);

// Callback OAuth2
router.get('/oauth/callback', DiscordController.callback);

// Vérifier le statut de connexion
router.get('/oauth/status', DiscordController.checkStatus);

// Déconnecter Discord
router.post('/oauth/disconnect', DiscordController.disconnect);

// ============= SERVICE INFO =============

const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const config = discordService.getConfig();
    const actions = discordService.getActions();
    const reactions = discordService.getReactions();

    res.json({
      service: {
        ...config,
        status: 'available',
        actions,
        reactions
      }
    });
  } catch (error) {
    console.error('Failed to get Discord service info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= LEGACY BOT TOKEN AUTH (OPTIONNEL) =============

router.post('/auth', authenticate, [
  body('botToken').isString().notEmpty().withMessage('Bot token is required'),
  body('guildId').isString().notEmpty().withMessage('Guild ID is required')
], handleValidationErrors, async (req: AuthRequest, res: Response) => {
  try {
    const { botToken, guildId } = req.body;
    const userId = req.user!.id;

    const success = await discordService.authenticate(userId, { botToken, guildId });

    if (success) {
      userStorage.updateServices(userId, 'discord', {
        botToken,
        guildId
      });

      res.json({
        success: true,
        message: 'Discord authentication successful',
        service: 'discord'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Discord authentication failed',
        message: 'Invalid bot token or insufficient permissions'
      });
    }
  } catch (error) {
    console.error('Discord authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to authenticate with Discord'
    });
  }
});

router.get('/auth', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAuthenticated = await discordService.isAuthenticated(userId);

    const user = userStorage.findById(userId);
    const discordData = user?.services.discord;

    res.json({
      authenticated: isAuthenticated,
      service: 'discord',
      guildId: discordData?.guildId,
      connectedAt: discordData?.connectedAt
    });
  } catch (error) {
    console.error('Failed to check Discord authentication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= ACTIONS =============

router.post('/actions/:actionId/listen', authenticate, [
  param('actionId').isIn(['message_posted_in_channel', 'user_mentioned', 'user_joined_server'])
    .withMessage('Invalid action ID'),
  body('parameters').isObject().withMessage('Parameters object is required')
], handleValidationErrors, async (req: AuthRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const { parameters } = req.body;
    const userId = req.user!.id;

    const isAuthenticated = await discordService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with Discord first'
      });
    }

    const validationError = validateActionParameters(actionId, parameters);
    if (validationError) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: validationError
      });
    }

    await discordService.startListening(userId, actionId, parameters);

    res.json({
      success: true,
      message: `Started listening for Discord action: ${actionId}`,
      actionId,
      userId,
      parameters
    });
  } catch (error) {
    console.error('Failed to start Discord action listener:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/actions/:actionId/listen', authenticate, [
  param('actionId').isIn(['message_posted_in_channel', 'user_mentioned', 'user_joined_server'])
    .withMessage('Invalid action ID'),
  body('parameters').optional().isObject().withMessage('Parameters must be an object')
], handleValidationErrors, async (req: AuthRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const userId = req.user!.id;

    await discordService.stopListening(userId, actionId);

    res.json({
      success: true,
      message: `Stopped listening for Discord action: ${actionId}`,
      actionId,
      userId
    });
  } catch (error) {
    console.error('Failed to stop Discord action listener:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= REACTIONS =============

router.post('/reactions/:reactionId/execute', authenticate, [
  param('reactionId').isIn(['send_message_to_channel', 'send_dm', 'add_role_to_user'])
    .withMessage('Invalid reaction ID'),
  body('parameters').isObject().withMessage('Parameters object is required'),
  body('triggerData').optional().isObject().withMessage('Trigger data must be an object')
], handleValidationErrors, async (req: AuthRequest, res: Response) => {
  try {
    const { reactionId } = req.params;
    const { parameters, triggerData = {} } = req.body;
    const userId = req.user!.id;

    const isAuthenticated = await discordService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with Discord first'
      });
    }

    const validationError = validateReactionParameters(reactionId, parameters);
    if (validationError) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: validationError
      });
    }

    const success = await discordService.executeReaction(reactionId, userId, parameters, triggerData);

    if (success) {
      res.json({
        success: true,
        message: `Discord reaction ${reactionId} executed successfully`,
        reactionId,
        userId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Reaction execution failed',
        message: `Failed to execute Discord reaction: ${reactionId}`
      });
    }
  } catch (error) {
    console.error('Failed to execute Discord reaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= GUILDS =============

router.get('/guilds', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log('📋 Fetching guilds for user:', userId);

    const user = userStorage.findById(userId);
    const discordData = user?.services?.discord;

    if (!discordData || !discordData.connected) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with Discord first'
      });
    }

    if (!discordData.guildId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No Discord server associated with your account'
      });
    }

    console.log('User is authenticated with Discord');
    console.log('   Guild ID:', discordData.guildId);
    console.log('   Guild Name:', discordData.guildName || 'N/A');

    const { getDiscordClient } = await import('../middleware/autoReactions');
    const client = getDiscordClient();

    if (!client || !client.isReady()) {
      return res.status(500).json({
        error: 'Service unavailable',
        message: 'Discord bot is not online'
      });
    }

    const guild = client.guilds.cache.get(discordData.guildId);

    if (!guild) {
      console.error('❌ Bot not in user guild:', discordData.guildId);
      return res.status(404).json({
        error: 'Guild not found',
        message: 'Bot is not in your connected server'
      });
    }

    console.log('✅ Found guild:', guild.name);

    res.json({
      guilds: [{
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        owner: false,
        permissions: '0'
      }]
    });
  } catch (error) {
    console.error('❌ Failed to get Discord guilds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= HELPER FUNCTIONS =============

function validateActionParameters(actionId: string, parameters: any): string | null {
  switch (actionId) {
    case 'message_posted_in_channel':
      if (!parameters.channelId || typeof parameters.channelId !== 'string') {
        return 'channelId is required and must be a string';
      }
      break;
    
    case 'user_mentioned':
      if (!parameters.userId || typeof parameters.userId !== 'string') {
        return 'userId is required and must be a string';
      }
      break;
    
    case 'user_joined_server':
      if (!parameters.guildId || typeof parameters.guildId !== 'string') {
        return 'guildId is required and must be a string';
      }
      break;
    
    default:
      return `Unknown action: ${actionId}`;
  }
  
  return null;
}

function validateReactionParameters(reactionId: string, parameters: any): string | null {
  switch (reactionId) {
    case 'send_message_to_channel':
      if (!parameters.channelId || typeof parameters.channelId !== 'string') {
        return 'channelId is required and must be a string';
      }
      if (!parameters.content || typeof parameters.content !== 'string') {
        return 'content is required and must be a string';
      }
      break;
    
    case 'send_dm':
      if (!parameters.userId || typeof parameters.userId !== 'string') {
        return 'userId is required and must be a string';
      }
      if (!parameters.content || typeof parameters.content !== 'string') {
        return 'content is required and must be a string';
      }
      break;
    
    case 'add_role_to_user':
      if (!parameters.guildId || typeof parameters.guildId !== 'string') {
        return 'guildId is required and must be a string';
      }
      if (!parameters.userId || typeof parameters.userId !== 'string') {
        return 'userId is required and must be a string';
      }
      if (!parameters.roleId || typeof parameters.roleId !== 'string') {
        return 'roleId is required and must be a string';
      }
      break;
    
    default:
      return `Unknown reaction: ${reactionId}`;
  }
  
  return null;
}


// ============= GET CHANNELS D'UN SERVEUR =============
router.get('/guilds/:guildId/channels', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { guildId } = req.params;
    const userId = req.user!.id;

    console.log('📋 Fetching channels for guild:', guildId, 'user:', userId);

    const user = userStorage.findById(userId);
    const discordData = user?.services?.discord;

    if (!discordData || !discordData.connected) {
      console.error('❌ User not connected to Discord');
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with Discord first'
      });
    }

    if (!discordData.guildId) {
      console.error('❌ No guild associated with user');
      return res.status(400).json({
        error: 'Bad request',
        message: 'No Discord server associated with your account'
      });
    }

    if (discordData.guildId !== guildId) {
      console.error('❌ User not connected to this guild');
      console.error('   User guild:', discordData.guildId);
      console.error('   Requested guild:', guildId);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access channels from your connected server'
      });
    }

    const { getDiscordClient } = await import('../middleware/autoReactions');
    const client = getDiscordClient();

    if (!client || !client.isReady()) {
      console.error('❌ Discord bot not ready');
      return res.status(500).json({ error: 'Discord bot not ready' });
    }

    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      console.error('❌ Guild not found:', guildId);
      return res.status(404).json({ error: 'Guild not found' });
    }

    console.log('✅ Found guild:', guild.name);

    const channels = await guild.channels.fetch();
    
    const textChannels = channels
      .filter((channel: any) => channel && channel.type === 0)
      .map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        category: channel.parent?.name,
      }));

    console.log('✅ Found', textChannels.length, 'text channels');

    res.json({ channels: textChannels });
  } catch (error) {
    console.error('❌ Failed to get Discord channels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= GET ROLES D'UN SERVEUR =============
router.get('/guilds/:guildId/roles', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { guildId } = req.params;
    const userId = req.user!.id;

    const isAuthenticated = await discordService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with Discord first'
      });
    }

    const client = (discordService as any).userClients.get(userId);
    if (!client || !client.isReady()) {
      return res.status(500).json({ error: 'Discord client not ready' });
    }

    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const roles = await guild.roles.fetch();
    
    const formattedRoles = roles
      .filter((role: any) => role.name !== '@everyone')
      .map((role: any) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
      }))
      .sort((a: any, b: any) => b.position - a.position);

    res.json({ roles: formattedRoles });
  } catch (error) {
    console.error('Failed to get Discord roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { DiscordService } from '../services/DiscordService';

const router = Router();
const discordService = new DiscordService();

// Middleware to check validation errors
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

// GET /api/v1/services/discord - Get Discord service configuration
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

// POST /api/v1/services/discord/auth - Authenticate with Discord Bot Token
router.post('/auth', [
  body('botToken').isString().notEmpty().withMessage('Bot token is required'),
  body('guildId').isString().notEmpty().withMessage('Guild ID is required'),
  body('userId').isString().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { botToken, guildId, userId } = req.body;

    const success = await discordService.authenticate(userId, { botToken, guildId });

    if (success) {
      res.json({
        success: true,
        message: 'Discord authentication successful',
        service: 'discord',
        userId
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

// GET /api/v1/services/discord/auth/:userId - Check authentication status
router.get('/auth/:userId', [
  param('userId').isString().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const isAuthenticated = await discordService.isAuthenticated(userId);

    res.json({
      authenticated: isAuthenticated,
      service: 'discord',
      userId
    });
  } catch (error) {
    console.error('Failed to check Discord authentication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/services/discord/actions/:actionId/listen - Start listening for an action
router.post('/actions/:actionId/listen', [
  param('actionId').isIn(['message_posted_in_channel', 'user_mentioned', 'user_joined_server'])
    .withMessage('Invalid action ID'),
  body('userId').isString().notEmpty().withMessage('User ID is required'),
  body('parameters').isObject().withMessage('Parameters object is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { actionId } = req.params;
    const { userId, parameters } = req.body;

    // Validate user is authenticated
    const isAuthenticated = await discordService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with Discord first'
      });
    }

    // Validate action-specific parameters
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

// DELETE /api/v1/services/discord/actions/:actionId/listen - Stop listening for an action
router.delete('/actions/:actionId/listen', [
  param('actionId').isIn(['message_posted_in_channel', 'user_mentioned', 'user_joined_server'])
    .withMessage('Invalid action ID'),
  body('userId').isString().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { actionId } = req.params;
    const { userId } = req.body;

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

// POST /api/v1/services/discord/reactions/:reactionId/execute - Execute a Discord reaction
router.post('/reactions/:reactionId/execute', [
  param('reactionId').isIn(['send_message_to_channel', 'send_dm', 'add_role_to_user'])
    .withMessage('Invalid reaction ID'),
  body('userId').isString().notEmpty().withMessage('User ID is required'),
  body('parameters').isObject().withMessage('Parameters object is required'),
  body('triggerData').optional().isObject().withMessage('Trigger data must be an object')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { reactionId } = req.params;
    const { userId, parameters, triggerData = {} } = req.body;

    // Validate user is authenticated
    const isAuthenticated = await discordService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with Discord first'
      });
    }

    // Validate reaction-specific parameters
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

// GET /api/v1/services/discord/guilds - Get available guilds (requires authentication)
router.get('/guilds/:userId', [
  param('userId').isString().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate user is authenticated
    const isAuthenticated = await discordService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with Discord first'
      });
    }

    // This is a simplified version - in reality, you'd fetch guilds from the Discord client
    res.json({
      guilds: [],
      message: 'Guild fetching not implemented in this basic version. Use Discord Developer Portal to get Guild IDs.'
    });
  } catch (error) {
    console.error('Failed to get Discord guilds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions for parameter validation
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

export default router;
import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { GitHubService } from '../services/GitHubService';
import crypto from 'crypto';

const router = Router();
const githubService = new GitHubService();

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

// Middleware to verify GitHub webhook signature
const verifyGitHubWebhook = (req: Request, res: Response, next: any) => {
  const signature = req.get('X-Hub-Signature-256');
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'default-webhook-secret';

  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  // Use the raw body buffer for signature verification
  let payload: string;
  if (Buffer.isBuffer(req.body)) {
    payload = req.body.toString('utf8');
  } else {
    // Fallback for already parsed JSON (shouldn't happen with raw middleware)
    payload = JSON.stringify(req.body);
  }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')}`;

  // Use crypto.timingSafeEqual for constant-time comparison to prevent timing attacks
  // First check if lengths match to avoid RangeError
  if (signature.length !== expectedSignature.length) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse the JSON body for the route handler
  try {
    req.body = JSON.parse(payload);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  next();
};

// GET /api/v1/services/github - Get GitHub service configuration
router.get('/', async (req: Request, res: Response) => {
  try {
    const config = githubService.getConfig();
    const actions = githubService.getActions();
    const reactions = githubService.getReactions();

    res.json({
      service: {
        ...config,
        status: 'available',
        actions,
        reactions
      }
    });
  } catch (error) {
    console.error('Failed to get GitHub service info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/services/github/auth - Authenticate with GitHub OAuth2 token
router.post('/auth', [
  body('accessToken').isString().notEmpty().withMessage('Access token is required'),
  body('userId').isString().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { accessToken, userId } = req.body;

    const success = await githubService.authenticate(userId, { accessToken });

    if (success) {
      res.json({
        success: true,
        message: 'GitHub authentication successful',
        service: 'github',
        userId
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'GitHub authentication failed',
        message: 'Invalid access token or insufficient permissions'
      });
    }
  } catch (error) {
    console.error('GitHub authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to authenticate with GitHub'
    });
  }
});

// GET /api/v1/services/github/auth/:userId - Check authentication status
router.get('/auth/:userId', [
  param('userId').isString().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const isAuthenticated = await githubService.isAuthenticated(userId);

    res.json({
      authenticated: isAuthenticated,
      service: 'github',
      userId
    });
  } catch (error) {
    console.error('Failed to check GitHub authentication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/services/github/actions/:actionId/listen - Start listening for an action
router.post('/actions/:actionId/listen', [
  param('actionId').isIn(['new_issue_created', 'pull_request_opened', 'commit_pushed', 'repository_starred'])
    .withMessage('Invalid action ID'),
  body('userId').isString().notEmpty().withMessage('User ID is required'),
  body('parameters').isObject().withMessage('Parameters object is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { actionId } = req.params;
    const { userId, parameters } = req.body;

    // Validate user is authenticated
    const isAuthenticated = await githubService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with GitHub first'
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

    await githubService.startListening(userId, actionId, parameters);

    res.json({
      success: true,
      message: `Started listening for GitHub action: ${actionId}`,
      actionId,
      userId,
      parameters,
      webhook: {
        url: `${req.protocol}://${req.get('host')}/api/v1/services/github/webhook`,
        events: getRequiredWebhookEvents(actionId)
      }
    });
  } catch (error) {
    console.error('Failed to start GitHub action listener:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/services/github/actions/:actionId/listen - Stop listening for an action
router.delete('/actions/:actionId/listen', [
  param('actionId').isIn(['new_issue_created', 'pull_request_opened', 'commit_pushed', 'repository_starred'])
    .withMessage('Invalid action ID'),
  body('userId').isString().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { actionId } = req.params;
    const { userId } = req.body;

    await githubService.stopListening(userId, actionId);

    res.json({
      success: true,
      message: `Stopped listening for GitHub action: ${actionId}`,
      actionId,
      userId
    });
  } catch (error) {
    console.error('Failed to stop GitHub action listener:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/services/github/reactions/:reactionId/execute - Execute a GitHub reaction
router.post('/reactions/:reactionId/execute', [
  param('reactionId').isIn(['create_issue', 'comment_on_issue', 'create_repository'])
    .withMessage('Invalid reaction ID'),
  body('userId').isString().notEmpty().withMessage('User ID is required'),
  body('parameters').isObject().withMessage('Parameters object is required'),
  body('triggerData').optional().isObject().withMessage('Trigger data must be an object')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { reactionId } = req.params;
    const { userId, parameters, triggerData = {} } = req.body;

    // Validate user is authenticated
    const isAuthenticated = await githubService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with GitHub first'
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

    const success = await githubService.executeReaction(reactionId, userId, parameters, triggerData);

    if (success) {
      res.json({
        success: true,
        message: `GitHub reaction ${reactionId} executed successfully`,
        reactionId,
        userId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Reaction execution failed',
        message: `Failed to execute GitHub reaction: ${reactionId}`
      });
    }
  } catch (error) {
    console.error('Failed to execute GitHub reaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/services/github/webhook - GitHub webhook endpoint
router.post('/webhook', verifyGitHubWebhook, async (req: Request, res: Response) => {
  try {
    const eventType = req.get('X-GitHub-Event');
    const payload = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'Missing event type header' });
    }

    console.log(`Received GitHub webhook: ${eventType}`);
    
    // Handle the webhook event
    await githubService.handleWebhookEvent(eventType, payload);
    
    // AUTOMATIC REACTIONS: Handle issues and Pull Requests
    setImmediate(async () => {
      try {
        const { setupAutoReactions } = await import('../middleware/autoReactions');
        const autoReactions = setupAutoReactions();
        
        // Handle urgent issues
        if (eventType === 'issues' && payload.action === 'opened') {
          const labels = payload.issue?.labels || [];
          const isUrgent = labels.some((label: any) => label.name.toLowerCase() === 'urgent');
          
          if (isUrgent) {
            console.log('🚨 URGENT ISSUE DETECTED - Triggering Discord notification');
            await autoReactions.handleUrgentIssue(eventType, payload);
          }
        }
        
        // Handle Pull Requests
        if (eventType === 'pull_request' && payload.action === 'opened') {
          console.log('🔄 PULL REQUEST DETECTED - Triggering Discord notification');
          await autoReactions.handlePullRequest(eventType, payload);
        }
        
        // Handle Comments on Issues and PRs
        if (eventType === 'issue_comment' && payload.action === 'created') {
          console.log('💬 COMMENT DETECTED - Triggering Discord notification');
          await autoReactions.handleComment(eventType, payload);
        }
        
      } catch (error) {
        console.error('Failed to process automatic reactions:', error);
      }
    });

    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Failed to process GitHub webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/services/github/oauth/url - Get GitHub OAuth URL
router.get('/oauth/url', [
  body('userId').optional().isString().withMessage('User ID must be a string'),
  body('redirectUri').optional().isString().withMessage('Redirect URI must be a string')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = req.body.redirectUri || process.env.GITHUB_REDIRECT_URI || 'http://localhost:8080/api/v1/auth/github/callback';
    const scopes = githubService.getConfig().scopes?.join(' ') || 'repo read:user';

    if (!clientId) {
      return res.status(500).json({
        error: 'GitHub OAuth not configured',
        message: 'GITHUB_CLIENT_ID environment variable is required'
      });
    }

    const state = crypto.randomBytes(16).toString('hex'); // For security
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;

    res.json({
      authUrl,
      state,
      scopes: scopes.split(' ')
    });
  } catch (error) {
    console.error('Failed to generate GitHub OAuth URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions for parameter validation
function validateActionParameters(actionId: string, parameters: any): string | null {
  const requiredFields = ['owner', 'repo'];
  
  for (const field of requiredFields) {
    if (!parameters[field] || typeof parameters[field] !== 'string') {
      return `${field} is required and must be a string`;
    }
  }

  // Action-specific validations
  switch (actionId) {
    case 'new_issue_created':
      // labels is optional
      break;
    case 'pull_request_opened':
      // targetBranch is optional
      break;
    case 'commit_pushed':
      // branch is optional
      break;
    case 'repository_starred':
      // No additional validations
      break;
    default:
      return `Unknown action: ${actionId}`;
  }

  return null;
}

function validateReactionParameters(reactionId: string, parameters: any): string | null {
  switch (reactionId) {
    case 'create_issue':
      if (!parameters.owner || typeof parameters.owner !== 'string') {
        return 'owner is required and must be a string';
      }
      if (!parameters.repo || typeof parameters.repo !== 'string') {
        return 'repo is required and must be a string';
      }
      if (!parameters.title || typeof parameters.title !== 'string') {
        return 'title is required and must be a string';
      }
      break;
    
    case 'comment_on_issue':
      if (!parameters.owner || typeof parameters.owner !== 'string') {
        return 'owner is required and must be a string';
      }
      if (!parameters.repo || typeof parameters.repo !== 'string') {
        return 'repo is required and must be a string';
      }
      if (!parameters.issue_number) {
        return 'issue_number is required';
      }
      if (!parameters.body || typeof parameters.body !== 'string') {
        return 'body is required and must be a string';
      }
      break;
    
    case 'create_repository':
      if (!parameters.name || typeof parameters.name !== 'string') {
        return 'name is required and must be a string';
      }
      break;
    
    default:
      return `Unknown reaction: ${reactionId}`;
  }

  return null;
}

function getRequiredWebhookEvents(actionId: string): string[] {
  switch (actionId) {
    case 'new_issue_created':
      return ['issues'];
    case 'pull_request_opened':
      return ['pull_request'];
    case 'commit_pushed':
      return ['push'];
    case 'repository_starred':
      return ['star'];
    default:
      return [];
  }
}

export default router;
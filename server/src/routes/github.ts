// server/src/routes/github.ts
import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { GitHubService } from '../services/GitHubService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { userStorage } from '../storage/UserStorage';
import { AreaExecutor } from '../services/AreaExecutor';
import crypto from 'crypto';
import { GitHubController } from '../controllers/github.controller';
import { Octokit } from '@octokit/rest';

const router = Router();
const githubService = new GitHubService();

router.get('/oauth/authorize', GitHubController.initiateAuth);
router.get('/oauth/callback', GitHubController.callback);
router.get('/oauth/status', GitHubController.checkStatus);

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

const verifyGitHubWebhook = (req: Request, res: Response, next: any) => {
  const signature = req.get('X-Hub-Signature-256');
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'default-webhook-secret';

  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  let payload: string;
  if (Buffer.isBuffer(req.body)) {
    payload = req.body.toString('utf8');
  } else {
    payload = JSON.stringify(req.body);
  }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')}`;

  if (signature.length !== expectedSignature.length) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    req.body = JSON.parse(payload);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  next();
};

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

router.post('/auth', authenticate, [
  body('accessToken').isString().notEmpty().withMessage('Access token is required')
], handleValidationErrors, async (req: AuthRequest, res: Response) => {
  try {
    const { accessToken } = req.body;
    const userId = req.user!.id;

    const success = await githubService.authenticate(userId, { accessToken });

    if (success) {
      const user = userStorage.findById(userId);
      if (user) {
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `token ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (response.ok) {
            const githubUser: any = await response.json();
            userStorage.updateServices(userId, 'github', {
              accessToken,
              username: githubUser.login
            });
          } else {
            userStorage.updateServices(userId, 'github', { accessToken });
          }
        } catch (error) {
          console.error('Failed to fetch GitHub user info:', error);
          userStorage.updateServices(userId, 'github', { accessToken });
        }
      }

      res.json({
        success: true,
        message: 'GitHub authentication successful',
        service: 'github'
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

router.get('/auth', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAuthenticated = await githubService.isAuthenticated(userId);

    const user = userStorage.findById(userId);
    const githubData = user?.services.github;

    res.json({
      authenticated: isAuthenticated,
      service: 'github',
      username: githubData?.username,
      connectedAt: githubData?.connectedAt
    });
  } catch (error) {
    console.error('Failed to check GitHub authentication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/actions/:actionId/listen', authenticate, [
  param('actionId').isIn(['new_issue_created', 'pull_request_opened', 'commit_pushed', 'repository_starred'])
    .withMessage('Invalid action ID'),
  body('parameters').isObject().withMessage('Parameters object is required')
], handleValidationErrors, async (req: AuthRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const { parameters } = req.body;
    const userId = req.user!.id;

    const isAuthenticated = await githubService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with GitHub first'
      });
    }

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

router.delete('/actions/:actionId/listen', authenticate, [
  param('actionId').isIn(['new_issue_created', 'pull_request_opened', 'commit_pushed', 'repository_starred'])
    .withMessage('Invalid action ID'),
  body('parameters').optional().isObject().withMessage('Parameters must be an object')
], handleValidationErrors, async (req: AuthRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const userId = req.user!.id;

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

router.post('/reactions/:reactionId/execute', authenticate, [
  param('reactionId').isIn(['create_issue', 'comment_on_issue', 'create_repository'])
    .withMessage('Invalid reaction ID'),
  body('parameters').isObject().withMessage('Parameters object is required'),
  body('triggerData').optional().isObject().withMessage('Trigger data must be an object')
], handleValidationErrors, async (req: AuthRequest, res: Response) => {
  try {
    const { reactionId } = req.params;
    const { parameters, triggerData = {} } = req.body;
    const userId = req.user!.id;

    const isAuthenticated = await githubService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User must be authenticated with GitHub first'
      });
    }

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

router.post('/webhook', verifyGitHubWebhook, async (req: Request, res: Response) => {
  try {
    const eventType = req.get('X-GitHub-Event');
    const payload = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'Missing event type header' });
    }

    console.log(`📥 Received GitHub webhook: ${eventType}`);
    
    await githubService.handleWebhookEvent(eventType, payload);
    
    const actionType = getActionTypeFromWebhook(eventType, payload);
    if (actionType) {
      const triggerData = formatTriggerData(eventType, payload);
      await AreaExecutor.executeMatchingAreas('github', actionType, triggerData);
    }

    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Failed to process GitHub webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getActionTypeFromWebhook(eventType: string, payload: any): string | null {
  switch (eventType) {
    case 'issues':
      if (payload.action === 'opened') return 'new_issue_created';
      break;
    case 'pull_request':
      if (payload.action === 'opened') return 'pull_request_opened';
      break;
    case 'push':
      return 'commit_pushed';
    case 'star':
      if (payload.action === 'created') return 'repository_starred';
      break;
  }
  return null;
}

function formatTriggerData(eventType: string, payload: any): any {
  const base = {
    repository: {
      owner: payload.repository?.owner?.login,
      repo: payload.repository?.name,
    }
  };

  switch (eventType) {
    case 'issues':
      return {
        ...base,
        issue: {
          number: payload.issue?.number,
          title: payload.issue?.title,
          body: payload.issue?.body,
          user: {
            login: payload.issue?.user?.login,
            id: payload.issue?.user?.id,
          },
          labels: payload.issue?.labels?.map((l: any) => l.name) || [],
          html_url: payload.issue?.html_url,
        }
      };

    case 'pull_request':
      return {
        ...base,
        pull_request: {
          number: payload.pull_request?.number,
          title: payload.pull_request?.title,
          body: payload.pull_request?.body,
          user: {
            login: payload.pull_request?.user?.login,
            id: payload.pull_request?.user?.id,
          },
          html_url: payload.pull_request?.html_url,
          head: {
            ref: payload.pull_request?.head?.ref,
            sha: payload.pull_request?.head?.sha,
          },
          base: {
            ref: payload.pull_request?.base?.ref,
            sha: payload.pull_request?.base?.sha,
          }
        }
      };

    case 'push':
      return {
        ...base,
        ref: payload.ref,
        commits: payload.commits?.map((c: any) => ({
          id: c.id,
          message: c.message,
          author: {
            name: c.author?.name,
            email: c.author?.email,
          }
        })) || [],
        pusher: {
          name: payload.pusher?.name,
          email: payload.pusher?.email,
        }
      };

    case 'star':
      return {
        ...base,
        sender: {
          login: payload.sender?.login,
          id: payload.sender?.id,
        },
        starred_at: payload.starred_at,
      };

    default:
      return base;
  }
}

router.get('/oauth/url', [
  body('redirectUri').optional().isString().withMessage('Redirect URI must be a string')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = req.body.redirectUri || process.env.GITHUB_REDIRECT_URI || 'http://localhost:8080/api/v1/services/github/oauth/callback';
    const scopes = githubService.getConfig().scopes?.join(' ') || 'repo read:user';

    if (!clientId) {
      return res.status(500).json({
        error: 'GitHub OAuth not configured',
        message: 'GITHUB_CLIENT_ID environment variable is required'
      });
    }

    const state = crypto.randomBytes(16).toString('hex');
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

function validateActionParameters(actionId: string, parameters: any): string | null {
  const requiredFields = ['owner', 'repo'];
  
  for (const field of requiredFields) {
    if (!parameters[field] || typeof parameters[field] !== 'string') {
      return `${field} is required and must be a string`;
    }
  }

  switch (actionId) {
    case 'new_issue_created':
    case 'pull_request_opened':
    case 'commit_pushed':
    case 'repository_starred':
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


// GET user repositories
router.get('/repositories', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const user = userStorage.findById(userId);
    const githubData = user?.services?.github;
    
    if (!githubData?.accessToken) {
      return res.status(401).json({ error: 'GitHub not authenticated' });
    }
    
    const octokit = new Octokit({
      auth: githubData.accessToken
    });
    
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      affiliation: 'owner,collaborator'
    });
    
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      description: repo.description,
      url: repo.html_url
    }));
    
    res.json({ repositories: formattedRepos });
  } catch (error: any) {
    console.error('Failed to fetch repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

export default router;
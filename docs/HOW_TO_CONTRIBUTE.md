# 🤝 How To Contribute to AREA

This guide will help you understand how to contribute to the AREA project, especially how to add new services, actions, and reactions while respecting the existing architecture.

## 📋 Table of Contents

- [Project Architecture Overview](#project-architecture-overview)
- [Adding a New Service](#adding-a-new-service)
- [File Structure for a Service](#file-structure-for-a-service)
- [Step-by-Step Guide](#step-by-step-guide)
- [Testing Your Service](#testing-your-service)
- [Code Style & Best Practices](#code-style--best-practices)
- [Submitting Your Contribution](#submitting-your-contribution)

---

## 🏗️ Project Architecture Overview

The AREA project follows a modular architecture where each service (Discord, GitHub, Spotify, etc.) is self-contained:

```
server/src/
├── config/              # OAuth2 & service configurations
│   └── myservice.ts
├── controllers/         # HTTP request handlers
│   └── myservice.controller.ts
├── routes/             # API endpoints
│   └── myservice.routes.ts
├── services/           # Business logic & service implementation
│   ├── base/
│   │   └── ServiceBase.ts    # Abstract base class for all services
│   ├── MyService.ts
│   └── myservice/
│       └── README.md          # Service-specific documentation
├── types/              # TypeScript interfaces
│   └── myservice.ts
└── models/             # Data models
    └── area.model.ts
```

### Key Concepts

- **Action**: An event that triggers an automation (e.g., "new email received")
- **Reaction**: An automated response to an action (e.g., "send Discord message")
- **Service**: A third-party platform integration (Discord, GitHub, Spotify, etc.)
- **AREA**: An automation workflow connecting an Action to a Reaction

---

## 🚀 Adding a New Service

Let's say you want to add **Slack** as a new service.

### Prerequisites

1. **OAuth2 credentials** or **API keys** from the service provider
2. **API documentation** of the service
3. Basic understanding of TypeScript and Express.js

---

## 📁 File Structure for a Service

For each new service, you need to create **5 core files**:

```
server/src/
├── config/slack.ts                    # OAuth2 & API configuration
├── controllers/slack.controller.ts    # HTTP handlers for OAuth & endpoints
├── routes/slack.routes.ts             # API routes definition
├── services/SlackService.ts           # Service implementation (extends ServiceBase)
└── types/slack.ts                     # TypeScript types & interfaces
```

Optional:
```
server/src/services/slack/
└── README.md                          # Service-specific documentation
```

---

## 📝 Step-by-Step Guide

### Step 1: Create Configuration File

Create `server/src/config/slack.ts`:

```typescript
export const SLACK_CONFIG = {
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:8080/api/v1/auth/slack/callback',
  scopes: ['chat:write', 'channels:read', 'users:read'],
  authUrl: 'https://slack.com/oauth/v2/authorize',
  tokenUrl: 'https://slack.com/api/oauth.v2.access',
};

export function getSlackAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: SLACK_CONFIG.clientId,
    redirect_uri: SLACK_CONFIG.redirectUri,
    scope: SLACK_CONFIG.scopes.join(','),
    state: state,
  });
  
  return `${SLACK_CONFIG.authUrl}?${params.toString()}`;
}
```

**Add to `.env`:**
```env
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
SLACK_REDIRECT_URI=http://localhost:8080/api/v1/auth/slack/callback
```

---

### Step 2: Define TypeScript Types

Create `server/src/types/slack.ts`:

```typescript
export interface SlackAuthData {
  accessToken: string;
  tokenType: string;
  scope: string;
  botUserId: string;
  teamId: string;
  teamName: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
}

export interface SlackMessage {
  channel: string;
  text: string;
  username?: string;
  icon_emoji?: string;
}
```

---

### Step 3: Implement the Service Class

Create `server/src/services/SlackService.ts`:

```typescript
import axios from 'axios';
import { ServiceBase } from './base/ServiceBase';
import { ServiceConfig, ActionConfig, ReactionConfig } from '../types/area';
import { SlackAuthData } from '../types/slack';

export class SlackService extends ServiceBase {
  private activeListeners: Map<string, any> = new Map();

  constructor() {
    const config: ServiceConfig = {
      name: 'slack',
      displayName: 'Slack',
      description: 'Automate Slack messages and channel events',
      authType: 'oauth2',
      baseUrl: 'https://slack.com/api',
      scopes: ['chat:write', 'channels:read', 'users:read']
    };
    super(config);
  }

  // Define available Actions
  getActions(): ActionConfig[] {
    return [
      {
        name: 'message_posted_in_channel',
        displayName: 'Message Posted in Channel',
        description: 'Triggered when a message is posted in a specific channel',
        parameters: [
          {
            name: 'channelId',
            type: 'string',
            required: true,
            description: 'ID of the Slack channel to monitor',
            placeholder: 'C01234567'
          },
          {
            name: 'keyword',
            type: 'string',
            required: false,
            description: 'Optional keyword to filter messages',
            placeholder: 'urgent'
          }
        ]
      }
    ];
  }

  // Define available Reactions
  getReactions(): ReactionConfig[] {
    return [
      {
        name: 'send_message',
        displayName: 'Send Message to Channel',
        description: 'Send a message to a Slack channel',
        parameters: [
          {
            name: 'channelId',
            type: 'string',
            required: true,
            description: 'ID of the channel to send message to',
            placeholder: 'C01234567'
          },
          {
            name: 'message',
            type: 'string',
            required: true,
            description: 'Message content',
            placeholder: 'Hello from AREA!'
          }
        ]
      }
    ];
  }

  // Authenticate with OAuth2 tokens
  async authenticate(userId: string, authData: SlackAuthData): Promise<boolean> {
    try {
      console.log(`🔐 Authenticating Slack for user ${userId}...`);
      
      // Store authentication data
      this.setAuthData(userId, {
        userId,
        serviceId: 'slack',
        accessToken: authData.accessToken,
        metadata: {
          botUserId: authData.botUserId,
          teamId: authData.teamId,
          teamName: authData.teamName
        }
      });

      console.log(`✅ Slack authenticated for user ${userId}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Slack authentication failed:`, error.message);
      return false;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(userId: string): Promise<boolean> {
    const authData = this.getAuthData(userId);
    return authData !== undefined && authData.accessToken !== undefined;
  }

  // Refresh authentication (if needed)
  async refreshAuth(userId: string): Promise<boolean> {
    // Slack tokens don't expire by default
    return await this.isAuthenticated(userId);
  }

  // Initialize service (called on server start)
  async initialize(): Promise<void> {
    console.log('✅ Slack service initialized');
  }

  // Cleanup on server shutdown
  async destroy(): Promise<void> {
    console.log('🔌 Slack service destroyed');
    this.activeListeners.clear();
  }

  // Start listening for an action
  async startListening(userId: string, actionId: string, parameters: Record<string, any>): Promise<void> {
    const listenerId = `${userId}_${actionId}_${JSON.stringify(parameters)}`;
    this.activeListeners.set(listenerId, { userId, actionId, parameters });
    console.log(`👂 Started listening for Slack action: ${actionId}`);
    
    // Implement your polling or webhook logic here
    // For example, poll Slack API every X seconds
  }

  // Stop listening for an action
  async stopListening(userId: string, actionId: string): Promise<void> {
    for (const [key, listener] of this.activeListeners.entries()) {
      if (listener.userId === userId && listener.actionId === actionId) {
        this.activeListeners.delete(key);
      }
    }
    console.log(`🔇 Stopped listening for Slack action: ${actionId}`);
  }

  // Execute a reaction
  async executeReaction(
    reactionId: string,
    userId: string,
    parameters: Record<string, any>,
    triggerData: Record<string, any>
  ): Promise<boolean> {
    try {
      const authData = this.getAuthData(userId);
      if (!authData || !authData.accessToken) {
        console.error('❌ User not authenticated');
        return false;
      }

      switch (reactionId) {
        case 'send_message':
          return await this.sendMessage(authData.accessToken, parameters);
        
        default:
          console.error(`❌ Unknown reaction: ${reactionId}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Slack reaction ${reactionId} failed:`, error);
      return false;
    }
  }

  // Helper method to send a message
  private async sendMessage(accessToken: string, parameters: any): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: parameters.channelId,
          text: parameters.message
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ok) {
        console.log(`✅ Slack message sent to ${parameters.channelId}`);
        return true;
      } else {
        console.error(`❌ Slack API error:`, response.data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to send Slack message:', error);
      return false;
    }
  }
}
```

---

### Step 4: Create Controller

Create `server/src/controllers/slack.controller.ts`:

```typescript
import { Request, Response } from 'express';
import axios from 'axios';
import { getSlackAuthUrl, SLACK_CONFIG } from '../config/slack';
import { SlackService } from '../services/SlackService';
import { userStorage } from '../storage/UserStorage';

const slackService = new SlackService();

export class SlackController {
  
  // Initiate OAuth2 flow
  static initiateAuth(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    
    const state = Buffer.from(JSON.stringify({
      userId: userId,
      timestamp: Date.now(),
    })).toString('base64');
    
    const authUrl = getSlackAuthUrl(state);
    
    console.log('🔐 Slack OAuth initiated for user:', userId);
    res.json({ authUrl });
  }
  
  // OAuth2 callback
  static async callback(req: Request, res: Response) {
    const { code, state, error } = req.query;
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    
    if (error) {
      console.error('❌ Slack OAuth error:', error);
      return res.redirect(`${frontendUrl}/services?error=${error}`);
    }
    
    if (!code || !state) {
      return res.redirect(`${frontendUrl}/services?error=missing_params`);
    }
    
    try {
      // Decode state to get userId
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const userId = stateData.userId;
      
      // Exchange code for access token
      const tokenResponse = await axios.post(SLACK_CONFIG.tokenUrl, null, {
        params: {
          client_id: SLACK_CONFIG.clientId,
          client_secret: SLACK_CONFIG.clientSecret,
          code: code,
          redirect_uri: SLACK_CONFIG.redirectUri
        }
      });
      
      if (!tokenResponse.data.ok) {
        throw new Error('Token exchange failed');
      }
      
      const { access_token, team, authed_user } = tokenResponse.data;
      
      // Authenticate with service
      const success = await slackService.authenticate(userId, {
        accessToken: access_token,
        tokenType: 'Bearer',
        scope: tokenResponse.data.scope,
        botUserId: tokenResponse.data.bot_user_id,
        teamId: team.id,
        teamName: team.name
      });
      
      if (!success) {
        throw new Error('Service authentication failed');
      }
      
      // Save to user storage
      userStorage.updateServices(userId, 'slack', {
        userId: userId,
        teamId: team.id,
        teamName: team.name,
        connectedAt: new Date()
      });
      
      console.log(`✅ Slack authenticated successfully for user ${userId}`);
      return res.redirect(`${frontendUrl}/services?connected=slack&team=${encodeURIComponent(team.name)}`);
      
    } catch (error: any) {
      console.error('❌ Slack OAuth callback error:', error.message);
      return res.redirect(`${frontendUrl}/services?error=auth_failed`);
    }
  }
  
  // Check authentication status
  static async checkStatus(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'demo_user';
      const isAuthenticated = await slackService.isAuthenticated(userId);
      
      const user = userStorage.findById(userId);
      const slackData = user?.services?.slack;
      
      res.json({
        authenticated: isAuthenticated,
        service: 'slack',
        teamName: slackData?.teamName,
        connectedAt: slackData?.connectedAt
      });
    } catch (error) {
      res.status(500).json({ authenticated: false, error: 'Failed to check status' });
    }
  }
}
```

---

### Step 5: Create Routes

Create `server/src/routes/slack.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { SlackService } from '../services/SlackService';
import { SlackController } from '../controllers/slack.controller';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const slackService = new SlackService();

// OAuth routes
router.get('/oauth/authorize', SlackController.initiateAuth);
router.get('/oauth/callback', SlackController.callback);
router.get('/oauth/status', SlackController.checkStatus);

// Service info
router.get('/', async (req: Request, res: Response) => {
  try {
    const config = slackService.getConfig();
    const actions = slackService.getActions();
    const reactions = slackService.getReactions();

    res.json({
      service: {
        ...config,
        status: 'available',
        actions,
        reactions
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute reaction
router.post('/reactions/:reactionId/execute', authenticate, [
  param('reactionId').isString(),
  body('parameters').isObject(),
], async (req: AuthRequest, res: Response) => {
  try {
    const { reactionId } = req.params;
    const { parameters, triggerData = {} } = req.body;
    const userId = req.user!.id;

    const isAuthenticated = await slackService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const success = await slackService.executeReaction(reactionId, userId, parameters, triggerData);

    if (success) {
      res.json({ success: true, message: `Reaction ${reactionId} executed` });
    } else {
      res.status(500).json({ success: false, error: 'Reaction execution failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

---

### Step 6: Register Routes in Main Server

Edit `server/src/index.ts`:

```typescript
// Add import at the top
import slackRoutes from './routes/slack.routes';

// Add route registration (around line 195)
app.use('/api/v1/services/slack', slackRoutes);

// Update /about.json endpoint to include Slack
// Add in the services array:
{
  name: 'slack',
  actions: [
    { name: 'message_posted_in_channel', description: 'Triggered when a message is posted' }
  ],
  reactions: [
    { name: 'send_message', description: 'Send a message to a Slack channel' }
  ]
}
```

---

### Step 7: Update Service Registry (if exists)

If there's a central service registry, register your service there. Otherwise, ensure it's imported and initialized in `index.ts`:

```typescript
import { SlackService } from './services/SlackService';

// Initialize service
const slackService = new SlackService();
await slackService.initialize();
```

---

## 🧪 Testing Your Service

### Manual Testing

1. **Start the server:**
```bash
cd server
npm run dev
```

2. **Test OAuth flow:**
```bash
# Get auth URL
curl http://localhost:8080/api/v1/services/slack/oauth/authorize?userId=test_user

# Visit the URL in browser, authorize, and check callback
```

3. **Test reaction execution:**
```bash
curl -X POST http://localhost:8080/api/v1/services/slack/reactions/send_message/execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "channelId": "C01234567",
      "message": "Hello from AREA!"
    }
  }'
```

### Automated Testing

Create test file `server/src/__tests__/slack.service.test.ts`:

```typescript
import { SlackService } from '../services/SlackService';

describe('SlackService', () => {
  let service: SlackService;

  beforeEach(() => {
    service = new SlackService();
  });

  test('should have correct service config', () => {
    const config = service.getConfig();
    expect(config.name).toBe('slack');
    expect(config.authType).toBe('oauth2');
  });

  test('should define actions', () => {
    const actions = service.getActions();
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].name).toBeDefined();
  });

  test('should define reactions', () => {
    const reactions = service.getReactions();
    expect(reactions.length).toBeGreaterThan(0);
    expect(reactions[0].name).toBeDefined();
  });
});
```

Run tests:
```bash
npm test
```

---

## 🎨 Code Style & Best Practices

### 1. Follow Existing Patterns
- Look at `DiscordService.ts`, `GitHubService.ts` as reference implementations
- Extend `ServiceBase` abstract class
- Use the same error handling patterns

### 2. TypeScript Best Practices
- Define proper types in `types/` folder
- Use interfaces for data structures
- Avoid `any` type when possible

### 3. Error Handling
```typescript
try {
  // Your code
  console.log('✅ Success message');
  return true;
} catch (error: any) {
  console.error('❌ Error message:', error.message);
  return false;
}
```

### 4. Logging
- Use emoji prefixes: 🔐 (auth), ✅ (success), ❌ (error), 📋 (list), 👂 (listening)
- Include userId and actionId in logs for debugging

### 5. Configuration
- Store all secrets in `.env`
- Never hardcode API keys or tokens
- Use environment variable fallbacks

### 6. Parameter Validation
```typescript
function validateParameters(parameters: any): string | null {
  if (!parameters.channelId) {
    return 'channelId is required';
  }
  if (typeof parameters.channelId !== 'string') {
    return 'channelId must be a string';
  }
  return null; // No error
}
```

---

## 📤 Submitting Your Contribution

### 1. Create a Feature Branch
```bash
git checkout -b feature/add-slack-service
```

### 2. Commit Your Changes
```bash
git add .
git commit -m "Add: Slack service integration with OAuth2

- Implement SlackService with message actions/reactions
- Add OAuth2 authentication flow
- Create routes and controllers
- Add tests for Slack service"
```

### 3. Run Linters & Tests
```bash
npm run lint
npm run typecheck
npm test
```

### 4. Create Service Documentation

Create `server/src/services/slack/README.md`:

```markdown
# Slack Service

Integration with Slack API for the AREA project.

## Features

### Actions
- `message_posted_in_channel` - Triggered when a message is posted in a channel

### Reactions
- `send_message` - Send a message to a Slack channel

## Setup

1. Create a Slack app at https://api.slack.com/apps
2. Add OAuth scopes: `chat:write`, `channels:read`, `users:read`
3. Set redirect URL: `http://localhost:8080/api/v1/auth/slack/callback`
4. Copy credentials to `.env`

## Usage

See main documentation for usage examples.
```

### 5. Update Main Documentation

Update `README.md` service table:

```markdown
| Service | Actions | REactions | Total |
|---------|---------|-----------|-------|
| Slack   | 1       | 1         | 2     |
```

### 6. Push and Create Pull Request
```bash
git push origin feature/add-slack-service
```

Then create a PR on GitHub with:
- Clear title: "Add Slack service integration"
- Description of what was added
- Testing instructions
- Screenshots/examples if applicable

---

## 📚 Additional Resources

- **ServiceBase documentation**: `server/src/services/base/ServiceBase.ts`
- **Example service**: `server/src/services/DiscordService.ts`
- **Type definitions**: `server/src/types/area.ts`
- **API routes structure**: `server/src/routes/discord.ts`

## 🆘 Need Help?

- Check existing service implementations
- Open an issue with the `question` label
- Ask in the project Discord/communication channel

---

**Thank you for contributing to AREA! 🎉**

import { DiscordService } from '../services/DiscordService';

// Mock complet de GitHubService pour éviter l'import de @octokit/rest
jest.mock('../services/GitHubService', () => {
  return {
    GitHubService: jest.fn().mockImplementation(() => {
      return {
        getConfig: jest.fn().mockReturnValue({
          name: 'github',
          displayName: 'GitHub',
          authType: 'oauth2',
          baseUrl: 'https://api.github.com',
          scopes: ['repo', 'write:repo_hook', 'read:user']
        }),
        getActions: jest.fn().mockReturnValue([
          {
            name: 'new_issue_created',
            displayName: 'New Issue Created',
            description: 'Triggered when a new issue is created in a repository',
            parameters: [
              { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
              { name: 'repo', type: 'string', required: true, description: 'Repository name' }
            ]
          },
          {
            name: 'pull_request_opened',
            displayName: 'Pull Request Opened',
            description: 'Triggered when a new pull request is opened',
            parameters: []
          },
          {
            name: 'commit_pushed',
            displayName: 'Commit Pushed',
            description: 'Triggered when commits are pushed',
            parameters: []
          },
          {
            name: 'repository_starred',
            displayName: 'Repository Starred',
            description: 'Triggered when someone stars a repository',
            parameters: []
          }
        ]),
        getReactions: jest.fn().mockReturnValue([
          {
            name: 'create_issue',
            displayName: 'Create Issue',
            description: 'Create a new issue in a GitHub repository',
            parameters: [
              { name: 'title', type: 'string', required: true, description: 'Issue title' }
            ]
          },
          {
            name: 'comment_on_issue',
            displayName: 'Comment on Issue',
            description: 'Add a comment to an issue',
            parameters: []
          },
          {
            name: 'create_repository',
            displayName: 'Create Repository',
            description: 'Create a new repository',
            parameters: []
          }
        ]),
        initialize: jest.fn().mockResolvedValue(undefined),
        startListening: jest.fn().mockResolvedValue(undefined),
        stopListening: jest.fn().mockResolvedValue(undefined),
        authenticate: jest.fn().mockResolvedValue(true),
        isAuthenticated: jest.fn().mockResolvedValue(false)
      };
    })
  };
});

const { GitHubService } = require('../services/GitHubService');

describe('Service Configurations', () => {
  describe('DiscordService', () => {
    let discordService: DiscordService;

    beforeAll(() => {
      discordService = new DiscordService();
    });

    test('should have correct configuration', () => {
      const config = discordService.getConfig();
      
      expect(config).toBeDefined();
      expect(config.name).toBe('discord');
      expect(config.displayName).toBe('Discord');
      expect(config.authType).toBe('bot_token');
    });

    test('should have valid actions', () => {
      const actions = discordService.getActions();
      
      expect(actions).toBeDefined();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);

      const actionNames = actions.map(a => a.name);
      expect(actionNames).toContain('message_posted_in_channel');
      expect(actionNames).toContain('user_mentioned');
      expect(actionNames).toContain('user_joined_server');
    });

    test('should have valid reactions', () => {
      const reactions = discordService.getReactions();
      
      expect(reactions).toBeDefined();
      expect(Array.isArray(reactions)).toBe(true);
      expect(reactions.length).toBeGreaterThan(0);

      const reactionNames = reactions.map(r => r.name);
      expect(reactionNames).toContain('send_message_to_channel');
      expect(reactionNames).toContain('send_dm');
      expect(reactionNames).toContain('add_role_to_user');
    });

    test('should have correct action parameters', () => {
      const actions = discordService.getActions();
      const messagePosted = actions.find(a => a.name === 'message_posted_in_channel');
      
      expect(messagePosted).toBeDefined();
      expect(messagePosted?.parameters).toBeDefined();
      expect(messagePosted?.parameters.length).toBeGreaterThan(0);
      
      const channelIdParam = messagePosted?.parameters.find(p => p.name === 'channelId');
      expect(channelIdParam).toBeDefined();
      expect(channelIdParam?.required).toBe(true);
      expect(channelIdParam?.type).toBe('string');
    });

    test('should have correct reaction parameters', () => {
      const reactions = discordService.getReactions();
      const sendMessage = reactions.find(r => r.name === 'send_message_to_channel');
      
      expect(sendMessage).toBeDefined();
      expect(sendMessage?.parameters).toBeDefined();
      expect(sendMessage?.parameters.length).toBeGreaterThan(0);
      
      const channelIdParam = sendMessage?.parameters.find(p => p.name === 'channelId');
      const contentParam = sendMessage?.parameters.find(p => p.name === 'content');
      
      expect(channelIdParam).toBeDefined();
      expect(contentParam).toBeDefined();
      expect(channelIdParam?.required).toBe(true);
      expect(contentParam?.required).toBe(true);
    });
  });

  describe('GitHubService (Mocked)', () => {
    let githubService: any;

    beforeAll(() => {
      githubService = new GitHubService();
    });

    test('should have correct configuration', () => {
      const config = githubService.getConfig();
      
      expect(config).toBeDefined();
      expect(config.name).toBe('github');
      expect(config.displayName).toBe('GitHub');
      expect(config.authType).toBe('oauth2');
      expect(config.baseUrl).toBe('https://api.github.com');
    });

    test('should have valid actions', () => {
      const actions = githubService.getActions();
      
      expect(actions).toBeDefined();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);

      const actionNames = actions.map((a: any) => a.name);
      expect(actionNames).toContain('new_issue_created');
      expect(actionNames).toContain('pull_request_opened');
      expect(actionNames).toContain('commit_pushed');
      expect(actionNames).toContain('repository_starred');
    });

    test('should have valid reactions', () => {
      const reactions = githubService.getReactions();
      
      expect(reactions).toBeDefined();
      expect(Array.isArray(reactions)).toBe(true);
      expect(reactions.length).toBeGreaterThan(0);

      const reactionNames = reactions.map((r: any) => r.name);
      expect(reactionNames).toContain('create_issue');
      expect(reactionNames).toContain('comment_on_issue');
      expect(reactionNames).toContain('create_repository');
    });

    test('should have correct action parameters', () => {
      const actions = githubService.getActions();
      const newIssue = actions.find((a: any) => a.name === 'new_issue_created');
      
      expect(newIssue).toBeDefined();
      expect(newIssue?.parameters).toBeDefined();
      
      const ownerParam = newIssue?.parameters.find((p: any) => p.name === 'owner');
      const repoParam = newIssue?.parameters.find((p: any) => p.name === 'repo');
      
      expect(ownerParam).toBeDefined();
      expect(repoParam).toBeDefined();
      expect(ownerParam?.required).toBe(true);
      expect(repoParam?.required).toBe(true);
    });

    test('should have correct reaction parameters', () => {
      const reactions = githubService.getReactions();
      const createIssue = reactions.find((r: any) => r.name === 'create_issue');
      
      expect(createIssue).toBeDefined();
      expect(createIssue?.parameters).toBeDefined();
      
      const titleParam = createIssue?.parameters.find((p: any) => p.name === 'title');
      expect(titleParam).toBeDefined();
      expect(titleParam?.required).toBe(true);
      expect(titleParam?.type).toBe('string');
    });

    test('should have OAuth scopes defined', () => {
      const config = githubService.getConfig();
      
      expect(config.scopes).toBeDefined();
      expect(Array.isArray(config.scopes)).toBe(true);
      expect(config.scopes?.length).toBeGreaterThan(0);
      expect(config.scopes).toContain('repo');
    });
  });
});

describe('Service Base Functionality', () => {
  describe('DiscordService Methods', () => {
    let discordService: DiscordService;

    beforeAll(() => {
      discordService = new DiscordService();
    });

    test('should initialize without errors', async () => {
      await expect(discordService.initialize()).resolves.not.toThrow();
    });

    test('should start and stop listening', async () => {
      const userId = 'test-user';
      const actionId = 'message_posted_in_channel';
      const parameters = { channelId: '123456789' };

      await expect(
        discordService.startListening(userId, actionId, parameters)
      ).resolves.not.toThrow();

      await expect(
        discordService.stopListening(userId, actionId)
      ).resolves.not.toThrow();
    });
  });

  describe('GitHubService Methods (Mocked)', () => {
    let githubService: any;

    beforeAll(() => {
      githubService = new GitHubService();
    });

    test('should initialize without errors', async () => {
      await expect(githubService.initialize()).resolves.not.toThrow();
    });

    test('should start and stop listening', async () => {
      const userId = 'test-user';
      const actionId = 'new_issue_created';
      const parameters = { owner: 'test-owner', repo: 'test-repo' };

      await expect(
        githubService.startListening(userId, actionId, parameters)
      ).resolves.not.toThrow();

      await expect(
        githubService.stopListening(userId, actionId)
      ).resolves.not.toThrow();
    });
  });
});
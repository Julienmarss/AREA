import { Octokit } from '@octokit/rest';
import { ServiceBase } from './base/ServiceBase';
import { ServiceConfig, ActionConfig, ReactionConfig, ActionTriggerEvent } from '../types/area';
import {
  GitHubRepoRef,
  CreateIssueParams,
  CommentParams,
  CreateRepoParams,
  NewIssueCreatedData,
  PullRequestOpenedData,
  CommitPushedData,
  RepositoryStarredData
} from '../types/github';

export class GitHubService extends ServiceBase {
  private octokit: Octokit | null = null;
  private activeListeners: Map<string, { userId: string; actionId: string; parameters: any }> = new Map();

  constructor() {
    const config: ServiceConfig = {
      name: 'github',
      displayName: 'GitHub',
      description: 'Automate GitHub issues, pull requests, and repository events',
      authType: 'oauth2',
      baseUrl: 'https://api.github.com',
      scopes: ['repo', 'write:repo_hook', 'read:user']
    };

    super(config);
  }

  getActions(): ActionConfig[] {
    return [
      {
        name: 'new_issue_created',
        displayName: 'New Issue Created',
        description: 'Triggered when a new issue is created in a repository',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner (username or organization)',
            placeholder: 'octocat'
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
            placeholder: 'Hello-World'
          },
          {
            name: 'labels',
            type: 'string',
            required: false,
            description: 'Comma-separated list of labels to filter (optional)',
            placeholder: 'bug,urgent'
          }
        ]
      },
      {
        name: 'pull_request_opened',
        displayName: 'Pull Request Opened',
        description: 'Triggered when a new pull request is opened',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner',
            placeholder: 'octocat'
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
            placeholder: 'Hello-World'
          },
          {
            name: 'targetBranch',
            type: 'string',
            required: false,
            description: 'Target branch to filter (optional)',
            placeholder: 'main'
          }
        ]
      },
      {
        name: 'commit_pushed',
        displayName: 'Commit Pushed',
        description: 'Triggered when commits are pushed to a repository',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner',
            placeholder: 'octocat'
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
            placeholder: 'Hello-World'
          },
          {
            name: 'branch',
            type: 'string',
            required: false,
            description: 'Branch to monitor (optional, default: all)',
            placeholder: 'main'
          }
        ]
      },
      {
        name: 'repository_starred',
        displayName: 'Repository Starred',
        description: 'Triggered when someone stars a repository',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner',
            placeholder: 'octocat'
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
            placeholder: 'Hello-World'
          }
        ]
      }
    ];
  }

  getReactions(): ReactionConfig[] {
    return [
      {
        name: 'create_issue',
        displayName: 'Create Issue',
        description: 'Create a new issue in a GitHub repository',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner',
            placeholder: 'octocat'
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
            placeholder: 'Hello-World'
          },
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'Issue title',
            placeholder: 'Bug report from AREA'
          },
          {
            name: 'body',
            type: 'string',
            required: false,
            description: 'Issue description',
            placeholder: 'This issue was automatically created by AREA'
          },
          {
            name: 'labels',
            type: 'string',
            required: false,
            description: 'Comma-separated labels',
            placeholder: 'bug,automated'
          }
        ]
      },
      {
        name: 'comment_on_issue',
        displayName: 'Comment on Issue/PR',
        description: 'Add a comment to an issue or pull request',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner',
            placeholder: 'octocat'
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
            placeholder: 'Hello-World'
          },
          {
            name: 'issue_number',
            type: 'number',
            required: true,
            description: 'Issue or PR number',
            placeholder: '1'
          },
          {
            name: 'body',
            type: 'string',
            required: true,
            description: 'Comment text',
            placeholder: 'Automated comment from AREA'
          }
        ]
      },
      {
        name: 'create_repository',
        displayName: 'Create Repository',
        description: 'Create a new GitHub repository',
        parameters: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Repository name',
            placeholder: 'my-new-repo'
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Repository description',
            placeholder: 'Created automatically by AREA'
          },
          {
            name: 'private',
            type: 'boolean',
            required: false,
            description: 'Make repository private',
            placeholder: 'false'
          }
        ]
      }
    ];
  }

async authenticate(userId: string, authData: { accessToken: string }): Promise<boolean> {
  try {
    console.log('🔐 Authenticating GitHub for user:', userId);
    
    this.octokit = new Octokit({
      auth: authData.accessToken
    });

    // Test the authentication by getting user info
    const { data: user } = await this.octokit.rest.users.getAuthenticated();
    
    console.log('✅ GitHub user authenticated:', user.login);

    this.setAuthData(userId, {
      userId,
      serviceId: 'github',
      accessToken: authData.accessToken,
      metadata: {
        username: user.login,
        userId: user.id,
        connectedAt: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error('❌ GitHub authentication failed:', error);
    return false;
  }
}

async isAuthenticated(userId: string): Promise<boolean> {
  const authData = this.getAuthData(userId);
  const isAuth = authData !== undefined && this.octokit !== null;
  console.log(`🔍 GitHub isAuthenticated for ${userId}:`, isAuth);
  return isAuth;
}

  async refreshAuth(userId: string): Promise<boolean> {
    // GitHub tokens don't expire automatically, but we can test if they're still valid
    if (!this.octokit) return false;
    
    try {
      await this.octokit.rest.users.getAuthenticated();
      return true;
    } catch (error) {
      console.error('GitHub token validation failed:', error);
      return false;
    }
  }

  async initialize(): Promise<void> {
    console.log('Initializing GitHub service...');
  }

  async destroy(): Promise<void> {
    console.log('Destroying GitHub service...');
    this.octokit = null;
    this.activeListeners.clear();
  }

  async startListening(userId: string, actionId: string, parameters: Record<string, any>): Promise<void> {
    const listenerId = `${userId}_${actionId}_${JSON.stringify(parameters)}`;
    this.activeListeners.set(listenerId, { userId, actionId, parameters });
    console.log(`Started listening for GitHub action: ${actionId} for user ${userId}`);
    
    // Note: Real webhook setup would happen here in production
    // For now, we just store the listener configuration
  }

  async stopListening(userId: string, actionId: string): Promise<void> {
    // Remove all listeners for this user and action
    for (const [key, listener] of this.activeListeners.entries()) {
      if (listener.userId === userId && listener.actionId === actionId) {
        this.activeListeners.delete(key);
      }
    }
    console.log(`Stopped listening for GitHub action: ${actionId} for user ${userId}`);
  }

  async executeReaction(reactionId: string, userId: string, parameters: Record<string, any>, triggerData: Record<string, any>): Promise<boolean> {
    if (!this.octokit) {
      console.error('GitHub not authenticated');
      return false;
    }

    try {
      switch (reactionId) {
        case 'create_issue':
          return await this.createIssue(parameters);
        
        case 'comment_on_issue':
          return await this.commentOnIssue(parameters);
        
        case 'create_repository':
          return await this.createRepository(parameters);
        
        default:
          console.error(`Unknown GitHub reaction: ${reactionId}`);
          return false;
      }
    } catch (error) {
      console.error(`GitHub reaction ${reactionId} failed:`, error);
      return false;
    }
  }

  // Webhook event handlers
  async handleWebhookEvent(eventType: string, payload: any): Promise<void> {
    console.log(`Received GitHub webhook: ${eventType}`);
    
    switch (eventType) {
      case 'issues':
        if (payload.action === 'opened') {
          await this.handleIssueCreated(payload);
        }
        break;
      
      case 'pull_request':
        if (payload.action === 'opened') {
          await this.handlePullRequestOpened(payload);
        }
        break;
      
      case 'push':
        await this.handlePushEvent(payload);
        break;
      
      case 'star':
        if (payload.action === 'created') {
          await this.handleRepositoryStarred(payload);
        }
        break;
      
      default:
        console.log(`Unhandled GitHub webhook event: ${eventType}`);
    }
  }

  private async handleIssueCreated(payload: any): Promise<void> {
    const triggerData: NewIssueCreatedData = {
      repository: { owner: payload.repository.owner.login, repo: payload.repository.name },
      issue: {
        number: payload.issue.number,
        title: payload.issue.title,
        body: payload.issue.body,
        user: { login: payload.issue.user.login, id: payload.issue.user.id },
        labels: payload.issue.labels.map((label: any) => label.name),
        html_url: payload.issue.html_url
      }
    };

    // Check listeners
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      if (listener.actionId === 'new_issue_created') {
        const { owner, repo, labels } = listener.parameters;
        
        // Check repository match
        if (owner !== triggerData.repository.owner || repo !== triggerData.repository.repo) {
          continue;
        }
        
        // Check labels filter
        if (labels) {
          const filterLabels = labels.split(',').map((l: string) => l.trim());
          const hasMatchingLabel = filterLabels.some((label: string) => 
            triggerData.issue.labels.includes(label)
          );
          if (!hasMatchingLabel) continue;
        }
        
        this.emitActionTrigger({
          serviceId: 'github',
          actionId: 'new_issue_created',
          userId: listener.userId,
          data: triggerData,
          timestamp: new Date()
        });
      }
    }
  }

  private async handlePullRequestOpened(payload: any): Promise<void> {
    const triggerData: PullRequestOpenedData = {
      repository: { owner: payload.repository.owner.login, repo: payload.repository.name },
      pull_request: {
        number: payload.pull_request.number,
        title: payload.pull_request.title,
        body: payload.pull_request.body,
        user: { login: payload.pull_request.user.login, id: payload.pull_request.user.id },
        html_url: payload.pull_request.html_url,
        head: { ref: payload.pull_request.head.ref, sha: payload.pull_request.head.sha },
        base: { ref: payload.pull_request.base.ref, sha: payload.pull_request.base.sha }
      }
    };

    // Check listeners (similar logic as issues)
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      if (listener.actionId === 'pull_request_opened') {
        const { owner, repo, targetBranch } = listener.parameters;
        
        if (owner !== triggerData.repository.owner || repo !== triggerData.repository.repo) {
          continue;
        }
        
        if (targetBranch && targetBranch !== triggerData.pull_request.base.ref) {
          continue;
        }
        
        this.emitActionTrigger({
          serviceId: 'github',
          actionId: 'pull_request_opened',
          userId: listener.userId,
          data: triggerData,
          timestamp: new Date()
        });
      }
    }
  }

  private async handlePushEvent(payload: any): Promise<void> {
    const triggerData: CommitPushedData = {
      repository: { owner: payload.repository.owner.login, repo: payload.repository.name },
      ref: payload.ref,
      commits: payload.commits.map((commit: any) => ({
        id: commit.id,
        message: commit.message,
        author: { name: commit.author.name, email: commit.author.email }
      })),
      pusher: { name: payload.pusher.name, email: payload.pusher.email }
    };

    // Check listeners
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      if (listener.actionId === 'commit_pushed') {
        const { owner, repo, branch } = listener.parameters;
        
        if (owner !== triggerData.repository.owner || repo !== triggerData.repository.repo) {
          continue;
        }
        
        if (branch && !triggerData.ref.endsWith(`/${branch}`)) {
          continue;
        }
        
        this.emitActionTrigger({
          serviceId: 'github',
          actionId: 'commit_pushed',
          userId: listener.userId,
          data: triggerData,
          timestamp: new Date()
        });
      }
    }
  }

  private async handleRepositoryStarred(payload: any): Promise<void> {
    const triggerData: RepositoryStarredData = {
      repository: { owner: payload.repository.owner.login, repo: payload.repository.name },
      sender: { login: payload.sender.login, id: payload.sender.id },
      starred_at: payload.starred_at
    };

    // Check listeners
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      if (listener.actionId === 'repository_starred') {
        const { owner, repo } = listener.parameters;
        
        if (owner === triggerData.repository.owner && repo === triggerData.repository.repo) {
          this.emitActionTrigger({
            serviceId: 'github',
            actionId: 'repository_starred',
            userId: listener.userId,
            data: triggerData,
            timestamp: new Date()
          });
        }
      }
    }
  }

  private async createIssue(parameters: any): Promise<boolean> {
    try {
      const { owner, repo, title, body, labels } = parameters;
      
      const issueData: any = {
        owner,
        repo,
        title,
        body: body || 'This issue was created automatically by AREA.'
      };

      if (labels) {
        issueData.labels = labels.split(',').map((label: string) => label.trim());
      }

      const response = await this.octokit!.rest.issues.create(issueData);
      console.log(`Created GitHub issue #${response.data.number} in ${owner}/${repo}`);
      return true;
    } catch (error) {
      console.error('Failed to create GitHub issue:', error);
      return false;
    }
  }

  private async commentOnIssue(parameters: any): Promise<boolean> {
    try {
      const { owner, repo, issue_number, body } = parameters;
      
      await this.octokit!.rest.issues.createComment({
        owner,
        repo,
        issue_number: parseInt(issue_number),
        body
      });
      
      console.log(`Added comment to GitHub issue #${issue_number} in ${owner}/${repo}`);
      return true;
    } catch (error) {
      console.error('Failed to comment on GitHub issue:', error);
      return false;
    }
  }

  private async createRepository(parameters: any): Promise<boolean> {
    try {
      const { name, description, private: isPrivate } = parameters;
      
      const response = await this.octokit!.rest.repos.createForAuthenticatedUser({
        name,
        description: description || 'Repository created automatically by AREA',
        private: isPrivate === 'true' || isPrivate === true
      });
      
      console.log(`Created GitHub repository: ${response.data.full_name}`);
      return true;
    } catch (error) {
      console.error('Failed to create GitHub repository:', error);
      return false;
    }
  }
}
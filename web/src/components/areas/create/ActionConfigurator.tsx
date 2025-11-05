// web/src/components/areas/create/ActionConfigurator.tsx
import { useState, useEffect } from 'react';
import { MessageSquare, Github, Music, Mail, Loader } from 'lucide-react';
import DiscordChannelSelector from '../../discord/DiscordChannelSelector';
import TimerActionConfig from './TimerActionConfig';
import { githubAPI } from '../../../services/api';

interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description: string;
}

interface ActionConfiguratorProps {
  service: string;
  type: string;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
}

export default function ActionConfigurator({
  service,
  type,
  config,
  onConfigChange,
}: ActionConfiguratorProps) {
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Load GitHub repos if needed
  useEffect(() => {
    if (service === 'github' && githubRepos.length === 0) {
      loadGitHubRepositories();
    }
  }, [service]);

  const loadGitHubRepositories = async () => {
    setLoadingRepos(true);
    try {
      const response = await githubAPI.getRepositories();
      setGithubRepos(response.repositories || []);
      console.log('✅ Loaded', response.repositories?.length || 0, 'repositories');
    } catch (error) {
      console.error('❌ Failed to load repositories:', error);
    } finally {
      setLoadingRepos(false);
    }
  };
  
  // ============================================
  // TIMER ACTION CONFIG
  // ============================================
  if (service === 'timer') {
    return <TimerActionConfig type={type} config={config} onConfigChange={onConfigChange} />;
  }

  // ============================================
  // DISCORD ACTION CONFIG
  // ============================================
  if (service === 'discord') {
    // message_posted_in_channel
    if (type === 'message_posted_in_channel') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <h4 className="font-semibold text-gray-900">Discord Action Configuration</h4>
        </div>
        
        <DiscordChannelSelector
          value={config.channelId || ''}
          onChange={(channelId, guildId, channelName) => {
            console.log('📝 Action Channel selected:', { channelId, guildId, channelName });
            onConfigChange({ 
              ...config, 
              channelId,
              guildId,
              channelName 
            });
          }}
          label="Select Channel to Monitor"
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keyword Filter (optional)
          </label>
          <input
            type="text"
            value={config.keyword || ''}
            onChange={(e) => onConfigChange({ ...config, keyword: e.target.value })}
            placeholder="e.g., bug, help, urgent"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Leave empty to trigger on all messages, or enter a keyword to filter specific messages
          </p>
        </div>

        {/* Preview Box */}
        <div className="bg-white border border-indigo-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">📋 Configuration Preview:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Channel:</strong> #{config.channelName || 'Not selected'}</p>
            <p><strong>Server:</strong> {config.guildId ? 'Selected' : 'Not selected'}</p>
            {config.keyword && (
              <p><strong>Keyword:</strong> "{config.keyword}"</p>
            )}
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
            💡 This AREA will trigger when a message is posted in <strong>#{config.channelName || 'the selected channel'}</strong>
            {config.keyword && ` containing the word "${config.keyword}"`}.
          </div>
        </div>
      </div>
    );
    }
    
    // user_mentioned
    if (type === 'user_mentioned') {
      return (
        <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h4 className="font-semibold text-gray-900">Discord User Mention Configuration</h4>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID to Monitor *
            </label>
            <input
              type="text"
              value={config.userId || ''}
              onChange={(e) => onConfigChange({ ...config, userId: e.target.value })}
              placeholder="123456789012345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Enter the Discord User ID to monitor for mentions. Right-click on a user and "Copy User ID" (Developer Mode must be enabled)
            </p>
          </div>

          {/* Preview Box */}
          <div className="bg-white border border-indigo-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">📋 Configuration Preview:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Monitored User ID:</strong> {config.userId || 'Not configured'}</p>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
              💡 This AREA will trigger when the specified user is mentioned in any message.
            </div>
          </div>
        </div>
      );
    }
    
    // user_joined_server
    if (type === 'user_joined_server') {
      return (
        <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h4 className="font-semibold text-gray-900">Discord User Joined Server Configuration</h4>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Server (Guild) ID to Monitor *
            </label>
            <input
              type="text"
              value={config.guildId || ''}
              onChange={(e) => onConfigChange({ ...config, guildId: e.target.value })}
              placeholder="123456789012345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Enter the Discord Server (Guild) ID. Right-click on the server icon and "Copy Server ID"
            </p>
          </div>

          {/* Preview Box */}
          <div className="bg-white border border-indigo-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">📋 Configuration Preview:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Monitored Server ID:</strong> {config.guildId || 'Not configured'}</p>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
              💡 This AREA will trigger when a new user joins the specified server.
            </div>
          </div>
        </div>
      );
    }
  }

  // ============================================
  // GITHUB ACTION CONFIG
  // ============================================
  if (service === 'github') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-300">
        <div className="flex items-center space-x-2 mb-2">
          <Github className="h-5 w-5 text-gray-900" />
          <h4 className="font-semibold text-gray-900">GitHub Action Configuration</h4>
        </div>
        
        {loadingRepos ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 text-gray-900 animate-spin" />
            <span className="ml-2 text-gray-600">Loading repositories...</span>
          </div>
        ) : githubRepos.length > 0 ? (
          <>
            {/* Repository Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Repository *
              </label>
              <select
                value={config.repo ? `${config.owner}/${config.repo}` : ''}
                onChange={(e) => {
                  const [owner, repo] = e.target.value.split('/');
                  onConfigChange({ ...config, owner, repo });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600"
                required
              >
                <option value="">-- Select a repository --</option>
                {githubRepos.map((repo) => (
                  <option key={repo.id} value={repo.fullName}>
                    {repo.fullName} {repo.private ? '🔒' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {githubRepos.length} repositories available
              </p>
            </div>
        
            {/* Labels filter for new_issue_created */}
            {type === 'new_issue_created' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Labels (optional)
            </label>
            <input
              type="text"
              value={config.labels || ''}
              onChange={(e) => onConfigChange({ ...config, labels: e.target.value })}
              placeholder="e.g., bug, urgent, help-wanted"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Comma-separated list of labels. Leave empty to trigger on all issues.
            </p>
          </div>
        )}
        
            {/* Target branch filter for pull_request_opened */}
            {type === 'pull_request_opened' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Branch (optional)
            </label>
            <input
              type="text"
              value={config.targetBranch || ''}
              onChange={(e) => onConfigChange({ ...config, targetBranch: e.target.value })}
              placeholder="e.g., main, develop"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Only trigger on PRs targeting this branch. Leave empty for all PRs.
            </p>
          </div>
        )}
        
            {/* Branch filter for commit_pushed */}
            {type === 'commit_pushed' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch to Monitor (optional)
            </label>
            <input
              type="text"
              value={config.branch || ''}
              onChange={(e) => onConfigChange({ ...config, branch: e.target.value })}
              placeholder="e.g., main, develop"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Only trigger on commits to this branch. Leave empty to monitor all branches.
            </p>
          </div>
        )}
        
            {/* Preview Box */}
            <div className="bg-white border border-gray-300 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">📋 Configuration Preview:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Action:</strong> {type.replace(/_/g, ' ')}</p>
            <p><strong>Repository:</strong> {config.owner && config.repo ? `${config.owner}/${config.repo}` : 'Not configured'}</p>
            {config.labels && <p><strong>Labels filter:</strong> {config.labels}</p>}
            {config.targetBranch && <p><strong>Target branch:</strong> {config.targetBranch}</p>}
            {config.branch && <p><strong>Branch:</strong> {config.branch}</p>}
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
            💡 This AREA will trigger when {type.replace(/_/g, ' ')} in <strong>{config.owner || '[owner]'}/{config.repo || '[repo]'}</strong>
            {config.labels && ` with labels: ${config.labels}`}
            {config.targetBranch && ` to branch: ${config.targetBranch}`}
            {config.branch && ` on branch: ${config.branch}`}.
          </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-gray-700 mb-2">No repositories found</p>
            <p className="text-sm text-gray-600 mb-3">
              Make sure you've connected your GitHub account and have access to repositories
            </p>
            <button
              type="button"
              onClick={loadGitHubRepositories}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition"
            >
              Retry Loading
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // SPOTIFY ACTION CONFIG
  // ============================================
  if (service === 'spotify') {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2 mb-3">
          <Music className="h-5 w-5 text-green-600" />
          <h4 className="font-semibold text-gray-900">Spotify Action Configuration</h4>
        </div>
        <p className="text-sm text-gray-700">
          ℹ️ Spotify actions are automatically configured and monitor your music activity.
        </p>
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
          💡 This action will trigger based on your Spotify activity
        </div>
      </div>
    );
  }

  // ============================================
  // GOOGLE (GMAIL) ACTION CONFIG
  // ============================================
  if (service === 'google') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
        <div className="flex items-center space-x-2 mb-2">
          <Mail className="h-5 w-5 text-red-600" />
          <h4 className="font-semibold text-gray-900">Gmail Action Configuration</h4>
        </div>
        
        {/* Filtre par expéditeur */}
        {type === 'email_from_sender' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sender Email Address *
            </label>
            <input
              type="email"
              value={config.from || ''}
              onChange={(e) => onConfigChange({ ...config, from: e.target.value })}
              placeholder="e.g., boss@company.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Enter the email address to monitor
            </p>
          </div>
        )}
        
        {/* Filtre par sujet */}
        {type === 'email_with_subject' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Keyword *
            </label>
            <input
              type="text"
              value={config.subject || ''}
              onChange={(e) => onConfigChange({ ...config, subject: e.target.value })}
              placeholder="e.g., Urgent, Invoice, Meeting"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Emails containing this keyword in the subject will trigger the action
            </p>
          </div>
        )}
        
        {/* Tous les emails */}
        {type === 'new_email_received' && (
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            💡 This action will trigger for every new email received in your inbox.
          </div>
        )}

        {/* Preview Box */}
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">📋 Configuration Preview:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Action:</strong> {type.replace(/_/g, ' ')}</p>
            {config.from && <p><strong>From:</strong> {config.from}</p>}
            {config.subject && <p><strong>Subject contains:</strong> "{config.subject}"</p>}
            {type === 'new_email_received' && <p><strong>Trigger:</strong> All emails</p>}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // DEFAULT: No config needed
  // ============================================
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm text-gray-700">
        ℹ️ This action doesn't require additional configuration.
      </p>
    </div>
  );
}
// web/src/components/areas/create/ReactionConfigurator.tsx
import { useState, useEffect } from 'react';
import { MessageSquare, Github, Music, Loader } from 'lucide-react';
import DiscordChannelSelector from '../../discord/DiscordChannelSelector';
import { githubAPI } from '../../../services/api';

interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description: string;
}

interface ReactionConfiguratorProps {
  service: string;
  type: string;
  config: Record<string, any>;
  actionService: string;
  onConfigChange: (config: Record<string, any>) => void;
}

export default function ReactionConfigurator({
  service,
  type,
  config,
  actionService,
  onConfigChange,
}: ReactionConfiguratorProps) {
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Load GitHub repos if needed
  useEffect(() => {
    if (service === 'github' && type === 'create_issue' && githubRepos.length === 0) {
      loadGitHubRepositories();
    }
  }, [service, type]);

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
  // DISCORD REACTION CONFIG
  // ============================================
  if (service === 'discord' && type === 'send_message_to_channel') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <h4 className="font-semibold text-gray-900">Discord REAction Configuration</h4>
        </div>
        
        <DiscordChannelSelector
          value={config.channelId || ''}
          onChange={(channelId, guildId, channelName) => {
            console.log('📝 REAction Channel selected:', { channelId, guildId, channelName });
            onConfigChange({ 
              ...config, 
              channelId,
              guildId,
              channelName 
            });
          }}
          label="Select Target Channel"
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Content *
          </label>
          <textarea
            value={config.content || ''}
            onChange={(e) => onConfigChange({ ...config, content: e.target.value })}
            placeholder="🚨 New GitHub issue: {{issue.title}}&#10;&#10;Created by: {{issue.user.login}}&#10;Link: {{issue.html_url}}"
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-600"
            required
          />
        </div>

        {/* Placeholders Info */}
        <PlaceholderInfo actionService={actionService} />

        {/* Preview */}
        <DiscordPreview config={config} />
      </div>
    );
  }

  // ============================================
  // GITHUB REACTION CONFIG
  // ============================================
  if (service === 'github' && type === 'create_issue') {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <Github className="h-5 w-5 text-gray-900" />
          <h4 className="font-semibold text-gray-900">GitHub REAction Configuration</h4>
        </div>
        
        {loadingRepos ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading repositories...</span>
          </div>
        ) : githubRepos.length > 0 ? (
          <>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Title *
              </label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => onConfigChange({ ...config, title: e.target.value })}
                placeholder="New issue from Discord: {{message.content}}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Use placeholders like {`{{message.content}}`} for dynamic values
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Body (optional)
              </label>
              <textarea
                value={config.body || ''}
                onChange={(e) => onConfigChange({ ...config, body: e.target.value })}
                placeholder="Issue created from Discord message by {{message.author}}"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labels (optional)
              </label>
              <input
                type="text"
                value={config.labels || ''}
                onChange={(e) => onConfigChange({ ...config, labels: e.target.value })}
                placeholder="bug, automated"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated list of labels
              </p>
            </div>

            {/* Placeholders for GitHub */}
            <PlaceholderInfo actionService={actionService} />
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
  // SPOTIFY REACTION CONFIG
  // ============================================
  if (service === 'spotify') {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2 mb-3">
          <Music className="h-5 w-5 text-green-600" />
          <h4 className="font-semibold text-gray-900">Spotify REAction Configuration</h4>
        </div>
        <p className="text-sm text-gray-700">
          ℹ️ Spotify reactions are automatically configured.
        </p>
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
          💡 This reaction will interact with your Spotify account
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
        ℹ️ This reaction doesn't require additional configuration.
      </p>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function PlaceholderInfo({ actionService }: { actionService: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs font-semibold text-gray-700 mb-3">🔖 Available Placeholders:</p>
      
      {actionService === 'github' && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">From GitHub Issue:</p>
          <div className="grid grid-cols-2 gap-2">
            <PlaceholderTag code="{{issue.title}}" desc="Issue title" />
            <PlaceholderTag code="{{issue.number}}" desc="Issue number" />
            <PlaceholderTag code="{{issue.html_url}}" desc="Issue URL" />
            <PlaceholderTag code="{{issue.user.login}}" desc="Creator username" />
            <PlaceholderTag code="{{issue.body}}" desc="Issue description" />
            <PlaceholderTag code="{{issue.state}}" desc="Issue state" />
          </div>
        </div>
      )}
      
      {actionService === 'discord' && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">From Discord Message:</p>
          <div className="grid grid-cols-2 gap-2">
            <PlaceholderTag code="{{message.content}}" desc="Message text" />
            <PlaceholderTag code="{{message.author}}" desc="Author name" />
            <PlaceholderTag code="{{message.channel}}" desc="Channel name" />
            <PlaceholderTag code="{{message.id}}" desc="Message ID" />
            <PlaceholderTag code="{{message.timestamp}}" desc="Timestamp" />
            <PlaceholderTag code="{{message.guild}}" desc="Server name" />
          </div>
        </div>
      )}

      {!actionService && (
        <p className="text-xs text-gray-500 italic">
          Placeholders will appear here based on your selected Action
        </p>
      )}
    </div>
  );
}

function PlaceholderTag({ code, desc }: { code: string; desc: string }) {
  return (
    <div className="bg-gray-50 px-2 py-1.5 rounded hover:bg-indigo-50 transition cursor-help" title={desc}>
      <code className="text-xs text-indigo-600 font-mono">{code}</code>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </div>
  );
}

function DiscordPreview({ config }: { config: Record<string, any> }) {
  return (
    <div className="bg-white border border-indigo-200 rounded-lg p-4">
      <p className="text-xs font-semibold text-gray-700 mb-2">📋 Configuration Preview:</p>
      <div className="space-y-1 text-xs text-gray-600 mb-3">
        <p><strong>Target Channel:</strong> #{config.channelName || 'Not selected'}</p>
        <p><strong>Server:</strong> {config.guildId ? 'Selected' : 'Not selected'}</p>
        {config.content && (
          <p><strong>Message Length:</strong> {config.content.length} characters</p>
        )}
      </div>
      
      {config.content && (
        <div className="mt-3 p-3 bg-gray-800 text-gray-100 rounded border-l-4 border-indigo-600 font-mono">
          <p className="text-xs font-medium text-gray-300 mb-2">💬 Message Preview:</p>
          <pre className="text-xs whitespace-pre-wrap">
            {config.content}
          </pre>
        </div>
      )}
      
      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
        💡 This message will be sent to <strong>#{config.channelName || 'the selected channel'}</strong> when the Action is triggered.
      </div>
    </div>
  );
}
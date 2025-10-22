// web/src/components/areas/create/ActionConfigurator.tsx
import { MessageSquare, Github, Music } from 'lucide-react';
import DiscordChannelSelector from '../../discord/DiscordChannelSelector';

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
  
  // ============================================
  // DISCORD ACTION CONFIG
  // ============================================
  if (service === 'discord' && type === 'message_posted_in_channel') {
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

  // ============================================
  // GITHUB ACTION CONFIG
  // ============================================
  if (service === 'github') {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <Github className="h-5 w-5 text-gray-900" />
          <h4 className="font-semibold text-gray-900">GitHub Action Configuration</h4>
        </div>
        <p className="text-sm text-gray-700">
          ℹ️ GitHub actions are automatically configured and monitor all your repositories.
        </p>
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
          💡 This action will trigger based on GitHub events (issues, pull requests, etc.)
        </div>
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
// web/src/components/areas/create/ActionConfigurator.tsx
import { MessageSquare, Github, Music, Mail } from 'lucide-react';
import DiscordChannelSelector from '../../discord/DiscordChannelSelector';
import TimerActionConfig from './TimerActionConfig';

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
  // TIMER ACTION CONFIG
  // ============================================
  if (service === 'timer') {
    return <TimerActionConfig type={type} config={config} onConfigChange={onConfigChange} />;
  }

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
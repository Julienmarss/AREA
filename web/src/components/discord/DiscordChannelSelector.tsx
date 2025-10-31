import { useState, useEffect } from 'react';
import { discordAPI } from '../../services/api';
import { Loader, AlertCircle } from 'lucide-react';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

interface Channel {
  id: string;
  name: string;
  type: number;
}

interface DiscordChannelSelectorProps {
  value: string;
  onChange: (channelId: string, guildId: string, channelName: string) => void;
  label?: string;
  required?: boolean;
}

export default function DiscordChannelSelector({ 
  value, 
  onChange, 
  label = "Select Channel",
  required = false 
}: DiscordChannelSelectorProps) {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string>('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuilds();
  }, []);

  useEffect(() => {
    if (selectedGuild) {
      loadChannels(selectedGuild);
    }
  }, [selectedGuild]);

  const loadGuilds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await discordAPI.getGuilds();
      setGuilds(response.guilds || []);
      
      // Auto-select first guild if only one
      if (response.guilds?.length === 1) {
        setSelectedGuild(response.guilds[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Discord servers');
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async (guildId: string) => {
    setLoadingChannels(true);
    
    try {
      const response = await discordAPI.getChannels(guildId);
      const textChannels = (response.channels || []).filter((c: Channel) => c.type === 0);
      setChannels(textChannels);
    } catch (err: any) {
      setError(err.message || 'Failed to load channels');
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const channelId = e.target.value;
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      onChange(channelId, selectedGuild, channel.name);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader className="h-6 w-6 text-indigo-600 animate-spin mr-2" />
        <span className="text-gray-600">Loading Discord servers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-800 font-medium">Error</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={loadGuilds}
            className="text-sm text-red-700 hover:text-red-800 underline mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (guilds.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          No Discord servers found. Please make sure you've authorized the Discord integration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Guild Selector */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Server</label>
        <select
          value={selectedGuild}
          onChange={(e) => setSelectedGuild(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          required={required}
        >
          <option value="">-- Select a server --</option>
          {guilds.map((guild) => (
            <option key={guild.id} value={guild.id}>
              {guild.name}
            </option>
          ))}
        </select>
      </div>

      {/* Channel Selector */}
      {selectedGuild && (
        <div>
          <label className="block text-xs text-gray-600 mb-1">Channel</label>
          {loadingChannels ? (
            <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <Loader className="h-4 w-4 text-indigo-600 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Loading channels...</span>
            </div>
          ) : channels.length > 0 ? (
            <select
              value={value}
              onChange={handleChannelChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required={required}
            >
              <option value="">-- Select a channel --</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  # {channel.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600">No text channels found in this server</p>
            </div>
          )}
        </div>
      )}

      {/* Selected Channel Info */}
      {value && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Channel ID:</strong> <code className="font-mono">{value}</code>
          </p>
        </div>
      )}
    </div>
  );
}
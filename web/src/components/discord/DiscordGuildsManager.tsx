// web/src/components/discord/DiscordGuildsManager.tsx
import { useState, useEffect } from 'react';
import { discordAPI } from '../../services/api';
import { Server, Hash, ChevronDown, ChevronRight, Loader } from 'lucide-react';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface Channel {
  id: string;
  name: string;
  type: number;
  position: number;
}

export default function DiscordGuildsManager() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await discordAPI.getGuilds();
      setGuilds(response.guilds || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load Discord servers');
      console.error('Failed to load guilds:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async (guildId: string) => {
    setLoadingChannels(true);
    
    try {
      const response = await discordAPI.getChannels(guildId);
      setChannels(response.channels || []);
      setSelectedGuild(guildId);
    } catch (err: any) {
      setError(err.message || 'Failed to load channels');
      console.error('Failed to load channels:', err);
    } finally {
      setLoadingChannels(false);
    }
  };

  const toggleGuild = (guildId: string) => {
    if (selectedGuild === guildId) {
      setSelectedGuild(null);
      setChannels([]);
    } else {
      loadChannels(guildId);
    }
  };

  const getChannelTypeIcon = (type: number) => {
    if (type === 0) return <Hash className="h-4 w-4 text-gray-500" />;
    if (type === 2) return <span className="text-gray-500">🔊</span>;
    if (type === 4) return <span className="text-gray-500">📁</span>;
    return <Hash className="h-4 w-4 text-gray-500" />;
  };


  const copyChannelId = (channelId: string) => {
    navigator.clipboard.writeText(channelId);
    alert(`Channel ID copied: ${channelId}\nYou can use this ID when creating AREAs`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={loadGuilds}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (guilds.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <Server className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No Discord servers found</p>
        <p className="text-sm text-gray-500 mt-1">
          Make sure you've authorized the bot to access your servers
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Your Discord Servers</h3>
        <span className="text-sm text-gray-600">{guilds.length} servers</span>
      </div>

      {guilds.map((guild) => (
        <div key={guild.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Guild Header */}
          <button
            onClick={() => toggleGuild(guild.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center space-x-3">
              {guild.icon ? (
                <img
                  src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                  alt={guild.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Server className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="text-left">
                <p className="font-medium text-gray-900">{guild.name}</p>
                <p className="text-xs text-gray-500">
                  {guild.owner ? '👑 Owner' : 'Member'}
                </p>
              </div>
            </div>
            {selectedGuild === guild.id ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {/* Channels List */}
          {selectedGuild === guild.id && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              {loadingChannels ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="h-6 w-6 text-indigo-600 animate-spin" />
                </div>
              ) : channels.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Text Channels (click to copy ID):
                  </p>
                  {channels
                    .filter(c => c.type === 0) // Only text channels
                    .sort((a, b) => a.position - b.position)
                    .map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => copyChannelId(channel.id)}
                        className="w-full flex items-center space-x-2 px-3 py-2 bg-white rounded hover:bg-indigo-50 transition text-left group"
                      >
                        {getChannelTypeIcon(channel.type)}
                        <span className="text-sm text-gray-700 flex-1">
                          {channel.name}
                        </span>
                        <span className="text-xs text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition">
                          {channel.id}
                        </span>
                      </button>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-2">
                  No text channels found
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Click on a channel to copy its ID. You'll need this ID when creating Discord AREAs.
        </p>
      </div>
    </div>
  );
}
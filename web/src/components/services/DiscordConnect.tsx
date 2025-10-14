import { useState } from 'react';
import { MessageSquare, CheckCircle, ExternalLink } from 'lucide-react';
import { ServiceStatus } from '../../types/services';
import ServiceCard from './ServiceCard';

interface DiscordConnectProps {
  status: ServiceStatus;
  onConnect: (botToken: string, guildId: string) => Promise<void>;
}

export default function DiscordConnect({ status, onConnect }: DiscordConnectProps) {
  const [discordBotToken, setDiscordBotToken] = useState('');
  const [discordGuildId, setDiscordGuildId] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordBotToken.trim() || !discordGuildId.trim()) return;

    setConnecting(true);
    try {
      await onConnect(discordBotToken, discordGuildId);
      setDiscordBotToken('');
      setDiscordGuildId('');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <ServiceCard
      title="Discord"
      icon={<MessageSquare className="h-6 w-6 text-white" />}
      gradient="bg-gradient-to-r from-indigo-600 to-indigo-700"
      status={status}
    >
      {status.connected ? (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold">Discord Bot Connected</p>
          <p className="text-sm text-gray-600 mt-1">
            Your bot is active and ready to automate Discord messages
          </p>
        </div>
      ) : (
        <div>
          <p className="text-gray-700 mb-4">
            Connect a Discord bot to automate messages, roles, and server events.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                type="password"
                value={discordBotToken}
                onChange={(e) => setDiscordBotToken(e.target.value)}
                placeholder="MTxxxxxxxxx.xxxxxx.xxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server ID (Guild ID)
              </label>
              <input
                type="text"
                value={discordGuildId}
                onChange={(e) => setDiscordGuildId(e.target.value)}
                placeholder="123456789012345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Create a bot at{' '}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  discord.com/developers
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            </div>

            {status.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {status.error}
              </div>
            )}

            <button
              type="submit"
              disabled={connecting}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Connect Discord'}
            </button>
          </form>
        </div>
      )}
    </ServiceCard>
  );
}

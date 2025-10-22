// web/src/components/services/DiscordConnect.tsx
import { MessageSquare, CheckCircle, Server } from 'lucide-react';
import { ServiceStatus } from '../../types/services';
import ServiceCard from './ServiceCard';

interface DiscordConnectProps {
  status: ServiceStatus;
  onConnect: () => void;
}

export default function DiscordConnect({ status, onConnect }: DiscordConnectProps) {
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
          <p className="text-gray-900 font-semibold text-lg mb-2">
            Discord Connected
          </p>
          
          {status.username && (
            <div className="bg-indigo-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Username:</span> {status.username}
              </p>
              {status.discriminator && (
                <p className="text-xs text-gray-600 mt-1">
                  {status.username}#{status.discriminator}
                </p>
              )}
            </div>
          )}

          {status.guildCount !== undefined && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-3">
              <Server className="h-4 w-4" />
              <span>
                {status.guildCount} server{status.guildCount !== 1 ? 's' : ''} available
              </span>
            </div>
          )}

          <p className="text-sm text-gray-600 mt-3">
            You can now use Discord actions and reactions in your AREAs
          </p>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              ✅ Send messages to channels<br/>
              ✅ Listen to channel messages<br/>
              ✅ React to Discord events
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-700 mb-4">
            Connect your Discord account to automate messages, roles, and server events.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 font-medium mb-2">
              What you can do with Discord:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Send messages to channels</li>
              <li>✅ Listen to messages in channels</li>
              <li>✅ Trigger actions based on keywords</li>
              <li>✅ Manage roles and members</li>
              <li>✅ React to server events</li>
            </ul>
          </div>

          {status.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-4">
              <p className="font-medium">Connection Error</p>
              <p className="mt-1">{status.error}</p>
            </div>
          )}

          <button
            onClick={onConnect}
            disabled={status.loading}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare className="h-5 w-5" />
            <span>
              {status.loading ? 'Connecting...' : 'Connect with Discord'}
            </span>
          </button>
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            You'll be redirected to Discord to authorize access to your servers
          </p>
        </div>
      )}
    </ServiceCard>
  );
}
// web/src/components/services/DiscordConnect.tsx
import { MessageSquare, CheckCircle } from 'lucide-react';
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
          <p className="text-gray-900 font-semibold">
            Connected as {status.username || 'Discord User'}
          </p>
          {status.discriminator && (
            <p className="text-sm text-gray-600">
              {status.username}#{status.discriminator}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            You can now use Discord actions and reactions in your AREAs
          </p>
          {status.guildCount && (
            <p className="text-xs text-gray-500 mt-2">
              {status.guildCount} server{status.guildCount > 1 ? 's' : ''} available
            </p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-gray-700 mb-4">
            Connect your Discord account to automate messages, roles, and server events.
          </p>
          
          <p className="text-sm text-gray-600 mb-4">
            ✅ Send messages to channels<br/>
            ✅ Manage roles and members<br/>
            ✅ React to server events
          </p>

          {status.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-4">
              {status.error}
            </div>
          )}

          <button
            onClick={onConnect}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center space-x-2"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Connect with Discord</span>
          </button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            You'll be redirected to Discord to authorize access
          </p>
        </div>
      )}
    </ServiceCard>
  );
}
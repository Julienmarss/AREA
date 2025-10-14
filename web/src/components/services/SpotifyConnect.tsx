import { Music, CheckCircle } from 'lucide-react';
import { ServiceStatus } from '../../types/services';
import ServiceCard from './ServiceCard';

interface SpotifyConnectProps {
  status: ServiceStatus;
  onConnect: () => void;
}

export default function SpotifyConnect({ status, onConnect }: SpotifyConnectProps) {
  return (
    <ServiceCard
      title="Spotify"
      icon={<Music className="h-6 w-6 text-white" />}
      gradient="bg-gradient-to-r from-green-600 to-green-700"
      status={status}
    >
      {status.connected ? (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold">Spotify Connected</p>
          <p className="text-sm text-gray-600 mt-1">
            You can now automate your music with Spotify actions and reactions
          </p>
        </div>
      ) : (
        <div>
          <p className="text-gray-700 mb-4">
            Connect your Spotify account to automate playlists, tracks, and artists.
          </p>

          {status.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {status.error}
            </div>
          )}

          <button
            onClick={onConnect}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center space-x-2"
          >
            <Music className="h-5 w-5" />
            <span>Connect with Spotify</span>
          </button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            You'll be redirected to Spotify to authorize access
          </p>
        </div>
      )}
    </ServiceCard>
  );
}
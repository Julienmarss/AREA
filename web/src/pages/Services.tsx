import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { githubAPI, discordAPI, spotifyAPI, googleAPI, timerAPI } from '../services/api';
import { ServiceStatus } from '../types/services';
import GitHubConnect from '../components/services/GitHubConnect';
import DiscordConnect from '../components/services/DiscordConnect';
import SpotifyConnect from '../components/services/SpotifyConnect';
import GoogleConnect from '../components/services/GoogleConnect';
import TimerConnect from '../components/services/TimerConnect';
import { AlertCircle, Info } from 'lucide-react';

export default function Services() {
  const { user } = useAuth();

  const [githubStatus, setGithubStatus] = useState<ServiceStatus>({ 
    connected: false, 
    loading: true 
  });
  
  const [discordStatus, setDiscordStatus] = useState<ServiceStatus>({ 
    connected: false, 
    loading: true 
  });
  
  const [spotifyStatus, setSpotifyStatus] = useState<ServiceStatus>({
    connected: false,
    loading: true
  });

  const [googleStatus, setGoogleStatus] = useState<ServiceStatus>({
    connected: false,
    loading: true
  });

  const [timerJobsCount, setTimerJobsCount] = useState<number>(0);
  const [timerLoading, setTimerLoading] = useState<boolean>(true);
  const [timerError, setTimerError] = useState<string | undefined>(undefined);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadStatuses();
    }
  }, [user?.id]);

  const loadStatuses = async () => {
    if (!user?.id) {
      setLoadError('User not authenticated');
      return;
    }

    const userId = user.id;
    console.log('🔄 Loading service statuses for user:', userId);
    
    // Load GitHub status
    try {
      console.log('🔍 Loading GitHub status...');
      const githubRes = await githubAPI.getStatus(userId);
      console.log('✅ GitHub status:', githubRes);
      
      setGithubStatus({
        connected: githubRes.authenticated,
        loading: false,
        username: githubRes.username,
      });
    } catch (error: any) {
      console.error('❌ Failed to load GitHub status:', error);
      setGithubStatus({ 
        connected: false, 
        loading: false,
        error: error.message || 'Failed to load GitHub status'
      });
    }

    // Load Discord status
    try {
      console.log('🔍 Loading Discord status...');
      const discordRes = await discordAPI.getStatus(userId);
      console.log('✅ Discord status:', discordRes);
      
      setDiscordStatus({
        connected: discordRes.authenticated,
        loading: false,
        username: discordRes.username,
        discriminator: discordRes.discriminator,
        guildCount: discordRes.guilds?.length || 0,
      });
    } catch (error: any) {
      console.error('❌ Failed to load Discord status:', error);
      setDiscordStatus({ 
        connected: false, 
        loading: false,
        error: error.message || 'Failed to load Discord status'
      });
    }

    // Load Spotify status
    try {
      console.log('🔍 Loading Spotify status...');
      const spotifyRes = await spotifyAPI.getStatus(userId);
      console.log('✅ Spotify status:', spotifyRes);
      
      const isConnected = (spotifyRes.authenticated !== undefined)
        ? spotifyRes.authenticated
        : spotifyRes.connected;
      setSpotifyStatus({
        connected: isConnected,
        loading: false,
      });
    } catch (error: any) {
      console.error('❌ Failed to load Spotify status:', error);
      setSpotifyStatus({
        connected: false,
        loading: false,
        error: error.message || 'Failed to load Spotify status'
      });
    }

    // Load Google status
    try {
      console.log('🔍 Loading Google status...');
      const googleRes = await googleAPI.getStatus(userId);
      console.log('✅ Google status:', googleRes);
      
      setGoogleStatus({
        connected: googleRes.authenticated,
        loading: false,
        username: googleRes.email,
      });
    } catch (error: any) {
      console.error('❌ Failed to load Google status:', error);
      setGoogleStatus({ 
        connected: false, 
        loading: false,
        error: error.message || 'Failed to load Google status'
      });
    }

    // Load Timer jobs count
    try {
      console.log('⏰ Loading Timer jobs...');
      const timerRes = await timerAPI.getJobs();
      console.log('✅ Timer jobs:', timerRes);
      setTimerJobsCount(timerRes.count || 0);
      setTimerLoading(false);
      setTimerError(undefined);
    } catch (error: any) {
      console.error('❌ Failed to load Timer jobs:', error);
      setTimerJobsCount(0);
      setTimerLoading(false);
      setTimerError(undefined);
    }
  };

  const handleConnectGitHub = async () => {
    if (!user?.id) {
      setGithubStatus(prev => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return;
    }

    setGithubStatus(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🔗 Initiating GitHub OAuth for user:', user.id);
      const response = await githubAPI.initiateOAuth(user.id);
      console.log('✅ Redirecting to:', response.authUrl);
      window.location.href = response.authUrl;
    } catch (error: any) {
      console.error('❌ GitHub OAuth failed:', error);
      setGithubStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to initiate OAuth',
      }));
    }
  };

  const handleConnectDiscord = async () => {
    if (!user?.id) {
      setDiscordStatus(prev => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return;
    }

    setDiscordStatus(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🔗 Initiating Discord OAuth for user:', user.id);
      const response = await discordAPI.initiateOAuth(user.id);
      console.log('✅ Redirecting to:', response.authUrl);
      window.location.href = response.authUrl;
    } catch (error: any) {
      console.error('❌ Discord OAuth failed:', error);
      setDiscordStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to initiate OAuth',
      }));
    }
  };

  const handleConnectSpotify = async () => {
    if (!user?.id) {
      setSpotifyStatus(prev => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return;
    }

    setSpotifyStatus(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      console.log('Initiating Spotify OAuth for user:', user.id);
      const response = await spotifyAPI.initiateAuth(user.id);
      console.log('Redirecting to:', response.authUrl);
      window.location.href = response.authUrl;
    } catch (error: any) {
      console.error('Spotify OAuth failed:', error);
      setSpotifyStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to initiate OAuth',
      }));
    }
  };

  const handleConnectGoogle = async () => {
    if (!user?.id) {
      setGoogleStatus(prev => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return;
    }

    setGoogleStatus(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🔗 Initiating Google OAuth for user:', user.id);
      const response = await googleAPI.initiateOAuth(user.id);
      console.log('✅ Redirecting to:', response.authUrl);
      window.location.href = response.authUrl;
    } catch (error: any) {
      console.error('❌ Google OAuth failed:', error);
      setGoogleStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to initiate OAuth',
      }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Connected Services</h1>
        <p className="text-gray-600 mt-2">
          Connect your favorite services to create powerful automations
        </p>
      </div>

      {/* Error Alert */}
      {loadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">Error Loading Services</p>
            <p className="text-sm text-red-600 mt-1">{loadError}</p>
          </div>
        </div>
      )}

      {/* Info Alert */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 font-medium">OAuth Authentication</p>
          <p className="text-sm text-blue-700 mt-1">
            When you click "Connect", you'll be redirected to authorize the service. 
            After authorization, you'll be redirected back to this page.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <TimerConnect jobsCount={timerJobsCount} loading={timerLoading} error={timerError} />
        <GitHubConnect status={githubStatus} onConnect={handleConnectGitHub} />
        <DiscordConnect status={discordStatus} onConnect={handleConnectDiscord} />
        <SpotifyConnect status={spotifyStatus} onConnect={handleConnectSpotify} />
        <GoogleConnect status={googleStatus} onConnect={handleConnectGoogle} />
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Need help connecting services?
        </h3>
        
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                TM
              </span>
              Timer
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• No setup required!</li>
              <li>• Schedule by time/day/week</li>
              <li>• Set custom intervals</li>
              <li>• Trigger any reaction</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                GH
              </span>
              GitHub
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Click "Connect with GitHub"</li>
              <li>• Authorize AREA application</li>
              <li>• Grant access to repositories</li>
              <li>• Create issues and PRs automatically</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                DC
              </span>
              Discord
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Click "Connect with Discord"</li>
              <li>• Select your servers</li>
              <li>• Authorize bot permissions</li>
              <li>• Send and listen to messages</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                SP
              </span>
              Spotify
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Click "Connect with Spotify"</li>
              <li>• Authorize access to your music</li>
              <li>• Control playback</li>
              <li>• Manage playlists automatically</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                GM
              </span>
              Google (Gmail)
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Click "Connect with Google"</li>
              <li>• Authorize Gmail access</li>
              <li>• Auto-reply to emails</li>
              <li>• Manage labels & filters</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-blue-200">
          <p className="text-sm text-gray-600">
            <strong>Troubleshooting:</strong> If you encounter any issues, make sure:
          </p>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li>• Popup blockers are disabled for this site</li>
            <li>• You're logged into the service you want to connect</li>
            <li>• The backend server is running properly</li>
            <li>• Check the browser console for detailed error messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
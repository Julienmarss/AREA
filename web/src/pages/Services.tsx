import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { githubAPI, discordAPI, spotifyAPI } from '../services/api';
import { ServiceStatus } from '../types/services';
import GitHubConnect from '../components/services/GitHubConnect';
import DiscordConnect from '../components/services/DiscordConnect';
import SpotifyConnect from '../components/services/SpotifyConnect';

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

  useEffect(() => {
    loadStatuses();
  }, []);

const loadStatuses = async () => {
  const userId = user?.id || 'demo_user';
  
  // Load GitHub status
  try {
    console.log('🔍 Loading GitHub status for user:', userId);
    const githubRes = await githubAPI.getStatus(userId);
    console.log('✅ GitHub status:', githubRes);
    
    setGithubStatus({
      connected: githubRes.authenticated,
      loading: false,
      username: githubRes.username,
    });
  } catch (error) {
    console.error('❌ Failed to load GitHub status:', error);
    setGithubStatus({ connected: false, loading: false });
  }

    // Load Discord status
    try {
      const discordRes = await discordAPI.getStatus();
      setDiscordStatus({
        connected: discordRes.authenticated,
        loading: false,
      });
    } catch (error) {
      setDiscordStatus({ connected: false, loading: false });
    }

    // Load Spotify status
    try {
      const spotifyRes = await spotifyAPI.getStatus(user?.id || 'demo_user');
      setSpotifyStatus({
        connected: spotifyRes.connected,
        loading: false,
      });
    } catch (error) {
      setSpotifyStatus({ connected: false, loading: false });
    }
  };

  const handleConnectGitHub = async () => {
    try {
      const response = await githubAPI.initiateOAuth(user?.id || 'demo_user');
      window.location.href = response.authUrl;
    } catch (error: any) {
      setGithubStatus(prev => ({
        ...prev,
        error: error.message || 'Failed to initiate OAuth',
      }));
    }
  };

  const handleConnectDiscord = async (botToken: string, guildId: string) => {
    setDiscordStatus(prev => ({ ...prev, error: undefined }));

    try {
      await discordAPI.connect(botToken, guildId);
      await loadStatuses();
    } catch (error: any) {
      setDiscordStatus(prev => ({
        ...prev,
        error: error.message || 'Failed to connect',
      }));
      throw error;
    }
  };

  const handleConnectSpotify = async () => {
    try {
      const response = await spotifyAPI.initiateAuth(user?.id || 'demo_user');
      window.location.href = response.authUrl;
    } catch (error: any) {
      setSpotifyStatus(prev => ({
        ...prev,
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

      <div className="space-y-6">
        <GitHubConnect status={githubStatus} onConnect={handleConnectGitHub} />
        <DiscordConnect status={discordStatus} onConnect={handleConnectDiscord} />
        <SpotifyConnect status={spotifyStatus} onConnect={handleConnectSpotify} />
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Need help connecting services?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>GitHub:</strong> Click "Connect with GitHub" to authorize via OAuth2
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Discord:</strong> Create a bot application at{' '}
              <a 
                href="https://discord.com/developers/applications" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline"
              >
                discord.com/developers
              </a>
              {' '}and invite it to your server
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Spotify:</strong> Click the connect button to authorize via OAuth2
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
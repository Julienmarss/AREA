// web/src/pages/Services.tsx
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

    // ✅ Load Discord status (OAuth2)
    try {
      console.log('🔍 Loading Discord status for user:', userId);
      const discordRes = await discordAPI.getStatus(userId);
      console.log('✅ Discord status:', discordRes);
      
      setDiscordStatus({
        connected: discordRes.authenticated,
        loading: false,
        username: discordRes.username,
        discriminator: discordRes.discriminator,
        guildCount: discordRes.guilds?.length || 0,
      });
    } catch (error) {
      console.error('❌ Failed to load Discord status:', error);
      setDiscordStatus({ connected: false, loading: false });
    }

    // Load Spotify status
    try {
      const spotifyRes = await spotifyAPI.getStatus(userId);
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

  // ✅ Nouvelle méthode pour Discord OAuth2
  const handleConnectDiscord = async () => {
    try {
      const response = await discordAPI.initiateOAuth(user?.id || 'demo_user');
      window.location.href = response.authUrl;
    } catch (error: any) {
      setDiscordStatus(prev => ({
        ...prev,
        error: error.message || 'Failed to initiate OAuth',
      }));
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
              <strong>Discord:</strong> Click "Connect with Discord" to authorize your account and select servers
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
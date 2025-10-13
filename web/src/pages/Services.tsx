import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { githubAPI, discordAPI, spotifyAPI } from '../services/api';
import { Github, MessageSquare, Music, CheckCircle, XCircle, Loader, ExternalLink } from 'lucide-react';

interface ServiceStatus {
  connected: boolean;
  loading: boolean;
  username?: string;
  error?: string;
}

export default function Services() {
  const { user } = useAuth();

  const [githubStatus, setGithubStatus] = useState<ServiceStatus>({ connected: false, loading: true });
  const [discordStatus, setDiscordStatus] = useState<ServiceStatus>({ connected: false, loading: true });
  const [spotifyStatus, setSpotifyStatus] = useState<ServiceStatus>({ connected: false, loading: true });

  const [githubToken, setGithubToken] = useState('');
  const [discordBotToken, setDiscordBotToken] = useState('');
  const [discordGuildId, setDiscordGuildId] = useState('');

  const [connectingGithub, setConnectingGithub] = useState(false);
  const [connectingDiscord, setConnectingDiscord] = useState(false);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      const githubRes = await githubAPI.getStatus();
      setGithubStatus({
        connected: githubRes.authenticated,
        loading: false,
        username: githubRes.username,
      });
    } catch (error) {
      setGithubStatus({ connected: false, loading: false });
    }

    try {
      const discordRes = await discordAPI.getStatus();
      setDiscordStatus({
        connected: discordRes.authenticated,
        loading: false,
      });
    } catch (error) {
      setDiscordStatus({ connected: false, loading: false });
    }

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

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken.trim()) return;

    setConnectingGithub(true);
    setGithubStatus(prev => ({ ...prev, error: undefined }));

    try {
      await githubAPI.connect(githubToken);
      await loadStatuses();
      setGithubToken('');
    } catch (error: any) {
      setGithubStatus(prev => ({
        ...prev,
        error: error.message || 'Failed to connect',
      }));
    } finally {
      setConnectingGithub(false);
    }
  };

  const handleConnectDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordBotToken.trim() || !discordGuildId.trim()) return;

    setConnectingDiscord(true);
    setDiscordStatus(prev => ({ ...prev, error: undefined }));

    try {
      await discordAPI.connect(discordBotToken, discordGuildId);
      await loadStatuses();
      setDiscordBotToken('');
      setDiscordGuildId('');
    } catch (error: any) {
      setDiscordStatus(prev => ({
        ...prev,
        error: error.message || 'Failed to connect',
      }));
    } finally {
      setConnectingDiscord(false);
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
        {/* GitHub Service */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Github className="h-6 w-6 text-white" />
                <h3 className="text-xl font-semibold text-white">GitHub</h3>
              </div>
              {githubStatus.loading ? (
                <Loader className="h-5 w-5 text-white animate-spin" />
              ) : githubStatus.connected ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-white font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-300">Not connected</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {githubStatus.connected ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-gray-900 font-semibold">
                  Connected as {githubStatus.username || 'GitHub User'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  You can now use GitHub actions and reactions in your AREAs
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 mb-4">
                  Connect your GitHub account to automate issues, pull requests, and repositories.
                </p>
                <form onSubmit={handleConnectGithub} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Access Token
                    </label>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Create a token at{' '}
                      <a
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center"
                      >
                        github.com/settings/tokens
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </p>
                  </div>

                  {githubStatus.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      {githubStatus.error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={connectingGithub}
                    className="w-full py-2 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {connectingGithub ? 'Connecting...' : 'Connect GitHub'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Discord Service */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-6 w-6 text-white" />
                <h3 className="text-xl font-semibold text-white">Discord</h3>
              </div>
              {discordStatus.loading ? (
                <Loader className="h-5 w-5 text-white animate-spin" />
              ) : discordStatus.connected ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-white font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-indigo-300" />
                  <span className="text-sm text-white">Not connected</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {discordStatus.connected ? (
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
                <form onSubmit={handleConnectDiscord} className="space-y-4">
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

                  {discordStatus.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      {discordStatus.error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={connectingDiscord}
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {connectingDiscord ? 'Connecting...' : 'Connect Discord'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Spotify Service */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Music className="h-6 w-6 text-white" />
                <h3 className="text-xl font-semibold text-white">Spotify</h3>
              </div>
              {spotifyStatus.loading ? (
                <Loader className="h-5 w-5 text-white animate-spin" />
              ) : spotifyStatus.connected ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm text-white font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm text-white">Not connected</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {spotifyStatus.connected ? (
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

                {spotifyStatus.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {spotifyStatus.error}
                  </div>
                )}

                <button
                  onClick={handleConnectSpotify}
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
          </div>
        </div>
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
              <strong>GitHub:</strong> Create a Personal Access Token with repo permissions at{' '}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">
                github.com/settings/tokens
              </a>
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Discord:</strong> Create a bot application at{' '}
              <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="underline">
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
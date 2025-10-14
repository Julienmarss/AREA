import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Zap, Settings, CheckCircle, XCircle, Github, MessageSquare, Music, Loader } from 'lucide-react';
import { githubAPI, discordAPI, spotifyAPI, areasAPI } from '../services/api';
import { Area } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [githubConnected, setGithubConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

const loadDashboardData = async () => {
  const userId = user?.id; // ✅ Utiliser le vrai userId
  
  // Charger les AREAs
  try {
    const areasData = await areasAPI.getAll(userId);
    setAreas(areasData.areas || []);
  } catch (error) {
    console.error('Failed to load areas:', error);
  } finally {
    setLoading(false);
  }

  try {
    const [github, discord, spotify] = await Promise.all([
      githubAPI.getStatus(userId).catch(() => ({ authenticated: false })),
      discordAPI.getStatus().catch(() => ({ authenticated: false })),
      spotifyAPI.getStatus(userId || 'demo_user').catch(() => ({ connected: false })),
    ]);

    setGithubConnected(github.authenticated);
    setDiscordConnected(discord.authenticated);
    setSpotifyConnected(spotify.connected);
  } catch (error) {
    console.error('Failed to load service statuses:', error);
  } finally {
    setServicesLoading(false);
  }
};

  const handleToggleArea = async (areaId: string) => {
    try {
      await areasAPI.toggle(areaId);
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to toggle area:', error);
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('Are you sure you want to delete this AREA?')) return;
    
    try {
      await areasAPI.delete(areaId);
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to delete area:', error);
    }
  };

  const connectedServicesCount = [githubConnected, discordConnected, spotifyConnected].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your automations and connected services
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connected Services</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {servicesLoading ? '-' : `${connectedServicesCount}/3`}
              </p>
            </div>
            <Settings className="h-10 w-10 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active AREAs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '-' : areas.filter(a => a.enabled).length}
              </p>
            </div>
            <Zap className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total AREAs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '-' : areas.length}
              </p>
            </div>
            <Zap className="h-10 w-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/services"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect Services
              </h3>
              <p className="text-sm text-gray-600">
                Link your GitHub, Discord, and Spotify accounts
              </p>
            </div>
            <Settings className="h-10 w-10 text-indigo-600 group-hover:scale-110 transition" />
          </div>
        </Link>

        <Link
          to="/areas/create"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md p-6 hover:shadow-lg transition group text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Create AREA
              </h3>
              <p className="text-sm text-indigo-100">
                Build your first automation
              </p>
            </div>
            <Plus className="h-10 w-10 group-hover:scale-110 transition" />
          </div>
        </Link>
      </div>

      {/* Services Status */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Connected Services</h2>
          <Link
            to="/services"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Manage →
          </Link>
        </div>

        {servicesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <ServiceStatus 
              name="GitHub" 
              icon={<Github className="h-5 w-5" />}
              connected={githubConnected}
            />
            <ServiceStatus 
              name="Discord" 
              icon={<MessageSquare className="h-5 w-5" />}
              connected={discordConnected}
            />
            <ServiceStatus 
              name="Spotify" 
              icon={<Music className="h-5 w-5" />}
              connected={spotifyConnected}
            />
          </div>
        )}
      </div>

      {/* My AREAs */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">My AREAs</h2>
          <Link
            to="/areas/create"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            New AREA
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : areas.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No AREAs yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first automation to get started
            </p>
            <Link
              to="/areas/create"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create AREA
            </Link>
          </div>
        ) : (
          /* Areas List */
          <div className="space-y-4">
            {areas.map((area) => (
              <div
                key={area.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{area.name}</h3>
                      {area.enabled ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {area.action.service}
                      </span>
                      <span>→</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {area.reaction.service}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleArea(area.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        area.enabled
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {area.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteArea(area.id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceStatus({ name, icon, connected }: { name: string; icon: React.ReactNode; connected: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="text-gray-600">{icon}</div>
        <span className="font-medium text-gray-900">{name}</span>
      </div>
      <div className="flex items-center space-x-2">
        {connected ? (
          <>
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Connected</span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Not connected</span>
          </>
        )}
      </div>
    </div>
  );
}
// web/src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Server, Database, Zap, ArrowRight, Github, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ServiceInfo {
  name: string;
  actions: Array<{ name: string; description: string }>;
  reactions: Array<{ name: string; description: string }>;
}

interface AboutData {
  client: { host: string };
  server: {
    current_time: number;
    services: ServiceInfo[];
  };
}

export default function Home() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetch(`${API_URL}/about.json`)
      .then(res => res.json())
      .then(data => {
        setAboutData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [API_URL]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold">Error loading services</p>
          <p className="text-sm text-red-600 mt-2">{error}</p>
          <p className="text-sm text-red-600 mt-2">
            Make sure the backend server is running on {API_URL}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
          <Zap className="h-10 w-10 text-indigo-600" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Automate Your Workflow
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect GitHub, Discord, and more to create powerful automations. 
          Trigger actions and reactions automatically.
        </p>
        {!user ? (
          <div className="flex justify-center space-x-4">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition font-semibold text-lg"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="flex justify-center space-x-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        )}
      </div>

      {aboutData && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
              <div className="flex items-center space-x-3 mb-2">
                <Server className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Available Services</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {aboutData.server.services.length}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                GitHub, Discord and more
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500">
              <div className="flex items-center space-x-3 mb-2">
                <Zap className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Trigger Actions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {aboutData.server.services.reduce((sum, s) => sum + s.actions.length, 0)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Events that start automations
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-purple-500">
              <div className="flex items-center space-x-3 mb-2">
                <Database className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">REActions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {aboutData.server.services.reduce((sum, s) => sum + s.reactions.length, 0)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Automated responses
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              How It Works
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Create powerful automations by connecting Actions and REActions
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-indigo-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Connect Services
                </h3>
                <p className="text-gray-600">
                  Link your GitHub, Discord and other accounts to AREA
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Create AREA
                </h3>
                <p className="text-gray-600">
                  Choose an Action trigger and a REAction response
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Automate Everything
                </h3>
                <p className="text-gray-600">
                  Sit back and let AREA handle your workflows automatically
                </p>
              </div>
            </div>
          </div>

          {/* Example Automations */}
          <div className="mb-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Example Automations
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Example 1 */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <Github className="h-10 w-10 text-gray-900" />
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-10 w-10 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  GitHub → Discord
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  When an urgent issue is created on GitHub, automatically send a notification to your Discord server
                </p>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Action</span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">REAction</span>
                </div>
              </div>

              {/* Example 2 */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-10 w-10 text-indigo-600" />
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <div className="flex-shrink-0">
                    <Github className="h-10 w-10 text-gray-900" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Discord → GitHub
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  When someone posts a message with bug keyword, automatically create a GitHub issue
                </p>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Action</span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">REAction</span>
                </div>
              </div>

              {/* Example 3 */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <Github className="h-10 w-10 text-gray-900" />
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-10 w-10 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pull Request → Discord
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get notified on Discord when a new pull request is opened with interactive merge buttons
                </p>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Action</span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">REAction</span>
                </div>
              </div>

              {/* Example 4 */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-10 w-10 text-indigo-600" />
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <div className="flex-shrink-0">
                    <Github className="h-10 w-10 text-gray-900" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Discord Commands → GitHub
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Use Discord slash commands to create issues, PRs, and comments directly from chat
                </p>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Action</span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">REAction</span>
                </div>
              </div>
            </div>
          </div>

        {/* Available Services */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Available Services
            </h2>

            <div className="space-y-6">
              {aboutData.server.services.map((service) => (
                <div key={service.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {service.name === 'github' && <Github className="h-6 w-6 text-white" />}
                        {service.name === 'discord' && <MessageSquare className="h-6 w-6 text-white" />}
                        <h3 className="text-xl font-semibold text-white capitalize">
                          {service.name}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-300" />
                        <span className="text-sm text-white font-medium">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Actions */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs mr-2 font-bold">
                            {service.actions.length} Actions
                          </span>
                          <span className="text-sm text-gray-600">Triggers</span>
                        </h4>
                        <ul className="space-y-2">
                          {service.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-green-600 mr-2 mt-0.5">▸</span>
                              <div>
                                <p className="font-medium text-sm text-gray-900">
                                  {action.name.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-gray-600">{action.description}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* REActions */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs mr-2 font-bold">
                            {service.reactions.length} REActions
                          </span>
                          <span className="text-sm text-gray-600">Responses</span>
                        </h4>
                        <ul className="space-y-2">
                          {service.reactions.map((reaction, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-purple-600 mr-2 mt-0.5">◂</span>
                              <div>
                                <p className="font-medium text-sm text-gray-900">
                                  {reaction.name.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-gray-600">{reaction.description}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          {!user && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-12 text-center text-white mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Automate?
              </h2>
              <p className="text-xl mb-8 text-indigo-100">
                Join AREA today and start connecting your favorite services
              </p>
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-lg"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          )}

{/* Mobile App Download */}
          <div className="bg-white rounded-2xl shadow-md p-8 text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              📱 Download Mobile App
            </h3>
            <p className="text-gray-600 mb-6">
              Take AREA with you. Download our Android app and manage your automations on the go.
</p>
<a
  href="/client.apk"
  download
  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md hover:shadow-lg"
>
  <Download className="h-5 w-5 mr-2" />
  Download APK
</a>
            <p className="text-xs text-gray-500 mt-4">
              Android 8.0 or higher required
            </p>
          </div>

          {/* Footer Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">Your IP:</span>
                <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                  {aboutData.client.host}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">Server Time:</span>
                <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                  {new Date(aboutData.server.current_time * 1000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
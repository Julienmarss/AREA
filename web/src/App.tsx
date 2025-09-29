import { useState, useEffect } from 'react';
import { Download, Server, Database, Zap } from 'lucide-react';

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

function App() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">AREA Platform</h1>
            </div>
            <a
              href="/client.apk"
              download
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Download className="h-5 w-5 mr-2" />
              Download APK
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">Error: {error}</p>
            <p className="text-sm text-red-600 mt-2">Make sure the backend server is running on {API_URL}</p>
          </div>
        )}

        {aboutData && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-3">
                  <Server className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Services</p>
                    <p className="text-2xl font-bold">{aboutData.server.services.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-3">
                  <Zap className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Actions</p>
                    <p className="text-2xl font-bold">
                      {aboutData.server.services.reduce((sum, s) => sum + s.actions.length, 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-3">
                  <Database className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">REActions</p>
                    <p className="text-2xl font-bold">
                      {aboutData.server.services.reduce((sum, s) => sum + s.reactions.length, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Services</h2>
              {aboutData.server.services.map((service) => (
                <div key={service.name} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <h3 className="text-xl font-semibold text-white capitalize">
                      {service.name.replace('_', ' ')}
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Actions */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">
                            {service.actions.length} Actions
                          </span>
                        </h4>
                        <ul className="space-y-2">
                          {service.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-green-600 mr-2">→</span>
                              <div>
                                <p className="font-medium text-sm">{action.name}</p>
                                <p className="text-xs text-gray-600">{action.description}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* REActions */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-2">
                            {service.reactions.length} REActions
                          </span>
                        </h4>
                        <ul className="space-y-2">
                          {service.reactions.map((reaction, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-purple-600 mr-2">←</span>
                              <div>
                                <p className="font-medium text-sm">{reaction.name}</p>
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

            {/* Footer Info */}
            <div className="mt-12 bg-white rounded-xl shadow-md p-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Your IP:</span> {aboutData.client.host}
                </div>
                <div>
                  <span className="font-semibold">Server Time:</span>{' '}
                  {new Date(aboutData.server.current_time * 1000).toLocaleString()}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white mt-12 border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            AREA Platform - Action REAction Automation System
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
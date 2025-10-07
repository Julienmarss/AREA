import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Zap, Settings, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
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
                Link your GitHub, Discord accounts
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
        <h2 className="text-xl font-bold text-gray-900 mb-4">Connected Services</h2>
        <div className="space-y-3">
          <ServiceStatus 
            name="GitHub" 
            connected={false}
          />
          <ServiceStatus 
            name="Discord" 
            connected={false}
          />
        </div>
        <Link
          to="/services"
          className="mt-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Manage services →
        </Link>
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

        {/* Empty State */}
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
      </div>
    </div>
  );
}

function ServiceStatus({ name, connected }: { name: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
      <span className="font-medium text-gray-900">{name}</span>
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
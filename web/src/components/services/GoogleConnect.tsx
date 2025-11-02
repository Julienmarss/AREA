import { Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { ServiceStatus } from '../../types/services';

interface GoogleConnectProps {
  status: ServiceStatus;
  onConnect: () => void;
}

export default function GoogleConnect({ status, onConnect }: GoogleConnectProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Google (Gmail)</h3>
              <p className="text-red-50 text-sm">Email automation & management</p>
            </div>
          </div>
          
          {status.loading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : status.connected ? (
            <CheckCircle2 className="h-6 w-6 text-white" />
          ) : (
            <AlertCircle className="h-5 w-5 text-white/70" />
          )}
        </div>
      </div>

      <div className="p-6">
        {status.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">Connection Error</p>
              <p className="text-xs text-red-600 mt-1">{status.error}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            {status.connected ? (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Connected</span>
                </div>
                {status.username && (
                  <p className="text-xs text-gray-500">{status.username}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Not connected</span>
              </div>
            )}
          </div>

          <button
            onClick={onConnect}
            disabled={status.loading || status.connected}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${status.connected 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg hover:scale-105 active:scale-95'
              }
              ${status.loading ? 'opacity-50 cursor-wait' : ''}
            `}
          >
            {status.loading ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </span>
            ) : status.connected ? (
              'Connected'
            ) : (
              'Connect with Google'
            )}
          </button>
        </div>

        {/* Features list */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 font-medium">Available Actions:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Receive new emails</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Send emails</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Auto-reply</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Manage labels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

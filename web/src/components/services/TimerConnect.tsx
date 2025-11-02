import { Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface TimerConnectProps {
  jobsCount: number;
  loading: boolean;
  error?: string;
}

export default function TimerConnect({ jobsCount, loading, error }: TimerConnectProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Timer</h3>
              <p className="text-purple-50 text-sm">Schedule time-based automations</p>
            </div>
          </div>
          
          {loading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-white" />
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Always Available</span>
              </div>
              <p className="text-xs text-gray-500">
                {loading ? 'Loading...' : `${jobsCount} scheduled ${jobsCount === 1 ? 'job' : 'jobs'}`}
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200">
            ✓ No Setup Required
          </div>
        </div>

        {/* Features list */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 font-medium">Available Triggers:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Every hour</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Every day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Every week</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Custom intervals</span>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-800">
            <strong>💡 Pro tip:</strong> Combine Timer with any service reaction to create powerful scheduled automations. 
            For example: "Every day at 9am → Send Discord message"
          </p>
        </div>
      </div>
    </div>
  );
}

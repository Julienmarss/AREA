import { Github, CheckCircle } from 'lucide-react';
import { ServiceStatus } from '../../types/services';
import ServiceCard from './ServiceCard';

interface GitHubConnectProps {
  status: ServiceStatus;
  onConnect: () => void;
}

export default function GitHubConnect({ status, onConnect }: GitHubConnectProps) {
  return (
    <ServiceCard
      title="GitHub"
      icon={<Github className="h-6 w-6 text-white" />}
      gradient="bg-gradient-to-r from-gray-800 to-gray-900"
      status={status}
    >
      {status.connected ? (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold">
            Connected as {status.username || 'GitHub User'}
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
          
          <p className="text-sm text-gray-600 mb-4">
            ✅ Full access to your repositories<br/>
            ✅ Create issues and pull requests<br/>
            ✅ Add comments and manage repos
          </p>

          {status.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-4">
              {status.error}
            </div>
          )}

          <button
            onClick={onConnect}
            className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-semibold flex items-center justify-center space-x-2"
          >
            <Github className="h-5 w-5" />
            <span>Connect with GitHub</span>
          </button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            You'll be redirected to GitHub to authorize access
          </p>
        </div>
      )}
    </ServiceCard>
  );
}
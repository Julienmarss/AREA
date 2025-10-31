import { Book, CheckCircle } from 'lucide-react';
import { ServiceStatus } from '../../types/services';
import ServiceCard from './ServiceCard';

interface NotionConnectProps {
  status: ServiceStatus;
  onConnect: () => void;
}

export default function NotionConnect({ status, onConnect }: NotionConnectProps) {
  return (
    <ServiceCard
      title="Notion"
      icon={<Book className="h-6 w-6 text-white" />}
      gradient="bg-gradient-to-r from-gray-800 to-gray-900"
      status={status}
    >
      {status.connected ? (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-gray-800 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold">Notion Connected</p>
          {status.username && (
            <p className="text-sm text-gray-600 mt-1">
              Workspace: {status.username}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            You can now automate your Notion workspace with pages and databases
          </p>
        </div>
      ) : (
        <div>
          <p className="text-gray-700 mb-4">
            Connect your Notion workspace to automate pages, databases, and content management.
          </p>

          {status.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {status.error}
            </div>
          )}

          <button
            onClick={onConnect}
            disabled={status.loading}
            className="w-full py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Book className="h-5 w-5" />
            <span>{status.loading ? 'Connecting...' : 'Connect with Notion'}</span>
          </button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            You'll be redirected to Notion to authorize access to your workspace
          </p>
        </div>
      )}
    </ServiceCard>
  );
}

import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { ServiceStatus } from '../../types/services';

interface ServiceCardProps {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  status: ServiceStatus;
  children: React.ReactNode;
}

export default function ServiceCard({ title, icon, gradient, status, children }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`${gradient} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon}
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
          {status.loading ? (
            <Loader className="h-5 w-5 text-white animate-spin" />
          ) : status.connected ? (
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
        {children}
      </div>
    </div>
  );
}
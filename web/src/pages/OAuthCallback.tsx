// web/src/pages/OAuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    console.log('🔍 OAuth Callback params:', { connected, error });

    if (error) {
      handleError(error);
    } else if (connected) {
      handleSuccess(connected);
    } else {
      setStatus('error');
      setMessage('No status received from server');
      setTimeout(() => navigate('/services'), 3000);
    }
  }, [searchParams, navigate]);

const handleSuccess = (service: string) => {
  console.log('✅ Service connected:', service);
  setStatus('success');
  
  const guildName = searchParams.get('guild');
  
  const serviceNames: Record<string, string> = {
    discord: guildName ? `Discord (Server: ${guildName})` : 'Discord',
    github: 'GitHub',
    spotify: 'Spotify'
  };
  
  setMessage(`${serviceNames[service] || service} connected successfully! 🎉`);
  
  setTimeout(() => {
    navigate('/services');
  }, 2000);
};

  const handleError = (error: string) => {
    console.error('❌ OAuth error:', error);
    setStatus('error');
    
    const errorMessages: Record<string, string> = {
      'access_denied': 'You denied access to the application',
      'no_guild': 'No Discord server found. Please join a server first.',
      'bot_not_configured': 'Discord bot is not configured on the server',
      'auth_failed': 'Authentication failed. Please try again.',
    };
    
    setMessage(errorMessages[error] || `Error: ${error}`);
    
    setTimeout(() => {
      navigate('/services');
    }, 5000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader className="h-16 w-16 text-indigo-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connecting...
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Success! 🎉
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="animate-pulse text-sm text-gray-500">
                Redirecting to services page...
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connection Failed
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => navigate('/services')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                Return to Services
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
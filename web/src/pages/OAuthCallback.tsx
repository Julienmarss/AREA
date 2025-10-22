// web/src/pages/OAuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Discord authentication...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔍 OAuth Callback params:', { code: !!code, state: !!state, error });

    if (error) {
      setStatus('error');
      setMessage(decodeURIComponent(error));
      setTimeout(() => navigate('/services'), 5000);
      return;
    }

    if (code && state) {
      handleDiscordCallback(code, state);
    } else {
      setStatus('error');
      setMessage('Missing code or state parameter');
      setTimeout(() => navigate('/services'), 3000);
    }
  }, []);

  const handleDiscordCallback = async (code: string, state: string) => {
    try {
      console.log('🔄 Processing Discord callback...');

      // Décoder le state pour obtenir le userId
      let userId = user?.id;
      
      try {
        const stateData = JSON.parse(atob(state));
        userId = stateData.userId || userId;
      } catch (e) {
        console.warn('⚠️ Could not parse state, using current user');
      }

      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('📤 Sending code to backend...', { userId });

      // Envoyer le code au backend
      const response = await fetch(`${API_URL}/api/v1/services/discord/oauth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('area_token')}`,
        },
        body: JSON.stringify({ code, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Discord');
      }

      console.log('✅ Discord connected:', data);

      setStatus('success');
      setMessage(`Discord connected! Welcome ${data.username || 'User'}!`);
      
      setTimeout(() => {
        navigate('/services');
      }, 2000);

    } catch (error: any) {
      console.error('❌ Discord callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect Discord');
      
      setTimeout(() => {
        navigate('/services');
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader className="h-16 w-16 text-indigo-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connecting Discord...
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
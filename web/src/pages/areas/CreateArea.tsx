// web/src/pages/areas/CreateArea.tsx - VERSION SIMPLIFIÉE
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { areasAPI, aboutAPI, githubAPI, discordAPI, spotifyAPI, googleAPI } from '../../services/api';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import CreateAreaSteps from '../../components/areas/create/CreateAreaSteps';
import { isActionConfigValid, isReactionConfigValid } from '../../components/areas/create/utils';

interface ServiceInfo {
  name: string;
  actions: Array<{ name: string; description: string }>;
  reactions: Array<{ name: string; description: string }>;
}

export default function CreateArea() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ============================================
  // STATE
  // ============================================
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Service connections
  const [githubConnected, setGithubConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [actionService, setActionService] = useState('');
  const [actionType, setActionType] = useState('');
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});
  const [reactionService, setReactionService] = useState('');
  const [reactionType, setReactionType] = useState('');
  const [reactionConfig, setReactionConfig] = useState<Record<string, any>>({});

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  // ============================================
  // DATA LOADING
  // ============================================
  const loadData = async () => {
    const userId = user?.id;
    if (!userId) {
      console.warn('⚠️ Cannot load data: no user ID');
      return;
    }

    try {
      // Load available services
      const aboutData = await aboutAPI.getInfo();
      setServices(aboutData.server.services);

      // Check service connections
      try {
        const github = await githubAPI.getStatus(userId);
        setGithubConnected(github.authenticated);
      } catch (e) {
        console.error('Failed to check GitHub:', e);
      }

      try {
        const discord = await discordAPI.getStatus(userId);
        setDiscordConnected(discord.authenticated);
      } catch (e) {
        console.error('Failed to check Discord:', e);
      }

      try {
        const spotify = await spotifyAPI.getStatus(userId);
        setSpotifyConnected(spotify.connected);
      } catch (e) {
        console.error('Failed to check Spotify:', e);
      }

      try {
        const google = await googleAPI.getStatus(userId);
        setGoogleConnected(google.authenticated);
      } catch (e) {
        console.error('Failed to check Google:', e);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const isServiceConnected = (serviceName: string) => {
    switch (serviceName) {
      case 'github': return githubConnected;
      case 'discord': return discordConnected;
      case 'spotify': return spotifyConnected;
      case 'google': return googleConnected;
      case 'timer': return true; // Timer is always available
      default: return false;
    }
  };

  // ============================================
  // VALIDATION
  // ============================================
  const canProceedToStep2 = areaName.trim() !== '';
  
  const canProceedToStep3 = Boolean(
    actionService && 
    actionType && 
    isActionConfigValid(actionService, actionType, actionConfig)
  );
  
  const canProceedToStep4 = Boolean(
    reactionService && 
    reactionType && 
    isReactionConfigValid(reactionService, reactionType, reactionConfig)
  );
  
  const canSubmit = canProceedToStep2 && canProceedToStep3 && canProceedToStep4;

  // ============================================
  // SUBMIT
  // ============================================
  const handleCreateArea = async () => {
    setError('');
    setCreating(true);

    try {
      const areaData = {
        userId: user?.id || 'demo_user',
        name: areaName,
        description: areaDescription,
        action: {
          service: actionService,
          type: actionType,
          config: actionConfig,
        },
        reaction: {
          service: reactionService,
          type: reactionType,
          config: reactionConfig,
        },
        enabled: true,
      };

      console.log('📝 Creating AREA:', areaData);
      await areasAPI.create(areaData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Failed to create AREA:', error);
      setError(error.message || 'Failed to create AREA');
    } finally {
      setCreating(false);
    }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // ============================================
  // RENDER: SUCCESS
  // ============================================
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AREA Created Successfully!</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: MAIN FORM
  // ============================================
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New AREA</h1>
        <p className="text-gray-600">
          Build an automation by connecting an Action trigger to a REAction response
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`w-16 sm:w-24 h-1 ${
                    currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs sm:text-sm">
          <span className={currentStep >= 1 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Name</span>
          <span className={currentStep >= 2 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Action</span>
          <span className={currentStep >= 3 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>REAction</span>
          <span className={currentStep >= 4 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Review</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <CreateAreaSteps
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          areaName={areaName}
          areaDescription={areaDescription}
          onNameChange={setAreaName}
          onDescriptionChange={setAreaDescription}
          services={services}
          isServiceConnected={isServiceConnected}
          actionService={actionService}
          actionType={actionType}
          actionConfig={actionConfig}
          onActionServiceChange={setActionService}
          onActionTypeChange={setActionType}
          onActionConfigChange={setActionConfig}
          reactionService={reactionService}
          reactionType={reactionType}
          reactionConfig={reactionConfig}
          onReactionServiceChange={setReactionService}
          onReactionTypeChange={setReactionType}
          onReactionConfigChange={setReactionConfig}
          canProceedToStep2={canProceedToStep2}
          canProceedToStep3={canProceedToStep3}
          canProceedToStep4={canProceedToStep4}
          canSubmit={canSubmit}
          onSubmit={handleCreateArea}
          creating={creating}
        />
      </div>
    </div>
  );
}
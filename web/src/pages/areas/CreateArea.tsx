import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { areasAPI, aboutAPI, githubAPI, discordAPI, spotifyAPI } from '../../services/api';
import { Zap, ArrowRight, Github, MessageSquare, Music, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface ServiceInfo {
  name: string;
  actions: Array<{ name: string; description: string }>;
  reactions: Array<{ name: string; description: string }>;
}

interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description: string;
  url: string;
}

export default function CreateArea() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Service connections status
  const [githubConnected, setGithubConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  // GitHub repositories
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Form states
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  
  // Action
  const [actionService, setActionService] = useState('');
  const [actionType, setActionType] = useState('');
  const [actionConfig, setActionConfig] = useState<Record<string, string>>({});
  
  // Reaction
  const [reactionService, setReactionService] = useState('');
  const [reactionType, setReactionType] = useState('');
  const [reactionConfig, setReactionConfig] = useState<Record<string, string>>({});

  // Step management (wizard)
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  // Charger les repos GitHub quand on sélectionne une réaction GitHub
  useEffect(() => {
    if (reactionService === 'github' && githubConnected && githubRepos.length === 0) {
      loadGitHubRepositories();
    }
  }, [reactionService, githubConnected]);

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
        const discord = await discordAPI.getStatus();
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

    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const loadGitHubRepositories = async () => {
    setLoadingRepos(true);
    try {
      console.log('📦 Loading GitHub repositories...');
      const response = await githubAPI.getRepositories();
      setGithubRepos(response.repositories);
      console.log('✅ Loaded', response.repositories.length, 'repositories');
    } catch (error) {
      console.error('Failed to load repositories:', error);
      setError('Failed to load GitHub repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const isServiceConnected = (serviceName: string) => {
    switch (serviceName) {
      case 'github': return githubConnected;
      case 'discord': return discordConnected;
      case 'spotify': return spotifyConnected;
      default: return false;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'github': return <Github className="h-5 w-5" />;
      case 'discord': return <MessageSquare className="h-5 w-5" />;
      case 'spotify': return <Music className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getServiceColor = (serviceName: string) => {
    switch (serviceName) {
      case 'github': return 'bg-gray-900 text-white';
      case 'discord': return 'bg-indigo-600 text-white';
      case 'spotify': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const selectedActionService = services.find(s => s.name === actionService);
  const selectedReactionService = services.find(s => s.name === reactionService);

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const canProceedToStep2 = areaName.trim() !== '';
  const canProceedToStep3 = actionService && actionType;
  const canProceedToStep4 = reactionService && reactionType && isReactionConfigValid();
  const canSubmit = canProceedToStep2 && canProceedToStep3 && canProceedToStep4;

  function isReactionConfigValid(): boolean {
    if (reactionService === 'github' && reactionType === 'create_issue') {
      return !!(reactionConfig.owner && reactionConfig.repo && reactionConfig.title);
    }
    if (reactionService === 'discord' && reactionType === 'send_message_to_channel') {
      return !!(reactionConfig.channelId && reactionConfig.content);
    }
    // Autres validations...
    return true;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

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
          <span className={currentStep >= 1 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>
            Name
          </span>
          <span className={currentStep >= 2 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>
            Action
          </span>
          <span className={currentStep >= 3 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>
            REAction
          </span>
          <span className={currentStep >= 4 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>
            Review
          </span>
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
      <form onSubmit={handleCreateArea} className="bg-white rounded-xl shadow-md p-6">
        {/* Step 1: Name & Description */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Step 1: Name Your AREA</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AREA Name *
              </label>
              <input
                type="text"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g., Create GitHub issue from Discord"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={areaDescription}
                onChange={(e) => setAreaDescription(e.target.value)}
                placeholder="Describe what this automation does..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>Next: Choose Action</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Step 2: Choose Action */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Step 2: Choose Action (Trigger)</h2>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                ← Back
              </button>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Service *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {services.map((service) => {
                  const connected = isServiceConnected(service.name);
                  return (
                    <button
                      key={service.name}
                      type="button"
                      onClick={() => {
                        if (connected) {
                          setActionService(service.name);
                          setActionType('');
                          setActionConfig({});
                        }
                      }}
                      disabled={!connected}
                      className={`p-4 border-2 rounded-lg transition ${
                        actionService === service.name
                          ? 'border-indigo-600 bg-indigo-50'
                          : connected
                          ? 'border-gray-200 hover:border-indigo-300'
                          : 'border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-2 rounded-lg ${getServiceColor(service.name)}`}>
                          {getServiceIcon(service.name)}
                        </div>
                        <span className="font-medium capitalize">{service.name}</span>
                        {!connected && (
                          <span className="text-xs text-red-600">Not connected</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {services.some(s => !isServiceConnected(s.name)) && (
                <p className="text-sm text-gray-600 mt-2">
                  Connect services on the{' '}
                  <a href="/services" className="text-indigo-600 hover:underline">
                    Services page
                  </a>
                </p>
              )}
            </div>

            {/* Action Type Selection */}
            {actionService && selectedActionService && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Action Type *
                </label>
                <div className="space-y-2">
                  {selectedActionService.actions.map((action) => (
                    <button
                      key={action.name}
                      type="button"
                      onClick={() => {
                        setActionType(action.name);
                        setActionConfig({});
                      }}
                      className={`w-full p-4 border-2 rounded-lg text-left transition ${
                        actionType === action.name
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{action.name.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Config for Discord */}
            {actionService === 'discord' && actionType === 'message_posted_in_channel' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Configuration</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel ID *
                  </label>
                  <input
                    type="text"
                    value={actionConfig.channelId || ''}
                    onChange={(e) => setActionConfig({ ...actionConfig, channelId: e.target.value })}
                    placeholder="123456789012345678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keyword (optional)
                  </label>
                  <input
                    type="text"
                    value={actionConfig.keyword || ''}
                    onChange={(e) => setActionConfig({ ...actionConfig, keyword: e.target.value })}
                    placeholder="bug"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only trigger when message contains this keyword
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToStep3}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>Next: Choose REAction</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Step 3: Choose REAction */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Step 3: Choose REAction (Response)</h2>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                ← Back
              </button>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Service *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {services.map((service) => {
                  const connected = isServiceConnected(service.name);
                  return (
                    <button
                      key={service.name}
                      type="button"
                      onClick={() => {
                        if (connected) {
                          setReactionService(service.name);
                          setReactionType('');
                          setReactionConfig({});
                        }
                      }}
                      disabled={!connected}
                      className={`p-4 border-2 rounded-lg transition ${
                        reactionService === service.name
                          ? 'border-indigo-600 bg-indigo-50'
                          : connected
                          ? 'border-gray-200 hover:border-indigo-300'
                          : 'border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-2 rounded-lg ${getServiceColor(service.name)}`}>
                          {getServiceIcon(service.name)}
                        </div>
                        <span className="font-medium capitalize">{service.name}</span>
                        {!connected && (
                          <span className="text-xs text-red-600">Not connected</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* REAction Type Selection */}
            {reactionService && selectedReactionService && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select REAction Type *
                </label>
                <div className="space-y-2">
                  {selectedReactionService.reactions.map((reaction) => (
                    <button
                      key={reaction.name}
                      type="button"
                      onClick={() => {
                        setReactionType(reaction.name);
                        setReactionConfig({});
                      }}
                      className={`w-full p-4 border-2 rounded-lg text-left transition ${
                        reactionType === reaction.name
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{reaction.name.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-600 mt-1">{reaction.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* REAction Config for GitHub - Create Issue */}
            {reactionService === 'github' && reactionType === 'create_issue' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Configuration</h4>
                
                {loadingRepos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-6 w-6 text-indigo-600 animate-spin" />
                    <span className="ml-2 text-gray-600">Loading repositories...</span>
                  </div>
                ) : githubRepos.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Repository *
                    </label>
                    <select
                      value={reactionConfig.repo ? `${reactionConfig.owner}/${reactionConfig.repo}` : ''}
                      onChange={(e) => {
                        const [owner, repo] = e.target.value.split('/');
                        setReactionConfig({ ...reactionConfig, owner, repo });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                      required
                    >
                      <option value="">-- Select a repository --</option>
                      {githubRepos.map((repo) => (
                        <option key={repo.id} value={repo.fullName}>
                          {repo.fullName} {repo.private ? '🔒' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {githubRepos.length} repositories available
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-2">No repositories found</p>
                    <button
                      type="button"
                      onClick={loadGitHubRepositories}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Title *
                  </label>
                  <input
                    type="text"
                    value={reactionConfig.title || ''}
                    onChange={(e) => setReactionConfig({ ...reactionConfig, title: e.target.value })}
                    placeholder="New issue from Discord: {{message.content}}"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Placeholders: {`{{message.content}}`}, {`{{message.author}}`}, {`{{message.channel}}`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Body (optional)
                  </label>
                  <textarea
                    value={reactionConfig.body || ''}
                    onChange={(e) => setReactionConfig({ ...reactionConfig, body: e.target.value })}
                    placeholder="Issue created from Discord message by {{message.author}}"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labels (optional)
                  </label>
                  <input
                    type="text"
                    value={reactionConfig.labels || ''}
                    onChange={(e) => setReactionConfig({ ...reactionConfig, labels: e.target.value })}
                    placeholder="bug, automated"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated list of labels
                  </p>
                </div>
              </div>
            )}

            {/* REAction Config for Discord - Send Message */}
            {reactionService === 'discord' && reactionType === 'send_message_to_channel' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Configuration</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel ID *
                  </label>
                  <input
                    type="text"
                    value={reactionConfig.channelId || ''}
                    onChange={(e) => setReactionConfig({ ...reactionConfig, channelId: e.target.value })}
                    placeholder="123456789012345678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content *
                  </label>
                  <textarea
                    value={reactionConfig.content || ''}
                    onChange={(e) => setReactionConfig({ ...reactionConfig, content: e.target.value })}
                    placeholder="New GitHub issue: {{issue.title}}"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Placeholders: {`{{issue.title}}`}, {`{{issue.number}}`}, {`{{issue.html_url}}`}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              disabled={!canProceedToStep4}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>Next: Review & Create</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Step 4: Review & Create */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Step 4: Review & Create</h2>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                ← Back
              </button>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">AREA Name</p>
                <p className="text-lg font-semibold text-gray-900">{areaName}</p>
                {areaDescription && (
                  <p className="text-sm text-gray-600 mt-1">{areaDescription}</p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">ACTION (Trigger)</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1 rounded ${getServiceColor(actionService)}`}>
                      {getServiceIcon(actionService)}
                    </div>
                    <span className="font-medium capitalize">{actionService}</span>
                  </div>
                  <p className="text-sm text-gray-700">{actionType.replace(/_/g, ' ')}</p>
                  {Object.keys(actionConfig).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      {Object.entries(actionConfig).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <ArrowRight className="h-6 w-6 text-gray-400 flex-shrink-0" />

                <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">REACTION (Response)</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1 rounded ${getServiceColor(reactionService)}`}>
                      {getServiceIcon(reactionService)}
                    </div>
                    <span className="font-medium capitalize">{reactionService}</span>
                  </div>
                  <p className="text-sm text-gray-700">{reactionType.replace(/_/g, ' ')}</p>
                  {Object.keys(reactionConfig).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      {Object.entries(reactionConfig).map(([key, value]) => (
                        <div key={key} className="truncate">
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit || creating}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Creating AREA...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Create AREA</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
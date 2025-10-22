// web/src/components/areas/create/CreateAreaSteps.tsx
import { ArrowRight } from 'lucide-react';
import { getServiceIcon, getServiceColor, formatType } from './utils';
import ActionConfigurator from './ActionConfigurator';
import ReactionConfigurator from './ReactionConfigurator';

interface ServiceInfo {
  name: string;
  actions: Array<{ name: string; description: string }>;
  reactions: Array<{ name: string; description: string }>;
}

interface CreateAreaStepsProps {
  // Current step
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  // Step 1: Name
  areaName: string;
  areaDescription: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  
  // Step 2: Action
  services: ServiceInfo[];
  isServiceConnected: (name: string) => boolean;
  actionService: string;
  actionType: string;
  actionConfig: Record<string, any>;
  onActionServiceChange: (service: string) => void;
  onActionTypeChange: (type: string) => void;
  onActionConfigChange: (config: Record<string, any>) => void;
  
  // Step 3: REAction
  reactionService: string;
  reactionType: string;
  reactionConfig: Record<string, any>;
  onReactionServiceChange: (service: string) => void;
  onReactionTypeChange: (type: string) => void;
  onReactionConfigChange: (config: Record<string, any>) => void;
  
  // Validation
  canProceedToStep2: boolean;
  canProceedToStep3: boolean;
  canProceedToStep4: boolean;
  canSubmit: boolean;
  
  // Submission
  onSubmit: () => void;
  creating: boolean;
}

export default function CreateAreaSteps(props: CreateAreaStepsProps) {
  const selectedActionService = props.services.find(s => s.name === props.actionService);
  const selectedReactionService = props.services.find(s => s.name === props.reactionService);

  return (
    <>
      {/* STEP 1: Name & Description */}
      {props.currentStep === 1 && (
        <Step1NameForm
          name={props.areaName}
          description={props.areaDescription}
          onNameChange={props.onNameChange}
          onDescriptionChange={props.onDescriptionChange}
          onNext={() => props.setCurrentStep(2)}
          canProceed={props.canProceedToStep2}
        />
      )}

      {/* STEP 2: Choose Action */}
      {props.currentStep === 2 && (
        <Step2ActionSelection
          services={props.services}
          isServiceConnected={props.isServiceConnected}
          actionService={props.actionService}
          actionType={props.actionType}
          actionConfig={props.actionConfig}
          selectedService={selectedActionService}
          onActionServiceChange={props.onActionServiceChange}
          onActionTypeChange={props.onActionTypeChange}
          onActionConfigChange={props.onActionConfigChange}
          onBack={() => props.setCurrentStep(1)}
          onNext={() => props.setCurrentStep(3)}
          canProceed={props.canProceedToStep3}
        />
      )}

      {/* STEP 3: Choose REAction */}
      {props.currentStep === 3 && (
        <Step3ReactionSelection
          services={props.services}
          isServiceConnected={props.isServiceConnected}
          reactionService={props.reactionService}
          reactionType={props.reactionType}
          reactionConfig={props.reactionConfig}
          actionService={props.actionService}
          selectedService={selectedReactionService}
          onReactionServiceChange={props.onReactionServiceChange}
          onReactionTypeChange={props.onReactionTypeChange}
          onReactionConfigChange={props.onReactionConfigChange}
          onBack={() => props.setCurrentStep(2)}
          onNext={() => props.setCurrentStep(4)}
          canProceed={props.canProceedToStep4}
        />
      )}

      {/* STEP 4: Review */}
      {props.currentStep === 4 && (
        <Step4Review
          areaName={props.areaName}
          areaDescription={props.areaDescription}
          actionService={props.actionService}
          actionType={props.actionType}
          actionConfig={props.actionConfig}
          reactionService={props.reactionService}
          reactionType={props.reactionType}
          reactionConfig={props.reactionConfig}
          onBack={() => props.setCurrentStep(3)}
          onSubmit={props.onSubmit}
          canSubmit={props.canSubmit}
          creating={props.creating}
        />
      )}
    </>
  );
}

// ============================================
// STEP 1: Name Form
// ============================================
interface Step1Props {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onNext: () => void;
  canProceed: boolean;
}

function Step1NameForm({ name, description, onNameChange, onDescriptionChange, onNext, canProceed }: Step1Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Step 1: Name Your AREA</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AREA Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
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
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe what this automation does..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <span>Next: Choose Action</span>
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ============================================
// STEP 2: Action Selection
// ============================================
interface Step2Props {
  services: ServiceInfo[];
  isServiceConnected: (name: string) => boolean;
  actionService: string;
  actionType: string;
  actionConfig: Record<string, any>;
  selectedService?: ServiceInfo;
  onActionServiceChange: (service: string) => void;
  onActionTypeChange: (type: string) => void;
  onActionConfigChange: (config: Record<string, any>) => void;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
}

function Step2ActionSelection(props: Step2Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Step 2: Choose Action (Trigger)</h2>
        <button
          type="button"
          onClick={props.onBack}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← Back
        </button>
      </div>

      <ServiceSelector
        services={props.services}
        selectedService={props.actionService}
        isServiceConnected={props.isServiceConnected}
        onServiceChange={(service) => {
          props.onActionServiceChange(service);
          props.onActionTypeChange('');
          props.onActionConfigChange({});
        }}
        label="Select Service"
      />

      {props.selectedService && (
        <TypeSelector
          types={props.selectedService.actions}
          selectedType={props.actionType}
          onTypeChange={(type) => {
            props.onActionTypeChange(type);
            props.onActionConfigChange({});
          }}
          label="Select Action Type"
        />
      )}

      {props.actionService && props.actionType && (
        <ActionConfigurator
          service={props.actionService}
          type={props.actionType}
          config={props.actionConfig}
          onConfigChange={props.onActionConfigChange}
        />
      )}

      <button
        type="button"
        onClick={props.onNext}
        disabled={!props.canProceed}
        className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <span>Next: Choose REAction</span>
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ============================================
// STEP 3: REAction Selection
// ============================================
interface Step3Props {
  services: ServiceInfo[];
  isServiceConnected: (name: string) => boolean;
  reactionService: string;
  reactionType: string;
  reactionConfig: Record<string, any>;
  actionService: string;
  selectedService?: ServiceInfo;
  onReactionServiceChange: (service: string) => void;
  onReactionTypeChange: (type: string) => void;
  onReactionConfigChange: (config: Record<string, any>) => void;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
}

function Step3ReactionSelection(props: Step3Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Step 3: Choose REAction (Response)</h2>
        <button
          type="button"
          onClick={props.onBack}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← Back
        </button>
      </div>

      <ServiceSelector
        services={props.services}
        selectedService={props.reactionService}
        isServiceConnected={props.isServiceConnected}
        onServiceChange={(service) => {
          props.onReactionServiceChange(service);
          props.onReactionTypeChange('');
          props.onReactionConfigChange({});
        }}
        label="Select Service"
      />

      {props.selectedService && (
        <TypeSelector
          types={props.selectedService.reactions}
          selectedType={props.reactionType}
          onTypeChange={(type) => {
            props.onReactionTypeChange(type);
            props.onReactionConfigChange({});
          }}
          label="Select REAction Type"
        />
      )}

      {props.reactionService && props.reactionType && (
        <ReactionConfigurator
          service={props.reactionService}
          type={props.reactionType}
          config={props.reactionConfig}
          actionService={props.actionService}
          onConfigChange={props.onReactionConfigChange}
        />
      )}

      <button
        type="button"
        onClick={props.onNext}
        disabled={!props.canProceed}
        className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <span>Next: Review & Create</span>
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ============================================
// STEP 4: Review
// ============================================
interface Step4Props {
  areaName: string;
  areaDescription: string;
  actionService: string;
  actionType: string;
  actionConfig: Record<string, any>;
  reactionService: string;
  reactionType: string;
  reactionConfig: Record<string, any>;
  onBack: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  creating: boolean;
}

function Step4Review(props: Step4Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Step 4: Review & Create</h2>
        <button
          type="button"
          onClick={props.onBack}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← Back
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-600">AREA Name</p>
          <p className="text-lg font-semibold text-gray-900">{props.areaName}</p>
          {props.areaDescription && (
            <p className="text-sm text-gray-600 mt-1">{props.areaDescription}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Action Card */}
          <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">ACTION (Trigger)</p>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`p-1 rounded ${getServiceColor(props.actionService)}`}>
                {getServiceIcon(props.actionService)}
              </div>
              <span className="font-medium capitalize">{props.actionService}</span>
            </div>
            <p className="text-sm text-gray-700">{formatType(props.actionType)}</p>
            {Object.keys(props.actionConfig).length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                {Object.entries(props.actionConfig).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <ArrowRight className="h-6 w-6 text-gray-400 flex-shrink-0" />

          {/* REAction Card */}
          <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">REACTION (Response)</p>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`p-1 rounded ${getServiceColor(props.reactionService)}`}>
                {getServiceIcon(props.reactionService)}
              </div>
              <span className="font-medium capitalize">{props.reactionService}</span>
            </div>
            <p className="text-sm text-gray-700">{formatType(props.reactionType)}</p>
            {Object.keys(props.reactionConfig).length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                {Object.entries(props.reactionConfig).map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={props.onSubmit}
        disabled={!props.canSubmit || props.creating}
        className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {props.creating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Creating AREA...</span>
          </>
        ) : (
          <>
            <span>Create AREA</span>
          </>
        )}
      </button>
    </div>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================

interface ServiceSelectorProps {
  services: ServiceInfo[];
  selectedService: string;
  isServiceConnected: (name: string) => boolean;
  onServiceChange: (service: string) => void;
  label: string;
}

function ServiceSelector({ services, selectedService, isServiceConnected, onServiceChange, label }: ServiceSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label} *
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
                  onServiceChange(service.name);
                }
              }}
              disabled={!connected}
              className={`p-4 border-2 rounded-lg transition ${
                selectedService === service.name
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
  );
}

interface TypeSelectorProps {
  types: Array<{ name: string; description: string }>;
  selectedType: string;
  onTypeChange: (type: string) => void;
  label: string;
}

function TypeSelector({ types, selectedType, onTypeChange, label }: TypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label} *
      </label>
      <div className="space-y-2">
        {types.map((type) => (
          <button
            key={type.name}
            type="button"
            onClick={() => onTypeChange(type.name)}
            className={`w-full p-4 border-2 rounded-lg text-left transition ${
              selectedType === type.name
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300'
            }`}
          >
            <p className="font-medium text-gray-900">{formatType(type.name)}</p>
            <p className="text-sm text-gray-600 mt-1">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
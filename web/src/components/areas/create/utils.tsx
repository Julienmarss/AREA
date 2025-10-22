import { Github, MessageSquare, Music, Zap } from 'lucide-react';

// ============================================
// Service Icons
// ============================================
export function getServiceIcon(serviceName: string) {
  switch (serviceName) {
    case 'github':
      return <Github className="h-5 w-5" />;
    case 'discord':
      return <MessageSquare className="h-5 w-5" />;
    case 'spotify':
      return <Music className="h-5 w-5" />;
    default:
      return <Zap className="h-5 w-5" />;
  }
}

// ============================================
// Service Colors
// ============================================
export function getServiceColor(serviceName: string) {
  switch (serviceName) {
    case 'github':
      return 'bg-gray-900 text-white';
    case 'discord':
      return 'bg-indigo-600 text-white';
    case 'spotify':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
}

// ============================================
// Validation Functions
// ============================================
export function isActionConfigValid(
  service: string,
  type: string,
  config: Record<string, any>
): boolean {
  if (service === 'discord' && type === 'message_posted_in_channel') {
    return !!(config.channelId && config.guildId);
  }
  
  if (service === 'github') {
    return true; // GitHub actions are usually valid by default
  }
  
  return true;
}

export function isReactionConfigValid(
  service: string,
  type: string,
  config: Record<string, any>
): boolean {
  if (service === 'github' && type === 'create_issue') {
    return !!(config.owner && config.repo && config.title);
  }
  
  if (service === 'discord' && type === 'send_message_to_channel') {
    return !!(config.channelId && config.content);
  }
  
  return true;
}

// ============================================
// Format Service Name
// ============================================
export function formatServiceName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================
// Format Action/REAction Type
// ============================================
export function formatType(type: string): string {
  return type.replace(/_/g, ' ');
}
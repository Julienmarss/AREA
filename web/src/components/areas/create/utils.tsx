import { Github, MessageSquare, Music, Mail, Clock, Zap } from 'lucide-react';

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
    case 'google':
      return <Mail className="h-5 w-5" />;
    case 'timer':
      return <Clock className="h-5 w-5" />;
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
    case 'google':
      return 'bg-red-600 text-white';
    case 'timer':
      return 'bg-purple-600 text-white';
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
  if (service === 'discord') {
    if (type === 'message_posted_in_channel') {
      return !!(config.channelId && config.guildId);
    }
    if (type === 'user_mentioned') {
      return !!config.userId;
    }
    if (type === 'user_joined_server') {
      return !!config.guildId;
    }
  }
  
  if (service === 'github') {
    // GitHub actions need owner and repo
    return !!(config.owner && config.repo);
  }
  
  if (service === 'google') {
    if (type === 'email_from_sender') {
      return !!config.from;
    }
    if (type === 'email_with_subject') {
      return !!config.subject;
    }
    return true; // new_email_received doesn't need config
  }
  
  if (service === 'timer') {
    // Timer validations
    if (type === 'every_hour') {
      return true; // No config needed
    }
    if (type === 'every_day') {
      return !!config.time; // Need time
    }
    if (type === 'every_week') {
      return !!(config.time && config.day); // Need time and day
    }
    if (type === 'interval') {
      return !!config.intervalMinutes; // Need interval
    }
    if (type === 'scheduled_time') {
      return !!config.cronExpression; // Need cron expression
    }
    return true;
  }
  
  return true;
}

export function isReactionConfigValid(
  service: string,
  type: string,
  config: Record<string, any>
): boolean {
  if (service === 'github') {
    if (type === 'create_issue') {
      return !!(config.owner && config.repo && config.title);
    }
    if (type === 'comment_on_issue') {
      return !!(config.owner && config.repo && config.issue_number && config.body);
    }
    if (type === 'create_repository') {
      return !!config.name;
    }
  }
  
  if (service === 'discord') {
    if (type === 'send_message_to_channel') {
      return !!(config.channelId && config.content);
    }
    if (type === 'send_dm') {
      return !!(config.userId && config.content);
    }
    if (type === 'add_role_to_user') {
      return !!(config.guildId && config.userId && config.roleId);
    }
  }
  
  if (service === 'google' && type === 'send_email') {
    return !!(config.to && config.subject && config.body);
  }
  
  if (service === 'google') {
    if (type === 'reply_to_email') {
      return !!config.body;
    }
    if (type === 'add_label') {
      return !!config.labelName;
    }
    // mark_as_read doesn't need config
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
export interface DiscordMessage {
  id: string;
  content: string;
  authorId: string;
  authorUsername: string;
  channelId: string;
  channelName: string;
  guildId?: string;
  timestamp: Date;
  mentions: string[];
  attachments: DiscordAttachment[];
}

export interface DiscordAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  contentType?: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  bot: boolean;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  memberCount: number;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'dm' | 'category';
  guildId?: string;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  permissions: string;
  position: number;
  guildId: string;
}

// Action trigger data types
export interface MessagePostedTriggerData {
  message: DiscordMessage;
  channel: DiscordChannel;
  author: DiscordUser;
  guild?: DiscordGuild;
}

export interface UserMentionedTriggerData {
  message: DiscordMessage;
  channel: DiscordChannel;
  author: DiscordUser;
  mentionedUser: DiscordUser;
  guild?: DiscordGuild;
}

export interface UserJoinedServerTriggerData {
  user: DiscordUser;
  guild: DiscordGuild;
  joinedAt: Date;
}

// Reaction parameter types
export interface SendMessageParameters {
  channelId: string;
  content: string;
  embed?: DiscordEmbed;
}

export interface SendDMParameters {
  userId: string;
  content: string;
  embed?: DiscordEmbed;
}

export interface AddRoleParameters {
  userId: string;
  roleId: string;
  guildId: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    iconUrl?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  timestamp?: Date;
}

// Configuration types
export interface DiscordBotConfig {
  token: string;
  clientId: string;
  guildIds?: string[];
  intents: number;
}

export interface DiscordAuthData {
  botToken: string;
  guildId: string;
  permissions: string[];
  connectedAt: Date;
}
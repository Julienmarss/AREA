import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { ServiceBase } from './base/ServiceBase';
import { ServiceConfig, ActionConfig, ReactionConfig } from '../types/area';
import { getDiscordClient } from '../middleware/autoReactions';
import { userStorage } from '../storage/UserStorage';

export class DiscordService extends ServiceBase {
  private activeListeners: Map<string, { userId: string; actionId: string; parameters: any }> = new Map();

  constructor() {
    const config: ServiceConfig = {
      name: 'discord',
      displayName: 'Discord',
      description: 'Automate Discord messages, roles, and server events',
      authType: 'oauth2',
      baseUrl: 'https://discord.com/api/v10'
    };

    super(config);
  }

  getActions(): ActionConfig[] {
    return [
      {
        name: 'message_posted_in_channel',
        displayName: 'Message Posted in Channel',
        description: 'Triggered when a message is posted in a specific channel',
        parameters: [
          {
            name: 'channelId',
            type: 'string',
            required: true,
            description: 'ID of the channel to monitor',
            placeholder: '123456789012345678'
          },
          {
            name: 'keyword',
            type: 'string',
            required: false,
            description: 'Optional keyword filter',
            placeholder: 'urgent'
          }
        ]
      },
      {
        name: 'user_mentioned',
        displayName: 'User Mentioned',
        description: 'Triggered when a specific user is mentioned',
        parameters: [
          {
            name: 'userId',
            type: 'string',
            required: true,
            description: 'ID of the user to monitor mentions for',
            placeholder: '123456789012345678'
          }
        ]
      },
      {
        name: 'user_joined_server',
        displayName: 'User Joined Server',
        description: 'Triggered when a user joins a specific server',
        parameters: [
          {
            name: 'guildId',
            type: 'string',
            required: true,
            description: 'ID of the server to monitor',
            placeholder: '123456789012345678'
          }
        ]
      }
    ];
  }

  getReactions(): ReactionConfig[] {
    return [
      {
        name: 'send_message_to_channel',
        displayName: 'Send Message to Channel',
        description: 'Send a message to a Discord channel',
        parameters: [
          {
            name: 'channelId',
            type: 'string',
            required: true,
            description: 'ID of the channel to send message to',
            placeholder: '123456789012345678'
          },
          {
            name: 'content',
            type: 'string',
            required: true,
            description: 'Message content to send',
            placeholder: 'Hello from AREA!'
          }
        ]
      },
      {
        name: 'send_dm',
        displayName: 'Send Direct Message',
        description: 'Send a private message to a user',
        parameters: [
          {
            name: 'userId',
            type: 'string',
            required: true,
            description: 'ID of the user to send DM to',
            placeholder: '123456789012345678'
          },
          {
            name: 'content',
            type: 'string',
            required: true,
            description: 'Message content to send',
            placeholder: 'Hello from AREA!'
          }
        ]
      },
      {
        name: 'add_role_to_user',
        displayName: 'Add Role to User',
        description: 'Add a role to a specific user in a server',
        parameters: [
          {
            name: 'guildId',
            type: 'string',
            required: true,
            description: 'ID of the server',
            placeholder: '123456789012345678'
          },
          {
            name: 'userId',
            type: 'string',
            required: true,
            description: 'ID of the user',
            placeholder: '123456789012345678'
          },
          {
            name: 'roleId',
            type: 'string',
            required: true,
            description: 'ID of the role to add',
            placeholder: '123456789012345678'
          }
        ]
      }
    ];
  }

  async authenticate(userId: string, authData: { botToken?: string; guildId: string }): Promise<boolean> {
    try {
      console.log(`🔐 Authenticating Discord for user ${userId}...`);
      
      const client = getDiscordClient();
      if (!client || !client.isReady()) {
        console.error('❌ Discord bot is not ready');
        return false;
      }

      const guild = client.guilds.cache.get(authData.guildId);
      if (!guild) {
        throw new Error(`Bot is not in the server with ID ${authData.guildId}`);
      }

      console.log(`✅ Bot found in guild: ${guild.name}`);

      this.setAuthData(userId, {
        userId,
        serviceId: 'discord',
        metadata: {
          guildId: authData.guildId,
          guildName: guild.name,
          connectedAt: new Date()
        }
      });

      console.log(`✅ Discord authenticated successfully for user ${userId}`);
      return true;

    } catch (error: any) {
      console.error(`❌ Discord authentication failed for user ${userId}:`, error.message);
      throw error;
    }
  }

async isAuthenticated(userId: string): Promise<boolean> {
  const client = getDiscordClient();
  const authData = this.getAuthData(userId);
  
  const user = userStorage.findById(userId);
  const discordData = user?.services?.discord;
  
  const isAuth = client?.isReady() === true && 
                 authData !== undefined && 
                 discordData?.connected === true;
  
  console.log(`🔍 Discord isAuthenticated for ${userId}:`, isAuth);
  return isAuth;
}

  async refreshAuth(userId: string): Promise<boolean> {
    const client = getDiscordClient();
    return client?.isReady() === true;
  }

  async initialize(): Promise<void> {
    console.log('Discord service initialized (using global bot)');
  }

  async destroy(): Promise<void> {
    console.log('Discord service destroy called (global bot stays alive)');
    this.activeListeners.clear();
  }

  async startListening(userId: string, actionId: string, parameters: Record<string, any>): Promise<void> {
    const listenerId = `${userId}_${actionId}_${JSON.stringify(parameters)}`;
    this.activeListeners.set(listenerId, { userId, actionId, parameters });
    console.log(`Started listening for Discord action: ${actionId} for user ${userId}`);
  }

  async stopListening(userId: string, actionId: string): Promise<void> {
    for (const [key, listener] of this.activeListeners.entries()) {
      if (listener.userId === userId && listener.actionId === actionId) {
        this.activeListeners.delete(key);
      }
    }
    console.log(`Stopped listening for Discord action: ${actionId} for user ${userId}`);
  }

  async executeReaction(reactionId: string, userId: string, parameters: Record<string, any>, triggerData: Record<string, any>): Promise<boolean> {
    const client = getDiscordClient();
    if (!client || !client.isReady()) {
      console.error(`Discord client not ready`);
      return false;
    }

    try {
      switch (reactionId) {
        case 'send_message_to_channel':
          return await this.sendMessageToChannel(client, parameters);
        
        case 'send_dm':
          return await this.sendDirectMessage(client, parameters);
        
        case 'add_role_to_user':
          return await this.addRoleToUser(client, parameters);
        
        default:
          console.error(`Unknown Discord reaction: ${reactionId}`);
          return false;
      }
    } catch (error) {
      console.error(`Discord reaction ${reactionId} failed:`, error);
      return false;
    }
  }

  private async sendMessageToChannel(client: Client, parameters: any): Promise<boolean> {
    try {
      const channel = await client.channels.fetch(parameters.channelId) as TextChannel;
      if (!channel) return false;

      const messageOptions: any = {
        content: parameters.content
      };

      if (parameters.embedTitle || parameters.embedDescription) {
        const embed = new EmbedBuilder();
        if (parameters.embedTitle) embed.setTitle(parameters.embedTitle);
        if (parameters.embedDescription) embed.setDescription(parameters.embedDescription);
        embed.setColor(0x0099ff);
        messageOptions.embeds = [embed];
      }

      await channel.send(messageOptions);
      console.log(`✅ Message sent to channel ${parameters.channelId}`);
      return true;
    } catch (error) {
      console.error('Failed to send message to channel:', error);
      return false;
    }
  }

  private async sendDirectMessage(client: Client, parameters: any): Promise<boolean> {
    try {
      const user = await client.users.fetch(parameters.userId);
      if (!user) return false;

      await user.send(parameters.content);
      console.log(`✅ DM sent to user ${parameters.userId}`);
      return true;
    } catch (error) {
      console.error('Failed to send direct message:', error);
      return false;
    }
  }

  private async addRoleToUser(client: Client, parameters: any): Promise<boolean> {
    try {
      const guild = await client.guilds.fetch(parameters.guildId);
      if (!guild) return false;

      const member = await guild.members.fetch(parameters.userId);
      if (!member) return false;

      const role = await guild.roles.fetch(parameters.roleId);
      if (!role) return false;

      await member.roles.add(role);
      console.log(`✅ Role ${parameters.roleId} added to user ${parameters.userId}`);
      return true;
    } catch (error) {
      console.error('Failed to add role to user:', error);
      return false;
    }
  }
}
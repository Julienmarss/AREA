// server/src/services/DiscordService.ts
import { Client, GatewayIntentBits, Message, GuildMember, TextChannel, User, Guild, EmbedBuilder } from 'discord.js';
import { ServiceBase } from './base/ServiceBase';
import { AreaExecutor } from './AreaExecutor';
import { ServiceConfig, ActionConfig, ReactionConfig } from '../types/area';
import {
  DiscordMessage,
  DiscordUser,
  DiscordGuild,
  DiscordChannel,
  DiscordAuthData
} from '../types/discord';

export class DiscordService extends ServiceBase {
  // Map pour stocker un client Discord par utilisateur
  private userClients: Map<string, Client> = new Map();
  private activeListeners: Map<string, { userId: string; actionId: string; parameters: any }> = new Map();

  constructor() {
    const config: ServiceConfig = {
      name: 'discord',
      displayName: 'Discord',
      description: 'Automate Discord messages, roles, and server events',
      authType: 'bot_token',
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

  async authenticate(userId: string, authData: { botToken: string; guildId: string }): Promise<boolean> {
    try {
      console.log(`🔐 Authenticating Discord for user ${userId}...`);
      
      // Déconnecter l'ancien client si existant
      const existingClient = this.userClients.get(userId);
      if (existingClient) {
        console.log(`📤 Destroying existing Discord client for user ${userId}`);
        existingClient.destroy();
        this.userClients.delete(userId);
      }

      // Créer un nouveau client pour cet utilisateur
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.DirectMessages
        ]
      });

      // Configurer les event handlers pour ce client
      this.setupClientEventHandlers(client, userId);

      // Se connecter avec le token
      console.log(`🔌 Connecting Discord bot for user ${userId}...`);
      await client.login(authData.botToken);

      // Attendre que le client soit prêt
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Discord client ready timeout'));
        }, 15000); // 15 secondes

        client.once('ready', () => {
          clearTimeout(timeout);
          console.log(`✅ Discord bot ready for user ${userId}: ${client.user?.tag}`);
          resolve();
        });

        client.once('error', (error) => {
          clearTimeout(timeout);
          console.error(`❌ Discord client error for user ${userId}:`, error);
          reject(error);
        });
      });

      // Vérifier que le bot a accès au serveur
      const guild = client.guilds.cache.get(authData.guildId);
      if (!guild) {
        throw new Error(`Bot is not in the server with ID ${authData.guildId}. Please invite the bot first.`);
      }

      console.log(`✅ Bot found in guild: ${guild.name}`);

      // Stocker le client
      this.userClients.set(userId, client);

      // Stocker les données d'authentification
      const discordAuthData: DiscordAuthData = {
        botToken: authData.botToken,
        guildId: authData.guildId,
        permissions: ['SEND_MESSAGES', 'MANAGE_ROLES', 'VIEW_CHANNELS'],
        connectedAt: new Date()
      };

      this.setAuthData(userId, {
        userId,
        serviceId: 'discord',
        accessToken: authData.botToken,
        metadata: discordAuthData
      });

      console.log(`✅ Discord authenticated successfully for user ${userId}`);
      return true;

    } catch (error: any) {
      console.error(`❌ Discord authentication failed for user ${userId}:`, error.message);
      
      // Nettoyer en cas d'erreur
      const client = this.userClients.get(userId);
      if (client) {
        client.destroy();
        this.userClients.delete(userId);
      }
      
      // Message d'erreur plus explicite
      if (error.message.includes('disallowed intents')) {
        throw new Error('Message Content Intent not enabled. Go to Discord Developer Portal > Bot > Privileged Gateway Intents > Enable "Message Content Intent"');
      }
      
      throw error;
    }
  }

  async isAuthenticated(userId: string): Promise<boolean> {
    const client = this.userClients.get(userId);
    const authData = this.getAuthData(userId);
    return client?.isReady() === true && authData !== undefined;
  }

  async refreshAuth(userId: string): Promise<boolean> {
    const client = this.userClients.get(userId);
    return client?.isReady() === true;
  }

  async initialize(): Promise<void> {
    console.log('Discord service initialized (multi-user support)');
  }

  async destroy(): Promise<void> {
    console.log('Destroying all Discord clients...');
    for (const [userId, client] of this.userClients.entries()) {
      console.log(`Destroying Discord client for user ${userId}`);
      client.destroy();
    }
    this.userClients.clear();
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
    const client = this.userClients.get(userId);
    if (!client || !client.isReady()) {
      console.error(`Discord client not ready for user ${userId}`);
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

  private setupClientEventHandlers(client: Client, userId: string): void {
    client.on('messageCreate', (message: Message) => {
      if (message.author.bot) return;
      this.handleMessageCreate(message, userId);
    });

    client.on('guildMemberAdd', (member: GuildMember) => {
      this.handleGuildMemberAdd(member, userId);
    });

    client.on('error', (error) => {
      console.error(`Discord client error for user ${userId}:`, error);
    });
  }

  private handleMessageCreate(message: Message, clientUserId: string): void {
    const triggerData = {
      message: this.convertToDiscordMessage(message),
      channel: this.convertToDiscordChannel(message.channel as TextChannel),
      author: this.convertToDiscordUser(message.author),
      guild: message.guild ? this.convertToDiscordGuild(message.guild) : undefined
    };

    AreaExecutor.executeMatchingAreas('discord', 'message_posted_in_channel', triggerData)
      .catch(err => console.error('Error executing AREAs for message:', err));

    if (message.mentions.users.size > 0) {
      message.mentions.users.forEach(mentionedUser => {
        const mentionTriggerData = {
          ...triggerData,
          mentionedUser: this.convertToDiscordUser(mentionedUser),
        };
        AreaExecutor.executeMatchingAreas('discord', 'user_mentioned', mentionTriggerData)
          .catch(err => console.error('Error executing AREAs for mention:', err));
      });
    }
  }

  private handleGuildMemberAdd(member: GuildMember, clientUserId: string): void {
    const triggerData = {
      user: this.convertToDiscordUser(member.user),
      guild: this.convertToDiscordGuild(member.guild),
      joinedAt: member.joinedAt || new Date()
    };

    AreaExecutor.executeMatchingAreas('discord', 'user_joined_server', triggerData)
      .catch(err => console.error('Error executing AREAs for member join:', err));
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

  private convertToDiscordMessage(message: Message): DiscordMessage {
    return {
      id: message.id,
      content: message.content,
      authorId: message.author.id,
      authorUsername: message.author.username,
      channelId: message.channelId,
      channelName: (message.channel as TextChannel).name || 'DM',
      guildId: message.guildId || undefined,
      timestamp: message.createdAt,
      mentions: Array.from(message.mentions.users.keys()),
      attachments: message.attachments.map(att => ({
        id: att.id,
        filename: att.name || 'unknown',
        url: att.url,
        size: att.size,
        contentType: att.contentType || undefined
      }))
    };
  }

  private convertToDiscordUser(user: User): DiscordUser {
    return {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar || undefined,
      bot: user.bot
    };
  }

  private convertToDiscordGuild(guild: Guild): DiscordGuild {
    return {
      id: guild.id,
      name: guild.name,
      icon: guild.icon || undefined,
      ownerId: guild.ownerId,
      memberCount: guild.memberCount
    };
  }

  private convertToDiscordChannel(channel: TextChannel): DiscordChannel {
    return {
      id: channel.id,
      name: channel.name,
      type: 'text',
      guildId: channel.guildId || undefined
    };
  }
}
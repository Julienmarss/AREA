import { Client, GatewayIntentBits, Message, GuildMember, TextChannel, User, Guild, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { ServiceBase } from './base/ServiceBase';
import { ServiceConfig, ActionConfig, ReactionConfig, ActionTriggerEvent } from '../types/area';
import {
  DiscordMessage,
  DiscordUser,
  DiscordGuild,
  DiscordChannel,
  MessagePostedTriggerData,
  UserMentionedTriggerData,
  UserJoinedServerTriggerData,
  SendMessageParameters,
  SendDMParameters,
  AddRoleParameters,
  DiscordAuthData
} from '../types/discord';

export class DiscordService extends ServiceBase {
  private client: Client;
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

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.setupEventHandlers();
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
          },
          {
            name: 'authorId',
            type: 'string',
            required: false,
            description: 'Optional specific author ID',
            placeholder: '123456789012345678'
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
          },
          {
            name: 'channelId',
            type: 'string',
            required: false,
            description: 'Optional specific channel ID',
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
          },
          {
            name: 'embedTitle',
            type: 'string',
            required: false,
            description: 'Optional embed title',
            placeholder: 'Alert'
          },
          {
            name: 'embedDescription',
            type: 'string',
            required: false,
            description: 'Optional embed description',
            placeholder: 'This is an automated message'
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
      // Check if client is already logged in with the same token
      if (this.client.isReady()) {
        const currentToken = this.client.token;
        if (currentToken === authData.botToken) {
          // Already authenticated with this token, just store user data
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
          return true;
        } else {
          // Need to login with new token
          this.client.destroy();
          this.client = new Client({
            intents: [
              GatewayIntentBits.Guilds,
              GatewayIntentBits.GuildMessages,
              GatewayIntentBits.GuildMembers,
              GatewayIntentBits.MessageContent,
              GatewayIntentBits.DirectMessages
            ]
          });
          this.setupEventHandlers();
        }
      }

      // Login with bot token
      await this.client.login(authData.botToken);
      
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

      return true;
    } catch (error) {
      console.error('Discord authentication failed:', error);
      return false;
    }
  }

  async isAuthenticated(userId: string): Promise<boolean> {
    const authData = this.getAuthData(userId);
    return authData !== undefined && this.client.isReady();
  }

  async refreshAuth(userId: string): Promise<boolean> {
    // Discord bot tokens don't expire, but we can check if the client is still connected
    return this.client.isReady();
  }

  async initialize(): Promise<void> {
    console.log('Initializing Discord service...');
    // The client will be logged in during authentication
  }

  async destroy(): Promise<void> {
    console.log('Destroying Discord service...');
    if (this.client) {
      this.client.destroy();
    }
    this.activeListeners.clear();
  }

  async startListening(userId: string, actionId: string, parameters: Record<string, any>): Promise<void> {
    const listenerId = `${userId}_${actionId}_${JSON.stringify(parameters)}`;
    this.activeListeners.set(listenerId, { userId, actionId, parameters });
    console.log(`Started listening for Discord action: ${actionId} for user ${userId}`);
  }

  async stopListening(userId: string, actionId: string): Promise<void> {
    // Remove all listeners for this user and action
    for (const [key, listener] of this.activeListeners.entries()) {
      if (listener.userId === userId && listener.actionId === actionId) {
        this.activeListeners.delete(key);
      }
    }
    console.log(`Stopped listening for Discord action: ${actionId} for user ${userId}`);
  }

  async executeReaction(reactionId: string, userId: string, parameters: Record<string, any>, triggerData: Record<string, any>): Promise<boolean> {
    try {
      switch (reactionId) {
        case 'send_message_to_channel':
          return await this.sendMessageToChannel(parameters);
        
        case 'send_dm':
          return await this.sendDirectMessage(parameters);
        
        case 'add_role_to_user':
          return await this.addRoleToUser(parameters);
        
        default:
          console.error(`Unknown Discord reaction: ${reactionId}`);
          return false;
      }
    } catch (error) {
      console.error(`Discord reaction ${reactionId} failed:`, error);
      return false;
    }
  }

  private setupEventHandlers(): void {
    this.client.on('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.on('messageCreate', (message: Message) => {
      this.handleMessageCreate(message);
    });

    this.client.on('guildMemberAdd', (member: GuildMember) => {
      this.handleGuildMemberAdd(member);
    });
  }

  private handleMessageCreate(message: Message): void {
    if (message.author.bot) return; // Ignore bot messages

    // Check for message_posted_in_channel triggers
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      if (listener.actionId === 'message_posted_in_channel') {
        this.checkMessagePostedTrigger(message, listener);
      } else if (listener.actionId === 'user_mentioned') {
        this.checkUserMentionedTrigger(message, listener);
      }
    }
  }

  private checkMessagePostedTrigger(message: Message, listener: { userId: string; actionId: string; parameters: any }): void {
    const { channelId, keyword, authorId } = listener.parameters;

    // Check channel match
    if (channelId && message.channelId !== channelId) return;

    // Check author match
    if (authorId && message.author.id !== authorId) return;

    // Check keyword match
    if (keyword && !message.content.toLowerCase().includes(keyword.toLowerCase())) return;

    // Trigger the action
    const triggerData: MessagePostedTriggerData = {
      message: this.convertToDiscordMessage(message),
      channel: this.convertToDiscordChannel(message.channel as TextChannel),
      author: this.convertToDiscordUser(message.author),
      guild: message.guild ? this.convertToDiscordGuild(message.guild) : undefined
    };

    this.emitActionTrigger({
      serviceId: 'discord',
      actionId: 'message_posted_in_channel',
      userId: listener.userId,
      data: triggerData,
      timestamp: new Date()
    });
  }

  private checkUserMentionedTrigger(message: Message, listener: { userId: string; actionId: string; parameters: any }): void {
    const { userId, channelId } = listener.parameters;

    // Check channel match if specified
    if (channelId && message.channelId !== channelId) return;

    // Check if the specified user is mentioned
    if (!message.mentions.users.has(userId)) return;

    const mentionedUser = message.mentions.users.get(userId);
    if (!mentionedUser) return;

    // Trigger the action
    const triggerData: UserMentionedTriggerData = {
      message: this.convertToDiscordMessage(message),
      channel: this.convertToDiscordChannel(message.channel as TextChannel),
      author: this.convertToDiscordUser(message.author),
      mentionedUser: this.convertToDiscordUser(mentionedUser),
      guild: message.guild ? this.convertToDiscordGuild(message.guild) : undefined
    };

    this.emitActionTrigger({
      serviceId: 'discord',
      actionId: 'user_mentioned',
      userId: listener.userId,
      data: triggerData,
      timestamp: new Date()
    });
  }

  private handleGuildMemberAdd(member: GuildMember): void {
    // Check for user_joined_server triggers
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      if (listener.actionId === 'user_joined_server') {
        const { guildId } = listener.parameters;

        if (member.guild.id === guildId) {
          const triggerData: UserJoinedServerTriggerData = {
            user: this.convertToDiscordUser(member.user),
            guild: this.convertToDiscordGuild(member.guild),
            joinedAt: member.joinedAt || new Date()
          };

          this.emitActionTrigger({
            serviceId: 'discord',
            actionId: 'user_joined_server',
            userId: listener.userId,
            data: triggerData,
            timestamp: new Date()
          });
        }
      }
    }
  }

  private async sendMessageToChannel(parameters: any): Promise<boolean> {
    try {
      const channel = await this.client.channels.fetch(parameters.channelId) as TextChannel;
      if (!channel) return false;

      const messageOptions: any = {
        content: parameters.content
      };

      // Handle optional embed parameters
      if (parameters.embedTitle || parameters.embedDescription) {
        const embed = new EmbedBuilder();
        if (parameters.embedTitle) embed.setTitle(parameters.embedTitle);
        if (parameters.embedDescription) embed.setDescription(parameters.embedDescription);
        embed.setColor(0x0099ff); // Default blue color
        messageOptions.embeds = [embed];
      }

      await channel.send(messageOptions);
      return true;
    } catch (error) {
      console.error('Failed to send message to channel:', error);
      return false;
    }
  }

  private async sendDirectMessage(parameters: any): Promise<boolean> {
    try {
      const user = await this.client.users.fetch(parameters.userId);
      if (!user) return false;

      await user.send(parameters.content);
      return true;
    } catch (error) {
      console.error('Failed to send direct message:', error);
      return false;
    }
  }

  private async addRoleToUser(parameters: any): Promise<boolean> {
    try {
      const guild = await this.client.guilds.fetch(parameters.guildId);
      if (!guild) return false;

      const member = await guild.members.fetch(parameters.userId);
      if (!member) return false;

      const role = await guild.roles.fetch(parameters.roleId);
      if (!role) return false;

      await member.roles.add(role);
      return true;
    } catch (error) {
      console.error('Failed to add role to user:', error);
      return false;
    }
  }

  // Helper conversion methods
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
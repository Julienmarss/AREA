import { Client, GatewayIntentBits } from 'discord.js';
import { discordCommands, handleSlashCommand } from '../commands/discordCommands';
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DISCORD_CONFIG = {
  BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
};

let discordClient: Client | null = null;

async function initDiscordClient() {
  if (discordClient && discordClient.isReady()) {
    return discordClient;
  }

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages
    ]
  });

  return new Promise((resolve, reject) => {
    discordClient!.once('ready', () => {
      console.log('✅ Discord bot is online:', discordClient!.user?.tag);
      setupDiscordInteractions();
      resolve(discordClient);
    });

    discordClient!.on('error', (error) => {
      console.error('❌ Discord client error:', error);
      reject(error);
    });

    console.log('🔌 Connecting Discord bot...');
    discordClient!.login(DISCORD_CONFIG.BOT_TOKEN).catch(reject);
  });
}

function setupDiscordInteractions() {
  if (!discordClient) return;
  
  discordClient.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
      }
    } catch (error) {
      console.error('Error handling Discord interaction:', error);
      
      if (interaction.isRepliable()) {
        const reply = { content: '❌ Une erreur est survenue', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }
  });

  discordClient.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const { AreaExecutor } = await import('../services/AreaExecutor');
    
    const triggerData = {
      message: {
        id: message.id,
        content: message.content,
        authorId: message.author.id,
        authorUsername: message.author.username,
        channelId: message.channelId,
        channelName: message.channel.isDMBased() ? 'DM' : (message.channel as any).name,
        guildId: message.guildId || undefined,
        timestamp: message.createdAt,
      }
    };

    await AreaExecutor.executeMatchingAreas('discord', 'message_posted_in_channel', triggerData)
      .catch(err => console.error('Error executing AREAs:', err));
  });

  discordClient.on('guildMemberAdd', async (member) => {
    const { AreaExecutor } = await import('../services/AreaExecutor');
    
    const triggerData = {
      user: {
        id: member.user.id,
        username: member.user.username,
      },
      guild: {
        id: member.guild.id,
        name: member.guild.name,
      },
      joinedAt: member.joinedAt || new Date()
    };

    await AreaExecutor.executeMatchingAreas('discord', 'user_joined_server', triggerData)
      .catch(err => console.error('Error executing AREAs:', err));
  });
}

export function setupAutoReactions() {
  console.log('🤖 Setting up Discord bot...');
  initDiscordClient().catch(console.error);
}

export function getDiscordClient() {
  return discordClient;
}
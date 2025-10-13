import { Client, GatewayIntentBits } from 'discord.js';
import { discordCommands, handleSlashCommand } from '../commands/discordCommands';
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DISCORD_CONFIG = {
  BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  CHANNEL_ID: process.env.DISCORD_CHANNEL_ID ?? '1422636117118681251'
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
      GatewayIntentBits.MessageContent
    ]
  });

  return new Promise((resolve, reject) => {
    discordClient!.once('ready', () => {
      console.log('✅ Discord bot initialized (slash commands only)');
      setupDiscordInteractions();
      resolve(discordClient);
    });

    discordClient!.on('error', (error) => {
      console.error('❌ Discord client error:', error);
      reject(error);
    });

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
}

export function setupAutoReactions() {
  console.log('🤖 Setting up Discord bot (slash commands)...');
  initDiscordClient().catch(console.error);
}
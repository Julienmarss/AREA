import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType, ComponentType } from 'discord.js';
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
      console.log('✅ Discord client auto-reaction initialized');
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

async function sendDiscordNotification(issueData: any): Promise<boolean> {
  try {
    if (!discordClient || !discordClient.isReady()) {
      await initDiscordClient();
    }

    const channel = await discordClient!.channels.fetch(DISCORD_CONFIG.CHANNEL_ID) as any;
    if (!channel || !channel.send) {
      console.error('❌ Discord channel not found or cannot send messages');
      return false;
    }

    const repoOwner = issueData.repository?.owner?.login || 'unknown';
    const repoName = issueData.repository?.name || 'unknown';
    const issueTitle = issueData.issue?.title || 'Sans titre';
    const issueUrl = issueData.issue?.html_url || 'https://github.com';
    const author = issueData.issue?.user?.login || 'unknown';
    const labelsText = (issueData.issue?.labels || [])
      .map((l: any) => l?.name)
      .filter(Boolean)
      .join(', ') || '—';

    const embed = new EmbedBuilder()
      .setColor(0xE11D48)
      .setTitle('Urgent issue détectée')
      .setURL(issueUrl)
      .setDescription(issueTitle)
      .addFields(
        { name: 'Référentiel', value: `${repoOwner}/${repoName}`, inline: true },
        { name: 'Auteur', value: author, inline: true },
        { name: 'Labels', value: labelsText, inline: true },
      )
      .setFooter({ text: 'AREA • Automations', iconURL: undefined })
      .setTimestamp(new Date());

    await channel.send({ embeds: [embed] });
    console.log('✅ Discord notification sent automatically for issue #' + issueData.issue?.number);
    return true;
  } catch (error) {
    console.error('❌ Failed to send Discord notification:', error);
    return false;
  }
}

const GITHUB_CONFIG = {
  TOKEN: process.env.GITHUB_TOKEN
};

function setupDiscordInteractions() {
  if (!discordClient) return;
  
  discordClient.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
        return;
      }
      
      if (interaction.isButton()) {
        const [action, type, id] = interaction.customId.split('_');
        
        if (action === 'close' && type === 'issue') {
          await handleCloseIssue(interaction, id);
        } else if (action === 'merge' && type === 'pr') {
          await handleMergePR(interaction, id);
        } else if (action === 'close' && type === 'pr') {
          await handleClosePR(interaction, id);
        }
      }
    } catch (error) {
      console.error('Error handling Discord interaction:', error);
      
      const reply = { content: '❌ Une erreur est survenue', ephemeral: true };
      
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
        await interaction.editReply(reply);
      } else {
        await interaction.reply(reply);
        }
      }
    }
  });
}

async function handleCloseIssue(interaction: any, issueNumber: string) {
  await interaction.deferReply({ ephemeral: true });
  
  const response = await fetch(`https://api.github.com/repos/JusyMathis/AREA-TEST/issues/${issueNumber}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ state: 'closed' })
  });
  
  if (response.ok) {
    await interaction.editReply('✅ Issue fermée avec succès!');
    
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x6B7280)
      .setTitle('✅ Issue fermée');
    
    await interaction.message.edit({ embeds: [embed], components: [] });
  } else {
    await interaction.editReply('❌ Échec de la fermeture de l\'issue');
  }
}

async function handleMergePR(interaction: any, prNumber: string) {
  await interaction.deferReply({ ephemeral: true });
  
  const response = await fetch(`https://api.github.com/repos/JusyMathis/AREA-TEST/pulls/${prNumber}/merge`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      commit_title: 'Merged via AREA Discord Bot',
      merge_method: 'merge'
    })
  });
  
  if (response.ok) {
    await interaction.editReply('✅ Pull Request mergée avec succès!');
    
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x10B981)
      .setTitle('✅ Pull Request mergée');
    
    await interaction.message.edit({ embeds: [embed], components: [] });
  } else {
    await interaction.editReply('❌ Échec du merge de la PR');
  }
}

async function handleClosePR(interaction: any, prNumber: string) {
  await interaction.deferReply({ ephemeral: true });
  
  const response = await fetch(`https://api.github.com/repos/JusyMathis/AREA-TEST/pulls/${prNumber}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ state: 'closed' })
  });
  
  if (response.ok) {
    await interaction.editReply('✅ Pull Request fermée avec succès!');
    
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x6B7280)
      .setTitle('❌ Pull Request fermée');
    
    await interaction.message.edit({ embeds: [embed], components: [] });
  } else {
    await interaction.editReply('❌ Échec de la fermeture de la PR');
  }
}

async function sendPullRequestNotification(prData: any): Promise<boolean> {
  try {
    if (!discordClient || !discordClient.isReady()) {
      await initDiscordClient();
    }

    const channel = await discordClient!.channels.fetch(DISCORD_CONFIG.CHANNEL_ID) as any;
    if (!channel || !channel.send) {
      console.error('❌ Discord channel not found or cannot send messages');
      return false;
    }

    const repoOwner = prData.repository?.owner?.login || 'unknown';
    const repoName = prData.repository?.name || 'unknown';
    const prTitle = prData.pull_request?.title || 'Sans titre';
    const prBody = prData.pull_request?.body || '';
    const prUrl = prData.pull_request?.html_url || 'https://github.com';
    const author = prData.pull_request?.user?.login || 'unknown';
    const authorAvatar = prData.pull_request?.user?.avatar_url;
    const prNumber = prData.pull_request?.number || '?';
    const sourceBranch = prData.pull_request?.head?.ref || 'unknown';
    const targetBranch = prData.pull_request?.base?.ref || 'unknown';
    const changedFiles = prData.pull_request?.changed_files || 0;
    const additions = prData.pull_request?.additions || 0;
    const deletions = prData.pull_request?.deletions || 0;
    const commits = prData.pull_request?.commits || 0;

    const images: string[] = [];
    
    // Markdown images: ![alt](url)
    const markdownRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = markdownRegex.exec(prBody)) !== null) {
      images.push(match[1]);
    }
    
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
    while ((match = urlRegex.exec(prBody)) !== null) {
      if (!images.includes(match[1])) {
        images.push(match[1]);
      }
    }
    
    const githubImageRegex = /(https?:\/\/github\.com\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
    while ((match = githubImageRegex.exec(prBody)) !== null) {
      if (!images.includes(match[1])) {
        images.push(match[1]);
      }
    }
    
    console.log('🖼️ Images found in PR:', images);

    let description = `**${prTitle}**`;
    if (prBody) {
      const cleanBody = prBody
        .replace(/!\[.*?\]\(.*?\)/g, '[Image]')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[#*`_]/g, '')
        .trim();
      
      if (cleanBody && cleanBody !== prTitle) {
        const truncatedBody = cleanBody.length > 200 ? 
          cleanBody.substring(0, 200) + '...' : cleanBody;
        description += `\n\n${truncatedBody}`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x2563EB)
      .setTitle('🔄 Nouvelle Pull Request')
      .setURL(prUrl)
      .setDescription(description)
      .addFields(
        { name: '🏷️ Référentiel', value: `${repoOwner}/${repoName}`, inline: true },
        { name: '👤 Auteur', value: author, inline: true },
        { name: '🌳 Branches', value: `${sourceBranch} → ${targetBranch}`, inline: true },
        { name: '📁 Fichiers', value: `${changedFiles} modifiés`, inline: true },
        { name: '➕ Ajouts', value: `+${additions}`, inline: true },
        { name: '➖ Suppressions', value: `-${deletions}`, inline: true }
      );

    if (authorAvatar) {
      embed.setThumbnail(authorAvatar);
    }

    if (images.length > 0) {
      try {
        embed.setImage(images[0]);
        console.log('✅ Image set for PR:', images[0]);
        
        if (images.length > 1) {
          embed.addFields({
            name: `🇮 Images (${images.length})`,
            value: images.slice(0, 3).map((img, i) => `[Image ${i + 1}](${img})`).join(' • '),
            inline: false
          });
        }
      } catch (error) {
        console.log('⚠️ Failed to set image:', images[0], error);
        embed.addFields({
          name: `🇮 Images (${images.length})`,
          value: images.slice(0, 3).map((img, i) => `[Image ${i + 1}](${img})`).join(' • '),
          inline: false
        });
      }
    } else {
      console.log('⚠️ No images found in PR body');
    }

    if (commits > 0) {
      embed.addFields({ 
        name: '📝 Commits', 
        value: `${commits} commit${commits > 1 ? 's' : ''}`, 
        inline: true 
      });
    }

    embed.setFooter({ text: 'AREA • Pull Requests', iconURL: undefined })
      .setTimestamp(new Date());

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`merge_pr_${prNumber}`)
          .setLabel('Merger')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`close_pr_${prNumber}`)
          .setLabel('Fermer')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌'),
        new ButtonBuilder()
          .setLabel('Voir sur GitHub')
          .setStyle(ButtonStyle.Link)
          .setURL(prUrl)
          .setEmoji('🔗')
      );

    await channel.send({ embeds: [embed], components: [actionRow] });
    console.log('✅ Pull Request notification with rich content sent for PR #' + prNumber);
    return true;
  } catch (error) {
    console.error('❌ Failed to send PR notification:', error);
    return false;
  }
}

export function setupAutoReactions() {
  console.log('🤖 Setting up automatic reactions...');
  
  initDiscordClient().catch(console.error);
  
  return {
    async handleUrgentIssue(eventType: string, payload: any) {
      console.log(`🚨 URGENT ISSUE DETECTED: ${eventType}`);
      
      if (eventType === 'issues' && payload.action === 'opened') {
        const labels = payload.issue?.labels || [];
        const isUrgent = labels.some((label: any) => 
          label.name.toLowerCase() === 'urgent'
        );

        if (isUrgent) {
          console.log('⚡ Triggering automatic issue notification...');
          
          const issueNumber = payload.issue?.number;
          await sendIssueNotificationWithButton(payload, issueNumber);
          
          return true;
        }
      }
      
      return false;
    },
    
    async handlePullRequest(eventType: string, payload: any) {
      console.log(`🔄 PULL REQUEST DETECTED: ${eventType}`);
      
      if (eventType === 'pull_request' && payload.action === 'opened') {
        console.log('⚡ Triggering automatic PR notification...');
        await sendPullRequestNotification(payload);
        return true;
      }
      
      return false;
    },
    
    async handleComment(eventType: string, payload: any) {
      console.log(`💬 COMMENT DETECTED: ${eventType}`);
      
      if (eventType === 'issue_comment' && payload.action === 'created') {
        console.log('⚡ Triggering automatic comment notification...');
        await sendCommentNotification(payload);
        return true;
      }
      
      return false;
    }
  };
}

async function sendIssueNotificationWithButton(issueData: any, issueNumber: string): Promise<boolean> {
  try {
    if (!discordClient || !discordClient.isReady()) {
      await initDiscordClient();
    }

    const channel = await discordClient!.channels.fetch(DISCORD_CONFIG.CHANNEL_ID) as any;
    if (!channel || !channel.send) {
      console.error('❌ Discord channel not found');
      return false;
    }

    const repoOwner = issueData.repository?.owner?.login || 'unknown';
    const repoName = issueData.repository?.name || 'unknown';
    const issueTitle = issueData.issue?.title || 'Sans titre';
    const issueBody = issueData.issue?.body || '';
    const issueUrl = issueData.issue?.html_url || 'https://github.com';
    const author = issueData.issue?.user?.login || 'unknown';
    const authorAvatar = issueData.issue?.user?.avatar_url;
    const labelsText = (issueData.issue?.labels || [])
      .map((l: any) => l?.name)
      .filter(Boolean)
      .join(', ') || '—';

    const images: string[] = [];
    
    // Markdown images: ![alt](url)
    const markdownRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = markdownRegex.exec(issueBody)) !== null) {
      images.push(match[1]);
    }
    
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
    while ((match = urlRegex.exec(issueBody)) !== null) {
      if (!images.includes(match[1])) {
        images.push(match[1]);
      }
    }
    
    console.log('🖼️ Images found in issue:', images);
    let description = issueTitle;
    if (issueBody) {
      const cleanBody = issueBody
        .replace(/!\[.*?\]\(.*?\)/g, '[Image]') // Remplacer images par [Image]
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Liens -> texte seul
        .replace(/[#*`_]/g, '') // Supprimer markdown
        .trim();
      
      if (cleanBody && cleanBody !== issueTitle) {
        const truncatedBody = cleanBody.length > 300 ? 
          cleanBody.substring(0, 300) + '...' : cleanBody;
        description = `**${issueTitle}**\n\n${truncatedBody}`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xE11D48)
      .setTitle('🚨 Issue urgente détectée')
      .setURL(issueUrl)
      .setDescription(description)
      .addFields(
        { name: '🏷️ Référentiel', value: `${repoOwner}/${repoName}`, inline: true },
        { name: '👤 Auteur', value: author, inline: true },
        { name: '🏷️ Labels', value: labelsText, inline: true }
      );

    if (authorAvatar) {
      embed.setThumbnail(authorAvatar);
    }

    if (images.length > 0) {
      embed.setImage(images[0]);
      if (images.length > 1) {
        embed.addFields({
          name: `🇮Images (${images.length})`,
          value: images.slice(0, 3).map((img, i) => `[Image ${i + 1}](${img})`).join(' • '),
          inline: false
        });
      }
    }

    embed.setFooter({ text: 'AREA • Issues', iconURL: undefined })
      .setTimestamp(new Date());

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`close_issue_${issueNumber}`)
          .setLabel('Fermer l\'issue')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setLabel('Voir sur GitHub')
          .setStyle(ButtonStyle.Link)
          .setURL(issueUrl)
          .setEmoji('🔗')
      );

    await channel.send({ embeds: [embed], components: [actionRow] });
    console.log('✅ Issue notification with rich content sent for #' + issueNumber);
    return true;
  } catch (error) {
    console.error('❌ Failed to send issue notification:', error);
    return false;
  }
}

async function sendCommentNotification(commentData: any): Promise<boolean> {
  try {
    if (!discordClient || !discordClient.isReady()) {
      await initDiscordClient();
    }

    const channel = await discordClient!.channels.fetch(DISCORD_CONFIG.CHANNEL_ID) as any;
    if (!channel || !channel.send) {
      console.error('❌ Discord channel not found');
      return false;
    }

    const repoOwner = commentData.repository?.owner?.login || 'unknown';
    const repoName = commentData.repository?.name || 'unknown';
    const issueTitle = commentData.issue?.title || 'Sans titre';
    const issueNumber = commentData.issue?.number || '?';
    const issueUrl = commentData.issue?.html_url || 'https://github.com';
    const commentBody = commentData.comment?.body || '';
    const commentUrl = commentData.comment?.html_url || issueUrl;
    const author = commentData.comment?.user?.login || 'unknown';
    const authorAvatar = commentData.comment?.user?.avatar_url;
    const isIssue = !commentData.issue?.pull_request;

    const images: string[] = [];
    
    // Markdown images: ![alt](url)
    const markdownRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = markdownRegex.exec(commentBody)) !== null) {
      images.push(match[1]);
    }
    
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
    while ((match = urlRegex.exec(commentBody)) !== null) {
      if (!images.includes(match[1])) {
        images.push(match[1]);
      }
    }
    
    console.log('🖼️ Images found in comment:', images);

    let cleanComment = commentBody
      .replace(/!\[.*?\]\(.*?\)/g, '[Image]')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[#*`_]/g, '')
      .trim();
    
    if (cleanComment.length > 300) {
      cleanComment = cleanComment.substring(0, 300) + '...';
    }

    const embed = new EmbedBuilder()
      .setColor(0x6366F1) // violet pour commentaires
      .setTitle(`💬 Nouveau commentaire sur ${isIssue ? 'l\'issue' : 'la PR'} #${issueNumber}`)
      .setURL(commentUrl)
      .setDescription(`**${issueTitle}**\n\n${cleanComment || '*Commentaire vide*'}`)
      .addFields(
        { name: '🏷️ Référentiel', value: `${repoOwner}/${repoName}`, inline: true },
        { name: '👤 Auteur', value: author, inline: true },
        { name: '🔗 Type', value: isIssue ? 'Issue' : 'Pull Request', inline: true }
      );

    // Avatar de l'auteur du commentaire
    if (authorAvatar) {
      embed.setThumbnail(authorAvatar);
    }

    // Première image du commentaire
    if (images.length > 0) {
      embed.setImage(images[0]);
      if (images.length > 1) {
        embed.addFields({
          name: `🇮Images (${images.length})`,
          value: images.slice(0, 3).map((img, i) => `[Image ${i + 1}](${img})`).join(' • '),
          inline: false
        });
      }
    }

    embed.setFooter({ text: 'AREA • Commentaires', iconURL: undefined })
      .setTimestamp(new Date());

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Voir le commentaire')
          .setStyle(ButtonStyle.Link)
          .setURL(commentUrl)
          .setEmoji('🔗'),
        new ButtonBuilder()
          .setLabel(`Voir ${isIssue ? 'l\'issue' : 'la PR'}`)
          .setStyle(ButtonStyle.Link)
          .setURL(issueUrl)
          .setEmoji('📄')
      );

    await channel.send({ embeds: [embed], components: [actionRow] });
    console.log(`✅ Comment notification sent for ${isIssue ? 'issue' : 'PR'} #${issueNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send comment notification:', error);
    return false;
  }
}

export { sendDiscordNotification };

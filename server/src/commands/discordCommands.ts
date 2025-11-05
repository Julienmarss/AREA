import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';

import { GitHubService } from '../services/GitHubService';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const GITHUB_CONFIG = {
  OWNER: process.env.GITHUB_OWNER,
  REPO: process.env.GITHUB_REPO,
  TOKEN: process.env.GITHUB_TOKEN
};

console.log('🔧 GitHub Config:', {
  OWNER: GITHUB_CONFIG.OWNER,
  REPO: GITHUB_CONFIG.REPO,
});

const githubService = new GitHubService();

export const discordCommands = [
  new SlashCommandBuilder()
    .setName('comment')
    .setDescription('Ajouter un commentaire sur une issue ou PR')
    .addIntegerOption(option =>
      option.setName('number')
        .setDescription('Numéro de l\'issue ou PR')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Votre commentaire')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type d\'élément')
        .setRequired(false)
        .addChoices(
          { name: 'Issue', value: 'issue' },
          { name: 'Pull Request', value: 'pr' }
        )),

  new SlashCommandBuilder()
    .setName('create-issue')
    .setDescription('Créer une nouvelle issue GitHub')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Titre de l\'issue')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description de l\'issue')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('labels')
        .setDescription('Labels séparés par des virgules (ex: bug,urgent)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('assignee')
        .setDescription('Utilisateur à assigner (username GitHub)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('branches')
    .setDescription('Lister les branches du repository')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Nombre de branches à afficher (max 10)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('issues')
    .setDescription('Lister les issues ouvertes')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Nombre d\'issues à afficher (max 10)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('pulls')
    .setDescription('Lister les pull requests ouvertes')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Nombre de PRs à afficher (max 10)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('close-issue')
    .setDescription('Fermer une issue')
    .addIntegerOption(option =>
      option.setName('number')
        .setDescription('Numéro de l\'issue à fermer')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Raison de fermeture')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('assign')
    .setDescription('Assigner une issue à quelqu\'un')
    .addIntegerOption(option =>
      option.setName('number')
        .setDescription('Numéro de l\'issue')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('user')
        .setDescription('Username GitHub à assigner')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('create-pr')
    .setDescription('Créer une PR: titre + branche vers main')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Titre de la PR')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('branch')
        .setDescription('Branche à merger (vers main)')
        .setRequired(true))
];

export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  try {
    const { commandName } = interaction;

    await interaction.deferReply();

    switch (commandName) {
      case 'comment':
        return await handleCommentCommand(interaction);
      case 'create-issue':
        return await handleCreateIssueCommand(interaction);
      case 'branches':
        return await handleListBranchesCommand(interaction);
      case 'issues':
        return await handleListIssuesCommand(interaction);
      case 'pulls':
        return await handleListPRsCommand(interaction);
      case 'close-issue':
        return await handleCloseIssueCommand(interaction);
      case 'assign':
        return await handleAssignCommand(interaction);
      case 'create-pr':
        return await handleCreatePRCommand(interaction);
      default:
        await interaction.editReply('❌ Commande non reconnue');
    }
  } catch (error) {
    console.error('❌ Error handling slash command:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    if (interaction.deferred) {
      await interaction.editReply(`❌ Erreur: ${errorMessage}`);
    } else {
      await interaction.reply(`❌ Erreur: ${errorMessage}`);
    }
  }
}

async function handleCommentCommand(interaction: ChatInputCommandInteraction) {
  const number = interaction.options.getInteger('number', true);
  const message = interaction.options.getString('message', true);
  const type = interaction.options.getString('type') || 'issue';

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/issues/${number}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: `**Commentaire Discord par ${interaction.user.username}:**\n\n${message}`
        })
      }
    );

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(`Erreur GitHub API: ${error.message || response.statusText}`);
    }

    const commentData = await response.json() as any;

    const embed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('✅ Commentaire ajouté')
      .setDescription(`Commentaire ajouté avec succès sur ${type === 'pr' ? 'la PR' : 'l\'issue'} #${number}`)
      .addFields(
        { name: '📝 Commentaire', value: message.length > 100 ? message.substring(0, 100) + '...' : message, inline: false },
        { name: '👤 Auteur Discord', value: interaction.user.username, inline: true },
        { name: '🔗 Voir sur GitHub', value: `[Lien](${commentData.html_url})`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    throw error;
  }
}

async function handleCreateIssueCommand(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString('title', true);
  const description = interaction.options.getString('description') || '';
  const labels = interaction.options.getString('labels') || '';
  const assignee = interaction.options.getString('assignee') || '';

  try {
    const issueData: any = {
      title: title,
      body: `**Issue créée depuis Discord par ${interaction.user.username}**\n\n${description}`,
    };

    if (labels) {
      issueData.labels = labels.split(',').map(l => l.trim()).filter(Boolean);
    }

    if (assignee) {
      issueData.assignee = assignee;
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(issueData)
      }
    );

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(`Erreur GitHub API: ${error.message || response.statusText}`);
    }

    const issue = await response.json() as any;

    const embed = new EmbedBuilder()
      .setColor(0xE11D48)
      .setTitle('🎯 Issue créée avec succès')
      .setURL(issue.html_url)
      .setDescription(`**${title}**\n\n${description || '*Pas de description*'}`)
      .addFields(
        { name: '🔢 Numéro', value: `#${issue.number}`, inline: true },
        { name: '👤 Créé par', value: interaction.user.username, inline: true },
        { name: '🏷️ Labels', value: labels || 'Aucun', inline: true }
      );

    if (assignee) {
      embed.addFields({ name: '👥 Assigné à', value: assignee, inline: true });
    }

    embed.setFooter({ text: 'AREA • GitHub Integration' })
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Voir sur GitHub')
          .setStyle(ButtonStyle.Link)
          .setURL(issue.html_url)
          .setEmoji('🔗')
      );

    await interaction.editReply({ embeds: [embed], components: [actionRow] });
  } catch (error) {
    console.error('❌ Error creating issue:', error);
    throw error;
  }
}

async function handleListBranchesCommand(interaction: ChatInputCommandInteraction) {
  const limit = Math.min(interaction.options.getInteger('limit') || 10, 15);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/branches?per_page=${limit}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur GitHub API: ${response.statusText}`);
    }

    const branches = await response.json() as any[];

    if (branches.length === 0) {
      await interaction.editReply('Aucune branche trouvée !');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle(`Branches du repository (${branches.length})`)
      .setDescription('Voici les branches disponibles :');

    branches.slice(0, limit).forEach((branch: any) => {
      const isProtected = branch.protected ? '🔒 ' : '';
      embed.addFields({
        name: `${isProtected}${branch.name}`,
        value: `Last commit: [${branch.commit.sha.substring(0, 7)}](${branch.commit.url})`,
        inline: true
      });
    });

    embed.setFooter({ text: 'AREA • GitHub Branches' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Error listing branches:', error);
    throw error;
  }
}

async function handleCloseIssueCommand(interaction: ChatInputCommandInteraction) {
  const number = interaction.options.getInteger('number', true);
  const reason = interaction.options.getString('reason') || 'Fermée via Discord';

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/issues/${number}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          state: 'closed',
          state_reason: 'completed'
        })
      }
    );

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(`Erreur GitHub API: ${error.message || response.statusText}`);
    }

    await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/issues/${number}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: `✅ **Issue fermée depuis Discord par ${interaction.user.username}**\n\nRaison: ${reason}`
        })
      }
    );

    const embed = new EmbedBuilder()
      .setColor(0x6B7280)
      .setTitle('✅ Issue fermée avec succès')
      .setDescription(`L'issue #${number} a été fermée`)
      .addFields(
        { name: '👤 Fermée par', value: interaction.user.username, inline: true },
        { name: '📝 Raison', value: reason, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Error closing issue:', error);
    throw error;
  }
}

async function handleAssignCommand(interaction: ChatInputCommandInteraction) {
  const number = interaction.options.getInteger('number', true);
  const user = interaction.options.getString('user', true);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/issues/${number}/assignees`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignees: [user] })
      }
    );

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(`Erreur GitHub API: ${error.message || response.statusText}`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x2563EB)
      .setTitle('👥 Assignment réussi')
      .setDescription(`L'issue #${number} a été assignée à @${user}`)
      .addFields(
        { name: '👤 Assigné par', value: interaction.user.username, inline: true },
        { name: '🎯 Assigné à', value: `@${user}`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Error assigning issue:', error);
    throw error;
  }
}

async function handleCreatePRCommand(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString('title', true);
  const head = interaction.options.getString('branch', true);
  const base = 'main';

  try {
    const branchResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/branches/${head}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!branchResponse.ok) {
      await interaction.editReply(
        `❌ La branche "${head}" n'existe pas. Utilisez \`/branches\` pour voir les branches disponibles.`
      );
      return;
    }

    const prData = {
      title: title,
      head: head,
      base: base,
      body: `**PR créée depuis Discord par ${interaction.user.username}**`,
    };

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/pulls`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prData)
      }
    );

    if (!response.ok) {
      const error = await response.json() as any;
      
      if (error.message && error.message.includes('No commits between')) {
        await interaction.editReply(
          `❌ Aucun commit entre \`${base}\` et \`${head}\`. La branche est peut-être déjà à jour.`
        );
        return;
      }
      
      throw new Error(`Erreur GitHub API: ${error.message || response.statusText}`);
    }

    const pr = await response.json() as any;

    const embed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('✅ Pull Request créée!')
      .setURL(pr.html_url)
      .setDescription(`**${title}**`)
      .addFields(
        { name: 'PR', value: `#${pr.number}`, inline: true },
        { name: 'Branche', value: `${head} → ${base}`, inline: true },
        { name: 'Créé par', value: interaction.user.username, inline: true }
      )
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Voir sur GitHub')
          .setStyle(ButtonStyle.Link)
          .setURL(pr.html_url)
          .setEmoji('🔗'),
        new ButtonBuilder()
          .setCustomId(`merge_pr_${pr.number}`)
          .setLabel('Merger')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
      );

    await interaction.editReply({ embeds: [embed], components: [actionRow] });
  } catch (error) {
    console.error('❌ Error creating pull request:', error);
    throw error;
  }
}

async function handleListIssuesCommand(interaction: ChatInputCommandInteraction) {
  const limit = Math.min(interaction.options.getInteger('limit') || 5, 10);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/issues?state=open&per_page=${limit}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur GitHub API: ${response.statusText}`);
    }

    const issues = await response.json() as any[];
    const filteredIssues = issues.filter((issue: any) => !issue.pull_request);

    if (filteredIssues.length === 0) {
      await interaction.editReply('🎉 Aucune issue ouverte !');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xE11D48)
      .setTitle(`📋 Issues ouvertes (${filteredIssues.length})`)
      .setDescription('Voici les issues actuellement ouvertes :');

    filteredIssues.slice(0, limit).forEach((issue: any) => {
      const labels = issue.labels.map((l: any) => l.name).join(', ') || 'Aucun';
      embed.addFields({
        name: `#${issue.number} - ${issue.title}`,
        value: `👤 ${issue.user.login} • 🏷️ ${labels}\n[Voir](${issue.html_url})`,
        inline: false
      });
    });

    embed.setFooter({ text: 'AREA • GitHub Issues' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Error listing issues:', error);
    throw error;
  }
}

async function handleListPRsCommand(interaction: ChatInputCommandInteraction) {
  const limit = Math.min(interaction.options.getInteger('limit') || 5, 10);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/pulls?state=open&per_page=${limit}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur GitHub API: ${response.statusText}`);
    }

    const prs = await response.json() as any[];

    if (prs.length === 0) {
      await interaction.editReply('🎉 Aucune pull request ouverte !');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x2563EB)
      .setTitle(`🔄 Pull Requests ouvertes (${prs.length})`)
      .setDescription('Voici les PRs actuellement ouvertes :');

    prs.slice(0, limit).forEach((pr: any) => {
      embed.addFields({
        name: `#${pr.number} - ${pr.title}`,
        value: `👤 ${pr.user.login} • 🌳 ${pr.head.ref} → ${pr.base.ref}\n[Voir](${pr.html_url})`,
        inline: false
      });
    });

    embed.setFooter({ text: 'AREA • GitHub Pull Requests' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Error listing pull requests:', error);
    throw error;
  }
}
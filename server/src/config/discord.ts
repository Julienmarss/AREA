
/**
 * Scopes nécessaires pour Discord OAuth2
 * @see https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
 */
export const DISCORD_SCOPES = [
  'identify',           // Lire les infos du profil
  'email',             // Lire l'email
  'guilds',            // Lire les serveurs de l'utilisateur
  'bot',               // Ajouter le bot aux serveurs
  'applications.commands'  // Utiliser les slash commands
];

/**
 * Permissions par défaut pour le bot Discord
 * @see https://discord.com/developers/docs/topics/permissions
 */
export const DISCORD_BOT_PERMISSIONS = '8'; // Administrator (ou calculer les permissions spécifiques)

/**
 * Génère l'URL d'autorisation OAuth2 Discord
 * @param state - chaîne encodée pour suivre l'utilisateur et le timestamp
 * @returns URL complète pour redirection vers Discord
 */
export const getDiscordAuthUrl = (state: string) => {
  const baseUrl = 'https://discord.com/api/oauth2/authorize';
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    redirect_uri: process.env.DISCORD_REDIRECT_URI || '',
    response_type: 'code',
    scope: DISCORD_SCOPES.join(' '),
    state: state,
    permissions: DISCORD_BOT_PERMISSIONS,
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.log('Discord OAuth URL generated:', url);
  return url;
};
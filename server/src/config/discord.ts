/**
 * Scopes nécessaires pour Discord OAuth2
 * @see https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
 */
export const DISCORD_SCOPES = [
  'identify',           // Lire les infos du profil
  'email',             // Lire l'email
  'guilds',            // Lire les serveurs de l'utilisateur
  'bot',               // ✅ AJOUTER LE BOT AUX SERVEURS
  'applications.commands'  // ✅ Utiliser les slash commands
];

/**
 * Permissions par défaut pour le bot Discord
 * @see https://discord.com/developers/docs/topics/permissions
 * 
 * Permissions incluses (valeur = 8589935647) :
 * - Lire les messages
 * - Envoyer des messages
 * - Gérer les rôles
 * - Gérer les webhooks
 * - Lire l'historique
 * - Mentionner @everyone
 */
export const DISCORD_BOT_PERMISSIONS = '8'; // Permissions étendues

/**
 * Génère l'URL d'autorisation OAuth2 Discord
 * @param state - chaîne encodée pour suivre l'utilisateur et le timestamp
 * @returns URL complète pour redirection vers Discord
 */
export const getDiscordAuthUrl = (state: string) => {
  const baseUrl = 'https://discord.com/api/oauth2/authorize';
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    redirect_uri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:8080/api/v1/services/discord/oauth/callback',
    response_type: 'code',
    scope: DISCORD_SCOPES.join(' '),
    state: state,
    permissions: DISCORD_BOT_PERMISSIONS,
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.log('Discord OAuth URL generated:', url);
  console.log('Redirect URI:', params.get('redirect_uri')); // ✅ Debug
  return url;
};
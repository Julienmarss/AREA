export const DISCORD_SCOPES = [
  'identify',
  'guilds',
  'bot',
  'applications.commands'
];

export const DISCORD_BOT_PERMISSIONS = '268443392';

export const getDiscordAuthUrl = (state: string) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('DISCORD_CLIENT_ID and DISCORD_REDIRECT_URI must be set in .env');
  }
  
  const baseUrl = 'https://discord.com/api/oauth2/authorize';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: DISCORD_SCOPES.join(' '),
    state: state,
    permissions: DISCORD_BOT_PERMISSIONS,
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.log('🔗 Discord OAuth URL generated');
  console.log('   Client ID:', clientId);
  console.log('   Redirect URI:', redirectUri);
  console.log('   Scopes:', DISCORD_SCOPES.join(', '));

  return url;
};
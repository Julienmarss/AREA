export const GITHUB_SCOPES = [
  'repo',           // Accès complet aux repos publics et privés
  'read:user',      // Lire les infos du profil
  'user:email',     // Lire l'email
];

export const getGitHubAuthUrl = (state: string) => {
  const baseUrl = 'https://github.com/login/oauth/authorize';
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: process.env.GITHUB_REDIRECT_URI || '',
    scope: GITHUB_SCOPES.join(' '),
    state: state,
  });

  return `${baseUrl}?${params.toString()}`;
};
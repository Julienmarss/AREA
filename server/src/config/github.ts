export const GITHUB_SCOPES = [
  'repo',
  'read:user',
  'user:email',
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
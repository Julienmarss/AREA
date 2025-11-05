export const NOTION_SCOPES = [
];

export const NOTION_AUTH_BASE_URL = 'https://api.notion.com/v1/oauth/authorize';
export const NOTION_TOKEN_URL = 'https://api.notion.com/v1/oauth/token';
export const NOTION_API_VERSION = '2022-06-28';

export const getNotionAuthUrl = (state: string) => {
  const baseUrl = NOTION_AUTH_BASE_URL;
  const params = new URLSearchParams({
    client_id: process.env.NOTION_CLIENT_ID || '',
    redirect_uri: process.env.NOTION_REDIRECT_URI || '',
    response_type: 'code',
    owner: 'user',
    state: state,
  });

  return `${baseUrl}?${params.toString()}`;
};

export const getNotionHeaders = (accessToken: string) => {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Notion-Version': NOTION_API_VERSION,
    'Content-Type': 'application/json',
  };
};

// web/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Helper pour récupérer le token
const getAuthHeaders = () => {
  const token = localStorage.getItem('area_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper pour les requêtes
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

// ============= AUTH API =============
export const authAPI = {
  register: async (email: string, password: string, firstName: string, lastName: string) => {
    return fetchAPI('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  },

  login: async (email: string, password: string) => {
    return fetchAPI('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  me: async () => {
    return fetchAPI('/api/v1/auth/me');
  },
};

// ============= GITHUB API =============
export const githubAPI = {
  // Vérifier le statut de connexion
  getStatus: async (userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchAPI(`/api/v1/services/github/oauth/status${query}`);
  },

  // Initier l'OAuth
  initiateOAuth: async (userId: string) => {
    return fetchAPI(`/api/v1/services/github/oauth/authorize?userId=${userId}`);
  },

  // ✅ Récupérer les repositories de l'utilisateur
  getRepositories: async () => {
    return fetchAPI('/api/v1/services/github/repositories');
  },
};

// ============= DISCORD API =============
export const discordAPI = {
  // ✅ Vérifier le statut de connexion
  getStatus: async (userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchAPI(`/api/v1/services/discord/oauth/status${query}`);
  },

  // ✅ Initier l'OAuth2
  initiateOAuth: async (userId: string) => {
    return fetchAPI(`/api/v1/services/discord/oauth/authorize?userId=${userId}`);
  },

  // ✅ Déconnecter Discord
  disconnect: async (userId: string) => {
    return fetchAPI(`/api/v1/services/discord/oauth/disconnect?userId=${userId}`, {
      method: 'POST',
    });
  },

  // ✅ Récupérer les serveurs (guilds) de l'utilisateur
  getGuilds: async () => {
    return fetchAPI('/api/v1/services/discord/guilds');
  },

  // ✅ Récupérer les channels d'un serveur
  getChannels: async (guildId: string) => {
    return fetchAPI(`/api/v1/services/discord/guilds/${guildId}/channels`);
  },

  // ✅ Récupérer les rôles d'un serveur
  getRoles: async (guildId: string) => {
    return fetchAPI(`/api/v1/services/discord/guilds/${guildId}/roles`);
  },
};

// ============= GOOGLE API =============
export const googleAPI = {
  // Vérifier le statut de connexion
  getStatus: async (userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchAPI(`/api/v1/services/google/oauth/status${query}`);
  },

  // Initier l'OAuth
  initiateOAuth: async (userId: string) => {
    return fetchAPI(`/api/v1/services/google/oauth/authorize?userId=${userId}`);
  },

  // Déconnecter
  disconnect: async (userId: string) => {
    return fetchAPI(`/api/v1/services/google/oauth/disconnect?userId=${userId}`, {
      method: 'DELETE',
    });
  },

  // Récupérer les emails récents
  getEmails: async (maxResults: number = 10) => {
    return fetchAPI(`/api/v1/services/google/emails?maxResults=${maxResults}`);
  },

  // Envoyer un email
  sendEmail: async (to: string, subject: string, body: string) => {
    return fetchAPI('/api/v1/services/google/emails/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    });
  },
};

// ============= SPOTIFY API =============
export const spotifyAPI = {
  // Vérifier le statut de connexion
  getStatus: async (userId: string) => {
    return fetchAPI(`/api/v1/services/spotify/oauth/status?userId=${userId}`);
  },

  // Initier l'auth OAuth
  initiateAuth: async (userId: string) => {
    return fetchAPI(`/api/v1/services/spotify/oauth/authorize?userId=${userId}`);
  },

  // Déconnecter
  disconnect: async (userId: string) => {
    return fetchAPI(`/api/v1/services/spotify/oauth/disconnect?userId=${userId}`, {
      method: 'POST',
    });
  },

  // Récupérer les playlists
  getPlaylists: async (userId: string) => {
    return fetchAPI(`/api/v1/spotify/playlists?userId=${userId}`);
  },

  // Rechercher des artistes
  searchArtists: async (userId: string, query: string) => {
    return fetchAPI(`/api/v1/spotify/search/artists?userId=${userId}&q=${encodeURIComponent(query)}`);
  },
};

// ============= NOTION API =============
export const notionAPI = {
  // Vérifier le statut de connexion
  getStatus: async (userId: string) => {
    return fetchAPI(`/api/v1/services/notion/status?userId=${userId}`);
  },

  // Initier l'OAuth
  initiateOAuth: async (userId: string) => {
    return fetchAPI(`/api/v1/services/notion/oauth/authorize?userId=${userId}`);
  },

  // Déconnecter
  disconnect: async (userId: string) => {
    return fetchAPI(`/api/v1/services/notion/disconnect?userId=${userId}`, {
      method: 'POST',
    });
  },

  // Récupérer les pages Notion
  getPages: async (userId: string) => {
    return fetchAPI(`/api/v1/services/notion/pages?userId=${userId}`);
  },

  // Récupérer les databases Notion
  getDatabases: async (userId: string) => {
    return fetchAPI(`/api/v1/services/notion/databases?userId=${userId}`);
  },
};

// ============= AREAS API =============
export const areasAPI = {
  // Récupérer toutes les AREAs
  getAll: async (userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchAPI(`/api/v1/areas${query}`);
  },

  // Récupérer une AREA
  getById: async (id: string) => {
    return fetchAPI(`/api/v1/areas/${id}`);
  },

  // Créer une AREA
  create: async (areaData: any) => {
    return fetchAPI('/api/v1/areas', {
      method: 'POST',
      body: JSON.stringify(areaData),
    });
  },

  // Mettre à jour une AREA
  update: async (id: string, updates: any) => {
    return fetchAPI(`/api/v1/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Supprimer une AREA
  delete: async (id: string) => {
    return fetchAPI(`/api/v1/areas/${id}`, {
      method: 'DELETE',
    });
  },

  // Activer/Désactiver une AREA
  toggle: async (id: string) => {
    return fetchAPI(`/api/v1/areas/${id}/toggle`, {
      method: 'POST',
    });
  },

  // Tester une AREA
  test: async (id: string) => {
    return fetchAPI(`/api/v1/areas/${id}/test`, {
      method: 'POST',
    });
  },
};

// ============= TIMER API =============
export const timerAPI = {
  // Récupérer les informations du service Timer
  getInfo: async () => {
    return fetchAPI('/api/v1/services/timer/info');
  },

  // Récupérer les jobs planifiés de l'utilisateur
  getJobs: async () => {
    return fetchAPI('/api/v1/services/timer/jobs');
  },

  // Valider une expression cron
  validateCron: async (cronExpression: string) => {
    return fetchAPI('/api/v1/services/timer/validate', {
      method: 'POST',
      body: JSON.stringify({ cronExpression }),
    });
  },

  // Récupérer des exemples d'expressions cron
  getExamples: async () => {
    return fetchAPI('/api/v1/services/timer/examples');
  },
};

// ============= ABOUT API =============
export const aboutAPI = {
  getInfo: async () => {
    return fetchAPI('/about.json');
  },
};

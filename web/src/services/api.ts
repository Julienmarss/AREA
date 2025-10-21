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

// ============= SPOTIFY API =============
export const spotifyAPI = {
  // Vérifier le statut de connexion
  getStatus: async (userId: string) => {
    return fetchAPI(`/api/v1/spotify/status?userId=${userId}`);
  },

  // Initier l'auth OAuth
  initiateAuth: async (userId: string) => {
    return fetchAPI(`/api/v1/auth/spotify?userId=${userId}`);
  },

  // Déconnecter
  disconnect: async (userId: string) => {
    return fetchAPI('/api/v1/spotify/disconnect', {
      method: 'POST',
      body: JSON.stringify({ userId }),
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

// ============= ABOUT API =============
export const aboutAPI = {
  getInfo: async () => {
    return fetchAPI('/about.json');
  },
};
// web/src/types/services.ts

export interface ServiceStatus {
  connected: boolean;
  loading: boolean;
  username?: string;
  discriminator?: string;
  guildCount?: number;
  avatar?: string;
  error?: string;
}

export interface ServiceCardProps {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  status: ServiceStatus;
  onConnect: () => void;
  children?: React.ReactNode;
}

// Types Discord spécifiques
export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
}

// Types GitHub spécifiques
export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description: string;
  url: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  owner: string;
  public: boolean;
  tracks: {
    total: number;
  };
}
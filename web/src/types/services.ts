export interface ServiceStatus {
  connected: boolean;
  loading: boolean;
  username?: string;
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
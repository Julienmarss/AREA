CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_services (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, service_name)
);

CREATE TABLE IF NOT EXISTS areas (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  action_service VARCHAR(50) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  action_config JSONB DEFAULT '{}',
  reaction_service VARCHAR(50) NOT NULL,
  reaction_type VARCHAR(100) NOT NULL,
  reaction_config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  last_triggered TIMESTAMP,
  last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, service)
);

CREATE INDEX IF NOT EXISTS idx_areas_user_id ON areas(user_id);
CREATE INDEX IF NOT EXISTS idx_areas_enabled ON areas(enabled);
CREATE INDEX IF NOT EXISTS idx_areas_action_service ON areas(action_service);
CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_areas_updated_at ON areas;

CREATE TRIGGER update_areas_updated_at 
  BEFORE UPDATE ON areas
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
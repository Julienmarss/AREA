// server/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

import authRoutes from './routes/auth';
import spotifyRoutes from './routes/spotify.routes';
import areasRoutes from './routes/areas.routes';
import discordRoutes from './routes/discord';
import githubRoutes from './routes/github';

import { HooksService } from './services/hooks.service';
import { DiscordService } from './services/DiscordService';
import { GitHubService } from './services/GitHubService';

import { setupAutoReactions } from './middleware/autoReactions';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 8080;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AREA API',
      version: '1.0.0',
      description: 'Documentation de l\'API AREA avec Swagger',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Serveur local',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true
}));

app.use('/api/v1/services/github/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    hooksRunning: true,
  });
});

app.get('/about.json', (req: Request, res: Response) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  
  res.json({
    client: {
      host: clientIp
    },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services: [
        {
          name: 'github',
          actions: [
            { name: 'new_issue_created', description: 'Triggered when a new issue is created in a repository' },
            { name: 'pull_request_opened', description: 'Triggered when a new pull request is opened' },
            { name: 'commit_pushed', description: 'Triggered when commits are pushed to a repository' },
            { name: 'repository_starred', description: 'Triggered when someone stars a repository' }
          ],
          reactions: [
            { name: 'create_issue', description: 'Create a new issue in a GitHub repository' },
            { name: 'comment_on_issue', description: 'Add a comment to an issue or pull request' },
            { name: 'create_repository', description: 'Create a new GitHub repository' }
          ]
        },
        {
          name: 'discord',
          actions: [
            { name: 'message_posted_in_channel', description: 'Triggered when a message is posted in a specific channel' },
            { name: 'user_mentioned', description: 'Triggered when user is mentioned' },
            { name: 'user_joined_server', description: 'Triggered when a user joins the server' }
          ],
          reactions: [
            { name: 'send_message_to_channel', description: 'Send a message to a channel' },
            { name: 'send_dm', description: 'Send a direct message' },
            { name: 'add_role_to_user', description: 'Add a role to a user' }
          ]
        },
        {
          name: 'spotify',
          actions: [
            { name: 'new_track_played', description: 'Triggered when a new track is played' },
            { name: 'new_track_saved', description: 'Triggered when a track is saved' },
            { name: 'playlist_updated', description: 'Triggered when a playlist is updated' },
            { name: 'specific_artist_played', description: 'Triggered when a specific artist is played' },
            { name: 'new_artist_followed', description: 'Triggered when you follow a new artist' }
          ],
          reactions: [
            { name: 'add_track_to_playlist', description: 'Add a track to a playlist' },
            { name: 'create_playlist', description: 'Create a new playlist' },
            { name: 'follow_artist', description: 'Follow an artist' },
            { name: 'create_playlist_with_artist_top_tracks', description: 'Create a playlist with artist top 5 tracks' }
          ]
        }
      ]
    }
  });
});

app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'AREA API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      services: '/api/v1/services',
      areas: '/api/v1/areas',
      spotify: '/api/v1/spotify',
      discord: '/api/v1/services/discord',
      github: '/api/v1/services/github',
    }
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', spotifyRoutes);
app.use('/api/v1', areasRoutes);
app.use('/api/v1/services/discord', discordRoutes);
app.use('/api/v1/services/github', githubRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`📋 About: http://localhost:${PORT}/about.json`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  
  console.log('🎵 Starting Spotify hooks service...');
  HooksService.start();
  
  console.log('🤖 Initializing Discord bot (slash commands)...');
  setupAutoReactions();
  
  console.log('🔧 Initializing AREA services...');
  const discordService = new DiscordService();
  await discordService.initialize();
  
  const githubService = new GitHubService();
  await githubService.initialize();
  
  console.log('✅ All services initialized and ready!');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt gracieux...');
  HooksService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt gracieux...');
  HooksService.stop();
  process.exit(0);
});
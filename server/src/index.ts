import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Configure dotenv to load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true
}));
// Raw body middleware for webhook signature verification
app.use('/api/v1/services/github/webhook', express.raw({ type: 'application/json' }));

// Regular JSON middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// About.json endpoint (required by subject)
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
          name: 'google_workspace',
          actions: [
            {
              name: 'gmail_new_email_from',
              description: 'Triggered when an email is received from a specific sender'
            },
            {
              name: 'gmail_email_with_label',
              description: 'Triggered when an email with a specific label is received'
            },
            {
              name: 'gmail_unread_count_exceeds',
              description: 'Triggered when unread email count exceeds threshold'
            },
            {
              name: 'gcalendar_event_starts_in',
              description: 'Triggered X minutes before an event starts'
            },
            {
              name: 'gdrive_new_file_in_folder',
              description: 'Triggered when a new file appears in a Drive folder'
            }
          ],
          reactions: [
            {
              name: 'gmail_send_email',
              description: 'Send an email via Gmail'
            },
            {
              name: 'gmail_mark_as_read',
              description: 'Mark emails as read'
            },
            {
              name: 'gcalendar_create_event',
              description: 'Create a calendar event'
            },
            {
              name: 'gdrive_upload_file',
              description: 'Upload a file to Google Drive'
            }
          ]
        },
        {
          name: 'github',
          actions: [
            {
              name: 'new_issue_created',
              description: 'Triggered when a new issue is created'
            },
            {
              name: 'pull_request_opened',
              description: 'Triggered when a PR is opened'
            },
            {
              name: 'commit_pushed',
              description: 'Triggered when a commit is pushed'
            },
            {
              name: 'repository_starred',
              description: 'Triggered when repository receives a star'
            }
          ],
          reactions: [
            {
              name: 'create_issue',
              description: 'Create an issue'
            },
            {
              name: 'comment_on_issue',
              description: 'Comment on an issue or PR'
            },
            {
              name: 'create_repository',
              description: 'Create a new repository'
            }
          ]
        },
        {
          name: 'discord',
          actions: [
            {
              name: 'message_posted_in_channel',
              description: 'Triggered when a message is posted in a channel'
            },
            {
              name: 'user_mentioned',
              description: 'Triggered when user is mentioned'
            },
            {
              name: 'user_joined_server',
              description: 'Triggered when a user joins the server'
            }
          ],
          reactions: [
            {
              name: 'send_message_to_channel',
              description: 'Send a message to a channel'
            },
            {
              name: 'send_dm',
              description: 'Send a direct message'
            },
            {
              name: 'add_role_to_user',
              description: 'Add a role to a user'
            }
          ]
        },
        {
          name: 'spotify',
          actions: [
            {
              name: 'new_track_played',
              description: 'Triggered when a new track is played'
            },
            {
              name: 'new_track_saved',
              description: 'Triggered when a track is saved'
            },
            {
              name: 'playlist_updated',
              description: 'Triggered when a playlist is updated'
            },
            {
              name: 'specific_artist_played',
              description: 'Triggered when a specific artist is played'
            }
          ],
          reactions: [
            {
              name: 'add_track_to_playlist',
              description: 'Add a track to a playlist'
            },
            {
              name: 'create_playlist',
              description: 'Create a new playlist'
            },
            {
              name: 'follow_artist',
              description: 'Follow an artist'
            }
          ]
        },
        {
          name: 'notion',
          actions: [
            {
              name: 'new_page_created',
              description: 'Triggered when a new page is created'
            },
            {
              name: 'page_updated',
              description: 'Triggered when a page is updated'
            },
            {
              name: 'database_entry_added',
              description: 'Triggered when an entry is added to a database'
            },
            {
              name: 'task_completed',
              description: 'Triggered when a task is completed'
            }
          ],
          reactions: [
            {
              name: 'create_page',
              description: 'Create a new page'
            },
            {
              name: 'update_page',
              description: 'Update an existing page'
            },
            {
              name: 'add_database_entry',
              description: 'Add an entry to a database'
            }
          ]
        }
      ]
    }
  });
});

// Import routes
import discordRoutes from './routes/discord';
import githubRoutes from './routes/github';

// Import middleware
import { setupAutoReactions } from './middleware/autoReactions';

// API Routes
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'AREA API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      services: '/api/v1/services',
      areas: '/api/v1/areas',
      users: '/api/v1/users'
    }
  });
});

// Service routes
app.use('/api/v1/services/discord', discordRoutes);
app.use('/api/v1/services/github', githubRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`📄 About: http://localhost:${PORT}/about.json`);
  
  // Initialize Discord bot and auto-reactions
  console.log('🤖 Initializing Discord bot and auto-reactions...');
  setupAutoReactions();
});

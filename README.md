# 🚀 AREA Platform - Action REAction Automation

![CI/CD](https://img.shields.io/github/actions/workflow/status/your-org/area-project/backend-ci.yml?label=CI%2FCD)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

AREA is an automation platform similar to IFTTT/Zapier, allowing users to create automated workflows by connecting Actions to REActions across multiple services.

## 📊 Services & Features

| Service | Actions | REactions | Total |
|---------|---------|-----------|-------|
| Google Workspace | 5 | 4 | 9 |
| GitHub | 4 | 3 | 7 |
| Discord | 3 | 3 | 6 |
| Spotify | 4 | 3 | 7 |
| Notion | 4 | 3 | 7 |
| **TOTAL** | **20** | **16** | **36** |

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Web Client (React)            │
│         Port 8081 - Vercel              │
└─────────────────┬───────────────────────┘
                  │
                  │ REST API
                  │
┌─────────────────▼───────────────────────┐
│     Application Server (Node.js)        │
│         Port 8080 - Railway             │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐            │
│  │PostgreSQL│  │  Redis   │            │
│  │   DB     │  │  Queue   │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/your-org/area-project.git
cd area-project
```

### 2. Setup environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or in detached mode
docker-compose up -d --build
```

### 4. Access the application

- **Web Client:** http://localhost:8081
- **API Server:** http://localhost:8080
- **API Documentation:** http://localhost:8080/about.json
- **Download APK:** http://localhost:8081/client.apk

## 🛠️ Development

### Backend (Node.js + TypeScript)

```bash
cd server
npm install
npm run dev
```

**Available scripts:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Frontend (React + Vite)

```bash
cd web
npm install
npm run dev
```

**Available scripts:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Mobile (Flutter)

```bash
cd mobile
flutter pub get

# Run on device/emulator
flutter run

# Build APK
flutter build apk --release

# Build Web
flutter build web --release
```

## 🔧 Tech Stack

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15
- **Cache/Queue:** Redis 7
- **Authentication:** JWT + OAuth2
- **Scheduler:** node-cron

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Router:** React Router v6

### Mobile
- **Framework:** Flutter 3.x
- **Platform:** Android, iOS, Web
- **Language:** Dart
- **State Management:** Provider/Riverpod
- **HTTP Client:** Dio

### DevOps
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting Backend:** Railway.app (Free)
- **Hosting Frontend:** Vercel (Free)
- **APK Distribution:** GitHub Releases

## 🌐 Deployment

### Backend (Railway)

1. Create account on [Railway.app](https://railway.app)
2. Install Railway CLI:
```bash
npm install -g @railway/cli
```
3. Login and deploy:
```bash
cd server
railway login
railway link
railway up
```

### Frontend (Vercel)

1. Create account on [Vercel](https://vercel.com)
2. Install Vercel CLI:
```bash
npm install -g vercel
```
3. Deploy:
```bash
cd web
vercel --prod
```

### Environment Variables Setup

**Railway (Backend):**
- Add all variables from `.env.example`
- Set `DATABASE_URL` (PostgreSQL addon)
- Set `REDIS_URL` (Redis addon)

**Vercel (Frontend):**
- `VITE_API_URL` = Your Railway backend URL

**GitHub Secrets (CI/CD):**
- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 📱 Mobile APK

The mobile APK is automatically built and published to GitHub Releases on each push to `main`.

**Download:**
1. Go to [Releases](https://github.com/your-org/area-project/releases)
2. Download latest `app-release.apk`
3. Install on Android device

Or access via: `https://your-domain.vercel.app/client.apk`

## 🔐 OAuth2 Setup

### Google Workspace

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable APIs: Gmail, Calendar, Drive
4. Create OAuth2 credentials
5. Add redirect URI: `http://localhost:8080/api/v1/auth/google/callback`
6. Copy Client ID & Secret to `.env`

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Homepage: `http://localhost:8081`
4. Callback: `http://localhost:8080/api/v1/auth/github/callback`
5. Copy Client ID & Secret to `.env`

### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. New Application
3. Bot section: Add Bot, copy token
4. OAuth2 section: Add redirect URI
5. Copy credentials to `.env`

### Spotify

1. Go to [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. Create App
3. Add redirect URI: `http://localhost:8080/api/v1/auth/spotify/callback`
4. Copy Client ID & Secret to `.env`

### Notion

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. New Integration
3. Add redirect URI
4. Copy credentials to `.env`

## 📖 API Documentation

### Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/{service}/` - OAuth2 initiate
- `GET /api/v1/auth/{service}/callback` - OAuth2 callback

#### Services
- `GET /api/v1/services` - List all services
- `GET /api/v1/services/:id` - Get service details
- `POST /api/v1/services/:id/connect` - Connect service

#### AREAs
- `GET /api/v1/areas` - List user AREAs
- `POST /api/v1/areas` - Create new AREA
- `PUT /api/v1/areas/:id` - Update AREA
- `DELETE /api/v1/areas/:id` - Delete AREA
- `POST /api/v1/areas/:id/toggle` - Enable/Disable AREA

#### System
- `GET /health` - Health check
- `GET /about.json` - Services & Actions info

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd web
npm test

# E2E tests
npm run test:e2e
```

## 📁 Project Structure

```
area-project/
├── .github/workflows/      # CI/CD pipelines
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── index.ts       # Entry point
│   ├── Dockerfile
│   └── package.json
├── web/                    # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.tsx        # Main component
│   ├── Dockerfile
│   └── package.json
├── mobile/                 # Mobile application
│   ├── android/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 👥 Team

- Backend Lead - [Julien Pars]
- Frontend Lead - [Mathis Pusy]
- Mobile Lead - [Yanis Passelman]
- DevOps Lead - [Kiks]

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

See [HOWTOCONTRIBUTE.md](./HOWTOCONTRIBUTE.md)

## 🐛 Known Issues

- Mobile APK build requires manual signing for production
- OAuth2 tokens refresh not yet implemented
- Rate limiting on hooks not implemented

## 🗺️ Roadmap

- [ ] User dashboard with AREA statistics
- [ ] Webhook support for real-time triggers
- [ ] AREA templates marketplace
- [ ] Multi-language support
- [ ] iOS app
- [ ] Advanced AREA conditions (AND/OR logic)

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact: team@area-project.com

---

**Built with ❤️ for EPITECH Project**